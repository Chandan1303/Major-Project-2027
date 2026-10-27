from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

import backend.app as application


class FarmQueryStub:
    def __init__(self, farm):
        self.farm = farm

    def filter_by(self, **_kwargs):
        return self

    def first(self):
        return self.farm


class EmptyHistoryQueryStub:
    def filter_by(self, **_kwargs):
        return self

    def first(self):
        return None


class FarmOptionalDataTests(TestCase):
    def test_field_creation_accepts_missing_measurements_without_synthetic_history(self):
        farm = SimpleNamespace(id=8, location="Test Location", total_area=10, fields=[])
        created_field = SimpleNamespace(id=21, to_dict=lambda: {"id": 21, "soil_ph": None, "soil_moisture": None, "planting_date": None})
        user = SimpleNamespace(id=4)

        with application.app.app_context(), \
                patch.object(application, "get_current_user", return_value=user), \
                patch.object(application.Farm, "query", FarmQueryStub(farm)), \
                patch.object(application, "Field", side_effect=lambda **_kwargs: created_field), \
                patch.object(application.db.session, "add") as add_record, \
                patch.object(application.db.session, "flush"), \
                patch.object(application.db.session, "commit"):
            response = application.app.test_client().post("/api/farms/8/fields", json={
                "name": "North Parcel",
                "area": 2,
                "location": "Test Location",
                "soil_type": "Black Cotton Soil",
                "sugarcane_variety": "Co 86032",
                "soil_ph": "",
                "soil_moisture": "",
                "planting_date": "",
            })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["data"]["field"]["planting_date"], None)
        self.assertEqual(add_record.call_count, 1)

    def test_field_measurement_columns_are_nullable_in_the_model(self):
        self.assertTrue(application.Field.__table__.c.soil_ph.nullable)
        self.assertTrue(application.Field.__table__.c.soil_moisture.nullable)
        self.assertTrue(application.Field.__table__.c.planting_date.nullable)

    def test_empty_farm_can_be_deleted_without_querying_a_missing_legacy_column(self):
        farm = SimpleNamespace(id=8, name="Vacant Farm", fields=[])
        user = SimpleNamespace(id=4)

        with application.app.app_context(), \
                patch.object(application, "get_current_user", return_value=user), \
                patch.object(application.Farm, "query", FarmQueryStub(farm)), \
                patch.object(application.Prediction, "query", EmptyHistoryQueryStub()), \
                patch.object(application.YieldPrediction, "query", EmptyHistoryQueryStub()), \
                patch.object(application.db.session, "delete"), \
                patch.object(application.db.session, "commit"):
            response = application.app.test_client().delete("/api/farms/8")

        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    import unittest

    unittest.main()