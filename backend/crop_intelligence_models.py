"""Persistence models for the independent crop growth monitoring module."""

from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint

from backend.models import UnsignedInt, db


class CropCycle(db.Model):
    __tablename__ = "crop_intelligence_cycles"
    __table_args__ = (Index("ix_crop_cycle_owner_field", "user_id", "field_id", "status"),)

    id = Column(Integer, primary_key=True)
    # The existing application tables use unsigned MySQL integer keys.
    user_id = Column(UnsignedInt, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(UnsignedInt, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(UnsignedInt, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    variety_code = Column(String(120), nullable=False, index=True)
    planting_date = Column(Date, nullable=False, index=True)
    planting_system = Column(String(80), nullable=True)
    season = Column(String(80), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(24), nullable=False, default="active", index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropVarietyReference(db.Model):
    __tablename__ = "crop_variety_references"

    id = Column(Integer, primary_key=True)
    variety_code = Column(String(120), nullable=False, unique=True, index=True)
    profile_json = Column(Text, nullable=False)
    updated_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropStageReference(db.Model):
    __tablename__ = "crop_stage_references"

    id = Column(Integer, primary_key=True)
    stage_key = Column(String(40), nullable=False, unique=True, index=True)
    stage_json = Column(Text, nullable=False)
    updated_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropMitigationStrategy(db.Model):
    __tablename__ = "crop_mitigation_strategies"

    id = Column(Integer, primary_key=True)
    strategy_key = Column(String(80), nullable=False, unique=True, index=True)
    strategy_json = Column(Text, nullable=False)
    updated_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropObservation(db.Model):
    __tablename__ = "crop_intelligence_observations"
    __table_args__ = (
        UniqueConstraint("cycle_id", "observation_date", name="uq_crop_observation_cycle_date"),
        Index("ix_crop_observation_cycle_date", "cycle_id", "observation_date"),
    )

    id = Column(Integer, primary_key=True)
    cycle_id = Column(Integer, ForeignKey("crop_intelligence_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    observation_date = Column(Date, nullable=False)
    dap = Column(Integer, nullable=False)
    plant_height_cm = Column(Float, nullable=True)
    tiller_count = Column(Integer, nullable=True)
    measurement_area_m2 = Column(Float, nullable=True)
    establishment_pct = Column(Float, nullable=True)
    leaf_condition = Column(String(40), nullable=True)
    leaf_symptoms = Column(Text, nullable=True)
    soil_moisture_pct = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    irrigation_activity = Column(Text, nullable=True)
    pest_symptoms = Column(Text, nullable=True)
    disease_symptoms = Column(Text, nullable=True)
    soil_or_drainage = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    photo_path = Column(String(255), nullable=True)
    source = Column(String(20), nullable=False, default="manual")
    created_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropObservationRevision(db.Model):
    __tablename__ = "crop_observation_revisions"

    id = Column(Integer, primary_key=True)
    observation_id = Column(Integer, ForeignKey("crop_intelligence_observations.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    snapshot_json = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CropComparison(db.Model):
    __tablename__ = "crop_growth_comparisons"
    __table_args__ = (UniqueConstraint("observation_id", "metric", name="uq_crop_comparison_observation_metric"),)

    id = Column(Integer, primary_key=True)
    observation_id = Column(Integer, ForeignKey("crop_intelligence_observations.id", ondelete="CASCADE"), nullable=False, index=True)
    metric = Column(String(80), nullable=False)
    actual_value = Column(Float, nullable=True)
    unit = Column(String(32), nullable=True)
    reference_status = Column(String(32), nullable=False)
    reference_json = Column(Text, nullable=True)
    explanation = Column(Text, nullable=False)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropRecommendation(db.Model):
    __tablename__ = "crop_intelligence_recommendations"

    id = Column(Integer, primary_key=True)
    cycle_id = Column(Integer, ForeignKey("crop_intelligence_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    observation_id = Column(Integer, ForeignKey("crop_intelligence_observations.id", ondelete="SET NULL"), nullable=True, index=True)
    recommendation_key = Column(String(120), nullable=False, index=True)
    recommendation_json = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CropActivity(db.Model):
    __tablename__ = "crop_intelligence_activities"
    __table_args__ = (Index("ix_crop_activity_cycle_date", "cycle_id", "activity_date"),)

    id = Column(Integer, primary_key=True)
    cycle_id = Column(Integer, ForeignKey("crop_intelligence_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_date = Column(Date, nullable=False, index=True)
    activity_type = Column(String(40), nullable=False)
    details = Column(Text, nullable=False)
    amount = Column(Float, nullable=True)
    amount_unit = Column(String(32), nullable=True)
    created_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CropTask(db.Model):
    __tablename__ = "crop_intelligence_tasks"
    __table_args__ = (
        UniqueConstraint("cycle_id", "idempotency_key", name="uq_crop_task_idempotency"),
        Index("ix_crop_task_cycle_due", "cycle_id", "due_date"),
    )

    id = Column(Integer, primary_key=True)
    cycle_id = Column(Integer, ForeignKey("crop_intelligence_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    idempotency_key = Column(String(180), nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    title = Column(String(180), nullable=False)
    category = Column(String(40), nullable=False, default="scouting")
    details = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False, default="normal")
    status = Column(String(20), nullable=False, default="pending", index=True)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropTaskEvent(db.Model):
    __tablename__ = "crop_task_events"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("crop_intelligence_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CropAlert(db.Model):
    __tablename__ = "crop_intelligence_alerts"
    __table_args__ = (Index("ix_crop_alert_cycle_status", "cycle_id", "status"),)

    id = Column(Integer, primary_key=True)
    cycle_id = Column(Integer, ForeignKey("crop_intelligence_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    observation_id = Column(Integer, ForeignKey("crop_intelligence_observations.id", ondelete="SET NULL"), nullable=True, index=True)
    rule_key = Column(String(80), nullable=False)
    indicator = Column(String(80), nullable=False)
    observed_value = Column(Text, nullable=True)
    reference_value = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False)
    evidence = Column(Text, nullable=False)
    possible_explanations_json = Column(Text, nullable=False)
    investigate_json = Column(Text, nullable=False)
    mitigation_json = Column(Text, nullable=False)
    follow_up_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="new", index=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CropAlertEvent(db.Model):
    __tablename__ = "crop_alert_events"

    id = Column(Integer, primary_key=True)
    alert_id = Column(Integer, ForeignKey("crop_intelligence_alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CropImport(db.Model):
    __tablename__ = "crop_intelligence_imports"
    __table_args__ = (UniqueConstraint("cycle_id", "file_sha256", name="uq_crop_import_hash"),)

    id = Column(Integer, primary_key=True)
    cycle_id = Column(Integer, ForeignKey("crop_intelligence_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    file_sha256 = Column(String(64), nullable=False)
    filename = Column(String(255), nullable=False)
    imported_rows = Column(Integer, nullable=False, default=0)
    rejected_rows = Column(Integer, nullable=False, default=0)
    summary_json = Column(Text, nullable=False)
    created_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CropProgressReport(db.Model):
    __tablename__ = "crop_intelligence_reports"
    __table_args__ = (UniqueConstraint("cycle_id", "checkpoint_day", name="uq_crop_report_checkpoint"),)

    id = Column(Integer, primary_key=True)
    cycle_id = Column(Integer, ForeignKey("crop_intelligence_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    checkpoint_day = Column(Integer, nullable=False)
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    report_json = Column(Text, nullable=False)
    generated_by = Column(UnsignedInt, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
