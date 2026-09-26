"""
SQLAlchemy Relational Database Models
Implements all 8 required entities:
1. roles
2. users
3. farms
4. fields
5. sugarcane_varieties
6. soil_data
7. weather_data
8. crop_records
Plus predictions, alerts, and password reset tokens.
"""

from datetime import datetime, date
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Date, DateTime, Boolean, Enum, ForeignKey, Index
)
from sqlalchemy.orm import relationship

db = SQLAlchemy()

# -----------------------------------------------------------------------------
# 1. ROLE MODEL
# Roles: Farmer/User, Agricultural Officer, Admin
# -----------------------------------------------------------------------------
class Role(db.Model):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="role_rel")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "display_name": self.display_name,
            "description": self.description
        }


# -----------------------------------------------------------------------------
# 2. USER MODEL
# Password hashing, JWT auth, Role-based access
# -----------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="farmer", nullable=False) # 'farmer','user','officer','admin'
    phone = Column(String(20), nullable=True)
    location = Column(String(200), nullable=True)
    email_verified = Column(Boolean, default=True, nullable=False)
    verification_token = Column(String(64), nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    role_rel = relationship("Role", back_populates="users")
    farms = relationship("Farm", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "role_id": self.role_id,
            "role_title": self.role_rel.display_name if self.role_rel else self.role.title(),
            "phone": self.phone or "",
            "location": self.location or "",
            "email_verified": self.email_verified,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 3. FARM MODEL
# Farm fields: Farm name, Location, Address, Total area
# -----------------------------------------------------------------------------
class Farm(db.Model):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    location = Column(String(200), nullable=False)
    address = Column(String(255), nullable=True)
    district = Column(String(120), nullable=False)
    state = Column(String(120), nullable=False)
    total_area = Column(Numeric(10, 2), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "location": self.location,
            "address": self.address or self.location,
            "district": self.district,
            "state": self.state,
            "total_area": float(self.total_area) if self.total_area else 0.0,
            "latitude": float(self.latitude) if self.latitude else None,
            "longitude": float(self.longitude) if self.longitude else None,
            "fields": [f.to_dict() for f in self.fields] if self.fields else [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 4. SUGARCANE VARIETY MODEL
# Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265
# -----------------------------------------------------------------------------
class SugarcaneVariety(db.Model):
    __tablename__ = "sugarcane_varieties"

    id = Column(Integer, primary_key=True, autoincrement=True)
    variety_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    origin = Column(String(150), nullable=True)
    maturity_type = Column(String(50), nullable=False)
    duration_months = Column(String(50), nullable=False)
    duration_days = Column(Integer, default=360, nullable=False)
    expected_yield_min = Column(Numeric(6, 2), nullable=False)
    expected_yield_max = Column(Numeric(6, 2), nullable=False)
    avg_yield = Column(Numeric(6, 2), nullable=False)
    sucrose_pct = Column(Numeric(4, 2), nullable=False)
    optimal_ph_min = Column(Numeric(4, 2), default=6.0, nullable=False)
    optimal_ph_max = Column(Numeric(4, 2), default=7.5, nullable=False)
    optimal_rainfall_min = Column(Numeric(7, 2), default=1000.0, nullable=False)
    optimal_rainfall_max = Column(Numeric(7, 2), default=1600.0, nullable=False)
    soil_suitability = Column(Text, nullable=False)
    weather_suitability = Column(Text, nullable=False)
    growth_characteristics = Column(Text, nullable=False)
    crop_condition = Column(String(100), default="Normal", nullable=False)
    disease_resistance = Column(Text, nullable=False)
    drought_tolerance = Column(String(50), nullable=False)
    risk_level = Column(String(50), default="Low", nullable=False)
    recommended_states = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "variety_code": self.variety_code,
            "name": self.name,
            "origin": self.origin or "",
            "maturity": self.maturity_type,
            "duration": self.duration_months,
            "duration_days": self.duration_days,
            "expected_yield_min": float(self.expected_yield_min),
            "expected_yield_max": float(self.expected_yield_max),
            "expected_yield": float(self.avg_yield),
            "avg_yield": float(self.avg_yield),
            "max_yield": float(self.expected_yield_max),
            "sucrose": float(self.sucrose_pct),
            "sucrose_pct": float(self.sucrose_pct),
            "soil_suitability": self.soil_suitability,
            "weather_suitability": self.weather_suitability,
            "growth_characteristics": self.growth_characteristics,
            "crop_condition": self.crop_condition,
            "disease": 4 if "High" in self.disease_resistance else 3,
            "drought": 5 if self.drought_tolerance == "High" else 3 if self.drought_tolerance == "Medium" else 2,
            "flood": 3,
            "disease_resistance": self.disease_resistance,
            "drought_tolerance": self.drought_tolerance,
            "risk": self.risk_level,
            "risk_level": self.risk_level,
            "states": [s.strip() for s in (self.recommended_states or "").split(",") if s.strip()],
            "description": self.description or ""
        }


# -----------------------------------------------------------------------------
# 5. FIELD MODEL
# Field information: Field name, Area, Location, Soil type, Soil pH, 
# Soil moisture, Sugarcane variety, Planting date
# -----------------------------------------------------------------------------
class Field(db.Model):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    location = Column(String(200), nullable=False)
    area = Column(Numeric(10, 2), nullable=False)
    soil_type = Column(String(80), nullable=False)
    soil_ph = Column(Numeric(4, 2), nullable=False)
    soil_moisture = Column(Numeric(5, 2), nullable=False)
    sugarcane_variety = Column(String(120), nullable=False, index=True)
    variety_id = Column(Integer, ForeignKey("sugarcane_varieties.id", ondelete="SET NULL"), nullable=True)
    planting_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="fields")
    soil_records = relationship("SoilData", back_populates="field", cascade="all, delete-orphan")
    crop_records = relationship("CropRecord", back_populates="field", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "farm_name": self.farm.name if self.farm else "",
            "name": self.name,
            "location": self.location,
            "area": float(self.area) if self.area else 0.0,
            "soil_type": self.soil_type,
            "soil_ph": float(self.soil_ph) if self.soil_ph else 7.0,
            "soil_moisture": float(self.soil_moisture) if self.soil_moisture else 60.0,
            "sugarcane_variety": self.sugarcane_variety,
            "planting_date": self.planting_date.isoformat() if self.planting_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 6. SOIL DATA MODEL
# Soil Analysis: Soil type, pH, moisture, nutrients if available, health score, suitability, impact
# -----------------------------------------------------------------------------
class SoilData(db.Model):
    __tablename__ = "soil_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="SET NULL"), nullable=True)
    soil_type = Column(String(80), nullable=False)
    soil_ph = Column(Numeric(4, 2), nullable=False)
    soil_moisture = Column(Numeric(5, 2), nullable=False)
    nitrogen_kg_ha = Column(Numeric(6, 2), nullable=True)
    phosphorus_kg_ha = Column(Numeric(6, 2), nullable=True)
    potassium_kg_ha = Column(Numeric(6, 2), nullable=True)
    organic_carbon_pct = Column(Numeric(4, 2), nullable=True)
    electrical_conductivity = Column(Numeric(5, 2), nullable=True)
    soil_health_score = Column(Numeric(5, 2), nullable=False)
    sugarcane_suitability = Column(String(50), nullable=False)
    ph_impact = Column(String(100), nullable=False)
    moisture_impact = Column(String(100), nullable=False)
    soil_impact_summary = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    field = relationship("Field", back_populates="soil_records")

    def to_dict(self):
        return {
            "id": self.id,
            "field_id": self.field_id,
            "field_name": self.field.name if self.field else "",
            "soil_type": self.soil_type,
            "soil_ph": float(self.soil_ph),
            "soil_moisture": float(self.soil_moisture),
            "nitrogen_kg_ha": float(self.nitrogen_kg_ha) if self.nitrogen_kg_ha is not None else None,
            "phosphorus_kg_ha": float(self.phosphorus_kg_ha) if self.phosphorus_kg_ha is not None else None,
            "potassium_kg_ha": float(self.potassium_kg_ha) if self.potassium_kg_ha is not None else None,
            "organic_carbon_pct": float(self.organic_carbon_pct) if self.organic_carbon_pct is not None else None,
            "electrical_conductivity": float(self.electrical_conductivity) if self.electrical_conductivity is not None else None,
            "soil_health_score": float(self.soil_health_score),
            "sugarcane_suitability": self.sugarcane_suitability,
            "ph_impact": self.ph_impact,
            "moisture_impact": self.moisture_impact,
            "soil_impact": self.soil_impact_summary,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None
        }


# -----------------------------------------------------------------------------
# 7. WEATHER DATA MODEL
# Weather Module: Temperature, Rainfall, Humidity, Wind speed, Condition, 
# Forecast, Weather history, Impacts
# -----------------------------------------------------------------------------
class WeatherData(db.Model):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location = Column(String(150), nullable=False, index=True)
    recorded_date = Column(Date, nullable=False, index=True)
    temperature_c = Column(Numeric(5, 2), nullable=False)
    rainfall_mm = Column(Numeric(7, 2), nullable=False)
    humidity_pct = Column(Numeric(5, 2), nullable=False)
    wind_speed_kmh = Column(Numeric(5, 2), nullable=False)
    weather_condition = Column(String(80), nullable=False)
    temperature_impact = Column(String(80), nullable=False)
    rainfall_impact = Column(String(80), nullable=False)
    humidity_impact = Column(String(80), nullable=False)
    overall_weather_risk = Column(String(50), default="Low", nullable=False)
    forecast_json = Column(Text, nullable=True)
    is_forecast = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "location": self.location,
            "recorded_date": self.recorded_date.isoformat(),
            "temperature": float(self.temperature_c),
            "rainfall": float(self.rainfall_mm),
            "humidity": float(self.humidity_pct),
            "wind_speed": float(self.wind_speed_kmh),
            "weather_condition": self.weather_condition,
            "temperature_impact": self.temperature_impact,
            "rainfall_impact": self.rainfall_impact,
            "humidity_impact": self.humidity_impact,
            "overall_weather_risk": self.overall_weather_risk,
            "is_forecast": self.is_forecast
        }


# -----------------------------------------------------------------------------
# 8. CROP RECORDS MODEL
# Crop Information: Growth stage, Planting date, Days since planting, 
# Timeline, Estimated harvest date, Current crop condition
# Stages: 1. Planting, 2. Germination, 3. Tillering, 4. Grand Growth, 5. Maturity, 6. Harvest
# -----------------------------------------------------------------------------
class CropRecord(db.Model):
    __tablename__ = "crop_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    sugarcane_variety = Column(String(120), nullable=False)
    planting_date = Column(Date, nullable=False)
    current_stage = Column(String(50), default="Planting", nullable=False, index=True)
    days_since_planting = Column(Integer, nullable=False)
    expected_growth_timeline_days = Column(Integer, default=360, nullable=False)
    estimated_harvest_date = Column(Date, nullable=False)
    current_crop_condition = Column(String(50), default="Good", nullable=False)
    stage_progress_pct = Column(Numeric(5, 2), default=0.0, nullable=False)
    health_score = Column(Numeric(5, 2), default=85.0, nullable=False)
    water_requirement_level = Column(String(50), default="Medium", nullable=False)
    key_agronomic_activity = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    field = relationship("Field", back_populates="crop_records")

    def to_dict(self):
        return {
            "id": self.id,
            "field_id": self.field_id,
            "sugarcane_variety": self.sugarcane_variety,
            "planting_date": self.planting_date.isoformat(),
            "current_stage": self.current_stage,
            "days_since_planting": self.days_since_planting,
            "expected_growth_timeline_days": self.expected_growth_timeline_days,
            "estimated_harvest_date": self.estimated_harvest_date.isoformat(),
            "current_crop_condition": self.current_crop_condition,
            "stage_progress_pct": float(self.stage_progress_pct),
            "health_score": float(self.health_score),
            "water_requirement_level": self.water_requirement_level,
            "key_agronomic_activity": self.key_agronomic_activity,
            "notes": self.notes or ""
        }


# -----------------------------------------------------------------------------
# 9. PREDICTION MODEL
# -----------------------------------------------------------------------------
class Prediction(db.Model):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True)
    farm_name = Column(String(120), nullable=True)
    field_name = Column(String(120), nullable=True)
    location = Column(String(200), nullable=False)
    variety = Column(String(120), nullable=False)
    area = Column(Numeric(10, 2), nullable=False)
    soil_type = Column(String(80), nullable=False)
    soil_ph = Column(Numeric(4, 2), nullable=False)
    soil_moisture = Column(Numeric(5, 2), nullable=False)
    rainfall = Column(Numeric(10, 2), nullable=False)
    temperature = Column(Numeric(5, 2), nullable=False)
    humidity = Column(Numeric(5, 2), nullable=False)
    predicted_yield = Column(Numeric(10, 2), nullable=False)
    expected_production = Column(Numeric(12, 2), nullable=False)
    confidence = Column(Numeric(5, 2), nullable=False)
    expected_loss = Column(Numeric(5, 2), nullable=False)
    crop_health = Column(String(50), nullable=False)
    factors = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="predictions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "field_id": self.field_id,
            "farm_name": self.farm_name,
            "field_name": self.field_name,
            "location": self.location,
            "variety": self.variety,
            "area": float(self.area),
            "soil_type": self.soil_type,
            "soil_ph": float(self.soil_ph),
            "soil_moisture": float(self.soil_moisture),
            "rainfall": float(self.rainfall),
            "temperature": float(self.temperature),
            "humidity": float(self.humidity),
            "predicted_yield": float(self.predicted_yield),
            "expected_production": float(self.expected_production),
            "confidence": float(self.confidence),
            "expected_loss": float(self.expected_loss),
            "crop_health": self.crop_health,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 10. ALERT MODEL
# -----------------------------------------------------------------------------
class Alert(db.Model):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), default="general", nullable=False)
    severity = Column(String(50), default="info", nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    farm_id = Column(Integer, nullable=True)
    field_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="alerts")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 11. PASSWORD RESET TOKEN MODEL
