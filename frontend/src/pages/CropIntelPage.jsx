import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { farmApi } from '../services/api';

const STAGES = ['Planting','Germination','Tillering','Grand Growth','Maturity','Harvest'];
const STAGE_DAYS  = [0, 30, 60, 120, 270, 360];
const STAGE_COLORS = ['#6366f1','#0ea5e9','#f59e0b','#16a34a','#ea580c','#2d7a3e'];

const STAGE_INFO = {
  Planting:     { desc:'Sett preparation, furrow placement, and initial irrigation.', water:'High', activity:'Select disease-free setts, apply basal NPK dose, ensure proper spacing.' },
  Germination:  { desc:'Bud sprouting, primary shoot emergence, and initial root establishment.', water:'High', activity:'Maintain soil moisture, inspect germination percentage, gap-filling.' },
  Tillering:    { desc:'Secondary and tertiary shoots emerging from primary stalks.', water:'Medium', activity:'First nitrogen top-dressing, earthing-up, weed management.' },
  'Grand Growth':{ desc:'Rapid stalk elongation and peak leaf area accumulation.', water:'Very High', activity:'Scheduled furrow irrigation, second potassium dose, stem borer scouting.' },
  Maturity:     { desc:'Sugar synthesis and storage in stalk internodes.', water:'Low', activity:'Withhold excess irrigation 25 days before harvest to build sucrose.' },
  Harvest:      { desc:'Crop at peak commercial cane sugar (CCS) ready for harvest.', water:'None', activity:'Ground-level cutting, rapid transport to mill within 24 hours.' },
};

