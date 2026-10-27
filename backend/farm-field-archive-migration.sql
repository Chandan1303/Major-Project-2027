-- Add non-destructive archive flags for existing farm and field records.
ALTER TABLE farms ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE fields ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
