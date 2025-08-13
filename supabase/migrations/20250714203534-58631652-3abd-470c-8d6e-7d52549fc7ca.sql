-- Insert sample license keys for testing
INSERT INTO public.license_keys (license_key, is_active, max_uses, expires_at, metadata) VALUES
('LK-TEST-DEMO-2024', true, 10, now() + interval '30 days', '{"type": "demo", "created_by": "system"}'),
('LK-ADMIN-FULL-ACCESS', true, null, null, '{"type": "admin", "created_by": "system"}'),
('LK-LIMITED-5-USES', true, 5, now() + interval '7 days', '{"type": "limited", "created_by": "system"}'),
('LK-EXPIRED-TEST-KEY', true, 100, now() - interval '1 day', '{"type": "expired", "created_by": "system"}');