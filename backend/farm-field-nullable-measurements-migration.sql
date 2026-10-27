-- Preserve existing field records while allowing unknown planting dates and soil readings.
-- Run once against the configured MySQL database before deploying the updated backend.
ALTER TABLE fields
    MODIFY COLUMN soil_ph NUMERIC(4, 2) NULL,
    MODIFY COLUMN soil_moisture NUMERIC(5, 2) NULL,
    MODIFY COLUMN planting_date DATE NULL;