export default function CropIntelPage() {
  const [farms, setFarms]     = useState([]);
  const [fields, setFields]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    farmApi.list().then(r => {
      const all = r.data?.farms || [];
      setFarms(all);
      const allFields = all.flatMap(f => (f.fields||[]).map(fld => ({ ...fld, farm_name: f.name })));
      setFields(allFields);
      if (allFields.length) setSelected(allFields[0]);
    }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, []);

  function getStageInfo(plantingDate, moisture = 65) {
    if (!plantingDate) return { stageIdx: 0, daysIn: 0, daysToHarvest: 360, pct: 0, condition: 'Good', stage: STAGES[0] };
    const days = Math.floor((Date.now() - new Date(plantingDate)) / 86400000);
    let stageIdx = 0;
    for (let i = STAGE_DAYS.length - 1; i >= 0; i--) {
      if (days >= STAGE_DAYS[i]) { stageIdx = i; break; }
    }
    stageIdx = Math.min(stageIdx, STAGES.length - 1);
    const daysToHarvest = Math.max(0, 360 - days);
    const pct = Math.min(Math.round((days / 360) * 100), 100);

    let condition = 'Good';
    if (moisture < 45) condition = 'Stressed';
    else if (moisture >= 60 && moisture <= 75) condition = 'Excellent';
    else if (moisture > 80) condition = 'Normal';

    return { stageIdx, daysIn: days, daysToHarvest, pct, condition, stage: STAGES[stageIdx] };
  }

  const si = selected ? getStageInfo(selected.planting_date, Number(selected.soil_moisture)) : null;
  const stageInfo = si ? STAGE_INFO[si.stage] : null;
  const harvestDate = selected?.planting_date
    ? new Date(new Date(selected.planting_date).getTime() + 360 * 86400000).toLocaleDateString('en-IN', { dateStyle: 'medium' })
    : '—';

  if (loading) return <AppLayout><div className="page-loading-center"><div className="loading-spinner" /><p>Loading crop intelligence…</p></div></AppLayout>;

  if (!fields.length) return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header"><div><p className="eyebrow">Crop Intelligence</p><h1 className="page-title">Crop Growth Tracker</h1></div></div>
        <div className="empty-page-state">
          <div className="eps-icon">🌿</div>
          <h2>No Fields Found</h2>
          <p>Add fields with planting dates to track crop growth stages.</p>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Crop Intelligence</p>
            <h1 className="page-title">Crop Growth Tracker</h1>
            <p className="page-subtitle">Monitor growth stages, track days, and plan activities for each field.</p>
          </div>
        </div>

        {/* Field selector */}
        <div className="profile-selector">
          {fields.map(f => (
            <button key={f.id} className={`profile-btn ${selected?.id===f.id?'profile-btn-active':''}`} onClick={() => setSelected(f)}>
              🌿 {f.name} <span className="profile-btn-sub">{f.farm_name}</span>
            </button>
          ))}
        </div>

        {selected && si && (
          <>
            {/* Current stage hero */}
            <div className="crop-stage-hero" style={{ borderLeft: `4px solid ${STAGE_COLORS[si.stageIdx]}` }}>
              <div className="csh-main">
                <div className="csh-stage-badge" style={{ background:`${STAGE_COLORS[si.stageIdx]}18`, color:STAGE_COLORS[si.stageIdx] }}>
                  {si.stage}
                </div>
                <div className="csh-stats">
                  <div className="csh-stat"><span className="csh-val">{si.daysIn}</span><span className="csh-label">Days Since Planting</span></div>
                  <div className="csh-stat"><span className="csh-val">{si.daysToHarvest}</span><span className="csh-label">Days to Harvest</span></div>
                  <div className="csh-stat"><span className="csh-val">{si.pct}%</span><span className="csh-label">Crop Progress</span></div>
                  <div className="csh-stat"><span className="csh-val">{si.condition}</span><span className="csh-label">Current Condition</span></div>
                  <div className="csh-stat"><span className="csh-val">{harvestDate}</span><span className="csh-label">Est. Harvest</span></div>
                </div>
              </div>
              <div className="csh-progress-bar">
                <div className="csh-fill" style={{ width:`${si.pct}%`, background:STAGE_COLORS[si.stageIdx] }} />
              </div>
            </div>

            {/* Stage pipeline */}
            <div className="dash-panel">
              <div className="dash-panel-header"><h3>Growth Stage Timeline</h3></div>
              <div className="stage-pipeline">
                {STAGES.map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`sp-stage ${i < si.stageIdx ? 'sp-done' : i === si.stageIdx ? 'sp-active' : 'sp-future'}`} style={i<=si.stageIdx?{'--sp-color':STAGE_COLORS[i]}:{}}>
                      <div className="sp-circle">
                        {i < si.stageIdx ? '✓' : i === si.stageIdx ? '●' : i+1}
                      </div>
                      <span className="sp-label">{s}</span>
                      <span className="sp-days">{STAGE_DAYS[i]}+ days</span>
                    </div>
                    {i < STAGES.length - 1 && <div className={`sp-line ${i < si.stageIdx ? 'sp-line-done' : ''}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Current stage details */}
            {stageInfo && (
              <div className="dash-two-col">
                <div className="dash-panel">
                  <div className="dash-panel-header"><h3>Current Stage: {si.stage}</h3></div>
                  <p style={{ fontSize:14, color:'#374151', lineHeight:1.6, marginBottom:16 }}>{stageInfo.desc}</p>
                  <div className="stage-detail-items">
                    <div className="sdi"><span className="sdi-icon">💧</span><div><strong>Water Requirement</strong><p>{stageInfo.water}</p></div></div>
                    <div className="sdi"><span className="sdi-icon">🌾</span><div><strong>Key Activities</strong><p>{stageInfo.activity}</p></div></div>
                  </div>
                </div>

                <div className="dash-panel">
                  <div className="dash-panel-header"><h3>Field Information</h3></div>
                  <div className="field-info-grid">
                    {[
                      ['Field Name',      selected.name],
                      ['Farm',            selected.farm_name],
                      ['Area',            `${Number(selected.area).toFixed(1)} ha`],
                      ['Variety',         selected.sugarcane_variety],
                      ['Planting Date',   selected.planting_date ? new Date(selected.planting_date).toLocaleDateString('en-IN') : '—'],
                      ['Soil Type',       selected.soil_type],
                      ['Soil pH',         Number(selected.soil_ph).toFixed(1)],
                      ['Soil Moisture',   `${Number(selected.soil_moisture).toFixed(0)}%`],
                    ].map(([k,v]) => (
                      <div key={k} className="fi-row"><span className="fi-key">{k}</span><span className="fi-val">{v}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All stages calendar */}
            <div className="dash-panel">
              <div className="dash-panel-header"><h3>Crop Growth Calendar</h3></div>
              <div className="crop-calendar">
                {STAGES.map((s, i) => {
                  const startDate = selected.planting_date
                    ? new Date(new Date(selected.planting_date).getTime() + STAGE_DAYS[i] * 86400000).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
                    : '—';
                  const endDate = selected.planting_date && i < STAGES.length - 1
                    ? new Date(new Date(selected.planting_date).getTime() + STAGE_DAYS[i+1] * 86400000).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
                    : '—';
                  const status = i < si.stageIdx ? 'completed' : i === si.stageIdx ? 'current' : 'upcoming';
                  return (
                    <div key={s} className={`cal-row cal-${status}`} style={{ '--cal-color': STAGE_COLORS[i] }}>
                      <div className="cal-stage-dot" />
                      <div className="cal-stage-name">{s}</div>
                      <div className="cal-dates">{startDate} {i < STAGES.length-1 ? `→ ${endDate}` : ''}</div>
                      <div className="cal-desc">{STAGE_INFO[s]?.activity.slice(0,50)}…</div>
                      <span className={`cal-status cal-status-${status}`}>{status}</span>
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
