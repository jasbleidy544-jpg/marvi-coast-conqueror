
-- 1) Limpieza total
DELETE FROM public.reports;
DELETE FROM public.check_ins;
DELETE FROM public.sponsor_adoptions;
DELETE FROM public.zones;

-- 2) zones: nuevo modelo (claim libre)
ALTER TABLE public.zones
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS radius_m integer NOT NULL DEFAULT 200;

-- Permitir INSERT y DELETE para guardianes autenticados
DROP POLICY IF EXISTS "Authenticated claim territory" ON public.zones;
CREATE POLICY "Authenticated claim territory"
ON public.zones FOR INSERT
TO authenticated
WITH CHECK (guardian_id = auth.uid());

DROP POLICY IF EXISTS "Guardian deletes own zone" ON public.zones;
CREATE POLICY "Guardian deletes own zone"
ON public.zones FOR DELETE
TO authenticated
USING (guardian_id = auth.uid());

-- 3) Función claim_territory
CREATE OR REPLACE FUNCTION public.claim_territory(
  _lat double precision,
  _lng double precision,
  _name text,
  _radius_m integer DEFAULT 200
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me public.profiles;
  _conflict public.zones;
  _conflict_owner public.profiles;
  _new_id text;
  _radius int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  END IF;
  IF _lat IS NULL OR _lng IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'GPS requerido.');
  END IF;
  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Ponle un nombre al territorio.');
  END IF;

  _radius := COALESCE(_radius_m, 200);
  IF _radius < 50 THEN _radius := 50; END IF;
  IF _radius > 1000 THEN _radius := 1000; END IF;

  SELECT * INTO _me FROM public.profiles WHERE id = auth.uid();

  -- ¿Hay un territorio existente cuyo círculo solape con el punto reclamado?
  SELECT z.* INTO _conflict
  FROM public.zones z
  WHERE public.haversine_m(z.lat, z.lng, _lat, _lng) <= z.radius_m
  ORDER BY public.haversine_m(z.lat, z.lng, _lat, _lng) ASC
  LIMIT 1;

  IF _conflict.id IS NOT NULL THEN
    IF _conflict.guardian_id = _me.id THEN
      RETURN jsonb_build_object('ok', false,
        'message', 'Ya eres guardián de "' || _conflict.name || '" en este punto.');
    END IF;
    SELECT * INTO _conflict_owner FROM public.profiles WHERE id = _conflict.guardian_id;
    IF _me.total_tons <= COALESCE(_conflict_owner.total_tons, 0) THEN
      RETURN jsonb_build_object('ok', false,
        'message', 'Aquí gobierna ' || COALESCE(_conflict_owner.display_name, 'otro guardián')
                || ' con ' || COALESCE(_conflict_owner.total_tons, 0) || ' t. Recolecta más para retarle.');
    END IF;
    -- Tomar el territorio: cambiar dueño y resetear estado
    UPDATE public.profiles SET zones_owned = GREATEST(0, zones_owned - 1)
      WHERE id = _conflict.guardian_id;
    UPDATE public.zones SET
      guardian_id = _me.id,
      name = _name,
      status = 'vulnerable',
      streak = 1,
      conquered_with_tons = _me.total_tons,
      last_visit = now(),
      hazard_level = GREATEST(20, hazard_level - 30),
      radius_m = _radius,
      lat = _lat,
      lng = _lng
    WHERE id = _conflict.id;
    UPDATE public.profiles SET zones_owned = zones_owned + 1 WHERE id = _me.id;
    RETURN jsonb_build_object('ok', true,
      'message', '¡Conquistaste "' || _name || '" a ' || COALESCE(_conflict_owner.display_name, 'otro guardián') || '!',
      'zone_id', _conflict.id);
  END IF;

  -- Crear nuevo territorio
  _new_id := gen_random_uuid()::text;
  INSERT INTO public.zones (id, name, kind, meters, lat, lng, guardian_id, status, streak, conquered_with_tons, last_visit, hazard_level, radius_m)
  VALUES (_new_id, _name, 'coastal', _radius, _lat, _lng, _me.id, 'vulnerable', 1, _me.total_tons, now(), 50, _radius);

  UPDATE public.profiles SET zones_owned = zones_owned + 1 WHERE id = _me.id;

  RETURN jsonb_build_object('ok', true,
    'message', '¡"' || _name || '" es tuyo! Mantenlo 7 días para protegerlo.',
    'zone_id', _new_id);
