-- ============================================================================
-- Sugarcane Yield Forecasting & Smart Agricultural Decision Support System
-- PART 1: Seed Data
-- ============================================================================

USE `majorlogin`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. SEED ROLES
-- ----------------------------------------------------------------------------
INSERT INTO `roles` (`id`, `name`, `display_name`, `description`) VALUES
(1, 'farmer', 'Farmer / User', 'Can manage farms, fields, monitor crop growth, soil health, weather, and run yield predictions'),
(2, 'officer', 'Agricultural Officer', 'Can access extension services, validate crop conditions, view regional farm analytics and issue advisories'),
(3, 'admin', 'System Administrator', 'Full system management, user administration, ML pipeline monitoring, and platform configuration')
ON DUPLICATE KEY UPDATE 
  `display_name` = VALUES(`display_name`),
  `description` = VALUES(`description`);

-- ----------------------------------------------------------------------------
-- 2. SEED SUGARCANE VARIETIES
-- Required: Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265
-- ----------------------------------------------------------------------------
INSERT INTO `sugarcane_varieties` (
  `id`, `variety_code`, `name`, `origin`, `maturity_type`, `duration_months`, `duration_days`,
  `expected_yield_min`, `expected_yield_max`, `avg_yield`, `sucrose_pct`,
  `optimal_ph_min`, `optimal_ph_max`, `optimal_rainfall_min`, `optimal_rainfall_max`,
  `soil_suitability`, `weather_suitability`, `growth_characteristics`, `crop_condition`,
  `disease_resistance`, `drought_tolerance`, `risk_level`, `recommended_states`, `description`
) VALUES
(
  1,
  'Co 86032',
  'Co 86032 (Nayana)',
  'ICAR-Sugarcane Breeding Institute, Coimbatore',
  'Mid-Late',
  '12-14 months',
  380,
  95.00,
  145.00,
  118.50,
  14.50,
  6.20,
  7.80,
  1100.00,
  1500.00,
  'Excellent in medium-to-deep black cotton soil and well-drained alluvial soil. Highly tolerant to salinity and sodicity.',
  'Thrives in tropical zones with 28-34°C temperatures and well-distributed rainfall. Good tolerance to high humidity and warm summers.',
  'Erect, thick canes, high tillering capacity, excellent ratoonability up to 3-4 cycles, non-lodging with self-detaching dry leaves.',
  'Excellent',
  'High resistance to red rot and smut; moderately resistant to wilt.',
  'High',
  'Low',
  'Maharashtra, Karnataka, Tamil Nadu, Andhra Pradesh, Gujarat',
  'India\'s most widely cultivated tropical sugarcane variety. Renowned for consistent high yields, superb sugar recovery, and outstanding drought resilience.'
),
(
  2,
  'Co 0238',
  'Co 0238 (Karan 4)',
  'ICAR-SBI Regional Centre, Karnal',
  'Early',
  '10-12 months',
  340,
  105.00,
  165.00,
  132.00,
  14.80,
  6.50,
  8.00,
  950.00,
  1400.00,
  'Performs best in fertile, well-drained loamy to silt-loam alluvial soils with good organic matter and high fertility.',
  'Adapted to subtropical climates with wide temperature variations (10°C to 42°C). Requires adequate moisture during formative stages.',
  'Tall vigorous growth, thick green-yellow stalks, heavy tillering, high juice sucrose content, susceptible to lodging under high nitrogen.',
  'Good',
  'Historically resistant to red rot, but recent localized strains require preventive fungicide rotation and certified seed cane.',
  'Medium',
  'Medium',
  'Uttar Pradesh, Punjab, Haryana, Bihar, Uttarakhand',
  'The miracle variety that revolutionized North Indian sugar production with unprecedented yields and commercial cane sugar recovery.'
),
(
  3,
  'CoC 671',
  'CoC 671',
  'Sugarcane Research Station, Cuddalore',
  'Early',
  '10-11 months',
  330,
  80.00,
  125.00,
  102.00,
  15.20,
  6.00,
  7.50,
  1200.00,
  1600.00,
  'Prefers fertile alluvial, clay loam, and red loamy soils with excellent water retention and neutral pH.',
  'Requires humid tropical climate with abundant sunshine. Sensitive to prolonged severe moisture stress during formative stage.',
  'Early maturing, outstanding early sugar accumulation reaching 18% brix at 10 months, moderate tillering, medium-thick stalks.',
  'Good',
  'Moderately resistant to red rot; susceptible to smut and moisture stress.',
  'Low',
  'Medium',
  'Tamil Nadu, Andhra Pradesh, Southern Karnataka, Kerala',
  'The benchmark high-sugar variety of South India. Highly valued by sugar mills for early season crushing with record early sucrose extraction.'
),
(
  4,
  'Co 99004',
  'Co 99004 (Damodar)',
  'ICAR-Sugarcane Breeding Institute, Coimbatore',
  'Mid-Late',
  '12-13 months',
  370,
  90.00,
  135.00,
  112.00,
  14.20,
  6.00,
  7.60,
  1050.00,
  1450.00,
  'Broad adaptation to black soils, red soils, and sandy clay loams. Tolerates moderate salinity and seasonal waterlogging.',
  'Suitable for tropical climate zones with good monsoon precipitation. Exhibits strong heat tolerance during grand growth.',
  'Profuse tillering, solid cane stalks with high fiber for bagasse energy, excellent ratoon capability, non-flowering habit.',
  'Normal',
  'High resistance to red rot and smut; resistant to yellow leaf disease.',
  'High',
  'Low',
  'Karnataka, Maharashtra, Telangana, Tamil Nadu',
  'A high biomass, dual-purpose sugarcane variety well-suited for both jaggery and crystalline white sugar production with robust disease safety.'
),
(
  5,
  'CoM 0265',
  'CoM 0265 (Phule 0265)',
  'Vasantdada Sugar Institute & MPKV Rahuri',
  'Mid-Late',
  '12-14 months',
  390,
  110.00,
  175.00,
  142.00,
  13.90,
  6.50,
  8.50,
  1000.00,
  1500.00,
  'Exceptional performance in heavy black clay soils, saline-sodic soils, and degraded agricultural lands where other varieties fail.',
  'Extremely drought tolerant and climate-hardy. Resilient against scorching summer temperatures up to 44°C and irregular rainfall.',
  'Massive vegetative vigour, very thick green-purple canes, high cane weight per stalk, solid internal core, excellent ratoon maintenance.',
  'Excellent',
  'Resistant to smut and red rot; highly tolerant to salinity, drought, and water deficit.',
  'High',
  'Low',
  'Maharashtra, Karnataka, Gujarat, Madhya Pradesh',
  'The record-breaking tonnage champion of Western India, capable of exceeding 150-170 t/ha under good management while thriving in adverse soil conditions.'
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `expected_yield_min` = VALUES(`expected_yield_min`),
  `expected_yield_max` = VALUES(`expected_yield_max`),
  `avg_yield` = VALUES(`avg_yield`),
  `sucrose_pct` = VALUES(`sucrose_pct`),
  `soil_suitability` = VALUES(`soil_suitability`),
  `weather_suitability` = VALUES(`weather_suitability`),
  `growth_characteristics` = VALUES(`growth_characteristics`),
  `crop_condition` = VALUES(`crop_condition`),
  `disease_resistance` = VALUES(`disease_resistance`),
  `drought_tolerance` = VALUES(`drought_tolerance`),
  `risk_level` = VALUES(`risk_level`),
  `description` = VALUES(`description`);

-- ----------------------------------------------------------------------------
-- 3. SEED WEATHER DATA (Historical & Regional Profiles)
-- ----------------------------------------------------------------------------
INSERT INTO `weather_data` (
  `location`, `recorded_date`, `temperature_c`, `rainfall_mm`, `humidity_pct`,
  `wind_speed_kmh`, `weather_condition`, `temperature_impact`, `rainfall_impact`,
  `humidity_impact`, `overall_weather_risk`, `is_forecast`
) VALUES
('Kolhapur', '2026-09-01', 28.5, 120.0, 78.0, 12.0, 'Scattered Showers', 'Optimal for cane elongation', 'Beneficial for grand growth', 'Favorable for tillers', 'Low', 0),
('Kolhapur', '2026-09-10', 29.2, 85.0,  74.0, 11.0, 'Partly Cloudy',    'Optimal vegetative range', 'Adequate root moisture',    'Optimal humidity',    'Low', 0),
('Kolhapur', '2026-09-20', 30.1, 45.0,  70.0, 10.0, 'Sunny',            'Supports photosynthesis',  'Supplemental irrigation needed', 'Moderate humidity', 'Low', 0),
('Kolhapur', '2026-09-26', 29.0, 15.0,  72.0, 9.5,  'Partly Cloudy',    'Favourable temperature',   'Requires scheduled irrigation', 'Ideal range',       'Low', 0),
('Mandya',   '2026-09-26', 28.0, 22.0,  68.0, 13.0, 'Mild Breeze',      'Ideal thermal window',     'Moderate moisture recharge', 'Healthy transpiration', 'Low', 0),
('Belagavi', '2026-09-26', 27.5, 35.0,  75.0, 14.0, 'Light Rain',       'Comfortable growth range', 'Optimal soil absorption',   'Suppresses spider mites', 'Low', 0),
('Meerut',   '2026-09-26', 31.5, 5.0,   60.0, 8.0,  'Clear Sky',        'Elevated midday heat',     'Low precipitation — irrigate', 'Slightly dry',       'Medium', 0)
ON DUPLICATE KEY UPDATE `temperature_c` = VALUES(`temperature_c`);

SET FOREIGN_KEY_CHECKS = 1;
