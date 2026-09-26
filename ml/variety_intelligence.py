"""
Sugarcane Variety Intelligence Module
Supports: Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265
Provides:
- Variety list
- Variety details
- Variety comparison:
  * Expected yield
  * Soil suitability
  * Weather suitability
  * Growth characteristics
  * Crop condition
  * Risk
"""

VARIETY_DATABASE = {
    "Co 86032": {
        "code": "Co 86032",
        "name": "Co 86032 (Nayana)",
        "origin": "ICAR-Sugarcane Breeding Institute, Coimbatore",
        "maturity_type": "Mid-Late",
        "duration_months": "12-14 months",
        "expected_yield_range": "95–145 t/ha",
        "expected_yield": 118.5,
        "avg_yield": 118.5,
        "max_yield": 145.0,
        "sucrose_pct": 14.5,
        "soil_suitability": "Excellent in medium-to-deep black cotton soil and well-drained alluvial soil. Highly tolerant to salinity and sodicity.",
        "weather_suitability": "Thrives in tropical zones with 28-34°C temperatures and well-distributed rainfall. High tolerance to warm summers.",
        "growth_characteristics": "Erect, thick canes, high tillering capacity, excellent ratoonability up to 3-4 cycles, non-lodging with self-detaching dry leaves.",
        "crop_condition": "Excellent",
        "disease_resistance": "High resistance to red rot and smut; moderately resistant to wilt.",
        "drought_tolerance": "High",
        "risk": "Low",
        "recommended_states": ["Maharashtra", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Gujarat"],
        "description": "India's most popular tropical commercial cane. Extremely reliable yield, excellent sucrose content, and superb drought tolerance."
    },
    "Co 0238": {
        "code": "Co 0238",
        "name": "Co 0238 (Karan 4)",
        "origin": "ICAR-SBI Regional Centre, Karnal",
        "maturity_type": "Early",
        "duration_months": "10-12 months",
        "expected_yield_range": "105–165 t/ha",
        "expected_yield": 132.0,
        "avg_yield": 132.0,
        "max_yield": 165.0,
        "sucrose_pct": 14.8,
        "soil_suitability": "Performs best in fertile, well-drained loamy to silt-loam alluvial soils with high organic matter.",
        "weather_suitability": "Adapted to subtropical climates with wide temperature variations (10°C to 42°C). High water requirement in peak summer.",
        "growth_characteristics": "Tall vigorous growth, thick green-yellow stalks, heavy tillering, high juice volume, susceptible to lodging under excess nitrogen.",
        "crop_condition": "Good",
        "disease_resistance": "Moderately resistant; requires preventive fungicide rotation and certified seed cane in high red-rot pockets.",
        "drought_tolerance": "Medium",
        "risk": "Medium",
        "recommended_states": ["Uttar Pradesh", "Punjab", "Haryana", "Bihar", "Uttarakhand"],
        "description": "Revolutionized North Indian sugar recovery with record early tonnage and commercial cane sugar extraction."
    },
    "CoC 671": {
        "code": "CoC 671",
        "name": "CoC 671",
        "origin": "Sugarcane Research Station, Cuddalore",
        "maturity_type": "Early",
        "duration_months": "10-11 months",
        "expected_yield_range": "80–125 t/ha",
        "expected_yield": 102.0,
        "avg_yield": 102.0,
        "max_yield": 125.0,
        "sucrose_pct": 15.2,
        "soil_suitability": "Prefers fertile alluvial, clay loam, and red loamy soils with good drainage and neutral pH (6.5–7.5).",
        "weather_suitability": "Requires humid tropical climate with abundant sunshine. Sensitive to prolonged moisture stress.",
        "growth_characteristics": "Early maturing, record early sugar accumulation reaching 18% brix by 10 months, moderate tillering, medium-thick stalks.",
        "crop_condition": "Good",
        "disease_resistance": "Moderately resistant to red rot; sensitive to moisture stress and smut.",
        "drought_tolerance": "Low",
        "risk": "Medium",
        "recommended_states": ["Tamil Nadu", "Andhra Pradesh", "Southern Karnataka", "Kerala"],
        "description": "The benchmark high-sugar variety in peninsular India. Prized by sugar mills for early crushing batches."
    },
    "Co 99004": {
        "code": "Co 99004",
        "name": "Co 99004 (Damodar)",
        "origin": "ICAR-Sugarcane Breeding Institute, Coimbatore",
        "maturity_type": "Mid-Late",
        "duration_months": "12-13 months",
        "expected_yield_range": "90–135 t/ha",
        "expected_yield": 112.0,
        "avg_yield": 112.0,
        "max_yield": 135.0,
        "sucrose_pct": 14.2,
        "soil_suitability": "Broad adaptation across black soils, red soils, and sandy clay loams. Tolerates moderate soil salinity.",
        "weather_suitability": "Suitable for tropical zones with good monsoon precipitation. Exhibits strong heat tolerance during grand growth.",
        "growth_characteristics": "Profuse tillering, solid cane stalks with high fiber for bagasse cogeneration, non-flowering habit.",
        "crop_condition": "Normal",
        "disease_resistance": "High resistance to red rot and smut; resistant to yellow leaf disease.",
        "drought_tolerance": "High",
        "risk": "Low",
        "recommended_states": ["Karnataka", "Maharashtra", "Telangana", "Tamil Nadu"],
        "description": "High biomass dual-purpose cane variety ideal for sugar and jaggery production with solid disease immunity."
    },
    "CoM 0265": {
        "code": "CoM 0265",
        "name": "CoM 0265 (Phule 0265)",
        "origin": "Vasantdada Sugar Institute & MPKV Rahuri",
        "maturity_type": "Mid-Late",
        "duration_months": "12-14 months",
        "expected_yield_range": "110–175 t/ha",
        "expected_yield": 142.0,
        "avg_yield": 142.0,
        "max_yield": 175.0,
        "sucrose_pct": 13.9,
        "soil_suitability": "Exceptional in heavy black clay soils, saline-sodic lands, and degraded fields where other varieties struggle.",
        "weather_suitability": "Extremely drought-tolerant and climate-hardy. Resilient against extreme summer heat up to 44°C.",
        "growth_characteristics": "Massive vegetative vigour, very thick green-purple canes, high single-cane weight, solid core, excellent ratoon yield.",
        "crop_condition": "Excellent",
        "disease_resistance": "Resistant to smut and red rot; highly tolerant to salinity, drought, and water deficit.",
        "drought_tolerance": "High",
        "risk": "Low",
        "recommended_states": ["Maharashtra", "Karnataka", "Gujarat", "Madhya Pradesh"],
        "description": "The heavy-tonnage champion of Western India, frequently surpassing 150 t/ha under good irrigation while enduring harsh soils."
    }
}

class VarietyIntelligenceEngine:
    SUPPORTED_VARIETIES = list(VARIETY_DATABASE.keys())

    @classmethod
    def list_varieties(cls) -> list:
        return list(VARIETY_DATABASE.values())

    @classmethod
    def get_variety(cls, code: str) -> dict:
        key = code.strip()
        for k, v in VARIETY_DATABASE.items():
            if k.lower() == key.lower() or v["name"].lower().startswith(key.lower()):
                return v
        return VARIETY_DATABASE.get("Co 86032")

    @classmethod
    def compare_varieties(cls, variety_codes: list, field_params: dict = None) -> dict:
        """
        Compares selected varieties across:
        - Expected yield
        - Soil suitability
        - Weather suitability
        - Growth characteristics
        - Crop condition
        - Risk
        """
        if not variety_codes:
            variety_codes = ["Co 86032", "Co 0238", "CoM 0265"]

        comparison_list = []
        for code in variety_codes:
            item = cls.get_variety(code)
            if item:
                comparison_list.append({
                    "code": item["code"],
                    "name": item["name"],
                    "expected_yield": item["expected_yield"],
                    "expected_yield_range": item["expected_yield_range"],
                    "soil_suitability": item["soil_suitability"],
                    "weather_suitability": item["weather_suitability"],
                    "growth_characteristics": item["growth_characteristics"],
                    "crop_condition": item["crop_condition"],
                    "risk": item["risk"],
                    "sucrose_pct": item["sucrose_pct"],
                    "maturity_type": item["maturity_type"],
                    "duration_months": item["duration_months"],
                    "disease_resistance": item["disease_resistance"],
                    "drought_tolerance": item["drought_tolerance"]
                })

        # Rank by expected yield
        comparison_list.sort(key=lambda x: x["expected_yield"], reverse=True)
        recommended = comparison_list[0]["code"] if comparison_list else "Co 86032"

        return {
            "comparison": comparison_list,
            "recommended": recommended,
            "comparison_criteria": [
                "Expected Yield",
                "Soil Suitability",
                "Weather Suitability",
                "Growth Characteristics",
                "Crop Condition",
                "Risk"
            ]
        }
