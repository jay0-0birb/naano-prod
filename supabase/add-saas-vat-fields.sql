-- =====================================================
-- Basic VAT metadata for SaaS companies
-- =====================================================
-- Adds country / VAT info used to compute TVA on invoices.
-- Safe to run multiple times thanks to IF NOT EXISTS.

ALTER TABLE public.saas_companies
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS is_vat_registered BOOLEAN DEFAULT false;

