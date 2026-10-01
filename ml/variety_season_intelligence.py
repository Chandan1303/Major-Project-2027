"""
Variety-Season Intelligence Engine
Provides recommendations for optimal growing conditions based on variety and season combination.
"""

import csv
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
VARIETY_MASTER_PATH = BASE_DIR / "backend" / "data" / "sugarcane_varieties_master.csv"


class VarietySeasonIntelligence:
    """
    Intelligent system for variety-season interactions and recommendations.
    Provides optimal conditions and warnings based on variety-season compatibility.
    """
    
    def __init__(self):
        self.variety_data = self._load_variety_master()
        self.season_multipliers = self._define_season_multipliers()
        self.optimal_conditions = self._define_optimal_conditions()
    
    def _load_variety_master(self) -> Dict[str, Dict]:
        """Load variety master data from CSV"""
        variety_dict = {}
        
        if not VARIETY_MASTER_PATH.exists():
            return variety_dict
        
        with open(VARIETY_MASTER_PATH, 'r', encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                variety_name = (row.get('Variety_Name') or '').strip()
                if variety_name:
                    variety_dict[variety_name.lower()] = {
                        'name': variety_name,
                        'common_name': row.get('Common_Name', ''),
                        'maturity': row.get('Maturity', 'Mid-late'),
                        'cane_yield': row.get('Cane_Yield_t_ha', ''),
                        'sucrose_percent': row.get('Sucrose_Percent', ''),
                        'ccs_percent': row.get('CCS_Percent', ''),
                        'red_rot_resistance': row.get('Red_Rot_Resistance', 'Moderate'),
                        'smut_resistance': row.get('Smut_Resistance', 'Moderate'),
                        'drought_tolerance': row.get('Drought_Tolerance', ''),
                        'salinity_tolerance': row.get('Salinity_Tolerance', ''),
                        'waterlogging_tolerance': row.get('Waterlogging_Tolerance', ''),
                        'recommended_states': row.get('Recommended_States', ''),
                        'zone': row.get('Zone', ''),
                        'special_features': row.get('Special_Features', ''),
                        'planting_season': row.get('Planting_Season', '').strip()
                    }
        
        return variety_dict
    
    def _define_season_multipliers(self) -> Dict[str, Dict[str, float]]:
        """
        Define yield multipliers for variety-season combinations.
        Based on agricultural research and variety adaptation.
        AMPLIFIED for better differentiation.
        """
        return {
            'Co 86032': {
                'Kharif': 1.25,      # Excellent in monsoon (HIGH water availability)
                'Rabi': 0.90,        # Moderate in winter (irrigation dependent)
                'Summer': 0.70,      # Poor in summer (HIGH water stress)
                'Autumn': 0.88,
                'Winter': 0.85,
                'Spring': 0.80,
                'Whole Year': 1.00
            },
            'Co 0238': {
                'Kharif': 1.30,      # Very good in monsoon
                'Rabi': 1.15,        # Excellent in winter (cool season variety)
                'Summer': 0.65,      # Struggles in summer heat
                'Autumn': 0.92,
                'Winter': 1.18,
                'Spring': 0.75,
                'Whole Year': 1.00
            },
            'CoC 671': {
                'Kharif': 1.20,      # Good in monsoon
                'Rabi': 0.95,        # Moderate in winter
                'Summer': 0.75,      # Below average in summer
                'Autumn': 0.90,
                'Winter': 0.93,
                'Spring': 0.85,
                'Whole Year': 1.00
            },
            'Co 99004': {
                'Kharif': 1.18,      # Good in monsoon
                'Rabi': 1.00,        # Good in winter
                'Summer': 0.72,      # Poor in summer
                'Autumn': 0.91,
                'Winter': 0.98,
                'Spring': 0.78,
                'Whole Year': 1.00
            },
            'CoM 0265': {
                'Kharif': 1.35,      # Excellent in monsoon (high yielder)
                'Rabi': 1.20,        # Very good in winter
                'Summer': 0.68,      # Struggles in summer
                'Autumn': 0.95,
                'Winter': 1.22,
                'Spring': 0.73,
                'Whole Year': 1.00
            }
        }
    
    def _define_optimal_conditions(self) -> Dict[str, Dict]:
        """
        Define optimal growing conditions for each season.
        Based on agronomic research and field experience.
        """
        return {
            'Kharif': {
                'season_name': 'Kharif (Monsoon)',
                'planting_window': 'June - August',
                'harvesting_window': 'December - March',
                'optimal_rainfall': {'min': 1200, 'max': 2000, 'ideal': 1500},
                'optimal_temperature': {'min': 26, 'max': 32, 'ideal': 29},
                'optimal_humidity': {'min': 65, 'max': 85, 'ideal': 75},
                'optimal_soil_moisture': {'min': 60, 'max': 80, 'ideal': 70},
                'irrigation': 'Minimal (monsoon provides water)',
                'advantages': [
                    'Natural rainfall availability',
                    'High humidity for growth',
                    'Optimal temperature range',
                    'Reduced irrigation costs'
                ],
                'challenges': [
                    'Risk of waterlogging in heavy soils',
                    'Potential pest pressure',
                    'Disease risk due to high moisture'
                ]
            },
            'Rabi': {
                'season_name': 'Rabi (Winter)',
                'planting_window': 'October - November',
                'harvesting_window': 'October - December (next year)',
                'optimal_rainfall': {'min': 800, 'max': 1200, 'ideal': 1000},
                'optimal_temperature': {'min': 22, 'max': 28, 'ideal': 25},
                'optimal_humidity': {'min': 50, 'max': 70, 'ideal': 60},
                'optimal_soil_moisture': {'min': 55, 'max': 70, 'ideal': 62},
                'irrigation': 'Regular (every 10-15 days)',
                'advantages': [
                    'Lower pest and disease pressure',
                    'Cool weather reduces water stress',
                    'Better sugar accumulation',
                    'Extended maturity period'
                ],
                'challenges': [
                    'Requires consistent irrigation',
                    'Higher water management costs',
                    'Cold stress in northern regions',
                    'Slower initial growth'
                ]
            },
            'Summer': {
                'season_name': 'Summer',
                'planting_window': 'February - March',
                'harvesting_window': 'January - March (next year)',
                'optimal_rainfall': {'min': 600, 'max': 1000, 'ideal': 800},
                'optimal_temperature': {'min': 25, 'max': 35, 'ideal': 30},
                'optimal_humidity': {'min': 45, 'max': 65, 'ideal': 55},
                'optimal_soil_moisture': {'min': 50, 'max': 65, 'ideal': 58},
                'irrigation': 'Frequent (every 7-10 days)',
                'advantages': [
                    'Early harvest in next year',
                    'Good for ratoon crops',
                    'Lower disease incidence'
                ],
                'challenges': [
                    'High water stress',
                    'Intensive irrigation required',
                    'Heat stress on crops',
                    'Increased evapotranspiration',
                    'Generally lower yields'
                ]
            },
            'Autumn': {
                'season_name': 'Autumn',
                'planting_window': 'September - October',
                'harvesting_window': 'November - January (next year)',
                'optimal_rainfall': {'min': 900, 'max': 1400, 'ideal': 1150},
                'optimal_temperature': {'min': 24, 'max': 30, 'ideal': 27},
                'optimal_humidity': {'min': 55, 'max': 75, 'ideal': 65},
                'optimal_soil_moisture': {'min': 55, 'max': 72, 'ideal': 64},
                'irrigation': 'Moderate (supplemental)',
                'advantages': [
                    'Balanced conditions',
                    'Moderate pest pressure',
                    'Good establishment'
                ],
                'challenges': [
                    'Variable weather',
                    'Requires monitoring'
                ]
            },
            'Winter': {
                'season_name': 'Winter',
                'planting_window': 'November - December',
                'harvesting_window': 'December - February (next year)',
                'optimal_rainfall': {'min': 700, 'max': 1100, 'ideal': 900},
                'optimal_temperature': {'min': 20, 'max': 26, 'ideal': 23},
                'optimal_humidity': {'min': 50, 'max': 68, 'ideal': 58},
                'optimal_soil_moisture': {'min': 52, 'max': 68, 'ideal': 60},
                'irrigation': 'Regular',
                'advantages': [
                    'Low pest pressure',
                    'Better sugar content',
                    'Reduced water loss'
                ],
                'challenges': [
                    'Cold stress risk',
                    'Slower growth',
                    'Frost damage potential in north'
                ]
            },
            'Spring': {
                'season_name': 'Spring',
                'planting_window': 'February - April',
                'harvesting_window': 'March - May (next year)',
                'optimal_rainfall': {'min': 800, 'max': 1300, 'ideal': 1050},
                'optimal_temperature': {'min': 23, 'max': 31, 'ideal': 27},
                'optimal_humidity': {'min': 52, 'max': 72, 'ideal': 62},
                'optimal_soil_moisture': {'min': 54, 'max': 70, 'ideal': 62},
                'irrigation': 'Moderate to frequent',
                'advantages': [
                    'Increasing day length',
                    'Rising temperatures favor growth',
                    'Good for certain varieties'
                ],
                'challenges': [
                    'Transition season variability',
                    'Pre-monsoon heat stress'
                ]
            },
            'Whole Year': {
                'season_name': 'Year-Round (Perennial)',
                'planting_window': 'Any time',
                'harvesting_window': 'Based on maturity (12-14 months)',
                'optimal_rainfall': {'min': 1000, 'max': 1800, 'ideal': 1400},
                'optimal_temperature': {'min': 24, 'max': 32, 'ideal': 28},
                'optimal_humidity': {'min': 55, 'max': 75, 'ideal': 65},
                'optimal_soil_moisture': {'min': 55, 'max': 75, 'ideal': 65},
                'irrigation': 'Season-dependent',
                'advantages': [
                    'Flexible planting',
                    'Adaptable varieties',
                    'Extended growing period'
                ],
                'challenges': [
                    'Requires careful management',
                    'Season-specific challenges apply'
                ]
            }
        }
    
    def get_season_multiplier(self, variety: str, season: str) -> float:
        """Get yield multiplier for variety-season combination"""
        variety_clean = variety.strip().replace(' ', ' ')
        season_clean = season.strip().title()
        
        if variety_clean in self.season_multipliers:
            return self.season_multipliers[variety_clean].get(season_clean, 1.0)
        
        # Default multipliers for unknown varieties (AMPLIFIED)
        default_multipliers = {
            'Kharif': 1.20,    # Strong monsoon advantage
            'Rabi': 0.95,      # Moderate winter performance
            'Summer': 0.75,    # Significant summer penalty
            'Autumn': 0.90,
            'Winter': 0.93,
            'Spring': 0.85,
            'Whole Year': 1.00
        }
        return default_multipliers.get(season_clean, 1.0)
    
    def get_variety_info(self, variety: str) -> Optional[Dict]:
        """Get variety information from master data"""
        variety_clean = variety.strip().lower()
        return self.variety_data.get(variety_clean)
    
    def get_recommended_season(self, variety: str) -> str:
        """Get recommended planting season for variety"""
        info = self.get_variety_info(variety)
        if info and info['planting_season']:
            return info['planting_season']
        
        # Default based on variety characteristics
        variety_clean = variety.strip()
        if variety_clean in self.season_multipliers:
            multipliers = self.season_multipliers[variety_clean]
            best_season = max(multipliers.items(), key=lambda x: x[1])[0]
            return best_season
        
        return 'Kharif'  # Default to monsoon season
    
    def is_season_suitable(self, variety: str, season: str) -> tuple[bool, str]:
        """
        Check if season is suitable for variety.
        Returns (is_suitable, message)
        """
        multiplier = self.get_season_multiplier(variety, season)
        recommended_season = self.get_recommended_season(variety)
        
        if multiplier >= 1.05:
            return True, f"Excellent choice! {variety} performs very well in {season} season."
        elif multiplier >= 0.95:
            return True, f"Good choice! {variety} is suitable for {season} season."
        elif multiplier >= 0.85:
            return False, f"⚠️ Sub-optimal: {variety} has moderate performance in {season}. Consider {recommended_season} season for better yields."
        else:
            return False, f"❌ Not recommended: {variety} performs poorly in {season}. Strongly recommend {recommended_season} season instead."
    
    def generate_recommendations(self, variety: str, season: str, predicted_yield: float, 
                                user_inputs: Dict) -> Dict:
        """
        Generate comprehensive recommendations for the variety-season combination.
        """
        multiplier = self.get_season_multiplier(variety, season)
        season_conditions = self.optimal_conditions.get(season.strip().title(), self.optimal_conditions['Kharif'])
        is_suitable, suitability_message = self.is_season_suitable(variety, season)
        recommended_season = self.get_recommended_season(variety)
        variety_info = self.get_variety_info(variety)
        
        # Calculate potential yield if optimal season was chosen
        if season.strip().title() != recommended_season:
            optimal_multiplier = self.get_season_multiplier(variety, recommended_season)
            potential_yield = predicted_yield * (optimal_multiplier / multiplier) if multiplier > 0 else predicted_yield
            yield_gain = potential_yield - predicted_yield
        else:
            potential_yield = predicted_yield
            yield_gain = 0
        
        # Analyze user inputs against optimal conditions
        input_analysis = self._analyze_user_inputs(user_inputs, season_conditions)
        
        # Generate actionable suggestions
        suggestions = self._generate_suggestions(
            variety, season, user_inputs, season_conditions, 
            is_suitable, input_analysis
        )
        
        return {
            'variety': variety,
            'season': season,
            'season_suitability': {
                'is_suitable': is_suitable,
                'message': suitability_message,
                'yield_multiplier': round(multiplier, 2),
                'recommended_season': recommended_season
            },
            'yield_optimization': {
                'predicted_yield': round(predicted_yield, 2),
                'potential_yield_optimal_season': round(potential_yield, 2),
                'potential_gain': round(yield_gain, 2),
                'gain_percentage': round((yield_gain / predicted_yield * 100), 1) if predicted_yield > 0 else 0
            },
            'optimal_conditions': {
                'season_info': season_conditions,
                'variety_specific': variety_info or {}
            },
            'input_analysis': input_analysis,
            'recommendations': suggestions
        }
    
    def _analyze_user_inputs(self, user_inputs: Dict, season_conditions: Dict) -> Dict:
        """Analyze user inputs against optimal seasonal conditions"""
        analysis = {
            'rainfall': self._analyze_parameter(
                user_inputs.get('rainfall_mm', user_inputs.get('rainfall', 0)),
                season_conditions['optimal_rainfall'],
                'mm'
            ),
            'temperature': self._analyze_parameter(
                user_inputs.get('temperature_c', user_inputs.get('temperature', 0)),
                season_conditions['optimal_temperature'],
                '°C'
            ),
            'humidity': self._analyze_parameter(
                user_inputs.get('humidity_pct', user_inputs.get('humidity', 0)),
                season_conditions['optimal_humidity'],
                '%'
            ),
            'soil_moisture': self._analyze_parameter(
                user_inputs.get('soil_moisture', 0),
                season_conditions['optimal_soil_moisture'],
                '%'
            )
        }
        return analysis
    
    def _analyze_parameter(self, value: float, optimal: Dict, unit: str) -> Dict:
        """Analyze a single parameter against optimal range"""
        value = float(value) if value else 0
        min_val = optimal['min']
        max_val = optimal['max']
        ideal_val = optimal['ideal']
        
        if min_val <= value <= max_val:
            if abs(value - ideal_val) <= (max_val - min_val) * 0.2:
                status = 'Optimal'
                color = 'green'
                message = f'✓ {value:.1f} {unit} is ideal'
            else:
                status = 'Acceptable'
                color = 'yellow'
                message = f'○ {value:.1f} {unit} is acceptable (ideal: {ideal_val} {unit})'
        elif value < min_val:
            status = 'Low'
            color = 'red'
            message = f'⚠ {value:.1f} {unit} is below optimal (min: {min_val} {unit})'
        else:
            status = 'High'
            color = 'red'
            message = f'⚠ {value:.1f} {unit} is above optimal (max: {max_val} {unit})'
        
        return {
            'value': value,
            'status': status,
            'color': color,
            'message': message,
            'optimal_range': f'{min_val}-{max_val} {unit}',
            'ideal': f'{ideal_val} {unit}'
        }
    
    def _generate_suggestions(self, variety: str, season: str, user_inputs: Dict, 
                            season_conditions: Dict, is_suitable: bool, 
                            input_analysis: Dict) -> List[Dict]:
        """Generate actionable suggestions based on analysis"""
        suggestions = []
        
        # Season suitability suggestion
        if not is_suitable:
            recommended = self.get_recommended_season(variety)
            suggestions.append({
                'category': 'Season Selection',
                'priority': 'High',
                'icon': '🌱',
                'message': f'Consider planting in {recommended} season for optimal {variety} performance',
                'impact': 'High yield improvement'
            })
        
        # Rainfall suggestions
        rainfall_analysis = input_analysis['rainfall']
        if rainfall_analysis['status'] == 'Low':
            suggestions.append({
                'category': 'Irrigation',
                'priority': 'High',
                'icon': '💧',
                'message': f'Increase irrigation frequency - current rainfall {rainfall_analysis["value"]:.0f}mm is below optimal {rainfall_analysis["optimal_range"]}',
                'impact': 'Prevent water stress'
            })
        elif rainfall_analysis['status'] == 'High':
            suggestions.append({
                'category': 'Drainage',
                'priority': 'High',
                'icon': '🚰',
                'message': f'Ensure proper drainage - rainfall {rainfall_analysis["value"]:.0f}mm exceeds optimal range',
                'impact': 'Prevent waterlogging'
            })
        
        # Temperature suggestions
        temp_analysis = input_analysis['temperature']
        if temp_analysis['status'] == 'Low':
            suggestions.append({
                'category': 'Temperature Management',
                'priority': 'Medium',
                'icon': '🌡️',
                'message': f'Temperature {temp_analysis["value"]:.1f}°C is low. Consider mulching to retain soil warmth',
                'impact': 'Improve growth rate'
            })
        elif temp_analysis['status'] == 'High':
            suggestions.append({
                'category': 'Temperature Management',
                'priority': 'High',
                'icon': '🌡️',
                'message': f'Temperature {temp_analysis["value"]:.1f}°C is high. Increase irrigation to combat heat stress',
                'impact': 'Prevent heat damage'
            })
        
        # Soil moisture suggestions
        moisture_analysis = input_analysis['soil_moisture']
        if moisture_analysis['status'] == 'Low':
            suggestions.append({
                'category': 'Soil Moisture',
                'priority': 'High',
                'icon': '💦',
                'message': f'Soil moisture {moisture_analysis["value"]:.0f}% is low. Schedule immediate irrigation',
                'impact': 'Prevent wilting'
            })
        
        # Humidity suggestions
        humidity_analysis = input_analysis['humidity']
        if humidity_analysis['status'] == 'Low':
            suggestions.append({
                'category': 'Humidity',
                'priority': 'Medium',
                'icon': '💨',
                'message': f'Humidity {humidity_analysis["value"]:.0f}% is low. Consider sprinkler irrigation to increase ambient humidity',
                'impact': 'Reduce transpiration stress'
            })
        
        # Season-specific suggestions
        season_suggestions = season_conditions.get('challenges', [])
        if season_suggestions:
            suggestions.append({
                'category': f'{season} Season Management',
                'priority': 'Medium',
                'icon': '📋',
                'message': 'Key challenges: ' + ', '.join(season_suggestions[:2]),
                'impact': 'Season-specific preparation'
            })
        
        # If everything is optimal
        if all(a['status'] in ['Optimal', 'Acceptable'] for a in input_analysis.values()):
            suggestions.append({
                'category': 'Status',
                'priority': 'Info',
                'icon': '✅',
                'message': 'All conditions are within optimal range. Maintain current practices.',
                'impact': 'Maximize yield potential'
            })
        
        return suggestions
