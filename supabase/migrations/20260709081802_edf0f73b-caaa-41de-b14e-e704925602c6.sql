ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS ride_class text NOT NULL DEFAULT 'economy';
ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_ride_class_chk;
ALTER TABLE public.rides ADD CONSTRAINT rides_ride_class_chk CHECK (ride_class IN ('fastest','economy','comfort'));

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS comfort_multiplier numeric NOT NULL DEFAULT 1.15;

ALTER TABLE public.app_settings ALTER COLUMN base_fare SET DEFAULT 3;
ALTER TABLE public.app_settings ALTER COLUMN per_km    SET DEFAULT 1.4;
ALTER TABLE public.app_settings ALTER COLUMN per_min   SET DEFAULT 0.3;
ALTER TABLE public.app_settings ALTER COLUMN min_fare  SET DEFAULT 12;

UPDATE public.app_settings
SET base_fare = 3, per_km = 1.4, per_min = 0.3, min_fare = 12,
    comfort_multiplier = 1.15, updated_at = now()
WHERE id = true;

CREATE OR REPLACE FUNCTION public.validate_ride_fare()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.app_settings;
  base numeric;
  mult numeric;
  is_admin boolean;
BEGIN
  SELECT * INTO s FROM public.app_settings WHERE id = true;

  IF TG_OP = 'INSERT' THEN
    base := GREATEST(
      COALESCE(s.min_fare, 12),
      COALESCE(s.base_fare, 3)
        + COALESCE(NEW.distance_km, 0) * COALESCE(s.per_km, 1.4)
        + COALESCE(NEW.duration_min, 0) * COALESCE(s.per_min, 0.3)
    );
    mult := CASE COALESCE(NEW.ride_class,'economy')
      WHEN 'comfort' THEN COALESCE(s.comfort_multiplier, 1.15)
      ELSE 1
    END;
    NEW.fare := round((base * mult)::numeric, 2);
    RETURN NEW;
  END IF;

  is_admin := private.has_role(auth.uid(),'admin');

  IF auth.uid() = NEW.customer_id
     AND (NEW.driver_id IS NULL OR auth.uid() IS DISTINCT FROM NEW.driver_id)
     AND NOT is_admin THEN
    NEW.fare := OLD.fare;
    NEW.driver_id := OLD.driver_id;
    NEW.customer_id := OLD.customer_id;
    NEW.ride_class := OLD.ride_class;
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_ride_fare() FROM PUBLIC, anon, authenticated;