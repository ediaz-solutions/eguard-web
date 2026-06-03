-- =============================================================================
-- eGuard v1.1 — Adicionar nome às políticas (perfis de horário)
-- Execute no Supabase SQL Editor
-- =============================================================================

-- Adicionar coluna name
ALTER TABLE access_policies ADD COLUMN IF NOT EXISTS name TEXT;

-- Atualizar políticas existentes sem nome
UPDATE access_policies SET name = 'Horário Comercial' WHERE name IS NULL;
