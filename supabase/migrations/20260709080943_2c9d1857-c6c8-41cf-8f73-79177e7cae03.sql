
-- 1) Private schema for security-definer helpers (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Rebuild policies to reference private.has_role and tighten SELECT scopes.

-- user_roles
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(),'admin'));

-- app_settings
DROP POLICY IF EXISTS "settings admin write" ON public.app_settings;
DROP POLICY IF EXISTS "settings admin insert" ON public.app_settings;
CREATE POLICY "settings admin write" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "settings admin insert" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'admin'));

-- withdrawals
DROP POLICY IF EXISTS "withdrawals driver read" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals admin update" ON public.withdrawals;
CREATE POLICY "withdrawals driver read" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (auth.uid() = driver_id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "withdrawals admin update" ON public.withdrawals
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));

-- drivers: SELECT restricted; admin update
DROP POLICY IF EXISTS "Drivers readable by authed" ON public.drivers;
DROP POLICY IF EXISTS "Admin manages drivers" ON public.drivers;
DROP POLICY IF EXISTS "admins update drivers" ON public.drivers;
CREATE POLICY "Drivers self/admin/customer-in-ride read" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR private.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.driver_id = drivers.id
        AND r.customer_id = auth.uid()
        AND r.status IN ('requested','accepted','in_progress','completed')
    )
  );
CREATE POLICY "admins update drivers" ON public.drivers
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));

-- profiles: SELECT restricted
DROP POLICY IF EXISTS "Profiles readable by authed" ON public.profiles;
DROP POLICY IF EXISTS "Admin updates any profile" ON public.profiles;
CREATE POLICY "Profiles self/admin/shared-ride read" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR private.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.rides r
      WHERE (r.customer_id = auth.uid() AND r.driver_id = profiles.id)
         OR (r.driver_id = auth.uid() AND r.customer_id = profiles.id)
    )
  );
CREATE POLICY "Admin updates any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));

-- driver_locations: SELECT restricted to driver, admin, or customer with active ride
DROP POLICY IF EXISTS "Authed reads driver locations" ON public.driver_locations;
CREATE POLICY "Driver/admin/active-customer read locations" ON public.driver_locations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = driver_id
    OR private.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.driver_id = driver_locations.driver_id
        AND r.customer_id = auth.uid()
        AND r.status IN ('accepted','in_progress')
    )
  );

-- promo_codes: admin only reads
DROP POLICY IF EXISTS "promos readable" ON public.promo_codes;
DROP POLICY IF EXISTS "promos admin write" ON public.promo_codes;
CREATE POLICY "promos admin read" ON public.promo_codes
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY "promos admin write" ON public.promo_codes
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));

-- promo_redemptions
DROP POLICY IF EXISTS "own redemptions" ON public.promo_redemptions;
CREATE POLICY "own redemptions" ON public.promo_redemptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));

-- rides
DROP POLICY IF EXISTS "Customer sees own rides" ON public.rides;
DROP POLICY IF EXISTS "Customer/driver update ride" ON public.rides;
CREATE POLICY "Customer sees own rides" ON public.rides
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = driver_id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Customer/driver update ride" ON public.rides
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = driver_id OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = driver_id OR private.has_role(auth.uid(),'admin'));

-- storage object policy referencing has_role
DROP POLICY IF EXISTS "driver read own docs" ON storage.objects;
CREATE POLICY "driver read own docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'driver-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(),'admin')));

-- 3) Now safe to drop the public has_role
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 4) Server-authoritative fare via trigger; prevent customer tampering
CREATE OR REPLACE FUNCTION public.validate_ride_fare()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.app_settings;
  computed numeric;
  is_admin boolean;
BEGIN
  SELECT * INTO s FROM public.app_settings WHERE id = true;

  IF TG_OP = 'INSERT' THEN
    computed := GREATEST(
      COALESCE(s.min_fare, 15),
      COALESCE(s.base_fare, 10)
        + COALESCE(NEW.distance_km, 0) * COALESCE(s.per_km, 2.5)
        + COALESCE(NEW.duration_min, 0) * COALESCE(s.per_min, 0.4)
    );
    NEW.fare := round(computed::numeric, 2);
    RETURN NEW;
  END IF;

  -- UPDATE path
  is_admin := private.has_role(auth.uid(),'admin');

  -- Customer (non-driver, non-admin) cannot change protected fields
  IF auth.uid() = NEW.customer_id
     AND (NEW.driver_id IS NULL OR auth.uid() IS DISTINCT FROM NEW.driver_id)
     AND NOT is_admin THEN
    NEW.fare := OLD.fare;
    NEW.driver_id := OLD.driver_id;
    NEW.customer_id := OLD.customer_id;
    -- allow only cancellation transitions by the customer
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_ride_fare() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_validate_ride_fare ON public.rides;
CREATE TRIGGER trg_validate_ride_fare
BEFORE INSERT OR UPDATE ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.validate_ride_fare();

-- 5) Remove hardcoded owner phone from triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen_role public.app_role;
  user_phone text;
  user_name text;
BEGIN
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone);
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, user_phone, 'Rider');

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, user_name, user_phone);

  chosen_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- No hardcoded admin bootstrap. Admins are granted manually by an existing admin.
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_admin_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin role may only be granted by an existing admin (or service_role).
  IF NEW.role = 'admin' THEN
    IF auth.uid() IS NULL THEN
      -- Allow service_role / trigger-less internal grants (auth.uid() null when no JWT)
      RETURN NEW;
    END IF;
    IF NOT private.has_role(auth.uid(),'admin') THEN
      RAISE EXCEPTION 'Only admins can grant the admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_admin_owner() FROM PUBLIC, anon, authenticated;
