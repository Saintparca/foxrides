
ALTER TABLE public.app_settings ALTER COLUMN driver_share SET DEFAULT 0.90;
ALTER TABLE public.app_settings ALTER COLUMN activation_fee SET DEFAULT 0;
ALTER TABLE public.app_settings ALTER COLUMN weekly_fee SET DEFAULT 0;

UPDATE public.app_settings
SET driver_share = 0.90, activation_fee = 0, weekly_fee = 0, updated_at = now()
WHERE id = true;
