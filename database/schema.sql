-- ============================================================================
-- Sugarcane Yield Forecasting & Smart Agricultural Decision Support System
-- PART 1: Core Relational Database Schema
-- Database: MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `majorlogin` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `majorlogin`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. ROLES TABLE
-- Roles: Farmer/User, Agricultural Officer, Admin
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'farmer, officer, admin',
  `display_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. USERS TABLE
-- User management with password hashing and role-based access
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` INT UNSIGNED NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('farmer','user','officer','admin') NOT NULL DEFAULT 'farmer',
  `phone` VARCHAR(20) NULL,
  `location` VARCHAR(200) NULL,
  `email_verified` TINYINT(1) NOT NULL DEFAULT 1,
  `verification_token` VARCHAR(64) NULL,
  `verification_token_expires` DATETIME NULL,
  `status` ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_role_id` (`role_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. FARMS TABLE
-- Farm Management: Farm name, Location, Address, Total area
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `farms` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `location` VARCHAR(200) NOT NULL,
  `address` VARCHAR(255) NULL,
  `district` VARCHAR(120) NOT NULL,
  `state` VARCHAR(120) NOT NULL,
  `total_area` DECIMAL(10, 2) NOT NULL COMMENT 'Area in hectares',
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_farms_user_id` (`user_id`),
  INDEX `idx_farms_state_district` (`state`, `district`),
  CONSTRAINT `fk_farms_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. SUGARCANE VARIETIES TABLE
