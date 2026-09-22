import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';

export default function PredictionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // State-wise variety mapping (which varieties grow where)
  const defaultVarieties = ['Co 86032', 'Co 0238', 'Co 0118'];
  const stateVarieties = {
    'Andaman And Nicobar Islands': defaultVarieties,
    'Maharashtra': ['Co 86032', 'CoC 671', 'Co 775', 'Co 94012', 'Co 0238'],
    'Uttar Pradesh': ['CoJ 64', 'Co 0238', 'Co 0118', 'Co 05009', 'CoS 767'],
    'Karnataka': ['CoM 0265', 'Co 86032', 'Co 94012', 'Co 419', 'Co 62175'],
    'Tamil Nadu': ['CoC 671', 'Co 86032', 'Co 94012', 'Co 419', 'Co 62175'],
    'Gujarat': ['CoJ 64', 'Co 775', 'Co 94008', 'Co 86032', 'Co 0238'],
    'Andhra Pradesh': ['Co 86032', 'CoC 671', 'Co 94012', 'Co 05009', 'Co 7717'],
    'Bihar': ['CoJ 64', 'Co 0238', 'Co 0118', 'Bo 91', 'CoS 767'],
    'Haryana': ['CoJ 64', 'Co 0238', 'CoPant 90223', 'Co 0118', 'CoS 767'],
    'Punjab': ['CoJ 88', 'CoPb 92', 'CoJ 64', 'Co 0238', 'CoS 767'],
    'Arunachal Pradesh': defaultVarieties,
    'Assam': defaultVarieties,
    'Chhattisgarh': defaultVarieties,
    'Dadra And Nagar Haveli': defaultVarieties,
    'Delhi': defaultVarieties,
    'Goa': defaultVarieties,
    'Himachal Pradesh': defaultVarieties,
    'Jammu And Kashmir': defaultVarieties,
    'Jharkhand': defaultVarieties,
    'Kerala': defaultVarieties,
    'Madhya Pradesh': defaultVarieties,
    'Manipur': defaultVarieties,
    'Meghalaya': defaultVarieties,
    'Mizoram': defaultVarieties,
    'Nagaland': defaultVarieties,
    'Odisha': defaultVarieties,
    'Puducherry': defaultVarieties,
    'Rajasthan': defaultVarieties,
    'Telangana': defaultVarieties,
    'Tripura': defaultVarieties,
    'Uttarakhand': defaultVarieties,
    'West Bengal': defaultVarieties
  };

  // Variety-wise season mapping (when each variety should be planted)
  const varietySeasons = {
    // Maharashtra varieties
    'Co 86032': ['Kharif', 'Summer'],
    'CoC 671': ['Kharif', 'Summer'],
    'Co 775': ['Kharif'],
    'Co 94012': ['Kharif', 'Summer'],
    'Co 0238': ['Rabi', 'Summer'],
    
    // Uttar Pradesh varieties
    'CoJ 64': ['Rabi'],
    'Co 0118': ['Rabi'],
    'Co 05009': ['Rabi', 'Summer'],
    'CoS 767': ['Rabi'],
    
    // Karnataka varieties
    'CoM 0265': ['Kharif', 'Summer'],
    'Co 419': ['Kharif', 'Summer'],
    'Co 62175': ['Kharif'],
    
    // Tamil Nadu varieties
    
    // Gujarat varieties
    'Co 94008': ['Kharif', 'Summer'],
    
    // Andhra Pradesh varieties
    'Co 7717': ['Kharif', 'Summer'],
    
    // Bihar varieties
    'Bo 91': ['Rabi'],
    
    // Haryana varieties
    'CoPant 90223': ['Rabi'],
    
    // Punjab varieties
    'CoJ 88': ['Rabi'],
    'CoPb 92': ['Rabi']
  };

  const states = Object.keys(stateVarieties);
  const allSeasons = ['Kharif', 'Rabi', 'Summer'];
  
  const [formData, setFormData] = useState({
    variety: stateVarieties['Maharashtra'][0],
    state: 'Maharashtra',
    season: varietySeasons[stateVarieties['Maharashtra'][0]]?.[0] || 'Kharif',
    area_hectare: '',
    rainfall_mm: '',
    temperature_c: '',
    soil_nitrogen: '',
    soil_phosphorus: '',
    soil_potassium: '',
    irrigation_frequency: '',
    prev_year_yield: ''
  });
  
  // Get varieties for selected state
  const availableVarieties = stateVarieties[formData.state] || [];
  
  // Get available seasons for selected variety
  const availableSeasons = varietySeasons[formData.variety] || allSeasons;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If state changes, reset variety to first available in that state
    if (name === 'state') {
      const newStateVarieties = stateVarieties[value] || [];
      const newVariety = newStateVarieties[0] || '';
      const newSeasons = varietySeasons[newVariety] || allSeasons;
      
      setFormData({
        ...formData,
        state: value,
        variety: newVariety,
        season: newSeasons[0] || 'Kharif'
      });
    } 
    // If variety changes, update season to first available for that variety
    else if (name === 'variety') {
      const newSeasons = varietySeasons[value] || allSeasons;
      setFormData({
        ...formData,
        variety: value,
        season: newSeasons[0] || 'Kharif'
      });
    } 
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate season is appropriate for variety
    const validSeasons = varietySeasons[formData.variety] || allSeasons;
    if (!validSeasons.includes(formData.season)) {
      alert(`Warning: ${formData.variety} is typically not grown in ${formData.season} season. Available seasons: ${validSeasons.join(', ')}`);
      return;
    }
    
    setLoading(true);
    
    // Simulate API call - Replace with actual API later
    setTimeout(() => {
      // Check if new variety (no previous yield or prev_year_yield = 0)
      const isNewVariety = !formData.prev_year_yield || parseFloat(formData.prev_year_yield) === 0;
      
      // Base prediction
      let predictedYield = (Math.random() * 30 + 50).toFixed(2);
      let confidence = (Math.random() * 15 + 85).toFixed(1);
      
      // Lower confidence if experimenting with new variety
      if (isNewVariety) {
        confidence = (parseFloat(confidence) - 10).toFixed(1);
        predictedYield = (parseFloat(predictedYield) - 5).toFixed(2);
      }
      
      setResult({
        yield: predictedYield,
        confidence: confidence,
        model: 'XGBoost',
        risk: parseFloat(predictedYield) > 65 ? 'Low' : parseFloat(predictedYield) > 55 ? 'Medium' : 'High',
        isNewVariety: isNewVariety
      });
      setLoading(false);
    }, 2000);
  };

  const handleReset = () => {
    const firstState = states[0];
    const firstVariety = stateVarieties[firstState][0];
    const firstSeasons = varietySeasons[firstVariety] || allSeasons;
    
    setFormData({
      variety: firstVariety,
      state: firstState,
      season: firstSeasons[0] || 'Kharif',
      area_hectare: '',
      rainfall_mm: '',
      temperature_c: '',
      soil_nitrogen: '',
      soil_phosphorus: '',
      soil_potassium: '',
      irrigation_frequency: '',
      prev_year_yield: ''
    });
    setResult(null);
  };

  const signout = async () => {
    await logout();
    navigate('/login');
  };

  const downloadReport = () => {
    if (!result) return;
    
    const reportData = {
      date: new Date().toLocaleDateString(),
      user: user?.name || 'User',
      inputs: {
        variety: formData.variety,
        state: formData.state,
        season: formData.season,
        area: formData.area_hectare + ' hectares',
        rainfall: formData.rainfall_mm + ' mm',
        temperature: formData.temperature_c + ' °C',
        nitrogen: formData.soil_nitrogen + ' kg/ha',
        phosphorus: formData.soil_phosphorus + ' kg/ha',
        potassium: formData.soil_potassium + ' kg/ha',
        irrigation: formData.irrigation_frequency + ' times/month',
        previousYield: formData.prev_year_yield || 'N/A'
      },
      prediction: {
        yield: result.yield + ' t/ha',
        confidence: result.confidence + '%',
        model: result.model,
        risk: result.risk,
        isNewVariety: result.isNewVariety
      }
    };

    const reportText = `
SUGARCANE YIELD PREDICTION REPORT
===============================================
Generated: ${reportData.date}
User: ${reportData.user}

INPUT PARAMETERS
===============================================
State: ${reportData.inputs.state}
Variety: ${reportData.inputs.variety}
Season: ${reportData.inputs.season}
Area: ${reportData.inputs.area}

Weather Conditions:
- Rainfall: ${reportData.inputs.rainfall}
- Temperature: ${reportData.inputs.temperature}

Soil Parameters:
- Nitrogen (N): ${reportData.inputs.nitrogen}
- Phosphorus (P): ${reportData.inputs.phosphorus}
- Potassium (K): ${reportData.inputs.potassium}

Management:
- Irrigation: ${reportData.inputs.irrigation}
- Previous Yield: ${reportData.inputs.previousYield}

PREDICTION RESULTS
===============================================
Predicted Yield: ${reportData.prediction.yield}
Confidence: ${reportData.prediction.confidence}
Model Used: ${reportData.prediction.model}
Risk Level: ${reportData.prediction.risk}
${reportData.prediction.isNewVariety ? '\n⚠️ NEW VARIETY EXPERIMENT\nThis variety has not been grown in this region before.\nLower confidence due to experimental nature.\n' : ''}

RECOMMENDATIONS
===============================================
${result.isNewVariety ? 
  '- Start with small experimental plots\n- Monitor crop health closely\n- Document all observations\n- Adjust practices based on early growth' :
  '- Maintain consistent irrigation schedule\n- Monitor weather conditions\n- Regular soil testing recommended\n- Follow best agricultural practices'
}

===============================================
Generated by SugarYield AI
Smart Agricultural Decision Support System
===============================================
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Yield_Prediction_Report_${formData.variety}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="prediction-page">
      <header className="dashboard-header">
        <Brand />
        <nav className="dashboard-nav">
          <button onClick={() => navigate('/dashboard')} className="nav-link">Dashboard</button>
          <button onClick={() => navigate('/prediction')} className="nav-link active">Predict Yield</button>
          <button onClick={signout} className="signout-btn">Sign out</button>
        </nav>
      </header>

      <section className="prediction-container">
        <div className="prediction-header">
          <p className="eyebrow">AI-Powered Forecasting</p>
          <h1>Sugarcane Yield Prediction</h1>
          <p className="subtitle">
            Get accurate yield predictions using advanced ML models trained on 12,000+ samples
          </p>
        </div>

        <div className="prediction-content">
          <div className="prediction-form-card">
            <h2>Input Parameters</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Crop Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>State *</label>
                    <select name="state" value={formData.state} onChange={handleChange} required>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <small>Varieties will update based on state</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Sugarcane Variety *</label>
                    <select name="variety" value={formData.variety} onChange={handleChange} required>
                      {availableVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <small>Only {formData.state} varieties • Season will auto-update</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Season *</label>
                    <select name="season" value={formData.season} onChange={handleChange} required>
                      {availableSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <small>Showing seasons for {formData.variety}</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Area (Hectares) *</label>
                    <input 
                      type="number" 
                      name="area_hectare" 
                      value={formData.area_hectare}
                      onChange={handleChange}
                      placeholder="e.g., 5.5"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Weather Conditions</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Rainfall (mm) *</label>
                    <input 
                      type="number" 
                      name="rainfall_mm" 
                      value={formData.rainfall_mm}
                      onChange={handleChange}
                      placeholder="e.g., 1200"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Temperature (°C) *</label>
                    <input 
                      type="number" 
                      name="temperature_c" 
                      value={formData.temperature_c}
                      onChange={handleChange}
                      placeholder="e.g., 28.5"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Soil Parameters (kg/ha)</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nitrogen (N) *</label>
                    <input 
                      type="number" 
                      name="soil_nitrogen" 
                      value={formData.soil_nitrogen}
                      onChange={handleChange}
                      placeholder="e.g., 180"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phosphorus (P) *</label>
                    <input 
                      type="number" 
                      name="soil_phosphorus" 
                      value={formData.soil_phosphorus}
                      onChange={handleChange}
                      placeholder="e.g., 60"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Potassium (K) *</label>
                    <input 
                      type="number" 
                      name="soil_potassium" 
                      value={formData.soil_potassium}
                      onChange={handleChange}
                      placeholder="e.g., 80"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Management Practices</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Irrigation Frequency (per month) *</label>
                    <input 
                      type="number" 
                      name="irrigation_frequency" 
                      value={formData.irrigation_frequency}
                      onChange={handleChange}
                      placeholder="e.g., 4"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Previous Year Yield (t/ha)</label>
                    <input 
                      type="number" 
                      name="prev_year_yield" 
                      value={formData.prev_year_yield}
                      onChange={handleChange}
                      placeholder="e.g., 65.5 (or 0 for new variety)"
                      step="0.1"
                      min="0"
                    />
                    <small>Enter 0 if experimenting with new variety</small>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleReset} className="btn-secondary">
                  Reset
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Predicting...' : 'Predict Yield'}
                </button>
              </div>
            </form>
          </div>

          {result && (
            <div className="prediction-result-card">
              <h2>Prediction Results</h2>
              
              <div className="result-main">
                <div className="result-value">
                  <span className="result-number">{result.yield}</span>
                  <span className="result-unit">t/ha</span>
                </div>
                <p className="result-label">Predicted Yield</p>
              </div>

              <div className="result-metrics">
                <div className="metric">
                  <span className="metric-label">Model Used</span>
                  <span className="metric-value">{result.model}</span>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Confidence</span>
                  <span className="metric-value">{result.confidence}%</span>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Risk Level</span>
                  <span className={`metric-value risk-${result.risk.toLowerCase()}`}>
                    {result.risk}
                  </span>
                </div>
              </div>

              <div className="result-details">
                <h3>Analysis</h3>
                
                {result.isNewVariety && (
                  <div className="warning-banner">
                    <strong>⚠️ New Variety Experiment</strong>
                    <p>
                      This variety hasn't been grown here before. Prediction based on similar conditions with lower confidence.
                    </p>
                  </div>
                )}
                
                <ul>
                  <li>
                    <strong>Variety Performance:</strong> {formData.variety} {
                      result.isNewVariety ? 
                      'is being tested in this region for the first time' :
                      `shows ${parseFloat(result.yield) > 65 ? 'excellent' : 
                      parseFloat(result.yield) > 55 ? 'good' : 'moderate'} yield potential`
                    } in {formData.state}
                  </li>
                  <li>
                    <strong>Weather Impact:</strong> Current rainfall ({formData.rainfall_mm}mm) and temperature ({formData.temperature_c}°C) are {
                      parseFloat(formData.rainfall_mm) > 1000 && parseFloat(formData.temperature_c) > 25 ? 'optimal' : 'acceptable'
                    } for sugarcane growth
                  </li>
                  <li>
                    <strong>Soil Fertility:</strong> NPK levels (N:{formData.soil_nitrogen}, P:{formData.soil_phosphorus}, K:{formData.soil_potassium}) indicate {
                      parseFloat(formData.soil_nitrogen) > 150 ? 'good' : 'moderate'
                    } soil fertility status
                  </li>
                  {result.isNewVariety && (
                    <li>
                      <strong>Recommendation:</strong> Start with small experimental plots and monitor closely. Adjust practices based on early growth observations.
                    </li>
                  )}
                </ul>
              </div>

              <div className="result-actions">
                <button onClick={handleReset} className="btn-secondary">
                  New Prediction
                </button>
                <button onClick={downloadReport} className="btn-outline">
                  Download Report
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
