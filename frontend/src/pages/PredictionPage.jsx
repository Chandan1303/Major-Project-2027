import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  Sparkles,
  History,
  Sprout,
  Layers,
  CloudSun,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
  MapPin,
  Calendar,
  CheckCircle2,
  Droplets,
  Cpu,
  ArrowRight,
  Search,
  Trash2,
  Eye,
  FileText,
  Loader2,
  Activity,
  Dna,
  Bell
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import SimulatorPage from './SimulatorPage';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';
import { mlApi, predictionApi, farmApi, weatherApi, irrigationApi, soilApi, varietyApi, request } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
// Static constants
const SOIL_TYPES = ['Black Soil', 'Alluvial Soil', 'Red Loam', 'Clay Loam', 'Sandy Loam'];
const GROWTH_STAGES = ['Planting', 'Germination', 'Tillering', 'Grand Growth', 'Maturity', 'Harvest'];
const SEASONS = ['Kharif', 'Rabi', 'Summer', 'Autumn', 'Winter', 'Spring', 'Whole Year'];
const INITIAL_FORM_DATA = {
  state: 'Maharashtra', district: 'Kolhapur', location: 'Kolhapur, Maharashtra',
  variety: 'Co 86032', season: 'Kharif', area: '2.5', soil_type: 'Black Soil',
  soil_ph: '7.2', soil_moisture: '62.0', rainfall: '1200.0', temperature: '29.5',
  humidity: '70.0', planting_date: '2025-10-15', crop_growth_stage: 'Grand Growth',
  historical_yield: '95.0'
};
// 2026-27 all-India FRP: ₹365/quintal at the 10.25% basic recovery rate.
// SAP states may announce a higher state price; recovery premiums also apply.
const BASE_CANE_FRP_PER_TONNE = 3650;
const formatINR = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(value);

const getYieldGapFactors = (forecast, inputs) => {
  const returnedFactors = forecast?.explainable_ai?.negative_factors;
  if (Array.isArray(returnedFactors) && returnedFactors.length) return { factors: returnedFactors, inferred: false };

  const number = value => value == null || value === '' ? Number.NaN : Number(value);
  const rainfall = number(inputs.rainfall_mm ?? inputs.rainfall);
  const temperature = number(inputs.temperature_c ?? inputs.temperature);
  const moisture = number(inputs.soil_moisture);
  const ph = number(inputs.soil_ph);
  const factors = [];

  if (Number.isFinite(rainfall) && rainfall < 900) factors.push({ factor: 'Rainfall', value: `${rainfall} mm`, note: 'Low annual rainfall may limit water availability during active growth.' });
  else if (Number.isFinite(rainfall) && rainfall > 1650) factors.push({ factor: 'Rainfall', value: `${rainfall} mm`, note: 'High annual rainfall can increase waterlogging risk; check field drainage.' });
  if (Number.isFinite(temperature) && temperature < 26) factors.push({ factor: 'Temperature', value: `${temperature} °C`, note: 'Cooler conditions may slow stalk growth.' });
  else if (Number.isFinite(temperature) && temperature > 34) factors.push({ factor: 'Temperature', value: `${temperature} °C`, note: 'Warm conditions raise crop water demand.' });
  if (Number.isFinite(moisture) && moisture < 50) factors.push({ factor: 'Soil Moisture', value: `${moisture}%`, note: 'Low soil moisture can constrain cane growth.' });
  else if (Number.isFinite(moisture) && moisture > 75) factors.push({ factor: 'Soil Moisture', value: `${moisture}%`, note: 'High soil moisture can limit root aeration.' });
  if (Number.isFinite(ph) && (ph < 6.2 || ph > 7.8)) factors.push({ factor: 'Soil pH', value: ph.toFixed(1), note: 'This pH is outside the preferred range and may affect nutrient availability.' });

  return { factors, inferred: true };
};

const getYieldGapActions = factors => {
  const actions = [];
  factors.forEach(({ factor, value, note }) => {
    const name = String(factor).toLowerCase();
    const reading = Number.parseFloat(value);
    if (name.includes('rainfall')) {
      actions.push(Number.isFinite(reading) && reading < 900
        ? 'Plan split irrigation from root-zone moisture checks, prioritizing tillering and grand growth.'
        : 'Keep field drains clear and check for standing water after heavy rain.');
    } else if (name.includes('temperature')) {
      actions.push(Number.isFinite(reading) && reading > 34
        ? 'During warm spells, avoid water stress with timely irrigation and retain crop residue as surface mulch.'
        : 'For cool conditions, align planting and harvest timing with local recommendations and avoid water stress.');
    } else if (name.includes('moisture')) {
      actions.push(Number.isFinite(reading) && reading > 75
        ? 'Reduce irrigation when the root zone is already wet and improve drainage where water stands.'
        : 'Use measured, timely irrigation and mulch to reduce evaporation.');
    } else if (name.includes('pH')) {
      actions.push('Confirm pH with a current soil test, then use locally recommended amendments only if the test supports them.');
    } else if (name.includes('historical yield')) {
      actions.push('Check plant stand, ratoon age, seed-cane health, weed pressure, and recent nutrient records to find field-specific constraints.');
    }
  });
  if (!actions.length) actions.push(
    'Check the field for missing or weak cane stools, weeds, pests, and disease; also review seed-cane quality and ratoon age.',
    'Get a current soil test for pH and nutrients (NPK), then follow a local fertilizer recommendation rather than adding fertilizer blindly.',
    'Check root-zone moisture and irrigation timing; improve drainage if water stands in the field.'
  );
  return [...new Set(actions)].slice(0, 4);
};

