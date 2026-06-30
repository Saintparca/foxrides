-- Approval status enum
DO $$ BEGIN
  CREATE TYPE public.driver_approval_status AS ENUM ('pending','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS omang_url text,
  ADD COLUMN IF NOT EXISTS license_url text,
  ADD COLUMN IF NOT EXISTS vehicle_reg_url text,
  ADD COLUMN IF NOT EXISTS insurance_url text,
  ADD COLUMN IF NOT EXISTS approval_status public.driver_approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Saved places
CREATE TABLE IF NOT EXISTS public.saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  address text NOT NULL,
  lat double precision,
  lng double precision,
  kind text NOT NULL DEFAULT 'favourite', -- 'home' | 'work' | 'favourite'
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_places TO authenticated;
GRANT ALL ON public.saved_places TO service_role;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_places owner" ON public.saved_places
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending', -- pending | paid | rejected
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals driver insert" ON public.withdrawals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "withdrawals driver read" ON public.withdrawals
  FOR SELECT TO authenticated USING (auth.uid() = driver_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "withdrawals admin update" ON public.withdrawals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Allow admins to update drivers (for approve/reject)
DROP POLICY IF EXISTS "admins update drivers" ON public.drivers;
CREATE POLICY "admins update drivers" ON public.drivers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Storage policies for private driver-docs bucket (bucket created via tool)
DROP POLICY IF EXISTS "driver upload own docs" ON storage.objects;
CREATE POLICY "driver upload own docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'driver-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "driver read own docs" ON storage.objects;
CREATE POLICY "driver read own docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'driver-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS "driver update own docs" ON storage.objects;
CREATE POLICY "driver update own docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'driver-docs' AND (storage.foldername(name))[1] = auth.uid()::text);