"""
Soil Analysis & Health Assessment Engine
Evaluates soil parameters for sugarcane cultivation:
- Soil type
- Soil pH
- Soil moisture
- Nutrients if available (DO NOT INVENT NUTRIENT VALUES)
- Soil health score
- Sugarcane suitability
- Soil impact
"""

SOIL_TYPE_SUITABILITY = {
    "Black Cotton Soil": {
        "suitability": "Highly Suitable",
        "base_score": 90,
        "drainage": "Moderate",
        "description": "High clay content with superb water and cation retention; traditional choice for Deccan sugarcane."
    },
    "Alluvial Soil": {
        "suitability": "Highly Suitable",
        "base_score": 92,
        "drainage": "Excellent",
        "description": "Deep, loamy, fertile soil of Indo-Gangetic plains with well-balanced mineral composition."
    },
    "Red Laterite Soil": {
        "suitability": "Suitable",
        "base_score": 78,
        "drainage": "Good",
        "description": "Well-drained porous soil; requires supplementary organic matter and phosphorus amendment."
    },
    "Clay Loam": {
        "suitability": "Highly Suitable",
        "base_score": 88,
        "drainage": "Good",
        "description": "Ideal soil texture balancing moisture holding capacity and root aeration for heavy tillering."
    },
    "Sandy Loam": {
        "suitability": "Moderate",
        "base_score": 72,
        "drainage": "Excessive",
        "description": "Light textured; requires higher irrigation frequency and split fertilizer applications to curb leaching."
    },
    "Loamy Soil": {
        "suitability": "Highly Suitable",
        "base_score": 90,
        "drainage": "Ideal",
        "description": "Optimal physical structure with balanced sand, silt, and clay proportions."
    }
}

