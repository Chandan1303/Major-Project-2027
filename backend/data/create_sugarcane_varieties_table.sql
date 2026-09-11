-- Create Sugarcane Varieties Master Table
-- Database: majorlogin

USE majorlogin;

-- Drop table if exists (be careful in production!)
-- DROP TABLE IF EXISTS sugarcane_varieties;

CREATE TABLE IF NOT EXISTS sugarcane_varieties (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    s_no INT,
    year_of_release YEAR,
    variety_name VARCHAR(100) NOT NULL,
    common_name VARCHAR(100),
    notification_no VARCHAR(50),
    variety_type VARCHAR(100),
    maturity_type ENUM('Early', 'Mid-late', 'Late', 'Mid-season') DEFAULT 'Mid-late',
    cane_yield_t_ha DECIMAL(10,2) COMMENT 'Cane yield in tonnes per hectare',
    sucrose_percent DECIMAL(5,2) COMMENT 'Sucrose percentage in juice',
    ccs_percent DECIMAL(5,2) COMMENT 'Commercial Cane Sugar percentage',
    ccs_yield_t_ha DECIMAL(10,2) COMMENT 'CCS yield in tonnes per hectare',
    red_rot_resistance ENUM('Resistant', 'Moderately Resistant', 'Moderately Susceptible', 'Susceptible', 'Highly Susceptible', 'Tolerant'),
    smut_resistance ENUM('Resistant', 'Moderately Resistant', 'Moderately Susceptible', 'Susceptible', 'Less Susceptible'),
    drought_tolerance BOOLEAN DEFAULT FALSE,
    salinity_tolerance BOOLEAN DEFAULT FALSE,
    waterlogging_tolerance BOOLEAN DEFAULT FALSE,
    ratooning_ability ENUM('Excellent', 'Good', 'Moderate', 'Poor'),
    recommended_states TEXT COMMENT 'Comma-separated list of recommended states',
    zone VARCHAR(100) COMMENT 'Agro-climatic zone',
    special_features TEXT COMMENT 'Special characteristics and features',
    planting_season VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_variety_name (variety_name),
    INDEX idx_year (year_of_release),
    INDEX idx_maturity (maturity_type),
    INDEX idx_zone (zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data insertion (first 10 varieties)
-- You can import the rest from CSV file

INSERT INTO sugarcane_varieties (
    s_no, year_of_release, variety_name, common_name, notification_no, 
    variety_type, maturity_type, recommended_states, zone
) VALUES
(1, 2025, 'CoS 17231', 'Bismil', 'S.O. 6123(E)', 'Early maturity variety', 'Early', 
 'Punjab, Haryana, Rajasthan, Central and western Uttar Pradesh and Uttarakhand', 'North West Zone'),
 
(2, 2025, 'Co 18022', 'Karan18', 'S.O. 6123(E)', 'Mid-late maturity variety', 'Mid-late', 
 'Punjab, Haryana, Rajasthan, Central and western Uttar Pradesh and Uttarakhand', 'North West Zone'),
 
(3, 2025, 'CoPb 18213', 'CoPb 100', 'S.O. 6123(E)', 'Mid-late maturity variety', 'Mid-late', 
 'Punjab, Haryana, Rajasthan, Central and western Uttar Pradesh and Uttarakhand', 'North West Zone'),
 
(4, 2024, 'Co 17018', 'Karan 17', 'S.O. 4388(E)', 'Mid-late maturity', 'Mid-late', 
 'Haryana, Punjab, Rajasthan, Uttarakhand, Central and Western Uttar Pradesh', 'North West Zone'),
 
(5, 2024, 'CoS 16233', 'Roshan', 'S.O. 4388(E)', 'Mid-late maturity', 'Mid-late', 
 'Punjab, Haryana, Uttarakhand, Rajasthan, Central and Western part of Uttar Pradesh', 'North West Zone'),
 
(6, 2023, 'Co 11015', NULL, 'S.O. 4222 (E)', 'Mid-late maturity variety', 'Mid-late', 
 'Andhra Pradesh, Telangana, Kerala, T.N., Karnataka, Gujarat, Maharashtra & M.P.', 'Peninsular Zone'),
 
(7, 2022, 'CoPb 98', 'CoPb 14185', 'S.O. 8(E)', 'Mid-late', 'Mid-late', 
 'Punjab, Haryana, Rajasthan, Uttarakhand and Western and Central Uttar Pradesh', 'North West Zone'),
 
(8, 2021, 'CoPb 95', NULL, 'S.O. 8(E)', 'Mid-late', 'Mid-late', 
 'Punjab', 'North West Zone'),
 
(9, 2020, 'Co 12009', 'Sankalp', 'S.O.3482(E)', 'Drought tolerant', 'Mid-late', 
 'Tamil Nadu, Kerala, Interior Andhra Pradesh, Telangana, Karnataka, Gujarat, Maharashtra, Madhya Pradesh and Chhattisgarh', 'Peninsular Zone'),
 
(10, 2019, 'Co V 15-356', 'Ranga (2009 V 127)', 'S.O. 3220(E)', 'Early', 'Early', 
 'Andhra Pradesh', NULL);

-- View the data
SELECT * FROM sugarcane_varieties ORDER BY year_of_release DESC LIMIT 10;

-- Summary statistics
SELECT 
    zone,
    COUNT(*) as variety_count,
    AVG(cane_yield_t_ha) as avg_yield,
    AVG(sucrose_percent) as avg_sucrose
FROM sugarcane_varieties
WHERE cane_yield_t_ha IS NOT NULL
GROUP BY zone;
