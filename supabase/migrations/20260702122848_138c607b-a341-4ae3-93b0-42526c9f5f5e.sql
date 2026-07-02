
-- app_settings singleton
CREATE TABLE public.app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  base_fare NUMERIC NOT NULL DEFAULT 10,
  per_km NUMERIC NOT NULL DEFAULT 2.5,
  per_min NUMERIC NOT NULL DEFAULT 0.4,
  min_fare NUMERIC NOT NULL DEFAULT 15,
  cancel_fee NUMERIC NOT NULL DEFAULT 10,
  driver_share NUMERIC NOT NULL DEFAULT 0.85,
  activation_fee NUMERIC NOT NULL DEFAULT 100,
  weekly_fee NUMERIC NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT ALL ON public.app_settings TO service_role;
GRANT UPDATE, INSERT ON public.app_settings TO authenticated;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable by all" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "settings admin insert" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.app_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

-- promo_codes
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value NUMERIC NOT NULL,
  max_uses INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promos readable" ON public.promo_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "promos admin write" ON public.promo_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- promo_redemptions
CREATE TABLE public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own redemptions" ON public.promo_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "insert own redemption" ON public.promo_redemptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
