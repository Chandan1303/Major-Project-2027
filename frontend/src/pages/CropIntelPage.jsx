import React, { useEffect, useState } from 'react';
import {
  Sprout, Calendar, Droplets, Clock, CheckCircle2, Activity,
  ArrowRight, Layers, Check, Sparkles, Building2, AlertTriangle,
  ChevronRight, Compass
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { farmApi } from '../services/api';
import { useField } from '../context/FieldContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const STAGES = ['Planting', 'Germination', 'Tillering', 'Grand Growth', 'Maturity', 'Harvest'];
const STAGE_DAYS  = [0, 30, 60, 120, 270, 360];
const STAGE_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ea580c', '#059669'];

const STAGE_INFO = {
  Planting:     { desc: 'Sett selection, furrow placement, and basal fertilization under optimal soil moisture.', water: 'High requirement', activity: 'Select certified two-to-three budded setts, apply basal NPK dose, and ensure furrow spacing of 1.2m.' },
  Germination:  { desc: 'Bud sprouting, primary shoot emergence, and early root establishment within 30 days.', water: 'High requirement', activity: 'Maintain constant furrow moisture, inspect sprouting rate, and perform gap filling.' },
  Tillering:    { desc: 'Secondary and tertiary tillers emerging from basal stalk nodes (60-120 days).', water: 'Moderate requirement', activity: 'First nitrogen top-dressing, light earthing-up, weed eradication, and stem borer scouting.' },
  'Grand Growth':{ desc: 'Peak internode elongation, canopy closure, and intense biomass accumulation (120-270 days).', water: 'Critical peak requirement', activity: 'Scheduled irrigation cycles, full earthing-up to prevent lodging, second potassium boost.' },
  Maturity:     { desc: 'Sucrose synthesis, internode ripening, and leaf senescence (270-360 days).', water: 'Low requirement', activity: 'Taper irrigation 30 days prior to harvest to promote juice sucrose concentration.' },
  Harvest:      { desc: 'Peak commercial cane sugar (CCS) accumulation; prompt harvest and factory crushing.', water: 'Zero irrigation', activity: 'Flush cutting at ground level, detrashing stalks, and direct dispatch to processing mill within 24h.' },
};

export default function CropIntelPage() {
  const { selectedField: ctxField, selectField } = useField();
  const [farms, setFarms]       = useState([]);
  const [fields, setFields]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    farmApi.list().then(r => {
      const all = r.data?.farms || [];
      setFarms(all);
      const allFields = all.flatMap(f => (f.fields || []).map(fld => ({ ...fld, farm_name: f.name })));
      setFields(allFields);
      if (allFields.length) {
        const matched = ctxField ? allFields.find(f => f.id === ctxField.id) : null;
        setSelected(matched || allFields[0]);
      }
    }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, [ctxField]);

  function getStageInfo(plantingDate, moisture = 65) {
    if (!plantingDate) return { stageIdx: 0, daysIn: 0, daysToHarvest: 360, pct: 0, condition: 'Good', badge: 'success', stage: STAGES[0] };
    const days = Math.floor((Date.now() - new Date(plantingDate)) / 86400000);
    let stageIdx = 0;
    for (let i = STAGE_DAYS.length - 1; i >= 0; i--) {
      if (days >= STAGE_DAYS[i]) { stageIdx = i; break; }
    }
    stageIdx = Math.min(stageIdx, STAGES.length - 1);
    const daysToHarvest = Math.max(0, 360 - days);
    const pct = Math.min(Math.round((days / 360) * 100), 100);

    let condition = 'Good';
    let badge = 'success';
    if (moisture < 45) { condition = 'Water Stressed'; badge = 'critical'; }
    else if (moisture >= 60 && moisture <= 75) { condition = 'Optimal Growth'; badge = 'success'; }
    else if (moisture > 80) { condition = 'High Saturation'; badge = 'warning'; }

    return { stageIdx, daysIn: days, daysToHarvest, pct, condition, badge, stage: STAGES[stageIdx] };
  }

  const si = selected ? getStageInfo(selected.planting_date, Number(selected.soil_moisture)) : null;
  const stageInfo = si ? STAGE_INFO[si.stage] : null;
  const harvestDate = selected?.planting_date
    ? new Date(new Date(selected.planting_date).getTime() + 360 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center">
          <div className="loading-spinner" />
          <p>Analyzing crop phenological calendar & stage telemetry…</p>
        </div>
      </AppLayout>
    );
  }

  if (!fields.length) {
    return (
      <AppLayout>
        <div className="page-container">
          <EmptyState
            icon={Sprout}
            title="No Field Parcels Configured"
            description="Add fields with recorded planting dates to activate automated 6-stage phenology calendars."
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container">
        
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <Sprout size={13} /> Sugarcane Phenology & Canopy Development
            </div>
            <h1 className="page-title" style={{ margin: '0 0 6px' }}>Crop Growth Tracker & Intelligence</h1>
            <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Deterministic phenological pipeline mapping days in ground to critical water and nutrient management windows.
            </p>
          </div>
        </div>

        {/* Field Selector Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 24 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            SELECT FIELD:
          </span>
          {fields.map(f => {
            const isSel = selected?.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setSelected(f); selectField(f.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isSel ? 'var(--primary-glow)' : 'var(--card-bg)',
                  color: isSel ? 'var(--primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Sprout size={14} style={{ opacity: isSel ? 1 : 0.6 }} />
                <span>{f.name}</span>
                <span style={{ fontSize: 11, color: isSel ? 'var(--primary)' : 'var(--text-muted)' }}>
                  ({f.farm_name})
                </span>
              </button>
            );
          })}
        </div>

        {selected && si && (
          <>
            {/* KPI Overview Row */}
            <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 24 }}>
              <StatCard
                label="Days Since Planting"
                value={si.daysIn}
                unit="days"
                icon={Clock}
                color="emerald"
                subtitle="Elapsed duration in ground"
              />
              <StatCard
                label="Remaining To Harvest"
                value={si.daysToHarvest}
                unit="days"
                icon={Calendar}
                color="blue"
                subtitle={`Est: ${harvestDate}`}
              />
              <StatCard
                label="Crop Cycle Progress"
                value={si.pct}
                unit="%"
                icon={Activity}
                color="purple"
                trend={`Stage ${si.stageIdx + 1} of 6`}
                subtitle="Full 360-day lifecycle"
              />
              <StatCard
                label="Current Stage Condition"
                value={si.condition}
                unit=""
                icon={Sprout}
                color={si.condition.includes('Stressed') ? 'red' : 'green'}
                subtitle="Moisture & stress index"
              />
            </div>

            {/* Stage Hero Banner */}
            <div
              className="card"
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--border-color)',
                borderLeft: `5px solid ${STAGE_COLORS[si.stageIdx]}`,
                background: 'var(--card-bg)',
                marginBottom: 24
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${STAGE_COLORS[si.stageIdx]}22`, color: STAGE_COLORS[si.stageIdx] }}>
                      ACTIVE STAGE {si.stageIdx + 1} OF 6
                    </span>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {si.stage} Phase
                    </h2>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                    {selected.name} · {selected.sugarcane_variety} · {Number(selected.area).toFixed(1)} Hectares
                  </p>
                </div>

                <Badge variant={si.badge}>{si.condition}</Badge>
              </div>

              {/* Progress Track */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Planting Date: {new Date(selected.planting_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>{si.pct}% Full Canopy Target</span>
                  <span>Estimated Harvest: {harvestDate}</span>
                </div>
                <div style={{ height: 8, borderRadius: 8, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${si.pct}%`, background: STAGE_COLORS[si.stageIdx], transition: 'width 0.8s ease' }} />
                </div>
              </div>
            </div>

            {/* 6-Stage Visual Stepper */}
            <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Sugarcane Agronomic Phenology Pipeline
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {STAGES.map((s, i) => {
                  const isDone = i < si.stageIdx;
                  const isCurrent = i === si.stageIdx;
                  const color = STAGE_COLORS[i];

                  return (
                    <div
                      key={s}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: isCurrent ? 'var(--primary-glow)' : 'var(--bg-secondary)',
                        border: isCurrent ? `2px solid ${color}` : '1px solid var(--border-color)',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: isDone ? '#10b981' : isCurrent ? color : 'var(--bg-tertiary)',
                          color: isDone || isCurrent ? '#ffffff' : 'var(--text-muted)',
                          margin: '0 auto 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13
                        }}
                      >
                        {isDone ? <Check size={16} /> : i + 1}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? color : 'var(--text-primary)', marginBottom: 4 }}>
                        {s}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Day {STAGE_DAYS[i]}+
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Directives & Agronomic Guidelines */}
            {stageInfo && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={16} color="var(--primary)" /> Agronomic Focus: {si.stage}
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {stageInfo.desc}
                  </p>
                  
                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-secondary)', marginBottom: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#0ea5e9', marginBottom: 4 }}>
                      <Droplets size={14} /> WATER REGIME REQUIREMENTS
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {stageInfo.water}
                    </div>
                  </div>

                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                      <Sparkles size={14} /> PRIORITY FIELD OPERATIONS
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {stageInfo.activity}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={16} color="var(--primary)" /> Parcel Specification Dossier
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PARCEL NAME</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selected.name}</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PARENT HOLDING</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selected.farm_name}</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CULTIVAR</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selected.sugarcane_variety}</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PARCEL EXTENT</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{Number(selected.area).toFixed(1)} ha</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>EDAPHIC pH</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{Number(selected.soil_ph).toFixed(1)}</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SOIL MOISTURE</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{Number(selected.soil_moisture).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Phenological Calendar Grid */}
            <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Annual Phenological Calendar</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Projected schedule from initial planting date</span>
                </div>
                <Badge variant="primary">360-Day Crop Cycle</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {STAGES.map((s, i) => {
                  const startDate = selected.planting_date
                    ? new Date(new Date(selected.planting_date).getTime() + STAGE_DAYS[i] * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '—';
                  const endDate = selected.planting_date && i < STAGES.length - 1
                    ? new Date(new Date(selected.planting_date).getTime() + STAGE_DAYS[i+1] * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '—';
                  const status = i < si.stageIdx ? 'Completed' : i === si.stageIdx ? 'Current' : 'Upcoming';
                  const statusVariant = i < si.stageIdx ? 'success' : i === si.stageIdx ? 'primary' : 'neutral';

                  return (
                    <div
                      key={s}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        padding: 14,
                        borderRadius: 12,
                        background: i === si.stageIdx ? 'var(--primary-glow)' : 'var(--bg-secondary)',
                        border: i === si.stageIdx ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[i] }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', minWidth: 120 }}>{s}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{startDate} {i < STAGES.length - 1 ? `→ ${endDate}` : ''}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {STAGE_INFO[s]?.activity}
                      </div>
                      <Badge variant={statusVariant}>{status}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </AppLayout>
  );
}