END;
$$;

-- 4) check_in_zone usa radius_m del territorio
CREATE OR REPLACE FUNCTION public.check_in_zone(
  _zone_id text,
  _lat double precision DEFAULT NULL,
  _lng double precision DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _zone public.zones;
  _new_streak INT;
  _became_protected BOOLEAN := false;
  _dist DOUBLE PRECISION;
  _today_count INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  END IF;
  IF _lat IS NULL OR _lng IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'GPS requerido. Activa la ubicación de tu dispositivo.');
  END IF;

  SELECT * INTO _zone FROM public.zones WHERE id = _zone_id;
  IF _zone.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Territorio no encontrado.');
  END IF;
  IF _zone.guardian_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Solo el guardián puede registrarse aquí.');
  END IF;

  _dist := public.haversine_m(_lat, _lng, _zone.lat, _zone.lng);
  IF _dist > _zone.radius_m THEN
    RETURN jsonb_build_object('ok', false,
      'message', 'No estás en el territorio. Estás a ' || round(_dist)::text || ' m de ' || _zone.name
              || ' (radio ' || _zone.radius_m || ' m).');
  END IF;

  SELECT count(*) INTO _today_count FROM public.check_ins
   WHERE user_id = auth.uid() AND zone_id = _zone_id
     AND created_at >= date_trunc('day', now());
  IF _today_count > 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Ya registraste tu día aquí. Vuelve mañana.');
  END IF;

  _new_streak := LEAST(7, COALESCE(_zone.streak, 0) + 1);
  IF _new_streak >= 7 AND _zone.status <> 'protected' THEN
    _became_protected := true;
  END IF;

  UPDATE public.zones SET
    streak = _new_streak,
    status = CASE WHEN _new_streak >= 7 THEN 'protected'::zone_status ELSE 'vulnerable'::zone_status END,
    last_visit = now()
  WHERE id = _zone_id;

  INSERT INTO public.check_ins (user_id, zone_id) VALUES (auth.uid(), _zone_id);

  RETURN jsonb_build_object('ok', true,
    'message', CASE WHEN _became_protected
      THEN '¡7 días seguidos! ' || _zone.name || ' está oficialmente PROTEGIDO.'
      ELSE 'Día ' || _new_streak || '/7 registrado. ¡Sigue así!'
    END);
END;
$$;

-- 5) report_cleanup usa radius_m del territorio
CREATE OR REPLACE FUNCTION public.report_cleanup(
  _zone_id text,
  _kilos numeric,
  _notes text,
  _photo_url text,
  _lat double precision DEFAULT NULL,
  _lng double precision DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _zone public.zones;
  _tons NUMERIC;
  _dist DOUBLE PRECISION;
  _reduction INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  END IF;
  IF _kilos <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Cantidad inválida.');
  END IF;
  IF _photo_url IS NULL OR length(_photo_url) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Debes adjuntar foto de evidencia.');
  END IF;
  IF _lat IS NULL OR _lng IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'GPS requerido. Activa la ubicación de tu dispositivo.');
  END IF;

  SELECT * INTO _zone FROM public.zones WHERE id = _zone_id;
  IF _zone.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Territorio no encontrado.');
  END IF;

  _dist := public.haversine_m(_lat, _lng, _zone.lat, _zone.lng);
  IF _dist > _zone.radius_m THEN
    RETURN jsonb_build_object('ok', false,
      'message', 'No estás en el territorio. Estás a ' || round(_dist)::text || ' m de ' || _zone.name
              || ' (radio ' || _zone.radius_m || ' m).');
  END IF;

  _tons := _kilos / 1000.0;
  _reduction := LEAST(10, GREATEST(0, (_kilos / 10)::int));

  INSERT INTO public.reports (user_id, zone_id, kilos, notes, photo_url)
  VALUES (auth.uid(), _zone_id, _kilos, _notes, _photo_url);

  UPDATE public.zones SET
    total_tons_collected = total_tons_collected + _tons,
    hazard_level = GREATEST(0, hazard_level - _reduction),
    last_visit = now()
  WHERE id = _zone_id;

  UPDATE public.profiles SET total_tons = total_tons + _tons WHERE id = auth.uid();

  RETURN jsonb_build_object('ok', true,
    'message', 'Registrados ' || _kilos || ' kg (' || round(_tons, 3) || ' t). ¡Tu poder de conquista creció!');
END;
$$;