class SoilAnalyzer:
    @classmethod
    def evaluate_soil(
        cls,
        soil_type: str,
        soil_ph: float,
        soil_moisture: float,
        nitrogen_kg_ha: float = None,
        phosphorus_kg_ha: float = None,
        potassium_kg_ha: float = None,
        organic_carbon_pct: float = None,
        electrical_conductivity: float = None
    ) -> dict:
        """
        Analyzes field soil health and impact.
        IMPORTANT: Nutrients (N, P, K, OC, EC) are evaluated ONLY if provided.
        No nutrient values are fabricated or invented.
        """
        ph = float(soil_ph)
        moisture = float(soil_moisture)
        type_info = SOIL_TYPE_SUITABILITY.get(
            soil_type,
            {
                "suitability": "Suitable",
                "base_score": 80,
                "drainage": "Moderate",
                "description": "Standard agricultural soil profile."
            }
        )

        # 1. pH Evaluation (Optimal for sugarcane: 6.0 - 7.5, acceptable 5.5 - 8.0)
        ph_points = 35.0
        if 6.2 <= ph <= 7.5:
            ph_status = "Optimal"
            ph_impact = "Optimal nutrient bioavailability. Nitrogen, phosphorus, and micronutrients are readily absorbed."
        elif 5.8 <= ph < 6.2:
            ph_status = "Slightly Acidic"
            ph_impact = "Moderate acidity. Micronutrient availability is adequate but phosphorus fixation may begin."
            ph_points -= 7.0
        elif 7.5 < ph <= 8.2:
            ph_status = "Slightly Alkaline"
            ph_impact = "Mild alkalinity. Zinc and iron micronutrient uptake may be restricted; monitor for chlorosis."
            ph_points -= 7.0
        elif ph < 5.8:
            ph_status = "Strongly Acidic"
            ph_impact = "Acid toxicity risk. Liming (agricultural lime/dolomite) strongly recommended to raise pH."
            ph_points -= 18.0
        else:
            ph_status = "Alkaline / Sodic"
            ph_impact = "Elevated alkalinity. Gypsum application and organic matter incorporation recommended."
            ph_points -= 18.0

        # 2. Moisture Evaluation (Optimal: 60% - 75%)
        moisture_points = 35.0
        if 60.0 <= moisture <= 75.0:
            moisture_status = "Optimal"
            moisture_impact = "Optimal root zone hydration. Maximizes cell turgor and stalk elongation."
        elif 50.0 <= moisture < 60.0:
            moisture_status = "Adequate"
            moisture_impact = "Adequate soil moisture. Schedule irrigation within 3–5 days."
            moisture_points -= 6.0
        elif 75.0 < moisture <= 85.0:
            moisture_status = "High Moisture"
            moisture_impact = "Soil is near saturation. Ensure drainage channels are clear to prevent root rot."
            moisture_points -= 8.0
        elif moisture < 50.0:
            moisture_status = "Deficit"
            moisture_impact = "Moisture stress detected. Immediate irrigation recommended to prevent tillering drop."
            moisture_points -= 16.0
        else:
            moisture_status = "Waterlogged"
            moisture_impact = "Critical waterlogging. Anaerobic conditions stifle root respiration and nutrient uptake."
            moisture_points -= 20.0

        # 3. Physical Soil Texture points (Max 30)
        texture_points = (type_info["base_score"] / 100.0) * 30.0

        # Base health score from physical and chemical measurements (max 100)
        base_health_score = round(ph_points + moisture_points + texture_points, 1)

        # 4. Real lab nutrients (only if provided by user/lab)
        nutrients = {}
        has_nutrients = False

        if nitrogen_kg_ha is not None:
            has_nutrients = True
            n = float(nitrogen_kg_ha)
            nutrients["nitrogen"] = {
                "value": n,
                "unit": "kg/ha",
                "status": "High" if n > 280 else "Medium" if n >= 180 else "Low",
                "optimal_range": "180–280 kg/ha"
            }

        if phosphorus_kg_ha is not None:
            has_nutrients = True
            p = float(phosphorus_kg_ha)
            nutrients["phosphorus"] = {
                "value": p,
                "unit": "kg/ha",
                "status": "High" if p > 55 else "Medium" if p >= 25 else "Low",
                "optimal_range": "25–55 kg/ha"
            }

        if potassium_kg_ha is not None:
            has_nutrients = True
            k = float(potassium_kg_ha)
            nutrients["potassium"] = {
                "value": k,
                "unit": "kg/ha",
                "status": "High" if k > 300 else "Medium" if k >= 150 else "Low",
                "optimal_range": "150–300 kg/ha"
            }

        if organic_carbon_pct is not None:
            has_nutrients = True
            oc = float(organic_carbon_pct)
            nutrients["organic_carbon"] = {
                "value": oc,
                "unit": "%",
                "status": "High" if oc > 0.75 else "Medium" if oc >= 0.50 else "Low",
                "optimal_range": "0.50%–0.85%"
            }

        if electrical_conductivity is not None:
            has_nutrients = True
            ec = float(electrical_conductivity)
            nutrients["electrical_conductivity"] = {
                "value": ec,
                "unit": "dS/m",
                "status": "Normal" if ec < 1.0 else "Critical Salinity" if ec > 2.0 else "Slight Salinity",
                "optimal_range": "< 1.0 dS/m"
            }

        final_health_score = base_health_score
        if base_health_score >= 82.0:
            health_label = "Excellent"
            suitability = "Highly Suitable"
        elif base_health_score >= 68.0:
            health_label = "Good"
            suitability = "Suitable"
        elif base_health_score >= 52.0:
            health_label = "Moderate"
            suitability = "Moderate"
        else:
            health_label = "Degraded"
            suitability = "Poor"

        soil_impact = (
            f"{soil_type} with pH {ph} and {moisture:.0f}% moisture is {suitability.lower()} for sugarcane. "
            f"{ph_impact} {moisture_impact}"
        )

        return {
            "soil_type": soil_type,
            "soil_ph": ph,
            "soil_moisture": moisture,
            "health_score": round(final_health_score),
            "health_label": health_label,
            "sugarcane_suitability": suitability,
            "ph_status": ph_status,
            "ph_impact": ph_impact,
            "moisture_status": moisture_status,
            "moisture_impact": moisture_impact,
            "soil_impact": soil_impact,
            "has_lab_nutrients": has_nutrients,
            "nutrients": nutrients if has_nutrients else None,
            "drainage": type_info.get("drainage", "Moderate"),
            "score_breakdown": {
                "ph_balance": round(ph_points),
                "moisture_holding": round(moisture_points),
                "soil_texture": round(texture_points)
            }
        }
