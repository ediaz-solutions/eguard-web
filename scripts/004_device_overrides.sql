-- eGuard: migration 004_device_overrides.sql
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS device_overrides (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     UUID        NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  override_date DATE        NOT NULL,
  extended_end  TIME        NOT NULL,
  reason        TEXT,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(device_id, override_date)
);

-- Index para a query do PolicyService (resolve por device_id + data de hoje)
CREATE INDEX IF NOT EXISTS idx_device_overrides_device_date
  ON device_overrides(device_id, override_date);

COMMENT ON TABLE device_overrides IS
  'Hora Extra: extends the end time of a specific device on a specific date without touching the shared access policy.';