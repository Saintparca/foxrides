
-- Rides: real route + live driver tracking + cancellation
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS route_polyline text,
  ADD COLUMN IF NOT EXISTS duration_min numeric,
  ADD COLUMN IF NOT EXISTS eta_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_lat numeric,
  ADD COLUMN IF NOT EXISTS driver_lng numeric,
  ADD COLUMN IF NOT EXISTS driver_loc_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS cancellation_fee numeric NOT NULL DEFAULT 0;

-- Live driver location table
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  heading numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_locations TO authenticated;
GRANT ALL ON public.driver_locations TO service_role;

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver upserts own location"
  ON public.driver_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Driver updates own location"
  ON public.driver_locations FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Driver deletes own location"
  ON public.driver_locations FOR DELETE TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Authed reads driver locations"
  ON public.driver_locations FOR SELECT TO authenticated
  USING (true);

-- Enable Realtime
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
