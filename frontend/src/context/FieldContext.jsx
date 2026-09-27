import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { farmApi, weatherApi } from '../services/api';

const FieldContext = createContext(null);

const STORAGE_KEY_FARM = 'sugaryield_active_farm_id';
const STORAGE_KEY_FIELD = 'sugaryield_active_field_id';
const STORAGE_KEY_PRED = 'sugaryield_active_prediction';

export function FieldProvider({ children }) {
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
    try {
      const res = await farmApi.list();
      const farmList = res.data?.farms || [];
      setFarms(farmList);

      if (farmList.length > 0) {
        // If current selection is invalid or empty, pick first farm
        let curFarm = farmList.find(f => String(f.id) === String(selectedFarmId));
        if (!curFarm) {
          curFarm = farmList[0];
          setSelectedFarmId(String(curFarm.id));
          localStorage.setItem(STORAGE_KEY_FARM, String(curFarm.id));
        }

        // Check field
        if (curFarm.fields && curFarm.fields.length > 0) {
          const curField = curFarm.fields.find(f => String(f.id) === String(selectedFieldId));
          if (!curField) {
            setSelectedFieldId(String(curFarm.fields[0].id));
            localStorage.setItem(STORAGE_KEY_FIELD, String(curFarm.fields[0].id));
          }
        } else {
          setSelectedFieldId('');
          localStorage.removeItem(STORAGE_KEY_FIELD);
        }
      }
    } catch (e) {
      console.error('Failed to load farms in FieldContext:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId, selectedFieldId]);

  useEffect(() => {
    refreshFarms();
  }, []);

  // Update selected farm
  const selectFarm = (farmId) => {
    const fIdStr = String(farmId);
    setSelectedFarmId(fIdStr);
    localStorage.setItem(STORAGE_KEY_FARM, fIdStr);

    const farmObj = farms.find(f => String(f.id) === fIdStr);
    if (farmObj && farmObj.fields && farmObj.fields.length > 0) {
      const firstFieldId = String(farmObj.fields[0].id);
      setSelectedFieldId(firstFieldId);
      localStorage.setItem(STORAGE_KEY_FIELD, firstFieldId);
    } else {
      setSelectedFieldId('');
      localStorage.removeItem(STORAGE_KEY_FIELD);
    }
  };

  // Update selected field
  const selectField = (fieldId) => {
    const fldIdStr = String(fieldId);
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
  const selectedFarm = farms.find(f => String(f.id) === String(selectedFarmId)) || (farms.length > 0 ? farms[0] : null);
  const allFields = farms.flatMap(f => (f.fields || []).map(fld => ({ ...fld, farm_name: f.name, farm_location: f.location })));
  const selectedField = allFields.find(f => String(f.id) === String(selectedFieldId)) || (selectedFarm?.fields?.[0] || null);

  // Fetch live weather when active farm/location changes
  useEffect(() => {
    const loc = selectedFarm?.location || selectedFarm?.district || 'Kolhapur';
    weatherApi.current(loc)
      .then(res => {
        if (res.data) setActiveWeather(res.data);
      })
      .catch(() => {});
  }, [selectedFarmId]);

  // Aggregate multi-farm stats
  const multiFarmStats = {
    totalFarms: farms.length,
    totalFields: allFields.length,
    totalArea: Number(allFields.reduce((sum, f) => sum + (Number(f.area) || 0), 0).toFixed(1)),
    avgSoilMoisture: allFields.length
      ? Number((allFields.reduce((sum, f) => sum + (Number(f.soil_moisture) || 60), 0) / allFields.length).toFixed(1))
      : 60.0,
    avgSoilPh: allFields.length
      ? Number((allFields.reduce((sum, f) => sum + (Number(f.soil_ph) || 7.0), 0) / allFields.length).toFixed(2))
      : 7.0,
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
