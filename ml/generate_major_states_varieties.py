"""
Generate training data for major sugarcane-producing states
Based on official ICAR-SBI variety recommendations
"""

import pandas as pd
import numpy as np
from pathlib import Path

np.random.seed(42)

# Major state varieties based on ICAR-SBI official recommendations
STATE_VARIETIES = {
    "Uttar Pradesh": {
        "Co 0238": {  # Already exists
            "yield_range": (105, 165), "avg_yield": 132.0, "sucrose": 14.8,
            "maturity": "Early", "drought_tolerance": "medium",
            "soil_preference": ["Alluvial Soil", "Loamy Soil", "Clay Loam"]
        },
        "CoS 767": {  # Popular in Western UP
            "yield_range": (95, 145), "avg_yield": 120.0, "sucrose": 15.1,
            "maturity": "Mid-late", "drought_tolerance": "medium",
            "soil_preference": ["Alluvial Soil", "Loamy Soil", "Sandy Loam"]
        },
        "Co 0238": {  # Already in dataset - skip duplicate
            "skip": True
        },
        "Co 15023": {  # Karan 15 - for Central/Western UP
            "yield_range": (100, 150), "avg_yield": 125.0, "sucrose": 14.9,
            "maturity": "Mid-late", "drought_tolerance": "high",
            "soil_preference": ["Alluvial Soil", "Clay Loam", "Loamy Soil"]
        },
        "CoLk 94184": {  # Good for Eastern UP
            "yield_range": (95, 140), "avg_yield": 117.5, "sucrose": 14.5,
            "maturity": "Early", "drought_tolerance": "medium",
            "soil_preference": ["Alluvial Soil", "Clay Loam"]
        }
    },
    
    "Maharashtra": {
        "Co 86032": {  # Already exists
            "skip": True
        },
        "CoM 0265": {  # Already exists
            "skip": True
        },
        "Co 94012": {  # Popular in Maharashtra too
            "yield_range": (100, 160), "avg_yield": 130.0, "sucrose": 15.0,
            "maturity": "Early", "drought_tolerance": "medium",
            "soil_preference": ["Black Soil", "Red Soil", "Loamy Soil"]
        },
        "MS 14082": {  # Maharashtra specific, high yielding
            "yield_range": (115, 175), "avg_yield": 145.0, "sucrose": 14.2,
            "maturity": "Mid-late", "drought_tolerance": "high",
            "soil_preference": ["Black Soil", "Red Soil"]
        }
    },
    
    "Madhya Pradesh": {
        "Co 86032": {  # Already exists
            "skip": True
        },
        "Co 0238": {  # Also grown in MP
            "yield_range": (100, 150), "avg_yield": 125.0, "sucrose": 14.7,
            "maturity": "Early", "drought_tolerance": "medium",
            "soil_preference": ["Black Soil", "Alluvial Soil", "Red Soil"]
        },
        "CoM 0265": {  # Good for MP
            "yield_range": (110, 170), "avg_yield": 140.0, "sucrose": 13.9,
            "maturity": "Mid-late", "drought_tolerance": "high",
            "soil_preference": ["Black Soil", "Red Soil"]
        },
        "Co 99004": {  # Suitable for MP
            "yield_range": (95, 145), "avg_yield": 120.0, "sucrose": 14.3,
            "maturity": "Mid-late", "drought_tolerance": "high",
            "soil_preference": ["Black Soil", "Red Soil", "Loamy Soil"]
        }
    },
    
    "Punjab": {
        "Co 0238": {  # Already exists
            "skip": True
        },
        "CoJ 64": {  # Popular Punjab variety
            "yield_range": (100, 155), "avg_yield": 127.5, "sucrose": 15.0,
            "maturity": "Mid-late", "drought_tolerance": "medium",
            "soil_preference": ["Alluvial Soil", "Loamy Soil", "Sandy Loam"]
        },
        "CoPb 91": {  # Punjab bred variety
            "yield_range": (105, 160), "avg_yield": 132.5, "sucrose": 14.8,
            "maturity": "Mid-late", "drought_tolerance": "medium",
            "soil_preference": ["Alluvial Soil", "Loamy Soil"]
        },
        "CoS 767": {  # Also suitable for Punjab
            "yield_range": (98, 148), "avg_yield": 123.0, "sucrose": 15.1,
            "maturity": "Mid-late", "drought_tolerance": "medium",
            "soil_preference": ["Alluvial Soil", "Sandy Loam"]
        }
    }
}

# Climate parameters for each state
STATE_CLIMATE = {
    "Uttar Pradesh": {
        "rainfall": (800, 1400), "temperature": (18, 38),
        "humidity": (50, 80), "soil_ph": (6.5, 8.0), "soil_moisture": (50, 75)
    },
    "Maharashtra": {
        "rainfall": (600, 1600), "temperature": (20, 38),
        "humidity": (45, 80), "soil_ph": (6.0, 8.5), "soil_moisture": (45, 75)
    },
    "Madhya Pradesh": {
        "rainfall": (700, 1500), "temperature": (18, 42),
        "humidity": (40, 75), "soil_ph": (6.5, 8.0), "soil_moisture": (45, 70)
    },
    "Punjab": {
        "rainfall": (500, 1100), "temperature": (10, 42),
        "humidity": (40, 80), "soil_ph": (7.0, 8.5), "soil_moisture": (55, 80)
    }
}

