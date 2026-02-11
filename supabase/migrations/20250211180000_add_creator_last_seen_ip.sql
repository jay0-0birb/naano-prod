-- Store creator's last seen IP for Naano promo self-click protection.
-- When a promo click comes from this IP (within 24h), we treat it as self-click and do not count it.
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS last_seen_ip TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS last_seen_ip_at TIMESTAMPTZ;