# -----------------------------------------------------------------------------
class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="reset_tokens")


# -----------------------------------------------------------------------------
# 12. YIELD PREDICTION MODEL (Complete ML Inference Records)
# -----------------------------------------------------------------------------
class YieldPrediction(db.Model):
    __tablename__ = "yield_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="SET NULL"), nullable=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True, index=True)
    location = Column(String(200), nullable=False)
    variety = Column(String(120), nullable=False, index=True)
    area = Column(Numeric(10, 2), nullable=False)
    soil_type = Column(String(80), nullable=False)
    soil_ph = Column(Numeric(4, 2), nullable=False)
    soil_moisture = Column(Numeric(5, 2), nullable=False)
    rainfall = Column(Numeric(10, 2), nullable=False)
    temperature = Column(Numeric(5, 2), nullable=False)
    humidity = Column(Numeric(5, 2), nullable=False)
    planting_date = Column(Date, nullable=False)
    crop_growth_stage = Column(String(50), nullable=False)
    historical_yield = Column(Numeric(10, 2), nullable=False)
    predicted_yield = Column(Numeric(10, 2), nullable=False)
    expected_production = Column(Numeric(12, 2), nullable=False)
    confidence = Column(Numeric(5, 2), nullable=False)
    expected_range_low = Column(Numeric(10, 2), nullable=False)
    expected_range_high = Column(Numeric(10, 2), nullable=False)
    risk_level = Column(String(50), default="Low", nullable=False)
    loss_percentage = Column(Numeric(5, 2), default=0.00, nullable=False)
    expected_loss_tonnes = Column(Numeric(10, 2), default=0.00, nullable=False)
    model_used = Column(String(50), default="Random Forest", nullable=False)
    crop_health = Column(String(50), default="Good", nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="yield_predictions")
    farm = relationship("Farm")
    field = relationship("Field")
    explanation = relationship("PredictionExplanation", back_populates="prediction", uselist=False, cascade="all, delete-orphan")
    history_records = relationship("PredictionHistory", back_populates="prediction", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "farm_id": self.farm_id,
            "farm_name": self.farm.name if self.farm else "",
            "field_id": self.field_id,
            "field_name": self.field.name if self.field else "",
            "location": self.location,
            "variety": self.variety,
            "area": float(self.area),
            "soil_type": self.soil_type,
            "soil_ph": float(self.soil_ph),
            "soil_moisture": float(self.soil_moisture),
            "rainfall": float(self.rainfall),
            "temperature": float(self.temperature),
            "humidity": float(self.humidity),
            "planting_date": self.planting_date.isoformat() if self.planting_date else None,
            "crop_growth_stage": self.crop_growth_stage,
            "historical_yield": float(self.historical_yield),
            "predicted_yield": float(self.predicted_yield),
            "expected_production": float(self.expected_production),
            "confidence": float(self.confidence),
            "expected_range": {
                "low": float(self.expected_range_low),
                "high": float(self.expected_range_high)
            },
            "risk": self.risk_level,
            "risk_level": self.risk_level,
            "loss_percentage": float(self.loss_percentage),
            "expected_loss_pct": float(self.loss_percentage),
            "expected_loss_tonnes": float(self.expected_loss_tonnes),
            "model_used": self.model_used,
            "crop_health": self.crop_health,
            "is_demo": self.is_demo,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 13. PREDICTION HISTORY MODEL
# -----------------------------------------------------------------------------
class PredictionHistory(db.Model):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("yield_predictions.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(Integer, nullable=True)
    field_id = Column(Integer, nullable=True)
    farm_name = Column(String(120), nullable=True)
    field_name = Column(String(120), nullable=True)
    variety = Column(String(120), nullable=False)
    predicted_yield = Column(Numeric(10, 2), nullable=False)
    expected_production = Column(Numeric(12, 2), nullable=False)
    confidence = Column(Numeric(5, 2), nullable=False)
    risk_level = Column(String(50), nullable=False)
    loss_percentage = Column(Numeric(5, 2), nullable=False)
    scenario_name = Column(String(100), default="Current Baseline", nullable=False)
    is_simulation = Column(Boolean, default=False, nullable=False)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    prediction = relationship("YieldPrediction", back_populates="history_records")
    user = relationship("User", backref="prediction_history")

    def to_dict(self):
        import json
        details = {}
        if self.details_json:
            try:
                details = json.loads(self.details_json)
            except Exception:
                pass
        return {
            "id": self.id,
            "prediction_id": self.prediction_id,
            "user_id": self.user_id,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "farm_name": self.farm_name or "N/A",
            "field_name": self.field_name or "N/A",
            "variety": self.variety,
            "predicted_yield": float(self.predicted_yield),
            "expected_production": float(self.expected_production),
            "confidence": float(self.confidence),
            "risk": self.risk_level,
            "risk_level": self.risk_level,
            "loss_percentage": float(self.loss_percentage),
            "scenario_name": self.scenario_name,
            "is_simulation": self.is_simulation,
            "details": details,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 14. PREDICTION EXPLANATIONS MODEL (XAI)
# -----------------------------------------------------------------------------
class PredictionExplanation(db.Model):
    __tablename__ = "prediction_explanations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("yield_predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    feature_importances_json = Column(Text, nullable=True)
    feature_contributions_json = Column(Text, nullable=True)
    positive_factors_json = Column(Text, nullable=True)
    negative_factors_json = Column(Text, nullable=True)
    confidence_reasons_json = Column(Text, nullable=True)
    summary_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    prediction = relationship("YieldPrediction", back_populates="explanation")

    def to_dict(self):
        import json
        def _parse(val):
            if not val:
                return []
            try:
                return json.loads(val)
            except Exception:
                return []

        return {
            "id": self.id,
            "prediction_id": self.prediction_id,
            "feature_importances": _parse(self.feature_importances_json),
            "feature_contributions": _parse(self.feature_contributions_json),
            "positive_factors": _parse(self.positive_factors_json),
            "negative_factors": _parse(self.negative_factors_json),
            "confidence_reasons": _parse(self.confidence_reasons_json),
            "summary": self.summary_explanation or "",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 15. RECOMMENDATION MODEL (AI Advisor & Decision Support)
# -----------------------------------------------------------------------------
class Recommendation(db.Model):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(Integer, nullable=True)
    field_id = Column(Integer, nullable=True)
    category = Column(String(50), default="advisor", nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    priority = Column(String(50), default="medium", nullable=False)
    status = Column(String(50), default="active", nullable=False)
    action_required = Column(String(255), nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="recommendations")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "category": self.category,
            "title": self.title,
            "content": self.content,
            "explanation": self.explanation,
            "priority": self.priority,
            "status": self.status,
            "action_required": self.action_required,
            "is_demo": self.is_demo,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# -----------------------------------------------------------------------------
# 16. MODEL PERFORMANCE MODEL
# -----------------------------------------------------------------------------
class ModelPerformance(db.Model):
    __tablename__ = "model_performance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(80), nullable=False, index=True)
    version = Column(String(50), default="2.0.0", nullable=False)
    mae = Column(Numeric(8, 4), nullable=False)
    rmse = Column(Numeric(8, 4), nullable=False)
    r2_score = Column(Numeric(8, 4), nullable=False)
    cv_score = Column(Numeric(8, 4), nullable=False)
    cv_folds = Column(Integer, default=5, nullable=False)
    n_train_samples = Column(Integer, nullable=False)
    n_test_samples = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    metrics_json = Column(Text, nullable=True)
    feature_importance_json = Column(Text, nullable=True)
    actual_vs_predicted_json = Column(Text, nullable=True)
    residuals_json = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        import json
        def _parse(val):
            if not val:
                return None
            try:
                return json.loads(val)
            except Exception:
                return None

        return {
            "id": self.id,
            "model_name": self.model_name,
            "version": self.version,
            "mae": float(self.mae),
            "rmse": float(self.rmse),
            "r2_score": float(self.r2_score),
            "cv_score": float(self.cv_score),
            "cv_folds": self.cv_folds,
            "n_train_samples": self.n_train_samples,
            "n_test_samples": self.n_test_samples,
            "is_active": self.is_active,
            "metrics": _parse(self.metrics_json),
            "feature_importance": _parse(self.feature_importance_json),
            "actual_vs_predicted": _parse(self.actual_vs_predicted_json),
            "evaluated_at": self.evaluated_at.isoformat() if self.evaluated_at else None
        }


# -----------------------------------------------------------------------------
# 17. REPORT MODEL
# -----------------------------------------------------------------------------
class Report(db.Model):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(Integer, nullable=True)
    field_id = Column(Integer, nullable=True)
    report_type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    parameters_json = Column(Text, nullable=True)
    report_data_json = Column(Text, nullable=True)
    file_format = Column(String(20), default="PDF", nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="reports")

    def to_dict(self):
        import json
        def _parse(val):
            if not val:
                return {}
            try:
                return json.loads(val)
            except Exception:
                return {}

        return {
            "id": self.id,
            "user_id": self.user_id,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "report_type": self.report_type,
            "title": self.title,
            "summary": self.summary or "",
            "parameters": _parse(self.parameters_json),
            "report_data": _parse(self.report_data_json),
            "file_format": self.file_format,
            "download_count": self.download_count,
            "is_demo": self.is_demo,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None
        }