GROWTH_STAGES = ["Planting", "Germination", "Tillering", "Grand Growth", "Maturity", "Harvest"]

def generate_variety_data(state, variety_code, variety_info, num_samples=120):
    """Generate realistic training data for a state-variety combination"""
    
    if variety_info.get("skip"):
        return []
    
    climate = STATE_CLIMATE[state]
    data = []
    
    for i in range(num_samples):
        growth_stage = np.random.choice(GROWTH_STAGES)
        soil_type = np.random.choice(variety_info["soil_preference"])
        
        # Climate parameters
        rainfall = np.random.uniform(*climate["rainfall"])
        temperature = np.random.uniform(*climate["temperature"])
        humidity = np.random.uniform(*climate["humidity"])
        soil_ph = np.random.uniform(*climate["soil_ph"])
        soil_moisture = np.random.uniform(*climate["soil_moisture"])
        
        # Field parameters
        area_hectare = np.random.uniform(0.5, 12.0)
        historical_yield = np.random.uniform(
            variety_info["yield_range"][0] * 0.8,
            variety_info["yield_range"][1] * 0.9
        )
        
        # Calculate yield based on conditions
        base_yield = variety_info["avg_yield"]
        yield_factors = 1.0
        
        # Growth stage impact
        stage_factors = {
            "Planting": 0.02, "Germination": 0.15, "Tillering": 0.45,
            "Grand Growth": 0.85, "Maturity": 0.95, "Harvest": 1.0
        }
        yield_factors *= stage_factors[growth_stage]
        
        # Rainfall impact
        optimal_rainfall = 1100
        if rainfall < 700:
            yield_factors *= (0.5 + (rainfall / 700) * 0.4)
        elif rainfall > 1500:
            yield_factors *= (1.0 - (rainfall - 1500) / 1500 * 0.25)
        else:
            yield_factors *= (0.85 + (1 - abs(rainfall - optimal_rainfall) / 1000))
        
        # Temperature impact
        if temperature < 20:
            yield_factors *= (0.7 + (temperature - 10) / 20)
        elif temperature > 35:
            yield_factors *= (1.0 - (temperature - 35) / 15)
        
        # Soil moisture impact
        if soil_moisture < 50:
            yield_factors *= (0.65 + soil_moisture / 100)
        elif soil_moisture > 75:
            yield_factors *= (1.0 - (soil_moisture - 75) / 40)
        
        # Drought tolerance bonus
        if variety_info["drought_tolerance"] == "high" and rainfall < 900:
            yield_factors *= 1.15
        
        # Calculate final yield
        yield_value = base_yield * yield_factors * np.random.uniform(0.88, 1.12)
        yield_value = np.clip(
            yield_value,
            variety_info["yield_range"][0] * 0.4,
            variety_info["yield_range"][1] * 1.15
        )
        
        data.append({
            "state": state,
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
    print("🌾 Generating Training Data for Major Sugarcane States")
    print("="*80)
    
    all_data = []
    summary = {}
    
    for state, varieties in STATE_VARIETIES.items():
        print(f"\n📍 {state}")
        state_data = []
        
        for variety_code, variety_info in varieties.items():
            if variety_info.get("skip"):
                print(f"   ⏭️  {variety_code} - Already in dataset, skipping")
                continue
            
            variety_data = generate_variety_data(state, variety_code, variety_info, num_samples=120)
            state_data.extend(variety_data)
            all_data.extend(variety_data)
            
            yields = [d['yield'] for d in variety_data]
            print(f"   ✅ {variety_code}: {len(variety_data)} samples")
            print(f"      Yield: {min(yields):.1f} - {max(yields):.1f} t/ha (avg: {np.mean(yields):.1f})")
        
        summary[state] = len(state_data)
    
    # Create DataFrame
    df = pd.DataFrame(all_data)
    
    # Save
    output_path = Path("ml/major_states_varieties_training_data.csv")
    df.to_csv(output_path, index=False)
    
    print("\n" + "="*80)
    print(f"✅ Generated {len(df)} total records")
    print(f"📁 Saved to: {output_path}")
    
    print("\n📊 Summary by State:")
    for state, count in summary.items():
        print(f"   {state}: {count} records")
    
    print("\n📊 New Varieties Added:")
    print(df.groupby(['state', 'variety']).size().to_string())
    
    print("\n" + "="*80)
    print("✅ Next Steps:")
    print("1. Review: ml/major_states_varieties_training_data.csv")
    print("2. Append to dataset")
    print("3. Retrain models: python train_karnataka_models.py")
    print("4. Update variety intelligence with new varieties")
    print("5. System will support 15+ varieties across major states!")

if __name__ == "__main__":
    main()
