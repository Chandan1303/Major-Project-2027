import unittest
from types import SimpleNamespace
from unittest.mock import patch

import backend.app as prediction_app
from backend.variety_rules import (
    configured_varieties_for_state,
    filter_varieties_for_recorded_fields,
    filter_varieties_for_state,
    is_variety_allowed_in_state,
    load_state_variety_recommendations,
    soils_for_recorded_variety,
)
from ml.variety_intelligence import VarietyIntelligenceEngine


class PredictionVarietyRulesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = load_state_variety_recommendations()
        cls.varieties = VarietyIntelligenceEngine.list_varieties()

    def test_karnataka_filter_uses_configured_state_recommendations(self):
        applicable = filter_varieties_for_state(self.varieties, "Karnataka", self.config)
        codes = {variety["code"] for variety in applicable}

        self.assertIn("Co 86032", codes)
        self.assertNotIn("CoC 671", codes)
        self.assertNotIn("Co 0238", codes)
        self.assertTrue(self.config["confirmation_required"])

    def test_configuration_covers_every_model_state_and_only_model_varieties(self):
        model_states = {
            state.casefold()
            for state in prediction_app.prediction_engine.encoders["state"].classes_
        }
        configured_states = {state.casefold() for state in self.config["states"]}
        model_varieties = {
            variety.casefold()
            for variety in prediction_app.prediction_engine.encoders["variety"].classes_
        }
        configured_varieties = {
            variety.casefold()
            for varieties in self.config["states"].values()
            for variety in varieties
        }

        self.assertEqual(configured_states, model_states)
        self.assertTrue(configured_varieties & model_varieties)
        self.assertEqual(
            set(configured_varieties_for_state("Karnataka", self.config)),
            {"Co 62175", "Co 419", "Co 94012", "Co 86032", "CoM 0265"},
        )

    def test_model_rejects_real_karnataka_variety_it_was_not_trained_for(self):
        client = prediction_app.app.test_client()
        with patch.object(prediction_app.prediction_engine, "predict") as predict:
            response = client.post("/api/ml/predict", json={
                "state": "Karnataka",
                "variety": "Co 62175",
            })

        self.assertEqual(response.status_code, 422)
        self.assertIn("trained yield model does not support", response.get_json()["message"])
        predict.assert_not_called()

    def test_regional_state_alias_is_normalized(self):
        self.assertTrue(is_variety_allowed_in_state("Co 86032", "Southern Karnataka", self.config))

    def test_district_varieties_require_a_matching_recorded_field(self):
        candidates = [
            {"code": "Co 86032", "name": "Co 86032 (Nayana)"},
            {"code": "Co 0238", "name": "Co 0238 (Karan 4)"},
        ]
        self.assertEqual(filter_varieties_for_recorded_fields(candidates, []), [])
        self.assertEqual(
            filter_varieties_for_recorded_fields(candidates, ["Co 86032"]),
            [candidates[0]],
        )

    def test_soil_options_are_limited_to_the_selected_variety(self):
        fields = [
            SimpleNamespace(sugarcane_variety="Co 86032", soil_type="Black Soil"),
            SimpleNamespace(sugarcane_variety="Co 0238", soil_type="Alluvial Soil"),
        ]
        self.assertEqual(soils_for_recorded_variety(fields, "Co 86032", ""), ["Black Soil"])

    def test_options_endpoint_returns_only_district_recorded_varieties_and_soils(self):
        farm = SimpleNamespace(
            state="Karnataka",
            district="Mysuru",
            fields=[
                SimpleNamespace(sugarcane_variety="Co 86032", soil_type="Black Soil"),
                SimpleNamespace(sugarcane_variety="CoM 0265", soil_type="Red Loam"),
            ],
        )
        farm_query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(all=lambda: [farm])
        )
        with (
            patch.object(prediction_app, "get_current_user", return_value=SimpleNamespace(id=1)),
            patch.object(prediction_app, "Farm", SimpleNamespace(query=farm_query)),
        ):
            response = prediction_app.app.test_client().get(
                "/api/agriculture/options?state=Karnataka&district=Mysuru&variety=Co%2086032"
            )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(
            {item["code"] for item in data["varieties"]},
            {"Co 86032", "CoM 0265"},
        )
        self.assertEqual(data["soil_types"], ["Black Soil"])

    def test_prediction_requires_a_saved_district(self):
        client = prediction_app.app.test_client()
        with patch.object(prediction_app.prediction_engine, "predict") as predict:
            response = client.post("/api/ml/predict", json={
                "state": "Karnataka",
                "variety": "Co 86032",
            })

        self.assertEqual(response.status_code, 400)
        self.assertIn("saved farm district", response.get_json()["message"])
        predict.assert_not_called()

    def test_backend_rejects_invalid_combination_before_inference(self):
        client = prediction_app.app.test_client()
        with patch.object(prediction_app.prediction_engine, "predict") as predict:
            response = client.post("/api/ml/predict", json={
                "state": "Karnataka",
                "variety": "Co 0238",
            })

        self.assertEqual(response.status_code, 400)
        self.assertIn("Co 0238", response.get_json()["message"])
        self.assertIn("Karnataka", response.get_json()["message"])
        predict.assert_not_called()

    def test_valid_combination_reaches_model_with_unchanged_input(self):
        client = prediction_app.app.test_client()
        payload = {
            "state": "Karnataka",
            "district": "Mysuru",
            "variety": "Co 86032",
            "location": "Mysuru, Karnataka",
            "area_hectare": 2.5,
            "soil_type": "Black Soil",
            "soil_ph": 7.2,
            "soil_moisture": 62.0,
            "rainfall_mm": 1200.0,
            "temperature_c": 29.5,
            "humidity_pct": 70.0,
            "planting_date": "2025-10-15",
            "crop_growth_stage": "Grand Growth",
            "historical_yield": 95.0,
        }
        prediction = {
            "predicted_yield": 100.0,
            "expected_production": 250.0,
            "confidence": 90.0,
            "expected_range": {"low": 90.0, "high": 110.0},
            "risk": "Low",
            "loss_percentage": 10.0,
            "expected_loss_t": 5.0,
            "model_used": "Random Forest",
            "crop_health": "Good",
            "feature_importance": [],
        }
        explanation = {
            "feature_contributions": [],
            "positive_factors": [],
            "negative_factors": [],
            "confidence_reasons": [],
            "summary": "",
        }

        farm = SimpleNamespace(
            state="Karnataka",
            district="Mysuru",
            fields=[SimpleNamespace(sugarcane_variety="Co 86032", soil_type="Black Soil")],
        )
        farm_query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(all=lambda: [farm])
        )
        with (
            patch.object(prediction_app, "get_current_user", return_value=SimpleNamespace(id=1)),
            patch.object(prediction_app, "Farm", SimpleNamespace(query=farm_query)),
            patch.object(prediction_app.prediction_engine, "predict", return_value=prediction) as predict,
            patch.object(prediction_app.prediction_engine, "explain_prediction", return_value=explanation),
            patch.object(prediction_app.db.session, "add"),
            patch.object(prediction_app.db.session, "flush"),
            patch.object(prediction_app.db.session, "commit"),
        ):
            response = client.post("/api/ml/predict", json=payload)

        self.assertEqual(response.status_code, 200, response.get_json())
        predict.assert_called_once_with(payload)
        self.assertEqual(response.get_json()["data"]["predicted_yield"], 100.0)

    def test_prediction_rejects_soil_not_recorded_for_selected_variety(self):
        farm = SimpleNamespace(
            state="Karnataka",
            district="Mysuru",
            fields=[SimpleNamespace(sugarcane_variety="Co 86032", soil_type="Black Soil")],
        )
        farm_query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(all=lambda: [farm])
        )
        with (
            patch.object(prediction_app, "get_current_user", return_value=SimpleNamespace(id=1)),
            patch.object(prediction_app, "Farm", SimpleNamespace(query=farm_query)),
            patch.object(prediction_app.prediction_engine, "predict") as predict,
        ):
            response = prediction_app.app.test_client().post("/api/ml/predict", json={
                "state": "Karnataka",
                "district": "Mysuru",
                "variety": "Co 86032",
                "soil_type": "Red Loam",
            })

        self.assertEqual(response.status_code, 400)
        self.assertIn("soil type is not recorded", response.get_json()["message"])
        predict.assert_not_called()

    def test_prediction_rejects_values_outside_variety_suitability_range(self):
        farm = SimpleNamespace(
            state="Karnataka",
            district="Mysuru",
            fields=[SimpleNamespace(sugarcane_variety="Co 86032", soil_type="Black Soil")],
        )
        farm_query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(all=lambda: [farm])
        )
        variety = SimpleNamespace(
            optimal_ph_min=6.2,
            optimal_ph_max=7.8,
            optimal_rainfall_min=1100,
            optimal_rainfall_max=1500,
        )
        variety_query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(first=lambda: variety)
        )
        with (
            patch.object(prediction_app, "get_current_user", return_value=SimpleNamespace(id=1)),
            patch.object(prediction_app, "Farm", SimpleNamespace(query=farm_query)),
            patch.object(prediction_app, "SugarcaneVariety", SimpleNamespace(query=variety_query)),
            patch.object(prediction_app.prediction_engine, "predict") as predict,
        ):
            response = prediction_app.app.test_client().post("/api/ml/predict", json={
                "state": "Karnataka",
                "district": "Mysuru",
                "variety": "Co 86032",
                "soil_type": "Black Soil",
                "soil_ph": 8.2,
                "rainfall_mm": 1200,
            })

        self.assertEqual(response.status_code, 400)
        self.assertIn("selected variety's suitable range", response.get_json()["message"])
        predict.assert_not_called()


if __name__ == "__main__":
    unittest.main()