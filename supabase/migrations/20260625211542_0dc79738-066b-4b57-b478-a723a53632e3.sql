
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS profile_pic_url text,
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'Botswana',
  ADD COLUMN IF NOT EXISTS activation_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_weekly_payment_at timestamptz;

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS pickup_lat numeric,
  ADD COLUMN IF NOT EXISTS pickup_lng numeric,
  ADD COLUMN IF NOT EXISTS dest_lat numeric,
  ADD COLUMN IF NOT EXISTS dest_lng numeric;
