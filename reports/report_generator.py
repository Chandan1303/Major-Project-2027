"""
Agricultural Decision Support System — Complete 7-Report Generator
Supports:
1. Yield Prediction Report
2. Crop Growth Report
3. Weather Report
4. Soil Report
5. Yield Loss Report
6. Farm Summary Report
7. Complete Farm Intelligence Report
Includes CSV exporter and JSON data packager.
"""

import io
import csv
import json
from datetime import datetime
from pathlib import Path


class AgronomicReportGenerator:
    def __init__(self, output_dir=None):
        self.output_dir = Path(output_dir) if output_dir else Path(__file__).resolve().parent

    def generate_report(self, report_type: str, farm_data: dict, field_data: dict = None, prediction_data: dict = None, weather_data: dict = None, soil_data: dict = None, crop_data: dict = None) -> dict:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        report_id = f"AGR-{int(datetime.now().timestamp())}"

        farm_name = farm_data.get("name", "Demo Sugarcane Farm")
        location = farm_data.get("location", "Kolhapur, Maharashtra")
        area = float(field_data.get("area") if field_data else farm_data.get("total_area", 5.0))
        variety = (field_data.get("sugarcane_variety") if field_data else None) or (prediction_data.get("variety") if prediction_data else "Co 86032")

        pred_yield = float(prediction_data.get("predicted_yield", 88.5)) if prediction_data else 88.5
        expected_prod = round(pred_yield * area, 2)
        confidence = float(prediction_data.get("confidence", 91.2)) if prediction_data else 91.2
        risk_level = (prediction_data.get("risk") or prediction_data.get("risk_level") or "Low") if prediction_data else "Low"
        loss_pct = float(prediction_data.get("loss_percentage") or prediction_data.get("expected_loss_pct") or 8.5) if prediction_data else 8.5

        # Standard Sections
        farm_overview = {
            "farm_name": farm_name,
            "field_name": field_data.get("name", "Active Field") if field_data else "All Fields Summary",
            "location": location,
            "area_hectares": area,
            "variety": variety,
            "planting_date": field_data.get("planting_date", "2025-10-15") if field_data else "2025-10-15"
        }

        soil_overview = soil_data or {
            "soil_type": field_data.get("soil_type", "Black Soil") if field_data else "Black Soil",
            "soil_ph": float(field_data.get("soil_ph", 7.2)) if field_data else 7.2,
            "soil_moisture": float(field_data.get("soil_moisture", 62.0)) if field_data else 62.0,
            "health_score": 88.0,
            "suitability": "Highly Suitable"
        }

        weather_overview = weather_data or {
            "temperature_c": 29.5,
            "rainfall_mm": 1220.0,
            "humidity_pct": 72.0,
            "weather_condition": "Partly Cloudy",
            "overall_weather_risk": "Low"
        }

        crop_overview = crop_data or {
            "current_stage": "Grand Growth",
            "days_since_planting": 330,
            "expected_timeline_days": 380,
            "estimated_harvest": "2026-11-01",
            "crop_condition": "Healthy"
        }

        prediction_overview = {
            "variety": variety,
            "predicted_yield_tha": pred_yield,
            "expected_production_tonnes": expected_prod,
            "confidence_percentage": confidence,
            "risk_level": risk_level,
            "loss_percentage": loss_pct,
            "expected_range": prediction_data.get("expected_range", {"low": round(pred_yield*0.9, 1), "high": round(pred_yield*1.1, 1)}) if prediction_data else {"low": round(pred_yield*0.9, 1), "high": round(pred_yield*1.1, 1)},
            "model_used": prediction_data.get("model_used", "Random Forest Regressor") if prediction_data else "Random Forest Regressor"
        }

        # Customized Focus by Report Type
        title = f"{report_type} — {farm_name}"
        summary = ""
        sections = {}
        recommendations = []

        if report_type == "Yield Prediction Report":
            title = f"Yield Prediction Report — {variety} at {farm_name}"
            summary = f"Forecasting a yield of {pred_yield:.1f} t/ha ({expected_prod:.1f} tonnes total production) with {confidence:.1f}% confidence under current agronomic conditions."
            sections = {
                "Farm Profile": farm_overview,
                "ML Yield Forecast": prediction_overview,
                "Soil & Climate Baseline": {**soil_overview, **weather_overview},
                "Explainable AI Summary": prediction_data.get("explainable_ai", {}) if prediction_data else {}
            }
            recommendations = [
                f"Maintain optimum moisture regime to sustain expected {pred_yield} t/ha yield.",
                "Conduct brix sampling 30 days prior to harvest to pinpoint peak sucrose window.",
                "Ensure lodging protection in high wind sectors during grand growth."
            ]

        elif report_type == "Crop Growth Report":
            title = f"Crop Growth & Phenology Report — {farm_name}"
            summary = f"Crop is currently in {crop_overview['current_stage']} stage ({crop_overview['days_since_planting']} days since planting) with {crop_overview['crop_condition']} vegetative vigor."
            sections = {
                "Farm & Field": farm_overview,
                "Crop Phenology": crop_overview,
                "Soil Water Availability": soil_overview,
                "Upcoming Agronomic Activities": {
                    "Next Stage": "Maturity",
                    "Estimated Harvest": crop_overview["estimated_harvest"],
                    "Focus Area": "Sucrose synthesis and moisture tapering"
                }
            }
            recommendations = [
                "Execute final earthing up to reinforce root anchor against stalk lodging.",
                "Monitor for early shoot and internode borers during elongation.",
                "Restrict nitrogen applications 90 days before anticipated harvest date."
            ]

        elif report_type == "Weather Report":
            title = f"Agro-Meteorological Impact Report — {location}"
            summary = f"Current weather indices show {weather_overview.get('temperature_c', 29.5)}°C and {weather_overview.get('rainfall_mm', 1200)} mm precipitation with {weather_overview.get('overall_weather_risk', 'Low')} weather risk."
            sections = {
                "Location": {"location": location, "recorded_date": timestamp[:10]},
                "Weather Parameters": weather_overview,
                "Impact on Sugarcane": {
                    "Temperature Impact": "Optimal photosynthesis and tillering range (26-34°C)",
                    "Precipitation Impact": "Satisfies formative transpiration requirements",
                    "Humidity Impact": "Supports healthy leaf transpiration without elevated fungal pressure"
                }
            }
            recommendations = [
                "Ensure proper drainage in furrows in case of heavy unseasonal showers.",
                "Adjust drip irrigation timing to evening during high temperature days.",
                "Monitor for foliar rust if humidity persists above 85% for consecutive days."
            ]

        elif report_type == "Soil Report":
            title = f"Soil Fertility & Health Assessment Report — {farm_name}"
            summary = f"Soil health scored at {soil_overview.get('health_score', 85)}/100 ({soil_overview.get('soil_type', 'Black Soil')}, pH {soil_overview.get('soil_ph', 7.0)}), classified as {soil_overview.get('suitability', 'Highly Suitable')}."
            sections = {
                "Field & Soil Profile": soil_overview,
                "Nutrient Recommendations": {
                    "Nitrogen (N)": "150-200 kg/ha split in 3 doses during first 100 days",
                    "Phosphorus (P2O5)": "60-80 kg/ha basal placement at planting",
                    "Potassium (K2O)": "80-120 kg/ha split between planting and grand growth"
                },
                "Soil Moisture Health": {
                    "Current Moisture": f"{soil_overview.get('soil_moisture', 60)}%",
                    "Status": "Adequate for active cane expansion"
                }
            }
            recommendations = [
                "Incorporate organic farmyard manure (FYM) or pressmud to improve soil microbial activity.",
                "Maintain soil pH within 6.5 to 7.8 band for optimal phosphorus availability.",
                "Use trash mulching between cane rows to conserve soil moisture and suppress weeds."
            ]

        elif report_type == "Yield Loss Report":
            title = f"Yield Loss & Risk Mitigation Analysis — {farm_name}"
            ref_yield = prediction_data.get("reference_yield", 118.5) if prediction_data else 118.5
            loss_tonnes = max(0.0, ref_yield - pred_yield) * area
            summary = f"Estimated yield gap of {loss_pct:.1f}% ({loss_tonnes:.1f} tonnes total potential loss) against variety genetic potential ({ref_yield:.1f} t/ha)."
            sections = {
                "Loss Metrics": {
                    "Predicted Yield": f"{pred_yield:.1f} t/ha",
                    "Reference Genetic Potential": f"{ref_yield:.1f} t/ha",
                    "Yield Deficit": f"{max(0.0, ref_yield - pred_yield):.1f} t/ha",
                    "Loss Percentage": f"{loss_pct:.1f}%",
                    "Total Production Deficit": f"{loss_tonnes:.1f} tonnes",
                    "Risk Classification": risk_level
                },
                "Factor Contribution Analysis": {
                    "Weather Influence": "Deficit rainfall or high summer temperature limits maximum cane elongation.",
                    "Soil Moisture Impact": "Fluctuations in root zone moisture during tillering stage.",
                    "Growth Stage Vulnerability": "Grand growth internode spacing affected by water stress."
                }
            }
            recommendations = [
                "Implement precision micro-irrigation to eliminate moisture stress during tillering.",
                "Apply potassium foliar spray (1% KCl) to enhance drought tolerance and stem thickness.",
                "Ensure balanced N-P-K fertilization to close the 15-20% management yield gap."
            ]

        elif report_type == "Farm Summary Report":
            title = f"Farm Operational Summary Report — {farm_name}"
            summary = f"Comprehensive summary of {farm_name} ({location}, {area} ha). Current projected harvest: {expected_prod:.1f} tonnes."
            sections = {
                "Farm Profile": farm_overview,
                "Soil Status": soil_overview,
                "Weather Baseline": weather_overview,
                "Yield Overview": prediction_overview
            }
            recommendations = [
                "Review field-by-field water distribution across blocks.",
                "Schedule harvesting logistics with local sugar mill 45 days in advance."
            ]

        else: # Complete Farm Intelligence Report
            report_type = "Complete Farm Intelligence Report"
            title = f"Complete Farm Intelligence & Decision Support Brief — {farm_name}"
            summary = f"Full agronomic evaluation synthesizing soil vitality ({soil_overview.get('health_score', 88)}/100), weather indices ({weather_overview.get('temperature_c', 29.5)}°C), phenology ({crop_overview['current_stage']}), and ML yield prediction ({pred_yield} t/ha)."
            sections = {
                "Farm & Field Profile": farm_overview,
                "Crop Growth & Lifecycle": crop_overview,
                "Soil Health & Nutrients": soil_overview,
                "Meteorological Profile": weather_overview,
                "AI Yield & Production Forecast": prediction_overview,
                "Yield Loss & Risk Analysis": {
                    "Loss Percentage": f"{loss_pct:.1f}%",
                    "Risk Level": risk_level,
                    "Mitigation Priority": "High" if loss_pct > 25 else "Moderate"
                }
            }
            recommendations = [
                "Synchronize irrigation scheduling with real-time soil moisture and weather outlook.",
                "Deploy proactive pest vigilance against Pyrilla and root borers.",
                "Engage with agricultural extension officer for pre-harvest cane brix testing.",
                "Log all seasonal inputs in the system to improve multi-year machine learning accuracy."
            ]

        report = {
            "report_id": report_id,
            "report_type": report_type,
            "title": title,
            "summary": summary,
            "generated_at": timestamp,
            "farm_name": farm_name,
            "location": location,
            "area_hectares": area,
            "variety": variety,
            "predicted_yield": pred_yield,
            "expected_production": expected_prod,
            "confidence": confidence,
            "risk_level": risk_level,
            "loss_percentage": loss_pct,
            "sections": sections,
            "recommendations": recommendations,
            "disclaimer": "This intelligence report is generated by AI-Based Sugarcane Decision Support System using trained machine learning models. Validate field-level decisions with certified agricultural officers."
        }

        # Save JSON artifact
        json_path = self.output_dir / f"{report_id}.json"
        try:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
        except Exception:
            pass

        return report

    def generate_csv(self, report_dict: dict) -> str:
        """Converts report sections and parameters into a clean CSV string"""
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["Report Title", report_dict.get("title", "")])
        writer.writerow(["Report Type", report_dict.get("report_type", "")])
        writer.writerow(["Report ID", report_dict.get("report_id", "")])
        writer.writerow(["Generated At", report_dict.get("generated_at", "")])
        writer.writerow(["Farm Name", report_dict.get("farm_name", "")])
        writer.writerow(["Location", report_dict.get("location", "")])
        writer.writerow(["Area (ha)", report_dict.get("area_hectares", "")])
        writer.writerow(["Variety", report_dict.get("variety", "")])
        writer.writerow(["Predicted Yield (t/ha)", report_dict.get("predicted_yield", "")])
        writer.writerow(["Expected Production (t)", report_dict.get("expected_production", "")])
        writer.writerow(["Confidence (%)", report_dict.get("confidence", "")])
        writer.writerow(["Risk Level", report_dict.get("risk_level", "")])
        writer.writerow(["Loss Percentage (%)", report_dict.get("loss_percentage", "")])
        writer.writerow([])

        writer.writerow(["--- SECTIONS & DATA ---"])
        sections = report_dict.get("sections", {})
        for sec_name, sec_data in sections.items():
            writer.writerow([sec_name])
            if isinstance(sec_data, dict):
                for k, v in sec_data.items():
                    writer.writerow(["", k, str(v)])
            writer.writerow([])

        writer.writerow(["--- RECOMMENDATIONS ---"])
        for idx, rec in enumerate(report_dict.get("recommendations", []), 1):
            writer.writerow([idx, rec])

        writer.writerow([])
        writer.writerow(["Disclaimer", report_dict.get("disclaimer", "")])

        return output.getvalue()

    def generate_farm_report(self, farm_data: dict, prediction_data: dict = None, weather_data: dict = None, soil_data: dict = None) -> dict:
        """Backward-compatible helper for Part 1"""
        return self.generate_report("Farm Summary Report", farm_data, prediction_data=prediction_data, weather_data=weather_data, soil_data=soil_data)
