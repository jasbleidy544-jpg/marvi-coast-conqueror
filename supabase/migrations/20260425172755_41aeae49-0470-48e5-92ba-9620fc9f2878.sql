
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('guardian', 'sponsor', 'admin');
CREATE TYPE public.zone_status AS ENUM ('critical', 'vulnerable', 'protected');
CREATE TYPE public.zone_kind AS ENUM ('coastal', 'urban', 'rural');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE,
  badge TEXT DEFAULT 'Aprendiz del Mar',
  avatar_url TEXT,
  total_tons NUMERIC(10,3) NOT NULL DEFAULT 0,
  zones_owned INTEGER NOT NULL DEFAULT 0,
  brand_name TEXT,
  brand_tagline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ ZONES (15 costeras Santa Marta) ============
CREATE TABLE public.zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind public.zone_kind NOT NULL DEFAULT 'coastal',
  meters INTEGER NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status public.zone_status NOT NULL DEFAULT 'critical',
  guardian_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conquered_with_tons NUMERIC(10,3),
  streak INTEGER NOT NULL DEFAULT 0,
  last_visit TIMESTAMPTZ,
  total_tons_collected NUMERIC(10,3) NOT NULL DEFAULT 0,
  hazard_level INTEGER NOT NULL DEFAULT 80,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  kilos NUMERIC(10,2) NOT NULL CHECK (kilos > 0),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ============ CHECK-INS (rachas 7 dias) ============
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- ============ SPONSORS / ADOPTIONS ============
CREATE TABLE public.sponsor_adoptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sponsor_id, guardian_id)
);
ALTER TABLE public.sponsor_adoptions ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============
-- profiles: todos los autenticados pueden ver, solo el dueño edita
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles: usuarios ven sus roles, solo admin asigna
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- zones: todos ven, autenticados pueden conquistar
CREATE POLICY "Zones viewable by everyone"
  ON public.zones FOR SELECT USING (true);
CREATE POLICY "Authenticated can update zones"
  ON public.zones FOR UPDATE TO authenticated USING (true);

-- reports: todos ven, dueño crea
CREATE POLICY "Reports viewable by authenticated"
  ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own reports"
  ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- check_ins
CREATE POLICY "Check-ins viewable by authenticated"
  ON public.check_ins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own check-ins"
  ON public.check_ins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- adoptions: marcas crean, todos ven
CREATE POLICY "Adoptions viewable by everyone"
  ON public.sponsor_adoptions FOR SELECT USING (true);
CREATE POLICY "Sponsors insert adoptions"
  ON public.sponsor_adoptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sponsor_id AND public.has_role(auth.uid(), 'sponsor'));
CREATE POLICY "Sponsors delete own adoptions"
  ON public.sponsor_adoptions FOR DELETE TO authenticated
  USING (auth.uid() = sponsor_id);

-- ============ TRIGGER: profile + role on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _name TEXT;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'guardian');

  INSERT INTO public.profiles (id, display_name, handle, brand_name, brand_tagline)
  VALUES (
    NEW.id,
    _name,
    '@' || lower(regexp_replace(_name, '[^a-zA-Z0-9]', '', 'g')),
    NEW.raw_user_meta_data->>'brand_name',
    NEW.raw_user_meta_data->>'brand_tagline'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TRIGGER: updated_at ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ STORAGE: report photos ============
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Report photos public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'reports');
CREATE POLICY "Authenticated upload report photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ SEED 15 ZONAS COSTERAS DE SANTA MARTA ============
INSERT INTO public.zones (id, name, kind, meters, lat, lng, status, hazard_level, description) VALUES
('z-bahia-concha',   'Bahía Concha',         'coastal', 320, 11.3221, -74.1584, 'critical',   88, 'Bahía dentro del Parque Tayrona'),
('z-playa-grande',   'Playa Grande',         'coastal', 180, 11.2766, -74.2057, 'critical',   72, 'Cerca de Taganga, accesible en lancha'),
('z-taganga',        'Playa de Taganga',     'coastal', 240, 11.2647, -74.1907, 'vulnerable', 55, 'Pueblo pesquero histórico'),
('z-rodadero',       'El Rodadero',          'coastal', 600, 11.2065, -74.2289, 'critical',   95, 'Playa turística principal'),
('z-playa-blanca',   'Playa Blanca',         'coastal', 280, 11.1989, -74.2401, 'critical',   78, 'Frente a El Rodadero'),
('z-cabo-san-juan',  'Cabo San Juan',        'coastal', 140, 11.3187, -74.0297, 'protected',  18, 'Ícono del Parque Tayrona'),
('z-playa-cristal',  'Playa Cristal',        'coastal', 210, 11.3392, -74.0976, 'protected',  22, 'Aguas turquesas, Tayrona'),
('z-playa-dormida',  'Playa Dormida',        'coastal', 360, 11.2351, -73.8819, 'critical',   85, 'Costa de Buritaca'),
('z-los-cocos',      'Los Cocos',            'coastal', 200, 11.2491, -73.8644, 'vulnerable', 60, 'Playa de Guachaca'),
('z-bello-horizonte','Bello Horizonte',      'coastal', 450, 11.1866, -74.2475, 'critical',   82, 'Zona hotelera al sur'),
('z-pozos-colorados','Pozos Colorados',      'coastal', 380, 11.1574, -74.2285, 'vulnerable', 58, 'Playa cerca al aeropuerto'),
('z-don-jaca',       'Don Jaca',             'coastal', 290, 11.1340, -74.2195, 'critical',   76, 'Playa al sur de la ciudad'),
('z-playa-salguero', 'Playa Salguero',       'coastal', 320, 11.1721, -74.2362, 'vulnerable', 64, 'Entre Rodadero y aeropuerto'),
('z-bahia-gaira',    'Bahía de Gaira',       'coastal', 410, 11.1820, -74.2310, 'critical',   80, 'Desembocadura del río Gaira'),
('z-neguanje',       'Bahía Neguanje',       'coastal', 350, 11.3402, -74.1136, 'protected',  20, 'Bahía protegida en Tayrona');
