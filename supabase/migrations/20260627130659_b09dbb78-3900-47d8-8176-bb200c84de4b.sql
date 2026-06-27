
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_first boolean;
  chosen_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'phone');

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO is_first;
  chosen_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen_role);

  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
