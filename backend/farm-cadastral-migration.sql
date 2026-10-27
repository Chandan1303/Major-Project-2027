-- Run once on existing MySQL installations to store farm survey numbers.
ALTER TABLE farms ADD COLUMN survey_number VARCHAR(120) NULL;
