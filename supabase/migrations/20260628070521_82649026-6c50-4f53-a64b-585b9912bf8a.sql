
-- Lock admin role to the owner's phone (75389897) only.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chosen_role public.app_role;
  user_phone text;
BEGIN
  user_phone := NEW.raw_user_meta_data->>'phone';

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), user_phone);

  chosen_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Only the owner's phone is ever granted admin, automatically.
  IF user_phone = '75389897' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Block grant/revoke of admin to anyone other than the owner's phone.
CREATE OR REPLACE FUNCTION public.enforce_admin_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_phone text;
BEGIN
  IF NEW.role = 'admin' THEN
    SELECT phone INTO target_phone FROM public.profiles WHERE id = NEW.user_id;
    IF target_phone IS DISTINCT FROM '75389897' THEN
      RAISE EXCEPTION 'Admin role is reserved for the app owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_admin_owner_trg ON public.user_roles;
CREATE TRIGGER enforce_admin_owner_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_owner();

-- Strip admin from anyone who isn't the owner phone (cleanup).
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id NOT IN (SELECT id FROM public.profiles WHERE phone = '75389897');

-- Ensure the owner account is admin (idempotent).
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM public.profiles WHERE phone = '75389897'
ON CONFLICT (user_id, role) DO NOTHING;

-- Make sure the trigger that runs handle_new_user on auth.users exists.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
