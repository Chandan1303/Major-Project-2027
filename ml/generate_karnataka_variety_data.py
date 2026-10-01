"""
Generate synthetic training data for Karnataka sugarcane varieties
Based on official variety characteristics and regional growing conditions
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)

# Karnataka variety characteristics from official data
KARNATAKA_VARIETIES = {
    "CoM 0265": {
        "maturity": "Medium-late",
        "productivity": "high",
        "yield_range": (110, 175),
        "avg_yield": 142,
        "soil_preference": ["Black Soil", "Saline Soil", "Alkaline Soil"],
        "districts": ["Belagavi", "Bagalkot"],
        "drought_tolerance": "high",
        "sucrose_pct": 13.9
    },
    "Co 86032": {
        "maturity": "Medium-late",
        "productivity": "medium-high",
        "yield_range": (95, 145),
        "avg_yield": 118.5,
        "soil_preference": ["Black Soil", "Red Soil", "Alluvial Soil", "Coastal Soil"],
        "districts": ["Belagavi", "Bagalkot", "Mandya", "Central Karnataka", "North Karnataka", "Coastal Karnataka"],
        "drought_tolerance": "high",
        "sucrose_pct": 14.5
    },
    "Co 94012": {
        "maturity": "Early",
        "productivity": "high",
        "yield_range": (100, 155),
        "avg_yield": 127.5,
        "soil_preference": ["Red Soil", "Black Soil", "Loamy Soil"],
        "districts": ["Central Karnataka", "North Karnataka"],
        "drought_tolerance": "medium",
        "sucrose_pct": 15.2
    },
    "Co 419": {
        "maturity": "Medium",
        "productivity": "medium",
        "yield_range": (80, 130),
        "avg_yield": 105,
        "soil_preference": ["Red Soil", "Black Soil", "Loamy Soil"],
        "districts": ["Mandya", "North Karnataka"],
        "drought_tolerance": "medium",
        "sucrose_pct": 14.0
    },
    "Co 62175": {
        "maturity": "Medium-late",
        "productivity": "medium-high",
        "yield_range": (90, 140),
        "avg_yield": 115,
        "soil_preference": ["Red Soil", "Black Soil"],
        "districts": ["Mandya", "Tungabhadra region"],
        "drought_tolerance": "medium",
        "sucrose_pct": 14.3
    }
}

# Karnataka growing conditions
SOIL_TYPES = ["Black Soil", "Red Soil", "Alluvial Soil", "Loamy Soil", "Saline Soil", "Coastal Soil"]
GROWTH_STAGES = ["Planting", "Germination", "Tillering", "Grand Growth", "Maturity", "Harvest"]

# Karnataka climate parameters (ranges based on regions)
CLIMATE_RANGES = {
    "rainfall_mm": (800, 1800),      # Karnataka: 800-1800mm annually
    "temperature_c": (22, 35),        # Karnataka: 22-35°C
    "humidity_pct": (55, 85),         # Karnataka: 55-85%
    "soil_ph": (6.0, 8.5),           # Slightly acidic to alkaline
    "soil_moisture": (45, 75)         # Moisture percentage
}

def generate_variety_data(variety_code, variety_info, num_samples=150):
    """Generate synthetic but realistic training data for a variety"""
    
    data = []
    
    for i in range(num_samples):
        # Select growth stage
        growth_stage = np.random.choice(GROWTH_STAGES)
        
        # Select soil type based on variety preference
        soil_type = np.random.choice(variety_info["soil_preference"])
        
        # Generate climate parameters with realistic variations
        rainfall = np.random.uniform(*CLIMATE_RANGES["rainfall_mm"])
        temperature = np.random.uniform(*CLIMATE_RANGES["temperature_c"])
        humidity = np.random.uniform(*CLIMATE_RANGES["humidity_pct"])
        
        # Soil parameters
        if "Saline" in soil_type or "Alkaline" in soil_type:
            soil_ph = np.random.uniform(7.5, 8.5)
        elif "Red" in soil_type:
            soil_ph = np.random.uniform(6.0, 7.0)
        else:
            soil_ph = np.random.uniform(6.5, 7.5)
        
        soil_moisture = np.random.uniform(*CLIMATE_RANGES["soil_moisture"])
        
        # Area typically 0.5 to 10 hectares
        area_hectare = np.random.uniform(0.5, 10.0)
        
        # Historical yield (previous season)
        historical_yield = np.random.uniform(
            variety_info["yield_range"][0] * 0.8,
            variety_info["yield_range"][1] * 0.9
        )
        
        # Calculate expected yield based on conditions
        base_yield = variety_info["avg_yield"]
        
        # Yield adjustments based on conditions
        yield_factors = 1.0
        
        # Growth stage impact
        stage_factors = {
            "Planting": 0.02,
            "Germination": 0.15,
            "Tillering": 0.45,
            "Grand Growth": 0.85,
            "Maturity": 0.95,
            "Harvest": 1.0
        }
        yield_factors *= stage_factors[growth_stage]
        
        # Rainfall impact
        optimal_rainfall = 1200
        if rainfall < 800:
            yield_factors *= (0.6 + (rainfall / 800) * 0.3)
        elif rainfall > 1600:
            yield_factors *= (1.0 - (rainfall - 1600) / 1000 * 0.2)
        else:
            yield_factors *= (0.9 + abs(rainfall - optimal_rainfall) / 2000)
        
        # Temperature impact
        if temperature < 25:
            yield_factors *= (0.8 + (temperature - 22) / 15)
        elif temperature > 33:
            yield_factors *= (1.0 - (temperature - 33) / 10)
        
        # Soil moisture impact
        if soil_moisture < 50:
            yield_factors *= (0.7 + soil_moisture / 100)
        elif soil_moisture > 70:
            yield_factors *= (1.0 - (soil_moisture - 70) / 50)
        
        # Drought tolerance factor
        if variety_info["drought_tolerance"] == "high" and rainfall < 1000:
            yield_factors *= 1.1
        
        # Calculate final yield with some randomness
        yield_value = base_yield * yield_factors * np.random.uniform(0.9, 1.1)
        
        # Ensure yield is within variety range
        yield_value = np.clip(
            yield_value,
            variety_info["yield_range"][0] * 0.5,
            variety_info["yield_range"][1] * 1.1
        )
        
        data.append({
            "state": "Karnataka",
            "variety": variety_code,
            "area_hectare": round(area_hectare, 2),
            "soil_type": soil_type,
            "soil_ph": round(soil_ph, 2),
            "soil_moisture": round(soil_moisture, 1),
            "rainfall_mm": round(rainfall, 1),
            "temperature_c": round(temperature, 1),
            "humidity_pct": round(humidity, 1),
            "growth_stage": growth_stage,
            "historical_yield": round(historical_yield, 1),
            "yield": round(yield_value, 1)
        })
    
    return data

def main():
    print("Generating Karnataka variety training data...")
    
    all_data = []
    
    for variety_code, variety_info in KARNATAKA_VARIETIES.items():
        print(f"\nGenerating {variety_code}...")
        variety_data = generate_variety_data(variety_code, variety_info, num_samples=150)
        all_data.extend(variety_data)
        print(f"  Generated {len(variety_data)} samples")
        print(f"  Yield range: {min(d['yield'] for d in variety_data):.1f} - {max(d['yield'] for d in variety_data):.1f} t/ha")
    
    # Create DataFrame
    df = pd.DataFrame(all_data)
    
    # Save to CSV
    output_path = Path("ml") / "karnataka_varieties_training_data.csv"
    df.to_csv(output_path, index=False)
    
    print(f"\n✅ Generated {len(df)} total records")
    print(f"📁 Saved to: {output_path}")
    
    # Show summary statistics
    print("\n📊 Data Summary:")
    print(df.groupby('variety')['yield'].agg(['count', 'mean', 'min', 'max']).round(1))
    
    print("\n✅ Next steps:")
    print("1. Review the generated data: karnataka_varieties_training_data.csv")
    print("2. Append to main dataset: cat karnataka_varieties_training_data.csv >> final_dataset/SUGARCANE_AGRONOMIC_ML_DATASET.csv")
    print("3. Retrain models: python ml/train_sugarcane_models.py")
    print("4. Update variety intelligence: ml/variety_intelligence.py")
    print("5. Update state recommendations: backend/data/state_variety_recommendations.json")

if __name__ == "__main__":
    main()
