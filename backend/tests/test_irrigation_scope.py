from datetime import date, datetime, timedelta
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

import backend.app as application


class QueryStub:
    def __init__(self, rows=None, first=None):
        self.rows = rows or []
        self.first_row = first
        self.field_id = None

    def join(self, *_args):
        return self

    def filter(self, *_args):
        return self

    def filter_by(self, **kwargs):
        self.field_id = kwargs.get("field_id")
        return self

    def order_by(self, *_args):
        return self

    def all(self):
        return self.rows

    def first(self):
        if self.field_id is not None:
            return self.rows.get(self.field_id)
        return self.first_row


class IrrigationScopeTests(TestCase):
    def setUp(self):
        self.client = application.app.test_client()
        farm = SimpleNamespace(name="North Farm", district="Kolhapur", location="Kolhapur")
        self.fields = [
            SimpleNamespace(
                id=11, name="Canal Field", farm=farm, location="Kolhapur",
                planting_date=date(2026, 1, 1), soil_ph=6.8,
                irrigation_method="Drip Irrigation"
            ),
            SimpleNamespace(
                id=12, name="East Field", farm=farm, location="Kolhapur",
                planting_date=date(2026, 1, 1), soil_ph=6.5,
                irrigation_method="Furrow Irrigation"
            ),
        ]
        self.soil_query = QueryStub(rows={
            11: SimpleNamespace(recorded_at=datetime.utcnow(), soil_moisture=65),
            12: SimpleNamespace(recorded_at=datetime.utcnow() - timedelta(days=45), soil_moisture=65),
        })

    def test_all_holdings_reports_each_field_and_keeps_stale_readings_unavailable(self):
        field_query = QueryStub(rows=self.fields)
        user = SimpleNamespace(id=7, role="user")
        with application.app.app_context(), \
            patch.object(application, "get_current_user", return_value=user), \
                patch.object(application.Field, "query", field_query), \
                patch.object(application.SoilData, "query", self.soil_query), \
                patch.object(application.weather_service, "get_current", return_value={}), \
                patch.object(application.CropIntelligenceEngine, "evaluate_crop_status", return_value={
                    "current_stage": "Tillering",
                    "water_requirement": "Moderate",
                }):
            response = self.client.get("/api/irrigation/decision-support")

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["field_count"], 2)
        self.assertEqual(data["counts"], {
            "Normal": 1,
            "Monitor": 0,
            "Critical": 0,
            "Unavailable": 1,
        })
        self.assertIsNone(data["soil_moisture_pct"])
        self.assertIsNone(data["recent_rainfall_mm"])
        self.assertIsNone(data["field_decisions"][1]["soil_moisture_pct"])
        self.assertEqual(data["field_decisions"][1]["status"], "Unavailable")

    def test_unknown_field_does_not_fall_back_to_another_holding(self):
        field_query = QueryStub(rows=self.fields, first=None)
        user = SimpleNamespace(id=7, role="user")
        with application.app.app_context(), \
            patch.object(application, "get_current_user", return_value=user), \
                patch.object(application.Field, "query", field_query):
            response = self.client.get("/api/irrigation/decision-support?field_id=999")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["message"], "Field not found.")


if __name__ == "__main__":
    import unittest

    unittest.main()