export default function PredictionPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { selectedFarm, selectedField, selectedPrediction, setSelectedPrediction } = useField();

  const [activeTab, setActiveTab] = useState('predict'); // 'predict' | 'history'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(selectedPrediction);
  const [showPredictionForm, setShowPredictionForm] = useState(!selectedPrediction);
  const [activeDecisionModule, setActiveDecisionModule] = useState('');
  const [decisionData, setDecisionData] = useState({});
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [explanationLoading, setExplanationLoading] = useState(false);
  const resultRef = useRef(null);

  // Geography data (dynamic from API)
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [loadingGeography, setLoadingGeography] = useState(false);

  // Farms and fields for pre-filling
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState('');

  // 11 Core Agronomic Inputs + Season
  const [formData, setFormData] = useState(() => selectedPrediction?.input_data || INITIAL_FORM_DATA);

  useEffect(() => {
    if (!['irrigation', 'soil', 'weather', 'health', 'varieties'].includes(activeDecisionModule)) {
      setDecisionLoading(false);
      return undefined;
    }
    const module = activeDecisionModule;
    let cancelled = false;
    const fieldId = selectedFieldId || selectedField?.id;
    const location = formData.district || formData.location || `${formData.district}, ${formData.state}`;
    setDecisionLoading(true);
    setDecisionError('');
    setDecisionData(previous => ({ ...previous, [module]: undefined }));

    const loadModule = async () => {
      try {
        let data;
        if (module === 'irrigation') {
          if (!fieldId) {
            data = {
              status: 'Unavailable',
              status_badge: 'default',
              crop_stage: result?.input_data?.crop_growth_stage || formData.crop_growth_stage || 'Unavailable',
              advice: 'A registered field is not linked to this forecast, so no current field-moisture reading is available for an irrigation decision.',
              recommendation: 'Select a registered field and record a current root-zone moisture reading before setting irrigation timing or volume.',
              irrigation_method: 'Not specified',
              data_source: 'Forecast inputs only; no registered field reading',
              soil_moisture_pct: null,
              recent_rainfall_mm: null,
              ambient_temperature_c: null,
              soil_moisture_recorded_at: null
            };
          } else {
            const response = await irrigationApi.decisionSupport({ field_id: fieldId });
            data = response.data;
          }
        } else if (module === 'soil') {
          if (!fieldId) {
            data = { forecast_only: true, data_available: false, message: 'No registered field is linked. Showing soil-related inputs from the active yield forecast.' };
          } else {
            const response = await soilApi.getByField(fieldId);
            data = response.data;
          }
        } else if (module === 'weather') {
          const [current, forecast] = await Promise.all([weatherApi.current(location), weatherApi.forecast(location)]);
          data = { current: current.data, forecast: forecast.data?.forecast || [], location };
        } else if (module === 'health') {
          const query = new URLSearchParams({ state: formData.state, district: formData.district });
          if (selectedField?.latitude != null && selectedField?.longitude != null) {
            query.set('latitude', selectedField.latitude);
            query.set('longitude', selectedField.longitude);
          }
          const response = await request('get', `/ndvi/current?${query.toString()}`);
          data = response.data;
        } else if (module === 'varieties') {
          const currentVariety = result?.input_data?.variety || result?.variety || formData.variety;
          const comparisonNames = [...new Set([currentVariety, ...varieties].filter(Boolean))].slice(0, 5);
          const response = await varietyApi.compare({ variety_names: comparisonNames });
          data = response.data;
        }
        if (!cancelled) setDecisionData(previous => ({ ...previous, [module]: data }));
      } catch (error) {
        if (!cancelled) setDecisionError(error.message || 'Could not load this decision module.');
      } finally {
        if (!cancelled) setDecisionLoading(false);
      }
    };

    loadModule();
    return () => { cancelled = true; };
  }, [activeDecisionModule, selectedFieldId, selectedField?.id, selectedField?.latitude, selectedField?.longitude, formData.state, formData.district, formData.location, formData.variety, varieties, result]);

  useEffect(() => {
    if (activeDecisionModule !== 'loss' || !result || result.explainable_ai) return undefined;
    let cancelled = false;
    const inputs = result.input_data || formData;
    setExplanationLoading(true);
    mlApi.explain({
      ...inputs,
      variety: inputs.variety || result.variety || formData.variety,
      rainfall_mm: Number(inputs.rainfall_mm ?? inputs.rainfall ?? 1200),
      temperature_c: Number(inputs.temperature_c ?? inputs.temperature ?? 29.5),
      humidity_pct: Number(inputs.humidity_pct ?? inputs.humidity ?? 70),
      soil_moisture: Number(inputs.soil_moisture ?? 60),
      soil_ph: Number(inputs.soil_ph ?? 7),
      historical_yield: Number(inputs.historical_yield ?? inputs.prev_year_yield ?? 85),
    }).then(response => {
      const explanation = response.data?.data || response.data;
      if (!cancelled && explanation) {
        setExplanationLoading(false);
        setResult(current => current ? { ...current, explainable_ai: explanation } : current);
      }
    }).catch(() => {
      // The input-based audit below remains available if model explanation is unavailable.
    }).finally(() => {
      if (!cancelled) setExplanationLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeDecisionModule, result, formData]);

  // Restore the last forecast after returning to this page (or refreshing it).
  useEffect(() => {
    let cancelled = false;
    const restoreLatestPrediction = async () => {
      try {
        const response = await predictionApi.list();
        const predictions = response.data?.predictions || [];
        const storedId = selectedPrediction?.prediction_id || selectedPrediction?.id;
        const matchingStoredPrediction = storedId
          ? predictions.find(prediction => String(prediction.prediction_id || prediction.id) === String(storedId))
          : null;
        let replacingStalePrediction = Boolean(storedId && !matchingStoredPrediction);
        let saved = matchingStoredPrediction || predictions[0] || null;
        if (cancelled) return;

        let id = saved?.prediction_id || saved?.id;
        let full = saved;
        if (id) {
          try {
            const detail = await predictionApi.getDetails(id);
            full = { ...(detail.data || {}), ...saved, prediction_id: saved.prediction_id || saved.id };
          } catch (error) {
            if (error.status !== 404) throw error;
            replacingStalePrediction = true;
            // The history row still has enough data to restore the forecast.
            // Avoid a duplicate detail request when the row was deleted meanwhile.
            full = saved;
          }
        }
        if (!saved) {
          if (replacingStalePrediction) {
            setSelectedPrediction(null);
            setResult(null);
            setShowPredictionForm(true);
          }
          return;
        }

        const input = saved.input_data || {
          state: selectedFarm?.state || INITIAL_FORM_DATA.state,
          district: selectedFarm?.district || INITIAL_FORM_DATA.district,
          location: full.location || INITIAL_FORM_DATA.location,
          variety: full.variety || INITIAL_FORM_DATA.variety,
          area: String(full.area ?? INITIAL_FORM_DATA.area),
          soil_type: full.soil_type || INITIAL_FORM_DATA.soil_type,
          soil_ph: String(full.soil_ph ?? INITIAL_FORM_DATA.soil_ph),
          soil_moisture: String(full.soil_moisture ?? INITIAL_FORM_DATA.soil_moisture),
          rainfall: String(full.rainfall ?? INITIAL_FORM_DATA.rainfall),
          temperature: String(full.temperature ?? INITIAL_FORM_DATA.temperature),
          humidity: String(full.humidity ?? INITIAL_FORM_DATA.humidity),
          planting_date: full.planting_date || INITIAL_FORM_DATA.planting_date,
          crop_growth_stage: full.crop_growth_stage || INITIAL_FORM_DATA.crop_growth_stage,
          historical_yield: String(full.historical_yield ?? INITIAL_FORM_DATA.historical_yield)
        };
        if (cancelled) return;
        full = {
          ...full,
          input_data: input,
          feature_importance: full.feature_importance || full.explanation?.feature_importances || [],
          expected_loss_t: full.expected_loss_t ?? full.expected_loss_tonnes,
          explainable_ai: full.explainable_ai || (full.explanation ? {
            summary: full.explanation.summary,
            positive_factors: full.explanation.positive_factors || [],
            negative_factors: full.explanation.negative_factors || []
          } : undefined)
        };
        setResult(full);
        setFormData(previous => ({ ...previous, ...input }));
        setShowPredictionForm(false);
        if (replacingStalePrediction || !selectedPrediction) setSelectedPrediction(full);
      } catch {
        // No prediction has been saved yet; leave the new forecast form ready.
      }
    };
    restoreLatestPrediction();
    return () => { cancelled = true; };
  }, []);

  // Data Quality state
  const [dataQuality, setDataQuality] = useState(null);
  const [dqChecking, setDqChecking] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyVariety, setHistoryVariety] = useState('');
  const [historyRisk, setHistoryRisk] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [graphData, setGraphData] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Helper to fetch live weather for a location and update formData
  const fetchWeatherForLocation = async (loc) => {
    try {
      const wRes = await weatherApi.current(loc || 'Kolhapur');
      const w = wRes.data;
      if (w) {
        setFormData(prev => ({
          ...prev,
          temperature: w.temperature ? String(w.temperature) : prev.temperature,
          rainfall: w.rainfall !== undefined && w.rainfall !== null ? String(Math.max(w.rainfall, 800)) : prev.rainfall,
          humidity: w.humidity ? String(w.humidity) : prev.humidity
        }));
      }
    } catch {
      // Fallback cleanly
    }
  };

  // Load states on mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/geography/states');
        const data = await response.json();
        if (data.success) {
          setStates(data.data.states.map(s => s.name));
        }
      } catch (error) {
        console.error('Failed to load states:', error);
        // Fallback to hardcoded states
        setStates(['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat',
          'Andhra Pradesh', 'Bihar', 'Punjab', 'Haryana', 'Telangana', 'Uttarakhand']);
      }
    };
    loadStates();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.state) return;
      
      setLoadingGeography(true);
      try {
        const response = await fetch(`http://localhost:5000/api/geography/districts?state=${encodeURIComponent(formData.state)}`);
        const data = await response.json();
        if (data.success) {
          setDistricts(data.data.districts);
          // Auto-select first district if current district is not in list
          if (data.data.districts.length > 0 && !data.data.districts.includes(formData.district)) {
            setFormData(prev => ({
              ...prev,
              district: data.data.districts[0],
              location: `${data.data.districts[0]}, ${prev.state}`
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load districts:', error);
        setDistricts([]);
      } finally {
        setLoadingGeography(false);
      }
    };
    loadDistricts();
  }, [formData.state]);

  // Load varieties when state changes
  useEffect(() => {
    const loadVarieties = async () => {
      if (!formData.state) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/geography/varieties?state=${encodeURIComponent(formData.state)}`);
        const data = await response.json();
        if (data.success) {
          setVarieties(data.data.varieties);
          // Auto-select first variety if current variety is not in list
          if (data.data.varieties.length > 0 && !data.data.varieties.includes(formData.variety)) {
            setFormData(prev => ({
              ...prev,
              variety: data.data.varieties[0]
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load varieties:', error);
        // Fallback to common varieties
        setVarieties(['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265']);
      }
    };
    loadVarieties();
  }, [formData.state]);

  // Load farms & fields for autofill + parse URL search params
  useEffect(() => {
    farmApi.list()
      .then(res => {
        const list = res.data?.farms || [];
        setFarms(list);

        const paramFarmId = searchParams.get('farm_id');
        const paramFieldId = searchParams.get('field_id');
        const paramVariety = searchParams.get('variety');

        if (paramVariety) {
          setFormData(prev => ({ ...prev, variety: paramVariety }));
        }

        const activeF = paramFarmId
          ? list.find(f => String(f.id) === String(paramFarmId))
          : list.find(f => String(f.id) === String(selectedFarm?.id));
        if (activeF) {
          setSelectedFarmId(String(activeF.id));

          const activeFld = paramFieldId
            ? (activeF.fields || []).find(fld => String(fld.id) === String(paramFieldId))
            : (activeF.fields || []).find(fld => String(fld.id) === String(selectedField?.id));

          if (activeFld) {
            setSelectedFieldId(String(activeFld.id));
            applySavedHolding(activeF, activeFld, true);
          } else applySavedHolding(activeF, null, true);
        }
      })
      .catch(() => {});
  }, [searchParams, selectedFarm, selectedField]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startNewPrediction = () => {
    setActiveTab('predict');
    setShowPredictionForm(true);
    setResult(null);
    setDataQuality(null);
    setActiveDecisionModule('');
    setSelectedFarmId('');
    setSelectedFieldId('');
    setFormData(INITIAL_FORM_DATA);
  };

  const applySavedHolding = (farm, field, reset = false) => {
    if (!farm) return;
    setFormData(previous => ({
      ...(reset ? INITIAL_FORM_DATA : previous),
      state: farm.state || (reset ? INITIAL_FORM_DATA.state : previous.state),
      district: farm.district || (reset ? INITIAL_FORM_DATA.district : previous.district),
      location: farm.location || [farm.district, farm.state].filter(Boolean).join(', ') || (reset ? INITIAL_FORM_DATA.location : previous.location),
      variety: field?.sugarcane_variety || (reset ? INITIAL_FORM_DATA.variety : previous.variety),
      area: field?.area != null ? String(field.area) : farm.total_area != null ? String(farm.total_area) : (reset ? INITIAL_FORM_DATA.area : previous.area),
      soil_type: field?.soil_type || (reset ? INITIAL_FORM_DATA.soil_type : previous.soil_type),
      soil_ph: field?.soil_ph != null ? String(field.soil_ph) : (reset ? INITIAL_FORM_DATA.soil_ph : previous.soil_ph),
      soil_moisture: field?.soil_moisture != null ? String(field.soil_moisture) : (reset ? INITIAL_FORM_DATA.soil_moisture : previous.soil_moisture),
      planting_date: field?.planting_date?.split('T')[0] || (reset ? INITIAL_FORM_DATA.planting_date : previous.planting_date),
      season: field?.season || farm.season || (reset ? INITIAL_FORM_DATA.season : previous.season),
      crop_growth_stage: field?.crop_growth_stage || (reset ? INITIAL_FORM_DATA.crop_growth_stage : previous.crop_growth_stage),
      historical_yield: field?.historical_yield != null ? String(field.historical_yield) : farm.historical_yield != null ? String(farm.historical_yield) : (reset ? INITIAL_FORM_DATA.historical_yield : previous.historical_yield),
      rainfall: field?.rainfall != null ? String(field.rainfall) : farm.rainfall != null ? String(farm.rainfall) : (reset ? INITIAL_FORM_DATA.rainfall : previous.rainfall),
      temperature: field?.temperature != null ? String(field.temperature) : farm.temperature != null ? String(farm.temperature) : (reset ? INITIAL_FORM_DATA.temperature : previous.temperature),
      humidity: field?.humidity != null ? String(field.humidity) : farm.humidity != null ? String(farm.humidity) : (reset ? INITIAL_FORM_DATA.humidity : previous.humidity)
    }));
    fetchWeatherForLocation(farm.location || farm.district);
  };

  const handleFarmSelect = (e) => {
    const fid = e.target.value;
    setSelectedFarmId(fid);
    setSelectedFieldId('');

    const f = farms.find(farm => String(farm.id) === String(fid));
    if (f) {
      const firstField = f.fields?.[0] || null;
      if (firstField) setSelectedFieldId(String(firstField.id));
      applySavedHolding(f, firstField, true);
    } else setFormData(INITIAL_FORM_DATA);
  };

  const handleFieldSelect = (e) => {
    const fieldId = e.target.value;
    setSelectedFieldId(fieldId);
    const f = farms.find(farm => String(farm.id) === String(selectedFarmId));
    if (f && f.fields) {
      const fld = f.fields.find(fl => String(fl.id) === String(fieldId));
      if (fld) {
        applySavedHolding(f, fld);
      }
    }
  };

  // Data Quality check
  const checkDataQuality = async () => {
    setDqChecking(true);
    try {
      const payload = {
        temperature: parseFloat(formData.temperature) || 29.5,
        rainfall: parseFloat(formData.rainfall) || 1200,
        humidity: parseFloat(formData.humidity) || 70,
        soil_type: formData.soil_type,
        soil_ph: parseFloat(formData.soil_ph) || 7.2,
        soil_moisture: parseFloat(formData.soil_moisture) || 60,
        variety: formData.variety,
        historical_yield: parseFloat(formData.historical_yield) || 95
      };
      const res = await mlApi.dataQuality(payload);
      setDataQuality(res.data);
      if (res.data?.is_ready_for_prediction) {
        toast.success(`Data Quality: ${res.data.quality_score}/100 - Ready for prediction!`);
      } else {
        toast.error(`Data Quality: ${res.data.quality_score}/100 - Issues found.`);
      }
    } catch (e) {
      toast.error('Data quality check error: ' + e.message);
    } finally {
      setDqChecking(false);
    }
  };

  // Execute AI Yield Prediction
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        ...formData,
        area_hectare: parseFloat(formData.area) || 1.0,
        rainfall_mm: parseFloat(formData.rainfall) || 1200.0,
        temperature_c: parseFloat(formData.temperature) || 29.5,
        humidity_pct: parseFloat(formData.humidity) || 70.0,
        soil_moisture: parseFloat(formData.soil_moisture) || 60.0,
        soil_ph: parseFloat(formData.soil_ph) || 7.0,
        historical_yield: parseFloat(formData.historical_yield) || 85.0,
        farm_id: selectedFarmId ? Number(selectedFarmId) : null,
        field_id: selectedFieldId ? Number(selectedFieldId) : null,
        farm_name: farms.find(farm => String(farm.id) === String(selectedFarmId))?.name || '',
        field_name: farms.find(farm => String(farm.id) === String(selectedFarmId))?.fields?.find(field => String(field.id) === String(selectedFieldId))?.name || ''
      };

      const res = await mlApi.predict(payload);
      if (res.success && res.data) {
        const savedResult = { ...res.data, input_data: { ...formData } };
        setResult(savedResult);
        setShowPredictionForm(false);
        setActiveDecisionModule('');
        if (typeof setSelectedPrediction === 'function') {
          setSelectedPrediction(savedResult);
        }
        toast.success('Yield predicted & persisted to MySQL database!');
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      } else {
        toast.error(res.message || 'Prediction failed.');
      }
    } catch (err) {
      toast.error('Prediction Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load History & Graph Data
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      if (historySearch) params.search = historySearch;
      if (historyVariety) params.variety = historyVariety;
      if (historyRisk) params.risk = historyRisk;
      if (historyDateFrom) params.date_from = historyDateFrom;
      if (historyDateTo) params.date_to = historyDateTo;

      const [histRes, graphRes] = await Promise.all([
        predictionApi.list(params),
        predictionApi.historyGraph()
      ]);

      setHistoryList(histRes.data?.predictions || []);
      setGraphData(graphRes.data || []);
    } catch (err) {
      toast.error('Failed to load prediction history: ' + err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyVariety, historyRisk, historyDateFrom, historyDateTo]);

  const handleDeletePrediction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prediction record?')) return;
    try {
      await predictionApi.remove(id);
      toast.success('Prediction record deleted.');
      loadHistory();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const exportPredictionPdf = () => {
    const removePrintMode = () => document.body.classList.remove('print-yield-prediction');
    document.body.classList.add('print-yield-prediction');
    window.addEventListener('afterprint', removePrintMode, { once: true });
    window.print();
    window.setTimeout(removePrintMode, 1500);
  };

  const riskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#10b981';
    }
  };

  const forecastYield = Number(result?.predicted_yield);
  const expectedProduction = Number(result?.expected_production);
  const estimatedCropValue = Number.isFinite(expectedProduction)
    ? expectedProduction * BASE_CANE_FRP_PER_TONNE
    : null;
  const referenceYield = Number(result?.reference_yield);
  const returnedYieldGapValue = result?.expected_loss_t ?? result?.expected_loss_tonnes;
  const returnedYieldGap = returnedYieldGapValue == null ? Number.NaN : Number(returnedYieldGapValue);
  const fieldArea = Number(result?.input_data?.area ?? formData.area);
  const yieldGapPerHectare = Number.isFinite(forecastYield) && Number.isFinite(referenceYield)
    ? Math.max(0, referenceYield - forecastYield)
    : Number.isFinite(returnedYieldGap) ? Math.max(0, returnedYieldGap) : null;
  const yieldGapForField = yieldGapPerHectare != null && Number.isFinite(fieldArea)
    ? yieldGapPerHectare * fieldArea
    : null;
  const gapPercentOfReference = yieldGapPerHectare != null && Number.isFinite(referenceYield) && referenceYield > 0
    ? (yieldGapPerHectare / referenceYield) * 100
    : null;
  const auditInputs = result?.input_data || formData;
  const yieldGapFactors = getYieldGapFactors(result, auditInputs);
  const yieldGapActions = getYieldGapActions(yieldGapFactors.factors);
  const showGapMitigations = Number.isFinite(forecastYield) && forecastYield < 70 && yieldGapPerHectare > 0;
  const positiveModelFactors = result?.explainable_ai?.positive_factors || [];
  const topModelDrivers = (result?.explainable_ai?.feature_contributions || result?.feature_importance || []).slice(0, 3);
  const priorYield = Number(auditInputs.historical_yield ?? auditInputs.prev_year_yield);
  const priorYieldIsMainDriver = topModelDrivers.some(driver => /historical yield/i.test(driver.feature || ''));
  const activeVariety = auditInputs.variety || result?.variety || formData.variety;
  const forecastWarningItems = [
    ...yieldGapFactors.factors.map((factor, index) => ({
      id: `factor-${index}`,
      title: `${factor.factor}${factor.value != null ? ` · ${factor.value}` : ''}`,
      detail: factor.note || 'Review this selected forecast input against a current field measurement.',
      severity: 'Review input'
    })),
    ...(yieldGapPerHectare > 0 && Number.isFinite(referenceYield) && Number.isFinite(forecastYield)
      ? [{
          id: 'yield-gap',
          title: 'Forecast below varietal reference',
          detail: `${activeVariety} is forecast at ${forecastYield.toFixed(1)} t/ha versus a ${referenceYield.toFixed(1)} t/ha reference (${gapPercentOfReference?.toFixed(1) ?? '—'}% below). The reference is a benchmark, not a guaranteed field yield.`,
          severity: result.risk || 'Yield gap'
        }]
      : [])
  ];
  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <span className="eyebrow">
              <Sparkles size={13} />
              AI Decision Support & Machine Learning
            </span>
            <h1 className="page-title">AI Sugarcane Yield Forecasting</h1>
            <p className="page-subtitle">
              Dual-model agronomic prediction engine powered by calibrated <strong>Random Forest & XGBoost Regressors</strong>.
              Pure soil, weather & varietal features without NDVI/satellite dependencies.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn ${activeTab === 'predict' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                if (activeTab === 'history' && selectedPrediction) {
                  setActiveTab('predict');
                  setResult(selectedPrediction);
                  setShowPredictionForm(false);
                } else startNewPrediction();
              }}
            >
              {activeTab === 'history' ? <Eye size={16} /> : <Sparkles size={16} />}
              <span>{activeTab === 'history' ? 'Latest Forecast' : 'New Prediction'}</span>
            </button>
            <button
              className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              <span>Forecast History & Audit</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: RUN PREDICTION */}
        {/* ========================================================================= */}
        {activeTab === 'predict' && (
          <div className="prediction-flow">
            {showPredictionForm && <>
            {/* Quick Prefill Section */}
            <div className="card" style={{ marginBottom: 22, padding: '16px 20px', background: 'var(--bg-panel)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Quick Autofill from Saved Holdings:</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                      Select a farm to automatically populate soil test readings, variety, and location data
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    value={selectedFarmId}
                    onChange={handleFarmSelect}
                    style={{ minWidth: 200, padding: '7px 12px', fontSize: 13 }}
                  >
                    <option value="">-- Choose Farm --</option>
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.district || f.location})</option>
                    ))}
                  </select>

                  {selectedFarmId && (
                    <select
                      className="form-control"
                      value={selectedFieldId}
                      onChange={handleFieldSelect}
                      style={{ minWidth: 200, padding: '7px 12px', fontSize: 13 }}
                    >
                      <option value="">-- Choose Field / Plot --</option>
                      {(farms.find(f => String(f.id) === String(selectedFarmId))?.fields || []).map(fld => (
                        <option key={fld.id} value={fld.id}>{fld.name} ({fld.sugarcane_variety})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handlePredict}>
              <div className="card" style={{ padding: '24px 26px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Agronomic Input Parameters (11 Multi-Sensor Factors)</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                      Evaluated simultaneously by trained Random Forest (R²=0.80) and XGBoost (R²=0.79) algorithms.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={checkDataQuality}
                    disabled={dqChecking}
                    style={{ padding: '7px 14px', fontSize: 12.5 }}
                  >
                    {dqChecking ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>{dqChecking ? 'Auditing…' : 'Verify Telemetry Quality'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                  {/* 1. State */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <MapPin size={14} className="text-emerald-500" />
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          state: newState,
                          location: `${prev.district}, ${newState}`
                        }));
                      }}
                      required
                    >
                      {states.length === 0 ? (
                        <option>Loading states...</option>
                      ) : (
                        states.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))
                      )}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                      11 major sugarcane-growing states
                    </small>
                  </div>

                  {/* 2. District */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <MapPin size={14} className="text-emerald-500" />
                      District *
                    </label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={(e) => {
                        const newDistrict = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          district: newDistrict,
                          location: `${newDistrict}, ${prev.state}`
                        }));
                      }}
                      required
                      disabled={loadingGeography || districts.length === 0}
                    >
                      {loadingGeography ? (
                        <option>Loading districts...</option>
                      ) : districts.length === 0 ? (
                        <option>Select state first</option>
                      ) : (
                        districts.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))
                      )}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                      {districts.length} districts with sugarcane cultivation
                    </small>
                  </div>

                  {/* 3. Variety */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Sprout size={14} className="text-emerald-500" />
                      Sugarcane Variety *
                    </label>
                    <select
                      name="variety"
                      value={formData.variety}
                      onChange={handleChange}
                      required
                      disabled={varieties.length === 0}
                    >
                      {varieties.length === 0 ? (
                        <option>Loading varieties...</option>
                      ) : (
                        varieties.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))
                      )}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                      {varieties.length} varieties recommended for {formData.state}
                    </small>
                  </div>

                  {/* 4. Season */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Calendar size={14} className="text-emerald-500" />
                      Planting Season *
                    </label>
                    <select
                      name="season"
                      value={formData.season}
                      onChange={handleChange}
                      required
                    >
                      {SEASONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                      Growing season affects yield multiplier
                    </small>
                  </div>

                  {/* 5. Area */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Activity size={14} className="text-emerald-500" />
                      Field Area (Hectares) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1000"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="e.g. 2.5"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Cultivated plot surface</small>
                  </div>

                  {/* 6. Soil Type */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Layers size={14} className="text-emerald-500" />
                      Soil Classification *
                    </label>
                    <select
                      name="soil_type"
                      value={formData.soil_type}
                      onChange={handleChange}
                      required
                    >
                      {SOIL_TYPES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Physicochemical soil texture</small>
                  </div>

                  {/* 7. Soil pH */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Layers size={14} className="text-emerald-500" />
                      Soil pH Level (4.5 - 9.5) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="4.5"
                      max="9.5"
                      name="soil_ph"
                      value={formData.soil_ph}
                      onChange={handleChange}
                      placeholder="e.g. 7.2"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Optimal sugarcane band: 6.5 – 7.8</small>
                  </div>

                  {/* 8. Soil Moisture */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Activity size={14} className="text-emerald-500" />
                      Soil Moisture (%) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="95"
                      name="soil_moisture"
                      value={formData.soil_moisture}
                      onChange={handleChange}
                      placeholder="e.g. 62.0"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Volumetric root zone moisture</small>
                  </div>

                  {/* 9. Rainfall */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <CloudSun size={14} className="text-emerald-500" />
                      Cumulative Precipitation (mm) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="100"
                      max="4000"
                      name="rainfall"
                      value={formData.rainfall}
                      onChange={handleChange}
                      placeholder="e.g. 1200"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Seasonal rainfall / effective irrigation</small>
                  </div>

                  {/* 10. Temperature */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <CloudSun size={14} className="text-emerald-500" />
                      Mean Temperature (°C) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="5"
                      max="55"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="e.g. 29.5"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Day-night average temperature</small>
                  </div>

                  {/* 11. Humidity */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <CloudSun size={14} className="text-emerald-500" />
                      Relative Humidity (%) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="15"
                      max="100"
                      name="humidity"
                      value={formData.humidity}
                      onChange={handleChange}
                      placeholder="e.g. 70"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Atmospheric vapor pressure index</small>
                  </div>

                  {/* 10. Planting Date */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Calendar size={14} className="text-emerald-500" />
                      Planting Date *
                    </label>
                    <input
                      type="date"
                      name="planting_date"
                      value={formData.planting_date}
                      onChange={handleChange}
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Date setts/ratoon planted</small>
                  </div>

                  {/* 11. Growth Stage */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Sprout size={14} className="text-emerald-500" />
                      Current Phenology Stage *
                    </label>
                    <select
                      name="crop_growth_stage"
                      value={formData.crop_growth_stage}
                      onChange={handleChange}
                      required
                    >
                      {GROWTH_STAGES.map(gs => (
                        <option key={gs} value={gs}>{gs}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Active developmental lifecycle phase</small>
                  </div>

                  {/* 12. Historical Yield */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <TrendingUp size={14} className="text-emerald-500" />
                      Previous Year Yield (t/ha) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="30"
                      max="220"
                      name="historical_yield"
                      value={formData.historical_yield}
                      onChange={handleChange}
                      placeholder="e.g. 95.0"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Last season's actual harvest yield for this field/block</small>
                  </div>
                </div>

                {/* Data Quality Report Card if checked */}
                {dataQuality && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 12,
                    background: dataQuality.quality_score >= 80 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${dataQuality.quality_score >= 80 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <strong style={{ color: dataQuality.quality_score >= 80 ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldCheck size={16} /> Server Audit: {dataQuality.quality_score}/100 ({dataQuality.status})
                      </strong>
                      <Badge variant={dataQuality.quality_score >= 80 ? 'success' : 'warning'}>
                        {dataQuality.is_ready_for_prediction ? 'Passed Validation' : 'Review Inputs'}
                      </Badge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 13 }}>
                      {dataQuality.checklist.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{c.passed ? '✅' : '⚠️'}</span>
                          <span style={{ fontWeight: 600 }}>{c.item}:</span>
                          <span style={{ color: 'var(--text-muted)' }}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700 }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Running Random Forest & XGBoost Models…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Run Dual-Model Yield Prediction</span>
                      </>
                    )}
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Calculated using trained ensemble models and saved directly into MySQL database.
                  </span>
                </div>
              </div>
            </form>
            </>}

            {/* Loading Indicator */}
            {loading && (
              <div className="card" style={{ padding: '36px 24px', textAlign: 'center', marginBottom: 24, background: 'var(--bg-panel)' }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Cpu size={28} className="animate-pulse" />
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Executing AI Yield Inference…</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13.5 }}>
                  Passing 11 agronomic telemetry parameters through trained Random Forest and XGBoost regressors.
                </p>
              </div>
            )}

            {/* Results Section */}
            {result && !showPredictionForm && (
              <div ref={resultRef} className="prediction-results" style={{ marginTop: 10 }}>
                {/* Result Hero Header */}
                <div style={{
                  padding: '28px 32px',
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #09261a 0%, #0d3b27 50%, #064e3b 100%)',
                  color: '#ffffff',
                  marginBottom: 24,
                  boxShadow: '0 16px 36px -8px rgba(6, 78, 59, 0.4)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '4px 10px', borderRadius: 9999, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 700, marginBottom: 12 }}>
                        <Sparkles size={12} />
                        FORECAST GENERATED VIA {result.model_used?.toUpperCase() || 'DUAL ENSEMBLE'}
                      </div>
                      <h2 style={{ fontSize: 40, margin: '0 0 8px', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        {result.predicted_yield} <span style={{ fontSize: 20, fontWeight: 500, color: '#a7f3d0' }}>tonnes / hectare</span>
                      </h2>
                      <p style={{ margin: 0, fontSize: 15, color: '#d1fae5' }}>
                        For <strong>{result.input_data?.variety || formData.variety}</strong> in <strong>{result.input_data?.location || formData.location}</strong> ({result.input_data?.area || formData.area} ha total surface)
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: 14, textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <span style={{ fontSize: 11, color: '#a7f3d0', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Expected Production</span>
                        <strong style={{ fontSize: 24, color: '#ffffff' }}>{result.expected_production} t</strong>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: 14, textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <span style={{ fontSize: 11, color: '#a7f3d0', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Model Confidence</span>
                        <strong style={{ fontSize: 24, color: '#34d399' }}>{result.confidence}%</strong>
                      </div>
                      <button type="button" className="btn-primary" onClick={startNewPrediction} style={{ minHeight: 44, padding: '10px 16px', justifyContent: 'center', background: '#10b981', color: '#052e1b', border: '1px solid rgba(167, 243, 208, 0.5)' }}>
                        <Sparkles size={16} /> New Prediction
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Outputs Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Yield Range</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: 'var(--text-primary)' }}>
                      {result.expected_range?.low} – {result.expected_range?.high} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>t/ha</span>
                    </h3>
                    <small style={{ color: '#10b981', fontWeight: 600 }}>±92% confidence boundary</small>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Expected Production</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: 'var(--text-primary)' }}>
                      {result.expected_production} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Tonnes</span>
                    </h3>
                    <small style={{ color: 'var(--text-muted)' }}>{result.predicted_yield} t/ha × {result.input_data?.area || formData.area} ha</small>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Cane Value · 2026–27 FRP</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: 'var(--text-primary)' }}>
                      {estimatedCropValue == null ? '—' : formatINR(estimatedCropValue)}
                    </h3>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {Number.isFinite(expectedProduction) ? `${expectedProduction.toLocaleString('en-IN')} t × ${formatINR(BASE_CANE_FRP_PER_TONNE)}/t · ${result.input_data?.state || formData.state} · ${result.input_data?.variety || result.variety || formData.variety}` : 'Production estimate unavailable'}
                    </small>
                    <small style={{ display: 'block', marginTop: 5, color: 'var(--text-muted)' }}>Based on all-India FRP at 10.25% recovery; state SAP and actual mill recovery can change the payable rate.</small>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Risk Assessment</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: riskColor(result.risk) }}>
                      {result.risk} Risk
                    </h3>
                    <small style={{ color: 'var(--text-muted)' }}>Based on yield loss vulnerability</small>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Yield Loss Deficit</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: result.loss_percentage > 20 ? '#ea580c' : '#10b981' }}>
                      {result.loss_percentage}%
                    </h3>
                    <small style={{ color: 'var(--text-muted)' }}>Benchmark: {result.reference_yield} t/ha potential</small>
                  </div>
                </div>

                {/* Model Consensus & Comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
                  <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Dual Algorithm Consensus</h3>
                      <Badge variant="success">Trained Weights</Badge>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                      Both algorithms evaluate your telemetry simultaneously without hardcoded formulas.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ padding: 14, borderRadius: 12, background: 'var(--border-subtle)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🌲 Random Forest Regressor</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {result.models_comparison?.random_forest} t/ha
                        </div>
                        <small style={{ color: '#10b981', fontWeight: 600 }}>5-Fold CV Score: R²=0.8005</small>
                      </div>

                      <div style={{ padding: 14, borderRadius: 12, background: 'var(--border-subtle)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🚀 XGBoost Regressor</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {result.models_comparison?.xgboost} t/ha
                        </div>
                        <small style={{ color: '#0ea5e9', fontWeight: 600 }}>5-Fold CV Score: R²=0.7936</small>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, padding: 10, background: 'rgba(14, 165, 233, 0.08)', borderRadius: 8, fontSize: 12.5, color: '#0284c7', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                      Model agreement is <strong>{result.model_agreement}%</strong>. Forecast uses the higher estimate ({result.model_used}: {result.predicted_yield} t/ha). Prediction record saved under ID #{result.prediction_id}.
                    </div>
                  </div>

                  {/* Feature Importance Bar Chart */}
                  <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Agronomic Feature Contributions</h3>
                      <Badge variant="info">Model Weights</Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart
                        data={(result.feature_importance || []).slice(0, 6)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(226, 232, 240, 0.6)" />
                        <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={90} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Importance']} />
                        <Bar dataKey="pct" fill="#10b981" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Explainable AI Factors */}
                {result.explainable_ai && (
                  <div className="card" style={{ padding: 22, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Explainable AI (XAI) Agronomic Diagnosis</h3>
                      <Badge variant="success">Evidence Based</Badge>
                    </div>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13.5 }}>
                      {result.explainable_ai.summary}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                      {/* Positive Drivers */}
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                          <CheckCircle2 size={16} /> Positive Yield Drivers
                        </h4>
                        {(result.explainable_ai.positive_factors || []).length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No strong positive drivers detected.</p>
                        ) : (
                          (result.explainable_ai.positive_factors || []).map((p, idx) => (
                            <div key={idx} style={{ marginBottom: 8, fontSize: 12.5 }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{p.factor} ({p.value}):</strong> {p.note}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Limiting Factors */}
                      <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                          <AlertTriangle size={16} /> Limiting / Deficit Factors
                        </h4>
                        {(result.explainable_ai.negative_factors || []).length === 0 ? (
                          <p style={{ fontSize: 13, color: '#10b981' }}>All agronomic parameters are within acceptable bands.</p>
                        ) : (
                          (result.explainable_ai.negative_factors || []).map((n, idx) => (
                            <div key={idx} style={{ marginBottom: 8, fontSize: 12.5 }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{n.factor} ({n.value}):</strong> {n.note}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Connected Workflow Actions Navigator */}
                <div className="card decision-support-card" style={{ padding: 22, background: 'var(--bg-panel)' }}>
                  <div className="decision-support-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span className="decision-support-eyebrow"><Sparkles size={13} /> FORECAST WORKSPACE</span>
                      <h3 style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 750 }}>Connected Decision Support Modules</h3>
                      <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                        Explore insights and actions linked to this forecast.
                      </p>
                    </div>
                    <div className="decision-support-context">
                      <Badge variant="success">Forecast linked</Badge>
                      <span>{auditInputs.variety || result.variety || formData.variety} · {Number.isFinite(forecastYield) ? `${forecastYield.toFixed(1)} t/ha` : 'Yield unavailable'}</span>
                    </div>
                  </div>

                  <div className="decision-module-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gridAutoRows: '1fr', gap: 12 }}>
                    {[
                      { id: 'loss', icon: TrendingUp, title: 'Yield Loss Audit', detail: 'See the yield gap and model drivers' },
                      { id: 'varieties', icon: Dna, title: 'Variety Comparison', detail: 'Review available cultivar benchmarks' },
                      { id: 'warnings', icon: Bell, title: 'Early Warnings', detail: 'Review alerts and forecast limits' },
                      { id: 'whatif', icon: Activity, title: 'What‑If Simulator', detail: 'Tune conditions against this yield forecast' },
                      { id: 'irrigation', icon: Droplets, title: 'Irrigation Decision', detail: 'Use the selected field’s latest reading' },
                      { id: 'weather', icon: CloudSun, title: 'Weather Outlook', detail: 'Review dated local weather data' },
                      { id: 'soil', icon: Layers, title: 'Soil & Nutrients', detail: 'Check recorded soil data freshness' },
                      { id: 'health', icon: Sprout, title: 'Crop Health', detail: 'Review available regional NDVI data' },
                      { id: 'pdf', icon: FileText, title: 'Export PDF Dossier', detail: 'Print or save this forecast' }
                    ].map(({ id, icon: Icon, title, detail }) => (
                      <button
                        key={id}
                        type="button"
                        aria-expanded={activeDecisionModule === id}
                        aria-controls={activeDecisionModule === id ? 'decision-module-content' : undefined}
                        className={`btn decision-module-button ${activeDecisionModule === id ? 'is-active' : ''}`}
                        onClick={() => { setDecisionError(''); setActiveDecisionModule(activeDecisionModule === id ? '' : id); }}
                        style={{ width: '100%', minHeight: 100, boxSizing: 'border-box', padding: '14px 15px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', textAlign: 'left' }}
                      >
                        <span className="decision-module-title"><span className="decision-module-icon"><Icon size={17} /></span><span>{title}</span><ArrowRight className="decision-module-arrow" size={15} /></span>
                        <small className="decision-module-detail" style={{ color: 'var(--text-muted)', marginTop: 7 }}>{detail}</small>
                      </button>
                    ))}
                  </div>

                  {activeDecisionModule && (
                    <div id="decision-module-content" className="card decision-module-panel" style={{ marginTop: 18, padding: 22, border: '1px solid var(--border-color)' }}>
                      {decisionLoading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}><Loader2 size={16} className="spin" />Loading field-linked information…</div>}
                      {decisionError && <div role="status" style={{ padding: 12, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--text-primary)' }}>{decisionError}</div>}
                      <div className="decision-module-content">
                      {activeDecisionModule === 'loss' && (
                        <>
                          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Yield Loss Audit</h3>
                          <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)' }}>The reference is a high-yield guide for this variety, not a promise for every field. The forecast estimates yield from the conditions and field details entered.</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
                            {[
                              ['Forecast', Number.isFinite(forecastYield) ? `${forecastYield.toFixed(1)} t/ha` : 'Not available'],
                              ['Reference', Number.isFinite(referenceYield) ? `${referenceYield.toFixed(1)} t/ha` : 'Not available'],
                              ['Gap per hectare', yieldGapPerHectare == null ? 'Not available' : `${yieldGapPerHectare.toFixed(1)} t/ha`],
                              [`Estimated gap for ${Number.isFinite(fieldArea) ? fieldArea : '—'} ha`, yieldGapForField == null ? 'Not available' : `${yieldGapForField.toFixed(1)} t`]
                            ].map(([label, value]) => <div key={label} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)' }}><small style={{ color: 'var(--text-muted)' }}>{label}</small><div style={{ fontWeight: 700, marginTop: 4 }}>{value}</div></div>)}
                          </div>
                          <h4 style={{ margin: '0 0 6px' }}>Why is there a yield gap?</h4>
                          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)' }}>{yieldGapFactors.factors.length ? (yieldGapFactors.inferred ? 'Possible causes based on the entered values; check these in the field.' : 'The model flagged these conditions for review.') : 'No clear problem was flagged in the supplied rainfall, temperature, soil pH, or moisture values.'}</p>
                          <ul style={{ margin: '0 0 14px', paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <li>{yieldGapPerHectare != null && Number.isFinite(forecastYield) && Number.isFinite(referenceYield) ? `The ${yieldGapPerHectare.toFixed(1)} t/ha gap is the ${referenceYield.toFixed(1)} t/ha reference minus the ${forecastYield.toFixed(1)} t/ha forecast${gapPercentOfReference != null ? ` (${gapPercentOfReference.toFixed(1)}% of the reference)` : ''}.` : 'The forecast and reference values are needed to calculate the per-hectare gap.'}</li>
                            {yieldGapFactors.factors.length ? yieldGapFactors.factors.map((factor, index) => (
                              <li key={`${factor.factor}-${index}`}><strong>{factor.factor}</strong>{factor.value != null && <> ({factor.value})</>}: {factor.note || 'Review this input against a current field measurement.'}</li>
                            )) : <>
                              {explanationLoading ? <li>Checking the model drivers for this forecast…</li> : (
                                <>
                                  {positiveModelFactors.length
                                    ? <li>The model rates {positiveModelFactors.map(factor => factor.factor).join(', ')} as supportive, so they do not stand out as the main problem.</li>
                                    : <li>The entered rainfall, temperature, soil pH, and moisture do not point to one clear cause for the lower estimate.</li>}
                                  {priorYieldIsMainDriver && Number.isFinite(priorYield) && <li>The model relies strongly on previous yield ({priorYield.toFixed(1)} t/ha). This helps set the forecast, but does not explain what caused the earlier harvest level.</li>}
                                  <li>Other causes—such as weak crop stand, soil nutrients, ratoon age, weeds, pests, or irrigation history—are not fully captured here. The model cannot assign the whole gap to one cause.</li>
                                </>
                              )}
                            </>}
                          </ul>
                          {showGapMitigations && (
                            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(16, 185, 129, 0.07)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                              <h4 style={{ margin: '0 0 5px' }}>Ways to move toward the reference</h4>
                              <p style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: 12 }}>Shown because this forecast is below the project’s 70 t/ha low-yield threshold. Prioritize checks; the full benchmark gap may not be recoverable.</p>
                              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {yieldGapActions.map((action, index) => <li key={index}>{action}</li>)}
                              </ul>
                            </div>
                          )}
                          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Use these factors to prioritize field checks. A forecast gap is a model comparison, not a guaranteed recoverable loss.</p>
                        </>
                      )}
                      {activeDecisionModule === 'varieties' && (
                        <>
                          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Variety Comparison</h3>
                          <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)' }}>Forecast variety: <strong>{result.input_data?.variety || result.variety || formData.variety}</strong> · location: {result.input_data?.district || formData.district}, {result.input_data?.state || formData.state}</p>
                          {decisionData.varieties?.comparison?.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>{decisionData.varieties.comparison.map(item => <div key={item.code} style={{ padding: 13, border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-panel)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{item.code}</strong>{item.code === decisionData.varieties.recommended && <Badge variant="success">Top benchmark</Badge>}</div><p style={{ margin: '7px 0', fontSize: 13 }}>Benchmark {item.expected_yield_range || `${item.expected_yield} t/ha`}</p><small style={{ color: 'var(--text-muted)' }}>Maturity: {item.maturity_type || 'Not listed'} · {item.duration_months ? `${item.duration_months} months` : 'duration unavailable'}</small><p style={{ margin: '8px 0 0', fontSize: 12 }}>Soil: {item.soil_suitability || 'Not listed'}<br/>Weather: {item.weather_suitability || 'Not listed'}<br/>Disease resistance: {item.disease_resistance || 'Not listed'}<br/>Drought tolerance: {item.drought_tolerance || 'Not listed'}</p></div>)}</div> : <p style={{ color: 'var(--text-muted)' }}>No variety comparison is available for the current location.</p>}
                          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Benchmarks are comparative reference data; they are not a guaranteed local yield or a substitute for district variety guidance.</p>
                        </>
                      )}
                      {activeDecisionModule === 'warnings' && (
                        <>
                          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Early Warnings</h3>
                          <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)' }}>
                            Current forecast for <strong>{activeVariety}</strong> · risk <strong style={{ color: riskColor(result.risk || result.risk_level) }}>{result.risk || result.risk_level || 'Not returned'}</strong>.
                            {' '}Checks below are generated from this forecast’s parameters and update when a new forecast is selected.
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8, marginBottom: 12 }}>
                            {[
                              ['Rainfall', auditInputs.rainfall_mm ?? auditInputs.rainfall, 'mm'],
                              ['Temperature', auditInputs.temperature_c ?? auditInputs.temperature, '°C'],
                              ['Humidity', auditInputs.humidity_pct ?? auditInputs.humidity, '%'],
                              ['Soil moisture', auditInputs.soil_moisture, '%'],
                              ['Soil pH', auditInputs.soil_ph, 'pH']
                            ].filter(([, value]) => value != null && value !== '').map(([label, value, unit]) => (
                              <div key={label} style={{ padding: '9px 11px', borderRadius: 9, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                <small style={{ display: 'block', color: 'var(--text-muted)' }}>{label}</small>
                                <strong>{value} {unit}</strong>
                              </div>
                            ))}
                          </div>
                          {forecastWarningItems.length ? (
                            <div style={{ display: 'grid', gap: 8 }}>
                              {forecastWarningItems.map(item => (
                                <div key={item.id} style={{ padding: 12, borderRadius: 10, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.22)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                    <strong>{item.title}</strong>
                                    <Badge variant="warning">{item.severity}</Badge>
                                  </div>
                                  <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{item.detail}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                              <strong>No parameter warning from the current forecast</strong>
                              <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>The supplied rainfall, temperature, soil moisture, and pH do not cross this screen’s review thresholds. Keep monitoring field conditions; this does not guarantee a risk-free crop.</p>
                            </div>
                          )}
                          <small style={{ display: 'block', marginTop: 10, color: 'var(--text-muted)' }}>These are forecast-based screening prompts, not diagnoses. Verify readings in the field before changing management.</small>
                        </>
                      )}
                      {activeDecisionModule === 'whatif' && <SimulatorPage embedded forecast={result} />}
                      {activeDecisionModule === 'irrigation' && decisionData.irrigation && (() => {
                        const irrigation = decisionData.irrigation;
                        const hasFieldReading = irrigation.soil_moisture_pct != null;
                        const inputMoisture = auditInputs.soil_moisture;
                        const inputRainfall = auditInputs.rainfall_mm ?? auditInputs.rainfall;
                        const inputTemperature = auditInputs.temperature_c ?? auditInputs.temperature;
                        const readingDate = irrigation.soil_moisture_recorded_at ? new Date(irrigation.soil_moisture_recorded_at) : null;
                        const forecastMoisture = inputMoisture == null || inputMoisture === '' ? Number.NaN : Number(inputMoisture);
                        const forecastRainfall = inputRainfall == null || inputRainfall === '' ? Number.NaN : Number(inputRainfall);
                        const lowSeasonalWaterInput = Number.isFinite(forecastRainfall) && forecastRainfall < 900;
                        const forecastStage = irrigation.crop_stage && irrigation.crop_stage !== 'Unavailable'
                          ? irrigation.crop_stage
                          : auditInputs.crop_growth_stage || 'Stage not entered';
                        const stageName = String(forecastStage).toLowerCase();
                        const highWaterDemandStage = stageName.includes('grand growth') || stageName.includes('tillering');
                        const forecastIrrigationGuidance = !Number.isFinite(forecastMoisture)
                          ? {
                              title: 'A current moisture check is needed',
                              reason: 'This forecast does not include a usable soil-moisture value, so it cannot indicate whether irrigation is needed.',
                              next: 'Measure moisture in the active root zone, then use the crop stage and local irrigation guidance to decide timing.'
                            }
                          : forecastMoisture < 45
                            ? {
                                title: 'Prioritize a field moisture check',
                                reason: `The forecast input is ${forecastMoisture.toFixed(1)}%, below the app’s 45% critical screening level. This is a model input, not a field measurement, so it cannot confirm water stress.`,
                                next: 'Measure root-zone moisture promptly. If the field reading confirms a deficit, plan irrigation for the crop stage using local practice; do not set a volume from this forecast value.'
                              }
                            : forecastMoisture < 60
                              ? {
                                  title: 'Check moisture before the next irrigation cycle',
                                  reason: `The forecast input is ${forecastMoisture.toFixed(1)}%, below the app’s 60% lower screening band. It suggests checking for a developing deficit, but does not confirm field conditions.`,
                                  next: 'Take a fresh root-zone measurement and review crop stage and recent rainfall. Irrigate only if the measured field condition supports it.'
                                }
                              : forecastMoisture <= 75
                                ? {
                                    title: lowSeasonalWaterInput || highWaterDemandStage ? 'Monitor closely and verify field moisture' : 'No immediate irrigation indicated by this input',
                                    reason: `The forecast soil-moisture input is ${forecastMoisture.toFixed(1)}%, within the app’s 60–75% screening band, but it is not a field measurement.${lowSeasonalWaterInput ? ` The cumulative precipitation input (${forecastRainfall.toFixed(0)} mm) is below the app’s 900 mm screening threshold, so seasonal water supply is a concern; this value is not recent rainfall.` : ''}${highWaterDemandStage ? ` ${forecastStage} is a high-water-demand phase, so moisture checks are especially important.` : ''}`,
                                    next: lowSeasonalWaterInput || highWaterDemandStage
                                      ? 'Measure root-zone moisture before the next irrigation decision. If the field reading confirms a deficit, irrigate according to local crop-stage guidance and the available method; do not calculate a water volume from forecast inputs.'
                                      : 'Check root-zone moisture and continue the locally scheduled rotation only if the field reading and crop stage support it.'
                                  }
                                : forecastMoisture <= 80
                                  ? {
                                      title: 'Check for excess moisture before irrigating',
                                      reason: `The forecast input is ${forecastMoisture.toFixed(1)}%, above the app’s 75% upper screening band. This may warrant checking for wet soil or poor drainage, but it is not a field diagnosis.`,
                                      next: 'Measure the root zone and inspect for standing water. Hold additional irrigation until field conditions are checked.'
                                    }
                                  : {
                                      title: 'Inspect for saturation before irrigating',
                                      reason: `The forecast input is ${forecastMoisture.toFixed(1)}%, above the app’s 80% high-moisture screening level. Confirm the reading and inspect drainage; the forecast input alone cannot establish saturation.`,
                                      next: 'Do not add water based on this forecast. Check the field and drainage first, then reassess using a current measurement.'
                                    };
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                              <div>
                                <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{hasFieldReading ? 'Field Irrigation Decision' : 'Forecast-based Irrigation Guidance'}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                                  {irrigation.field_name ? `${irrigation.field_name}${irrigation.farm_name ? ` · ${irrigation.farm_name}` : ''}` : `Forecast inputs · ${activeVariety} · ${auditInputs.district || formData.district}, ${auditInputs.state || formData.state}`}
                                </p>
                              </div>
                              <Badge variant={hasFieldReading ? (irrigation.status_badge || 'neutral') : 'warning'}>{hasFieldReading ? (irrigation.status || 'Status unavailable') : 'Preliminary · verify in field'}</Badge>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 14 }}>
                              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                <small style={{ color: 'var(--text-muted)' }}>{hasFieldReading ? 'Latest measured soil moisture' : 'Soil moisture in this forecast'}</small>
                                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 3 }}>{hasFieldReading ? `${Number(irrigation.soil_moisture_pct).toFixed(1)}%` : Number.isFinite(forecastMoisture) ? `${forecastMoisture.toFixed(1)}%` : 'Not entered'}</div>
                                <small style={{ color: 'var(--text-muted)' }}>{hasFieldReading ? (readingDate && !Number.isNaN(readingDate.getTime()) ? `Measured ${readingDate.toLocaleString()}` : 'Recent field record; time unavailable') : irrigation.soil_moisture_recorded_at ? 'No fresh field record; showing forecast input only' : 'Forecast input only · not a measured field reading'}</small>
                              </div>
                              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Crop stage</small>
                                <div style={{ fontWeight: 700, marginTop: 5 }}>{forecastStage}</div>
                                <small style={{ color: 'var(--text-muted)' }}>{highWaterDemandStage ? 'Higher water-demand phase; monitor moisture' : 'Use stage-specific local schedule'}</small>
                              </div>
                              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Irrigation method</small>
                                <div style={{ fontWeight: 700, marginTop: 5 }}>{irrigation.irrigation_method && irrigation.irrigation_method !== 'Not specified' ? irrigation.irrigation_method : 'Choose local method'}</div>
                                <small style={{ color: 'var(--text-muted)' }}>{irrigation.irrigation_method && irrigation.irrigation_method !== 'Not specified' ? 'Method linked to selected field' : 'Method is not linked to this forecast'}</small>
                              </div>
                            </div>

                            <div style={{ padding: 13, borderRadius: 10, background: hasFieldReading ? 'var(--bg-panel)' : 'rgba(245, 158, 11, 0.08)', border: `1px solid ${hasFieldReading ? 'var(--border-color)' : 'rgba(245, 158, 11, 0.25)'}`, marginBottom: 10 }}>
                              <strong>{hasFieldReading ? 'Why this recommendation?' : forecastIrrigationGuidance.title}</strong>
                              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>{hasFieldReading ? (irrigation.advice || 'No explanation was returned.') : forecastIrrigationGuidance.reason}</p>
                            </div>
                            <div style={{ padding: 13, borderRadius: 10, background: 'rgba(16, 185, 129, 0.07)', border: '1px solid rgba(16, 185, 129, 0.18)' }}>
                              <strong>Next step</strong>
                              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>{hasFieldReading ? (irrigation.recommendation || 'No next step was returned.') : forecastIrrigationGuidance.next}</p>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                              {irrigation.ambient_temperature_c != null && <Badge variant="info">Current weather temperature {irrigation.ambient_temperature_c} °C</Badge>}
                              {irrigation.recent_rainfall_mm != null && <Badge variant="info">Recent rainfall {irrigation.recent_rainfall_mm} mm</Badge>}
                            </div>
                            {!hasFieldReading && (inputMoisture != null || inputRainfall != null || inputTemperature != null) && (
                              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--bg-panel)', border: '1px dashed var(--border-color)' }}>
                                <strong style={{ fontSize: 13 }}>Forecast inputs · not field measurements</strong>
                                <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                                  {[
                                    inputMoisture != null && `Soil moisture ${inputMoisture}%`,
                                    inputRainfall != null && `Rainfall ${inputRainfall} mm`,
                                    inputTemperature != null && `Temperature ${inputTemperature} °C`
                                  ].filter(Boolean).join(' · ')}. These values describe the yield forecast and support preliminary screening only. The precipitation value is cumulative seasonal input, not a recent rainfall observation; none of these values replaces a current field reading.
                                </p>
                              </div>
                            )}
                            <small style={{ display: 'block', marginTop: 10, color: 'var(--text-muted)' }}>Data source: {irrigation.data_source || 'not stated'}. Verify soil moisture and field conditions before applying water; this guidance does not calculate an irrigation volume.</small>
                          </>
                        );
                      })()}
                      {activeDecisionModule === 'weather' && decisionData.weather && <><h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Weather Outlook · {decisionData.weather.location}</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}><Badge variant="info">Now {decisionData.weather.current?.temperature ?? '—'}°C</Badge><Badge variant="info">Rain {decisionData.weather.current?.rainfall ?? '—'} mm</Badge><Badge variant="info">Humidity {decisionData.weather.current?.humidity ?? '—'}%</Badge>{decisionData.weather.current?.is_demo && <Badge variant="warning">Demo baseline, not live weather</Badge>}</div><small style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 10 }}>Source: {decisionData.weather.current?.source || 'not stated'}{decisionData.weather.current?.observed_at ? ` · observed ${new Date(decisionData.weather.current.observed_at).toLocaleString()}` : ' · observation time unavailable'}</small>{decisionData.weather.forecast?.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>{decisionData.weather.forecast.slice(0, 5).map(day => <div key={day.date} style={{ padding: 10, borderRadius: 9, background: 'var(--bg-panel)' }}><strong>{day.day || new Date(day.date).toLocaleDateString()}</strong><div style={{ fontSize: 13, marginTop: 4 }}>{day.description || 'Conditions unavailable'}</div><small style={{ color: 'var(--text-muted)' }}>{day.low ?? '—'}–{day.high ?? '—'}°C · rain {day.rainfall ?? '—'} mm</small></div>)}</div> : <p>No dated forecast data returned.</p>}<p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 0 }}>Use forecast dates as a planning aid; conditions and provider coverage may change. Confirm with local observations before field operations.</p></>}
                      {activeDecisionModule === 'soil' && decisionData.soil && (() => {
                        const soil = decisionData.soil;
                        const soilInputs = auditInputs;
                        const pHValue = Number(soilInputs.soil_ph);
                        const hasPH = soilInputs.soil_ph != null && soilInputs.soil_ph !== '' && Number.isFinite(pHValue);
                        const moistureValue = soilInputs.soil_moisture;
                        const soilType = soilInputs.soil_type;
                        const pHInScreeningBand = hasPH && pHValue >= 6.5 && pHValue <= 7.8;
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                              <div>
                                <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Soil & Nutrient Review</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                                  {soil.forecast_only
                                    ? `Forecast profile · ${activeVariety} · ${soilInputs.district || formData.district}, ${soilInputs.state || formData.state}`
                                    : `${selectedField?.name || 'Selected field'} · recorded soil information`}
                                </p>
                              </div>
                              <Badge variant={soil.forecast_only ? 'warning' : soil.data_available ? 'success' : 'neutral'}>
                                {soil.forecast_only ? 'Forecast inputs only' : soil.data_available ? (soil.health_label || 'Field assessment') : 'Field data needs updating'}
                              </Badge>
                            </div>

                            {soil.forecast_only ? (
                              <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 12 }}>
                                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                    <small style={{ color: 'var(--text-muted)' }}>Soil pH in forecast</small>
                                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{hasPH ? `${pHValue.toFixed(1)} pH` : 'Not entered'}</div>
                                    <small style={{ color: 'var(--text-muted)' }}>{hasPH ? (pHInScreeningBand ? 'Within the app’s 6.5–7.8 screening band' : 'Outside the app’s 6.5–7.8 screening band') : 'No pH value in this forecast'}</small>
                                  </div>
                                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                    <small style={{ color: 'var(--text-muted)' }}>Soil moisture in forecast</small>
                                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{moistureValue == null || moistureValue === '' ? 'Not entered' : `${moistureValue}%`}</div>
                                    <small style={{ color: 'var(--text-muted)' }}>Model input · not a measured field sample</small>
                                  </div>
                                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                    <small style={{ color: 'var(--text-muted)' }}>Soil type in forecast</small>
                                    <div style={{ fontWeight: 700, marginTop: 7 }}>{soilType || 'Not entered'}</div>
                                    <small style={{ color: 'var(--text-muted)' }}>Model input · confirm for the field</small>
                                  </div>
                                </div>
                                <div style={{ padding: 13, borderRadius: 10, background: pHInScreeningBand ? 'rgba(16, 185, 129, 0.07)' : 'rgba(245, 158, 11, 0.08)', border: `1px solid ${pHInScreeningBand ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.22)'}`, marginBottom: 10 }}>
                                  <strong>{hasPH ? (pHInScreeningBand ? 'pH screening' : 'Confirm soil pH') : 'Add a soil pH result'}</strong>
                                  <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                                    {hasPH
                                      ? (pHInScreeningBand
                                          ? `The forecast pH of ${pHValue.toFixed(1)} falls within the app’s screening band. Confirm it with a current field soil test before making amendment decisions.`
                                          : `The forecast pH of ${pHValue.toFixed(1)} is outside the app’s screening band. Confirm with a representative soil test; only apply pH amendments if a local soil-test recommendation supports them.`)
                                      : 'A current, representative soil test is needed to assess pH and nutrient availability.'}
                                  </p>
                                </div>
                                <div style={{ padding: 13, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                                  <strong>Nutrients (NPK)</strong>
                                  <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>N, P, and K lab results are not included in the yield forecast inputs. Take a current soil test and follow a local recommendation; this screen does not infer fertilizer rates.</p>
                                </div>
                                <small style={{ display: 'block', marginTop: 10, color: 'var(--text-muted)' }}>Forecast values describe model inputs. They do not replace measured field data or a laboratory soil analysis.</small>
                              </>
                            ) : (
                              <>
                                {soil.data_available ? (
                                  <>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                      {soil.health_score != null && <Badge variant="info">Soil score {soil.health_score}</Badge>}
                                      {soil.recorded_at && <Badge variant="info">Recorded {new Date(soil.recorded_at).toLocaleDateString()}</Badge>}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 12 }}>
                                      {[
                                        ['Measured pH', soil.soil_ph == null ? 'Not recorded' : `${soil.soil_ph} pH`],
                                        ['Measured moisture', soil.soil_moisture == null ? 'Not recorded' : `${soil.soil_moisture}%`],
                                        ['Recorded soil type', soil.soil_type || 'Not recorded']
                                      ].map(([label, value]) => <div key={label} style={{ padding: 11, borderRadius: 9, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}><small style={{ color: 'var(--text-muted)' }}>{label}</small><div style={{ fontWeight: 700, marginTop: 4 }}>{value}</div></div>)}
                                    </div>
                                    <p>{soil.message || soil.sugarcane_suitability || 'Review these measurements alongside a current lab soil test.'}</p>
                                    {soil.nutrients ? <p>Recorded nutrients: {Object.entries(soil.nutrients).map(([name, value]) => `${name} ${value ?? '—'}`).join(' · ')}</p> : <div style={{ padding: 12, borderRadius: 9, background: 'var(--bg-panel)' }}><strong>NPK lab results not attached</strong><p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Use a current soil test and local recommendation before adjusting fertilizer.</p></div>}
                                  </>
                                ) : (
                                  <>
                                    <p style={{ color: 'var(--text-secondary)' }}>{soil.message || 'No current soil measurements are recorded for this field.'}</p>
                                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', marginBottom: 10 }}>
                                      <strong>Forecast context · not field measurements</strong>
                                      <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>Forecast pH {hasPH ? `${pHValue.toFixed(1)}` : 'not entered'} · moisture {moistureValue == null || moistureValue === '' ? 'not entered' : `${moistureValue}%`} · soil type {soilType || 'not entered'}.</p>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)' }}>Record a current soil sample for pH and NPK, plus field moisture if needed. The forecast does not contain laboratory nutrient results.</p>
                                  </>
                                )}
                                {soil.recorded_at && <small style={{ color: 'var(--text-muted)' }}>Last soil record: {new Date(soil.recorded_at).toLocaleString()} · compare with the sampling date before using.</small>}
                              </>
                            )}
                          </>
                        );
                      })()}
                      {activeDecisionModule === 'health' && decisionData.health && (() => {
                        const healthData = decisionData.health;
                        const ndviSnapshot = healthData.ndvi_data;
                        const healthAssessment = ndviSnapshot?.health || ndviSnapshot?.average_health || {};
                        const healthLabel = typeof ndviSnapshot?.health_category === 'string'
                          ? ndviSnapshot.health_category
                          : typeof ndviSnapshot?.health_status === 'string'
                            ? ndviSnapshot.health_status
                            : typeof healthAssessment === 'string'
                              ? healthAssessment
                              : healthAssessment.category || healthAssessment.health_category || 'Assessment unavailable';
                        const ndviValue = ndviSnapshot?.ndvi ?? ndviSnapshot?.ndvi_value ?? ndviSnapshot?.ndvi_mean;
                        const recommendations = Array.isArray(healthAssessment.recommendations)
                          ? healthAssessment.recommendations.filter(item => typeof item === 'string')
                          : [];
                        return (
                          <>
                            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Crop Health Snapshot</h3>
                            {ndviSnapshot ? (
                              <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                  <Badge variant="info">{ndviSnapshot.source === 'Historical Data' ? 'Historical regional NDVI' : 'NDVI'} {ndviValue == null ? 'not reported' : Number(ndviValue).toFixed(3)}</Badge>
                                  <Badge variant={/poor|fair|moderate/i.test(healthLabel) ? 'warning' : 'success'}>{healthLabel}</Badge>
                                  {ndviSnapshot.total_records != null && <Badge variant="neutral">{ndviSnapshot.total_records} historical records</Badge>}
                                </div>
                                <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>
                                  {healthAssessment.description || healthData.note || 'Use this vegetation signal as a screening aid and compare it with direct field observations.'}
                                </p>
                                {recommendations.length > 0 && (
                                  <>
                                    <strong style={{ fontSize: 13 }}>Suggested checks</strong>
                                    <ul style={{ margin: '5px 0 10px', paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                      {recommendations.map((recommendation, index) => <li key={`${index}-${recommendation}`}>{recommendation}</li>)}
                                    </ul>
                                  </>
                                )}
                                <small style={{ color: 'var(--text-muted)' }}>
                                  Source: {healthData.data_source || ndviSnapshot.source || 'not stated'}
                                  {ndviSnapshot.observation_date ? ` · observation ${ndviSnapshot.observation_date}` : healthData.timestamp ? ` · retrieved ${new Date(healthData.timestamp).toLocaleString()}` : ''}
                                  {ndviSnapshot.source === 'Historical Data' ? ' · historical regional data, not a live field measurement' : ' · verify with field scouting'}
                                </small>
                              </>
                            ) : (
                              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-panel)' }}>
                                <strong>No NDVI snapshot for this location</strong>
                                <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>Use field scouting and dated photos until satellite or regional data is available. No crop-health diagnosis is inferred from the yield forecast.</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {activeDecisionModule === 'pdf' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                          <div><h3 style={{ margin: '0 0 5px', fontSize: 16 }}>Export Forecast Dossier</h3><p style={{ margin: 0, color: 'var(--text-secondary)' }}>The print view includes the selected forecast, model drivers, and any open module summary. Choose “Save as PDF” in the print dialog.</p><small style={{ display: 'block', marginTop: 7, color: 'var(--text-muted)' }}>Forecast date: {result.created_at ? new Date(result.created_at).toLocaleString() : new Date().toLocaleString()} · Field: {result.input_data?.field_name || selectedField?.name || 'not linked'}</small></div>
                          <button type="button" className="btn-primary" onClick={exportPredictionPdf} style={{ minWidth: 172, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', whiteSpace: 'nowrap' }}><FileText size={16} /> Export PDF</button>
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </div>

                <section className="prediction-print-summary" aria-hidden="true">
                  <h2>Decision Support Summary</h2>
                  <p><strong>Field:</strong> {result.input_data?.field_name || selectedField?.name || 'Not linked'} · <strong>Farm:</strong> {result.input_data?.farm_name || selectedFarm?.name || 'Not linked'} · <strong>Area:</strong> {Number.isFinite(fieldArea) ? `${fieldArea} ha` : 'Not available'}</p>
                  <p><strong>Forecast:</strong> {Number.isFinite(forecastYield) ? `${forecastYield.toFixed(1)} t/ha` : 'Not available'} · <strong>Reference gap:</strong> {yieldGapPerHectare == null ? 'Not available' : `${yieldGapPerHectare.toFixed(1)} t/ha (${yieldGapForField == null ? 'total unavailable' : `${yieldGapForField.toFixed(1)} t for this field`})`}</p>
                  <small>Generated {new Date().toLocaleString()} · Review source data and field conditions before acting.</small>
                </section>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PREDICTION HISTORY & ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="history-flow">
            {/* Historical Trend Graph */}
            <div className="card" style={{ marginBottom: 24, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Temporal Yield Progression</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                    Chronological evaluation of predicted yields across your evaluated farms and seasons.
                  </p>
                </div>
                <Badge variant="success">MySQL Audit Trail</Badge>
              </div>

              {graphData.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No historical prediction data points recorded yet. Run your first forecast above!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.6)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis unit=" t" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip formatter={(v, n) => [n === 'yield' ? `${v} t/ha` : `${v} t`, n === 'yield' ? 'Predicted Yield' : 'Production']} />
                    <Legend />
                    <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={2.5} name="Yield (t/ha)" activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="production" stroke="#0ea5e9" strokeWidth={1.8} name="Total Production (t)" strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="card" style={{ marginBottom: 24, padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <input
                  type="text"
                  placeholder="🔍 Search farm, field, location…"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadHistory()}
                />

                <select
                  value={historyVariety}
                  onChange={e => setHistoryVariety(e.target.value)}
                >
                  <option value="">All Varieties</option>
                  {varieties.length > 0 ? varieties.map(v => <option key={v} value={v}>{v}</option>) : 
                    ['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265'].map(v => <option key={v} value={v}>{v}</option>)
                  }
                </select>

                <select
                  value={historyRisk}
                  onChange={e => setHistoryRisk(e.target.value)}
                >
                  <option value="">All Risk Levels</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                  <option value="Critical">Critical Risk</option>
                </select>

                <input
                  type="date"
                  value={historyDateFrom}
                  onChange={e => setHistoryDateFrom(e.target.value)}
                  title="From Date"
                />

                <input
                  type="date"
                  value={historyDateTo}
                  onChange={e => setHistoryDateTo(e.target.value)}
                  title="To Date"
                />

                <button className="btn-outline" onClick={loadHistory}>
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Prediction History ({historyList.length})</h3>
                <Badge variant="info">Persistent Storage</Badge>
              </div>

              {historyLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading prediction records…</div>
              ) : historyList.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No prediction records match your query.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Farm / Location</th>
                        <th>Field</th>
                        <th>Variety</th>
                        <th>Yield (t/ha)</th>
                        <th>Production (t)</th>
                        <th>Confidence</th>
                        <th>Risk</th>
                        <th>Loss Deficit</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map(r => (
                        <tr key={r.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {r.created_at ? r.created_at.slice(0, 10) : '—'}
                          </td>
                          <td>
                            <strong>{r.farm_name || r.location}</strong>
                          </td>
                          <td>{r.field_name || 'Plot'}</td>
                          <td>
                            <Badge variant="success" size="sm">{r.variety}</Badge>
                          </td>
                          <td style={{ fontWeight: 700, color: '#10b981' }}>
                            {Number(r.predicted_yield).toFixed(1)}
                          </td>
                          <td>
                            {Number(r.expected_production || 0).toFixed(1)}
                          </td>
                          <td>{r.confidence}%</td>
                          <td>
                            <Badge variant={r.risk_level?.toLowerCase() || r.risk?.toLowerCase() || 'low'} size="sm">
                              {r.risk_level || r.risk || 'Low'}
                            </Badge>
                          </td>
                          <td style={{ color: (r.loss_percentage || r.expected_loss) > 20 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                            {Number(r.loss_percentage || r.expected_loss || 0).toFixed(1)}%
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              className="btn-outline"
                              style={{ padding: '4px 8px', fontSize: 12, marginRight: 6 }}
                              onClick={() => setDetailsModal(r)}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            <button
                              className="btn-outline"
                              style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              onClick={() => handleDeletePrediction(r.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Details Modal */}
            <Modal
              isOpen={Boolean(detailsModal)}
              onClose={() => setDetailsModal(null)}
              title={`Prediction Record #${detailsModal?.id}`}
              subtitle="Full audited agronomic parameters and model outputs"
              footer={
                <button className="btn-primary" onClick={() => setDetailsModal(null)}>
                  Close Details
                </button>
              }
            >
              {detailsModal && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13, marginBottom: 16 }}>
                    <div><strong>Date:</strong> {detailsModal.created_at?.slice(0, 10)}</div>
                    <div><strong>Farm:</strong> {detailsModal.farm_name || detailsModal.location}</div>
                    <div><strong>Field:</strong> {detailsModal.field_name || 'Plot'}</div>
                    <div><strong>Variety:</strong> {detailsModal.variety}</div>
                    <div><strong>Area:</strong> {detailsModal.area} ha</div>
                    <div><strong>Predicted Yield:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>{detailsModal.predicted_yield} t/ha</span></div>
                    <div><strong>Expected Production:</strong> {detailsModal.expected_production} t</div>
                    <div><strong>Confidence:</strong> {detailsModal.confidence}%</div>
                    <div><strong>Risk Level:</strong> {detailsModal.risk_level || detailsModal.risk}</div>
                    <div><strong>Loss Deficit:</strong> {detailsModal.loss_percentage || detailsModal.expected_loss}%</div>
                  </div>

                  {detailsModal.explanation && (
                    <div style={{ background: 'var(--border-subtle)', padding: 14, borderRadius: 10, fontSize: 12.5 }}>
                      <strong>AI Agronomic Explanation:</strong>
                      <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>{detailsModal.explanation.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </Modal>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
