import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { farmApi, weatherApi } from '../services/api';
import { useAuth } from './AuthContext';

const FieldContext = createContext(null);

const STORAGE_KEY_FARM = 'sugaryield_active_farm_id';
const STORAGE_KEY_FIELD = 'sugaryield_active_field_id';
const STORAGE_KEY_PRED = 'sugaryield_active_prediction';

export function FieldProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState(() => localStorage.getItem(STORAGE_KEY_FARM) || '');
  const [selectedFieldId, setSelectedFieldId] = useState(() => localStorage.getItem(STORAGE_KEY_FIELD) || '');
  const [selectedPrediction, setSelectedPredictionState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRED);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [activeWeather, setActiveWeather] = useState(null);

  // Load farms and initialize active selection
  const refreshFarms = useCallback(async () => {
    if (!user) {
      setFarms([]);
      setLoading(false);
      return;
    }

    try {
      const res = await farmApi.list();
      const farmList = res.data?.farms || [];
      setFarms(farmList);

      const savedField = farmList.flatMap(farm => (farm.fields || []).map(field => ({ ...field, farm })))
        .find(item => String(item.id) === String(selectedFieldId));
      if (selectedFieldId && savedField) {
        if (String(savedField.farm.id) !== String(selectedFarmId)) {
          setSelectedFarmId(String(savedField.farm.id));
          localStorage.setItem(STORAGE_KEY_FARM, String(savedField.farm.id));
        }
      } else if (selectedFieldId) {
        setSelectedFieldId('');
        localStorage.removeItem(STORAGE_KEY_FIELD);
      }
    } catch (e) {
      console.error('Failed to load farms in FieldContext:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId, selectedFieldId, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setFarms([]);
      setLoading(false);
      return;
    }
    refreshFarms();
  }, [authLoading, user]);

  // Update selected farm
  const selectFarm = (farmId) => {
    const fIdStr = String(farmId);
    setSelectedFarmId(fIdStr);
    localStorage.setItem(STORAGE_KEY_FARM, fIdStr);

    const farmObj = farms.find(f => String(f.id) === fIdStr);
    const currentFieldBelongs = farmObj?.fields?.some(field => String(field.id) === String(selectedFieldId));
    if (!currentFieldBelongs) {
      setSelectedFieldId('');
      localStorage.removeItem(STORAGE_KEY_FIELD);
    }
  };

  // Update selected field
  const selectField = (fieldId) => {
    const fldIdStr = String(fieldId);
    if (!fldIdStr) {
      setSelectedFieldId('');
      localStorage.removeItem(STORAGE_KEY_FIELD);
      return;
    }
    setSelectedFieldId(fldIdStr);
    localStorage.setItem(STORAGE_KEY_FIELD, fldIdStr);

    // Also ensure selectedFarm matches
    for (const farm of farms) {
      if (farm.fields && farm.fields.some(fld => String(fld.id) === fldIdStr)) {
        if (String(farm.id) !== selectedFarmId) {
          setSelectedFarmId(String(farm.id));
          localStorage.setItem(STORAGE_KEY_FARM, String(farm.id));
        }
        break;
      }
    }
  };

  // Set selected prediction for cross-module inspection (XAI, Yield Loss, Reports)
  const setSelectedPrediction = (pred) => {
    setSelectedPredictionState(pred);
    if (pred) {
      try {
        localStorage.setItem(STORAGE_KEY_PRED, JSON.stringify(pred));
      } catch {}
    } else {
      localStorage.removeItem(STORAGE_KEY_PRED);
    }
  };

  // Computed objects
  const selectedFarm = farms.find(f => String(f.id) === String(selectedFarmId)) || null;
  const allFields = farms.flatMap(f => (f.fields || []).map(fld => ({ ...fld, farm_name: f.name, farm_location: f.location })));
  const selectedField = allFields.find(f => String(f.id) === String(selectedFieldId)) || null;

  // Fetch live weather when active farm/location changes
  useEffect(() => {
    if (!user || authLoading) return;
    if (!selectedFarm) { setActiveWeather(null); return; }
    const loc = selectedFarm.location || selectedFarm.district;
    weatherApi.current(loc)
      .then(res => {
        if (res.data) setActiveWeather(res.data);
      })
      .catch(() => {});
  }, [selectedFarmId, user, authLoading]);

  // Aggregate multi-farm stats
  const freshMoistureFields = allFields.filter(field => {
    const recordedAt = field.soil_moisture_recorded_at ? new Date(field.soil_moisture_recorded_at).getTime() : NaN;
    const age = Date.now() - recordedAt;
    return field.soil_moisture != null && Number.isFinite(Number(field.soil_moisture))
      && Number.isFinite(recordedAt) && age >= 0 && age <= 30 * 86400000;
  });
  const measuredPhFields = allFields.filter(field => field.soil_ph != null && Number.isFinite(Number(field.soil_ph)));
  const multiFarmStats = {
    totalFarms: farms.length,
    totalFields: allFields.length,
    totalArea: Number(allFields.reduce((sum, f) => sum + (Number(f.area) || 0), 0).toFixed(1)),
    avgSoilMoisture: freshMoistureFields.length
      ? Number((freshMoistureFields.reduce((sum, field) => sum + Number(field.soil_moisture), 0) / freshMoistureFields.length).toFixed(1))
      : null,
    avgSoilPh: measuredPhFields.length
      ? Number((measuredPhFields.reduce((sum, field) => sum + Number(field.soil_ph), 0) / measuredPhFields.length).toFixed(2))
      : null,
    varieties: [...new Set(allFields.map(f => f.sugarcane_variety).filter(Boolean))]
  };

  const value = {
    farms,
    allFields,
    selectedFarm,
    selectedField,
    selectedFarmId,
    selectedFieldId,
    selectedPrediction,
    activeWeather,
    multiFarmStats,
    loading,
    selectFarm,
    selectField,
    setSelectedPrediction,
    refreshFarms
  };

  return <FieldContext.Provider value={value}>{children}</FieldContext.Provider>;
}

export const useField = () => {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error('useField must be used within a FieldProvider');
  }
  return context;
};
