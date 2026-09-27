import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import {
  Layers,
  Activity,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FlaskConical
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import { useField } from '../context/FieldContext';
import { soilApi } from '../services/api';

function ScoreRing({ score, label, color }) {
  const r = 52, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 120 120" width="130" height="130">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-primary)">
          {score}
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-muted)" letterSpacing="0.05em">
          {label}
        </text>
      </svg>
    </div>
  );
}

export default function SoilPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedField: ctxField, selectField } = useField();
  const [data, setData]         = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    soilApi.getAll().then(r => {
      const d = r.data;
      setData(d);
      if (d?.fields?.length) {
        const queryFieldId = searchParams.get('field_id');
        const matched = queryFieldId
          ? d.fields.find(fld => String(fld.id) === String(queryFieldId))
          : ctxField
          ? d.fields.find(fld => fld.id === ctxField.id)
          : null;
        setSelected(matched || d.fields[0]);
      }
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [searchParams, ctxField]);

  if (loading) {
    return (
      <AppLayout>
        <div className="card" style={{ padding: 48, textAlign: 'center', margin: 40 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading agronomic soil health analysis…</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !data?.fields?.length) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="page-header">
            <div>
              <span className="eyebrow"><Layers size={13} /> Soil Intelligence</span>
              <h1 className="page-title">Soil Analysis & Profiling</h1>
            </div>
          </div>
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Layers size={40} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px' }}>No Field Soil Data Found</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 16px' }}>Add fields with soil parameters to see telemetry here.</p>
            <button className="btn-primary" onClick={() => navigate('/farms')}>Add Field</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const f = selected;
  const healthColor = f?.health_score >= 80 ? '#10b981' : f?.health_score >= 65 ? '#f59e0b' : '#ef4444';

  const radarData = f ? [
    { subject: 'pH Balance',       value: f.health_score >= 80 ? 92 : 62 },
    { subject: 'Moisture Retention', value: Math.min(100, Number(f.soil_moisture) + 10) },
    { subject: 'Agronomic Match',   value: f.suitability === 'Highly Suitable' ? 95 : f.suitability === 'Suitable' ? 78 : 55 },
    { subject: 'Overall Health',   value: f.health_score },
    { subject: 'Buffer Capacity',  value: f.ph_status === 'Optimal' ? 90 : 58 },
  ] : [];

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <span className="eyebrow">
              <Layers size={13} />
              Agronomic Soil Intelligence
            </span>
            <h1 className="page-title">Soil Health & Cane Suitability</h1>
            <p className="page-subtitle">Field-level soil profiling, pH compatibility, moisture holding capacity, and cane cultivar suitability assessment.</p>
          </div>
          {f && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/prediction?farm_id=${f.farm_id}&field_id=${f.id}`)}
            >
              <Sparkles size={16} />
              <span>Predict Yield for {f.name}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Summary Metrics */}
        {data.summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard
              icon={FlaskConical}
              label="Avg Health Score"
              value={`${data.summary.avg_health_score}/100`}
              color="#10b981"
              subtitle="Composite index score"
            />
            <StatCard
              icon={ShieldCheck}
              label="Health Status"
              value={data.summary.health_label}
              color="#059669"
              subtitle="Agronomic baseline rating"
            />
            <StatCard
              icon={CheckCircle2}
              label="Optimal Fields"
              value={data.summary.excellent_count}
              color="#0ea5e9"
              subtitle="High sucrose retention capacity"
            />
            <StatCard
              icon={AlertTriangle}
              label="Needs Attention"
              value={data.summary.needs_attention}
              color={data.summary.needs_attention > 0 ? '#ef4444' : '#10b981'}
              subtitle="pH or moisture adjustments"
            />
          </div>
        )}

        {/* Field Selection Strip */}
        <div className="card" style={{ padding: '12px 18px', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Select Monitored Field Plot:
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {data.fields.map(field => {
              const active = selected?.id === field.id;
              return (
                <button
                  key={field.id}
                  className={`btn ${active ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setSelected(field); selectField(field.id); }}
                  style={{ padding: '8px 14px', fontSize: 13 }}
                >
                  <Layers size={14} />
                  <span>{field.name}</span>
                  <small style={{ opacity: 0.8, fontSize: 11 }}>({field.farm_name})</small>
                </button>
              );
            })}
          </div>
        </div>

        {f && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Soil Profile Panel */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{f.name} — Physicochemical Profile</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.farm_name}</span>
                </div>
                <Badge variant={f.health_label?.toLowerCase() === 'excellent' ? 'success' : 'warning'}>
                  {f.health_label} Health
                </Badge>
              </div>

              {/* Soil Overview Box */}
              <div style={{ background: 'var(--border-subtle)', padding: '14px 18px', borderRadius: 12, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{f.soil_type}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Cane Suitability: <strong style={{ color: 'var(--primary)' }}>{f.suitability}</strong>
                  </div>
                </div>
              </div>

              {/* 6 Key Soil Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'Soil pH', value: Number(f.soil_ph).toFixed(1), color: f.ph_status === 'Optimal' ? '#10b981' : '#f59e0b' },
                  { label: 'Moisture', value: `${Number(f.soil_moisture).toFixed(0)}%`, color: '#0ea5e9' },
                  { label: 'Health Score', value: `${f.health_score}/100`, color: healthColor },
                  { label: 'pH Status', value: f.ph_status, color: f.ph_status === 'Optimal' ? '#10b981' : '#f59e0b' },
                  { label: 'Moisture Status', value: f.moisture_status, color: '#0ea5e9' },
                  { label: 'Suitability', value: f.suitability, color: '#10b981' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg-panel)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Score Breakdown Progress Bars */}
              {f.score_breakdown && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Score Contribution Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(f.score_breakdown).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5 }}>
                        <span style={{ width: 110, color: 'var(--text-muted)' }}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                          <div style={{ width: `${(v / 25) * 100}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}/25</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Radar + Score Ring */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Soil Health Diagnostic Ring</h3>
                <Badge variant="success">Radial Evaluation</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <ScoreRing score={f.health_score} label="HEALTH INDEX" color={healthColor} />
                <ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(226, 232, 240, 0.6)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <Radar name="Soil" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* pH Guide Section */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>pH Reference Standards for Sugarcane Growth</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { range: '< 5.5',   label: 'Strongly Acidic', note: 'Agricultural lime required — toxicity risk', color: '#ef4444' },
              { range: '5.5–6.0', label: 'Moderately Acidic', note: 'Apply agricultural lime — reduced uptake',  color: '#f59e0b' },
              { range: '6.0–7.5', label: 'Optimal Range',    note: 'Ideal standard for Indian cane varieties',  color: '#10b981' },
              { range: '7.5–8.0', label: 'Slightly Alkaline',note: 'Minor impact — monitor micronutrients',   color: '#f59e0b' },
              { range: '> 8.0',   label: 'Alkaline Calcareous', note: 'Gypsum / elemental sulfur indicated',     color: '#ef4444' },
            ].map(p => (
              <div key={p.range} style={{ background: 'var(--bg-panel)', padding: 14, borderRadius: 12, border: '1px solid var(--border)', borderTop: `4px solid ${p.color}` }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: p.color }}>{p.range}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '3px 0' }}>{p.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{p.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
