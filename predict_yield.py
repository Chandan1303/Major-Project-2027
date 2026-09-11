"""
Yield Prediction System - Works with Historical + Real-time API Data
====================================================================

This system can predict yield using:
1. Historical CSV data (for training)
2. Real-time API data (for live predictions)

Outputs:
1. Predicted Yield (t/ha)
2. Confidence Score (0-100%)
3. Feature Importance (what affected prediction)
4. Yield Loss Risk (Low/Medium/High)
5. Variety Recommendation

Team: Dayanand, Chandan (Lead), Harsha, Mohammad
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')


class YieldPredictor:
    """
    Complete yield prediction system with explainability
    """
    
    def __init__(self, model_dir='models'):
        """Load trained models and preprocessing objects"""
        self.model_dir = Path(model_dir)
        
        # Load all 3 models
        with open(self.model_dir / 'linear_regression_model.pkl', 'rb') as f:
            self.lr_model = pickle.load(f)
        
        with open(self.model_dir / 'random_forest_model.pkl', 'rb') as f:
            self.rf_model = pickle.load(f)
        
        with open(self.model_dir / 'xgboost_model.pkl', 'rb') as f:
            self.xgb_model = pickle.load(f)
        
        # Load preprocessing objects
        with open(self.model_dir / 'scaler.pkl', 'rb') as f:
            self.scaler = pickle.load(f)
        
        with open(self.model_dir / 'label_encoders.pkl', 'rb') as f:
            self.label_encoders = pickle.load(f)
        
        # Load feature names
        with open(self.model_dir / 'feature_names.json', 'r') as f:
            self.feature_names = json.load(f)
        
        # Load metadata
        with open(self.model_dir / 'model_metadata.json', 'r') as f:
            self.metadata = json.load(f)
        
        self.best_model_name = self.metadata['best_model']
        
        if self.best_model_name == 'linear_regression':
            self.best_model = self.lr_model
        elif self.best_model_name == 'random_forest':
            self.best_model = self.rf_model
        else:
            self.best_model = self.xgb_model
        
        print(f"Loaded ALL 3 models:")
        print(f"  - Linear Regression (R2: {self.metadata['metrics']['linear_regression']['R2']:.4f})")
        print(f"  - Random Forest (R2: {self.metadata['metrics']['random_forest']['R2']:.4f})")
        print(f"  - XGBoost (R2: {self.metadata['metrics']['xgboost']['R2']:.4f})")
        print(f"\nBest Model: {self.best_model_name.upper()} (R2: {self.metadata['metrics'][self.best_model_name]['R2']:.4f})")
    
    def prepare_input(self, input_data):
        """
        Prepare input data for prediction
        
        Handles both:
        - Historical CSV format
        - Real-time API format
        
        Parameters:
        -----------
        input_data : dict or pd.DataFrame
            Input features
        
        Returns:
        --------
        pd.DataFrame : Prepared features
        """
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        else:
            df = input_data.copy()
        
        # Fill missing values with defaults
        defaults = {
            'rainfall_mm': 1200,
            'temperature_c': 30,
            'sunlight_hours': 8,
            'soil_nitrogen': 150,
            'soil_phosphorus': 60,
            'soil_potassium': 75,
            'ndvi_mean': 0.6,
            'ndvi_max': 0.75,
            'ndvi_min': 0.4,
            'ndvi_std': 0.1,
            'crop_duration_days': 360,
            'irrigation_frequency': 3,
            'prev_year_yield': 70,
            'yield_3yr_avg': 70,
            'yield_5yr_avg': 70,
            'area_hectare': 1,
            'variety': 'Co 86032',
            'state': 'Karnataka',
            'season': 'Annual'
        }
        
        for col, default_val in defaults.items():
            if col not in df.columns:
                df[col] = default_val
            else:
                df[col] = df[col].fillna(default_val)
        
        # Encode categorical variables
        for col, encoder in self.label_encoders.items():
            if col in df.columns:
                # Handle unseen categories
                df[col + '_encoded'] = df[col].apply(
                    lambda x: encoder.transform([str(x)])[0] 
                    if str(x) in encoder.classes_ 
                    else encoder.transform([encoder.classes_[0]])[0]
                )
        
        # Select features in correct order
        X = df[self.feature_names]
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=self.feature_names)
        
        return X_scaled, df
    
    def predict(self, input_data, return_details=True):
        """
        Make yield prediction with full analysis
        
        Parameters:
        -----------
        input_data : dict or pd.DataFrame
            Input features
        return_details : bool
            Whether to return detailed analysis
        
        Returns:
        --------
        dict : Prediction results
        """
        # Prepare input
        X_scaled, original_df = self.prepare_input(input_data)
        
        # Get predictions from ALL 3 models
        lr_pred = self.lr_model.predict(X_scaled)[0]
        rf_pred = self.rf_model.predict(X_scaled)[0]
        xgb_pred = self.xgb_model.predict(X_scaled)[0]
        
        # Use best model as primary
        if self.best_model_name == 'linear_regression':
            primary_pred = lr_pred
        elif self.best_model_name == 'random_forest':
            primary_pred = rf_pred
        else:
            primary_pred = xgb_pred
        
        # Calculate ensemble average
        ensemble_pred = (lr_pred + rf_pred + xgb_pred) / 3
        
        # Calculate confidence based on agreement between models
        predictions_array = np.array([lr_pred, rf_pred, xgb_pred])
        pred_std = np.std(predictions_array)
        max_std = 50  # Maximum expected standard deviation
        confidence = 100 * (1 - min(pred_std / max_std, 1))
        
        # Yield loss analysis
        expected_yield = 80  # Typical good yield for sugarcane
        yield_loss = max(0, expected_yield - primary_pred)
        yield_loss_pct = (yield_loss / expected_yield * 100)
        
        if yield_loss_pct < 10:
            loss_risk = "Low"
        elif yield_loss_pct < 30:
            loss_risk = "Medium"
        else:
            loss_risk = "High"
        
        # Feature importance for this prediction
        import shap
        explainer = shap.TreeExplainer(self.best_model)
        shap_values = explainer.shap_values(X_scaled)
        
        feature_impact = pd.DataFrame({
            'feature': self.feature_names,
            'impact': np.abs(shap_values[0])
        }).sort_values('impact', ascending=False)
        
        # Basic result
        result = {
            'predicted_yield': round(primary_pred, 2),
            'confidence_score': round(confidence, 1),
            'yield_loss_risk': loss_risk,
            'model_used': self.best_model_name
        }
        
        # Detailed analysis
        if return_details:
            result.update({
                'ensemble_predictions': {
                    'linear_regression': round(lr_pred, 2),
                    'random_forest': round(rf_pred, 2),
                    'xgboost': round(xgb_pred, 2),
                    'ensemble_average': round(ensemble_pred, 2)
                },
                'yield_analysis': {
                    'expected_yield': expected_yield,
                    'yield_loss': round(yield_loss, 2),
                    'yield_loss_percent': round(yield_loss_pct, 1)
                },
                'top_factors': feature_impact.head(5).to_dict('records'),
                'input_data': original_df.iloc[0].to_dict()
            })
        
        return result
    
    def compare_varieties(self, base_input, varieties_to_compare=None):
        """
        Compare yield predictions across different varieties
        
        Parameters:
        -----------
        base_input : dict
            Base input data
        varieties_to_compare : list
            List of varieties to compare (default: all major varieties)
        
        Returns:
        --------
        pd.DataFrame : Comparison results
        """
        if varieties_to_compare is None:
            varieties_to_compare = ['Co 86032', 'Co 0238', 'CoM 0265', 'Co 99004', 'CoPb 94']
        
        results = []
        
        for variety in varieties_to_compare:
            test_input = base_input.copy()
            test_input['variety'] = variety
            
            prediction = self.predict(test_input, return_details=False)
            
            results.append({
                'variety': variety,
                'predicted_yield': prediction['predicted_yield'],
                'confidence': prediction['confidence_score'],
                'risk': prediction['yield_loss_risk']
            })
        
        comparison_df = pd.DataFrame(results).sort_values('predicted_yield', ascending=False)
        
        return comparison_df
    
    def predict_from_api_data(self, api_response):
        """
        Predict from real-time API data (OpenWeather, etc.)
        
        Parameters:
        -----------
        api_response : dict
            API response with weather data
        
        Example:
        --------
        api_response = {
            'temperature': 32.5,
            'humidity': 65,
            'rainfall': 1450,  # historical or forecast
            'location': 'Mandya',
            'state': 'Karnataka'
        }
        
        Returns:
        --------
        dict : Prediction results
        """
        # Map API data to model features
        model_input = {
            'temperature_c': api_response.get('temperature', 30),
            'rainfall_mm': api_response.get('rainfall', 1200),
            'state': api_response.get('state', 'Karnataka'),
            'district': api_response.get('location', 'Unknown')
        }
        
        # Add defaults for features not in API
        # (These would come from database for the location)
        
        return self.predict(model_input)


# =============================================================================
# Example Usage
# =============================================================================
if __name__ == "__main__":
    print("="*80)
    print("YIELD PREDICTION SYSTEM - DEMO")
    print("="*80)
    
    # Initialize predictor
    predictor = YieldPredictor()
    
    print("\n" + "-"*80)
    print("EXAMPLE 1: Prediction from Historical Data")
    print("-"*80)
    
    # Historical CSV format
    historical_input = {
        'state': 'Karnataka',
        'district': 'Mandya',
        'variety': 'Co 86032',
        'rainfall_mm': 1450,
        'temperature_c': 32.5,
        'sunlight_hours': 8.5,
        'soil_nitrogen': 180,
        'soil_phosphorus': 65,
        'soil_potassium': 80,
        'ndvi_mean': 0.58,
        'prev_year_yield': 75.2,
        'crop_duration_days': 380,
        'irrigation_frequency': 3
    }
    
    result = predictor.predict(historical_input)
    
    print(f"\nPredicted Yield: {result['predicted_yield']} t/ha")
    print(f"Confidence: {result['confidence_score']}%")
    print(f"Risk: {result['yield_loss_risk']}")
    print(f"\nTop Contributing Factors:")
    for factor in result['top_factors']:
        print(f"  - {factor['feature']}: {factor['impact']:.4f}")
    
    print("\n" + "-"*80)
    print("EXAMPLE 2: Prediction from Real-time API Data")
    print("-"*80)
    
    # Real-time API format
    api_data = {
        'temperature': 31.5,
        'humidity': 68,
        'rainfall': 1300,
        'location': 'Mandya',
        'state': 'Karnataka'
    }
    
    result2 = predictor.predict_from_api_data(api_data)
    
    print(f"\nPredicted Yield: {result2['predicted_yield']} t/ha")
    print(f"Confidence: {result2['confidence_score']}%")
    print(f"Risk: {result2['yield_loss_risk']}")
    
    print("\n" + "-"*80)
    print("EXAMPLE 3: Variety Comparison")
    print("-"*80)
    
    comparison = predictor.compare_varieties(historical_input)
    
    print("\nVariety Performance Comparison:")
    print(comparison.to_string(index=False))
    
    print("\n" + "="*80)
    print("READY FOR FLASK API!")
    print("="*80)