-- Supporting Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sugarcane_varieties` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variety_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `origin` VARCHAR(150) NULL,
  `maturity_type` VARCHAR(50) NOT NULL COMMENT 'Early, Mid-Late, etc.',
  `duration_months` VARCHAR(50) NOT NULL COMMENT 'e.g. 10-12 months',
  `duration_days` INT UNSIGNED NOT NULL DEFAULT 360,
  `expected_yield_min` DECIMAL(6, 2) NOT NULL,
  `expected_yield_max` DECIMAL(6, 2) NOT NULL,
  `avg_yield` DECIMAL(6, 2) NOT NULL,
  `sucrose_pct` DECIMAL(4, 2) NOT NULL,
  `optimal_ph_min` DECIMAL(4, 2) NOT NULL DEFAULT 6.0,
  `optimal_ph_max` DECIMAL(4, 2) NOT NULL DEFAULT 7.5,
  `optimal_rainfall_min` DECIMAL(7, 2) NOT NULL DEFAULT 1000.0,
  `optimal_rainfall_max` DECIMAL(7, 2) NOT NULL DEFAULT 1600.0,
  `soil_suitability` TEXT NOT NULL,
  `weather_suitability` TEXT NOT NULL,
  `growth_characteristics` TEXT NOT NULL,
  `crop_condition` VARCHAR(100) NOT NULL DEFAULT 'Normal',
  `disease_resistance` TEXT NOT NULL,
  `drought_tolerance` VARCHAR(50) NOT NULL,
  `risk_level` ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
  `recommended_states` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_varieties_code` (`variety_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. FIELDS TABLE
-- Field Management: Field name, Area, Location, Soil type, Soil pH, 
-- Soil moisture, Sugarcane variety, Planting date
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fields` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `farm_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `location` VARCHAR(200) NOT NULL,
  `area` DECIMAL(10, 2) NOT NULL COMMENT 'Area in hectares',
  `soil_type` VARCHAR(80) NOT NULL,
  `soil_ph` DECIMAL(4, 2) NOT NULL,
  `soil_moisture` DECIMAL(5, 2) NOT NULL,
  `sugarcane_variety` VARCHAR(120) NOT NULL,
  `variety_id` INT UNSIGNED NULL,
  `planting_date` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_fields_farm_id` (`farm_id`),
  INDEX `idx_fields_variety` (`sugarcane_variety`),
  INDEX `idx_fields_planting_date` (`planting_date`),
  CONSTRAINT `fk_fields_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fields_variety` FOREIGN KEY (`variety_id`) REFERENCES `sugarcane_varieties` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. SOIL DATA TABLE
-- Soil Analysis: Soil type, pH, moisture, nutrients if available, 
-- health score, suitability, impact
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `soil_data` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `field_id` INT UNSIGNED NOT NULL,
  `farm_id` INT UNSIGNED NULL,
  `soil_type` VARCHAR(80) NOT NULL,
  `soil_ph` DECIMAL(4, 2) NOT NULL,
  `soil_moisture` DECIMAL(5, 2) NOT NULL,
  `nitrogen_kg_ha` DECIMAL(6, 2) NULL COMMENT 'Available Nitrogen (kg/ha) if tested',
  `phosphorus_kg_ha` DECIMAL(6, 2) NULL COMMENT 'Available Phosphorus (kg/ha) if tested',
  `potassium_kg_ha` DECIMAL(6, 2) NULL COMMENT 'Available Potassium (kg/ha) if tested',
  `organic_carbon_pct` DECIMAL(4, 2) NULL COMMENT 'Organic Carbon (%) if tested',
  `electrical_conductivity` DECIMAL(5, 2) NULL COMMENT 'EC dS/m if tested',
  `soil_health_score` DECIMAL(5, 2) NOT NULL COMMENT 'Calculated health score 0-100',
  `sugarcane_suitability` VARCHAR(50) NOT NULL COMMENT 'Highly Suitable, Suitable, Moderate, Poor',
  `ph_impact` VARCHAR(100) NOT NULL,
  `moisture_impact` VARCHAR(100) NOT NULL,
  `soil_impact_summary` TEXT NULL,
  `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_soil_field_id` (`field_id`),
  INDEX `idx_soil_farm_id` (`farm_id`),
  CONSTRAINT `fk_soil_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_soil_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. WEATHER DATA TABLE
-- Weather Module: Temperature, Rainfall, Humidity, Wind speed, Condition, 
-- Forecast, Weather history, Impact assessments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `weather_data` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `location` VARCHAR(150) NOT NULL,
  `recorded_date` DATE NOT NULL,
  `temperature_c` DECIMAL(5, 2) NOT NULL,
  `rainfall_mm` DECIMAL(7, 2) NOT NULL,
  `humidity_pct` DECIMAL(5, 2) NOT NULL,
  `wind_speed_kmh` DECIMAL(5, 2) NOT NULL,
  `weather_condition` VARCHAR(80) NOT NULL,
  `temperature_impact` VARCHAR(80) NOT NULL,
  `rainfall_impact` VARCHAR(80) NOT NULL,
  `humidity_impact` VARCHAR(80) NOT NULL,
  `overall_weather_risk` ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Low',
  `forecast_json` TEXT NULL,
  `is_forecast` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_weather_loc_date` (`location`, `recorded_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. CROP RECORDS TABLE
-- Crop Information: Growth stage, Planting date, Days since planting, 
-- Timeline, Estimated harvest date, Crop condition
-- Stages: 1. Planting, 2. Germination, 3. Tillering, 4. Grand Growth, 5. Maturity, 6. Harvest
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `crop_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `field_id` INT UNSIGNED NOT NULL,
  `sugarcane_variety` VARCHAR(120) NOT NULL,
  `planting_date` DATE NOT NULL,
  `current_stage` ENUM('Planting','Germination','Tillering','Grand Growth','Maturity','Harvest') NOT NULL DEFAULT 'Planting',
  `days_since_planting` INT UNSIGNED NOT NULL,
  `expected_growth_timeline_days` INT UNSIGNED NOT NULL DEFAULT 360,
  `estimated_harvest_date` DATE NOT NULL,
  `current_crop_condition` ENUM('Excellent','Good','Normal','Stressed','Severe Stress') NOT NULL DEFAULT 'Good',
  `stage_progress_pct` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `health_score` DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
  `water_requirement_level` VARCHAR(50) NOT NULL DEFAULT 'Medium',
  `key_agronomic_activity` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_crop_records_field_id` (`field_id`),
  INDEX `idx_crop_records_stage` (`current_stage`),
  CONSTRAINT `fk_crop_records_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. PREDICTIONS TABLE (Preserved & Enhanced)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `predictions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `field_id` INT UNSIGNED NULL,
  `farm_name` VARCHAR(120) NULL,
  `field_name` VARCHAR(120) NULL,
  `location` VARCHAR(200) NOT NULL,
  `variety` VARCHAR(120) NOT NULL,
  `area` DECIMAL(10, 2) NOT NULL,
  `soil_type` VARCHAR(80) NOT NULL,
  `soil_ph` DECIMAL(4, 2) NOT NULL,
  `soil_moisture` DECIMAL(5, 2) NOT NULL,
  `rainfall` DECIMAL(10, 2) NOT NULL,
  `temperature` DECIMAL(5, 2) NOT NULL,
  `humidity` DECIMAL(5, 2) NOT NULL,
  `predicted_yield` DECIMAL(10, 2) NOT NULL,
  `expected_production` DECIMAL(12, 2) NOT NULL,
  `confidence` DECIMAL(5, 2) NOT NULL,
  `expected_loss` DECIMAL(5, 2) NOT NULL,
  `crop_health` VARCHAR(50) NOT NULL,
  `factors` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_predictions_user_id` (`user_id`),
  INDEX `idx_predictions_field_id` (`field_id`),
  CONSTRAINT `fk_predictions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_predictions_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. ALERTS TABLE (Preserved & Enhanced)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `type` ENUM('weather','soil','yield','pest','irrigation','general') NOT NULL DEFAULT 'general',
  `severity` ENUM('info','low','medium','high','critical') NOT NULL DEFAULT 'info',
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `farm_id` INT UNSIGNED NULL,
  `field_id` INT UNSIGNED NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_alerts_user_id` (`user_id`),
  CONSTRAINT `fk_alerts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. PASSWORD RESET TOKENS (Preserved)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_prt_user_id` (`user_id`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. YIELD PREDICTIONS TABLE (Advanced Complete System)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `yield_predictions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `farm_id` INT UNSIGNED NULL,
  `field_id` INT UNSIGNED NULL,
  `location` VARCHAR(200) NOT NULL,
  `variety` VARCHAR(120) NOT NULL,
  `area` DECIMAL(10, 2) NOT NULL,
  `soil_type` VARCHAR(80) NOT NULL,
  `soil_ph` DECIMAL(4, 2) NOT NULL,
  `soil_moisture` DECIMAL(5, 2) NOT NULL,
  `rainfall` DECIMAL(10, 2) NOT NULL,
  `temperature` DECIMAL(5, 2) NOT NULL,
  `humidity` DECIMAL(5, 2) NOT NULL,
  `planting_date` DATE NOT NULL,
  `crop_growth_stage` VARCHAR(50) NOT NULL,
  `historical_yield` DECIMAL(10, 2) NOT NULL,
  `predicted_yield` DECIMAL(10, 2) NOT NULL,
  `expected_production` DECIMAL(12, 2) NOT NULL,
  `confidence` DECIMAL(5, 2) NOT NULL,
  `expected_range_low` DECIMAL(10, 2) NOT NULL,
  `expected_range_high` DECIMAL(10, 2) NOT NULL,
  `risk_level` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
  `loss_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `expected_loss_tonnes` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `model_used` VARCHAR(50) NOT NULL DEFAULT 'Random Forest',
  `crop_health` VARCHAR(50) NOT NULL DEFAULT 'Good',
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_yp_user` (`user_id`),
  INDEX `idx_yp_farm` (`farm_id`),
  INDEX `idx_yp_field` (`field_id`),
  INDEX `idx_yp_variety` (`variety`),
  INDEX `idx_yp_date` (`created_at`),
  CONSTRAINT `fk_yp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_yp_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_yp_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. PREDICTION HISTORY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prediction_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prediction_id` INT UNSIGNED NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `farm_id` INT UNSIGNED NULL,
  `field_id` INT UNSIGNED NULL,
  `farm_name` VARCHAR(120) NULL,
  `field_name` VARCHAR(120) NULL,
  `variety` VARCHAR(120) NOT NULL,
  `predicted_yield` DECIMAL(10, 2) NOT NULL,
  `expected_production` DECIMAL(12, 2) NOT NULL,
  `confidence` DECIMAL(5, 2) NOT NULL,
  `risk_level` VARCHAR(50) NOT NULL,
  `loss_percentage` DECIMAL(5, 2) NOT NULL,
  `scenario_name` VARCHAR(100) NOT NULL DEFAULT 'Current Baseline',
  `is_simulation` TINYINT(1) NOT NULL DEFAULT 0,
  `details_json` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ph_user` (`user_id`),
  INDEX `idx_ph_pred` (`prediction_id`),
  CONSTRAINT `fk_ph_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ph_pred` FOREIGN KEY (`prediction_id`) REFERENCES `yield_predictions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. PREDICTION EXPLANATIONS TABLE (Explainable AI - XAI)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prediction_explanations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prediction_id` INT UNSIGNED NOT NULL,
  `feature_importances_json` TEXT NULL,
  `feature_contributions_json` TEXT NULL,
  `positive_factors_json` TEXT NULL,
  `negative_factors_json` TEXT NULL,
  `confidence_reasons_json` TEXT NULL,
  `summary_explanation` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_pe_pred` (`prediction_id`),
  CONSTRAINT `fk_pe_pred` FOREIGN KEY (`prediction_id`) REFERENCES `yield_predictions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. RECOMMENDATIONS TABLE (AI Farm Advisor & Decision Support)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recommendations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `farm_id` INT UNSIGNED NULL,
  `field_id` INT UNSIGNED NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'advisor',
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `explanation` TEXT NULL,
  `priority` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `action_required` VARCHAR(255) NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_rec_user` (`user_id`),
  INDEX `idx_rec_category` (`category`),
  CONSTRAINT `fk_rec_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. MODEL PERFORMANCE TABLE (RF vs XGBoost metrics)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `model_performance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `model_name` VARCHAR(80) NOT NULL,
  `version` VARCHAR(50) NOT NULL DEFAULT '2.0.0',
  `mae` DECIMAL(8, 4) NOT NULL,
  `rmse` DECIMAL(8, 4) NOT NULL,
  `r2_score` DECIMAL(8, 4) NOT NULL,
  `cv_score` DECIMAL(8, 4) NOT NULL,
  `cv_folds` INT NOT NULL DEFAULT 5,
  `n_train_samples` INT NOT NULL,
  `n_test_samples` INT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `metrics_json` TEXT NULL,
  `feature_importance_json` TEXT NULL,
  `actual_vs_predicted_json` LONGTEXT NULL,
  `residuals_json` LONGTEXT NULL,
  `evaluated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_mp_name` (`model_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. REPORTS TABLE (7 Agronomic Reports & Exports)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `farm_id` INT UNSIGNED NULL,
  `field_id` INT UNSIGNED NULL,
  `report_type` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT NULL,
  `parameters_json` TEXT NULL,
  `report_data_json` LONGTEXT NULL,
  `file_format` VARCHAR(20) NOT NULL DEFAULT 'PDF',
  `download_count` INT NOT NULL DEFAULT 0,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `generated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_rep_user` (`user_id`),
  INDEX `idx_rep_type` (`report_type`),
  CONSTRAINT `fk_rep_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
