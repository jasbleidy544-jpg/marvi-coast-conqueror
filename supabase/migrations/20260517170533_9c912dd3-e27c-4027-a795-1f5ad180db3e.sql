
CREATE OR REPLACE FUNCTION public.haversine_m(lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  r CONSTANT DOUBLE PRECISION := 6371000;
  dLat DOUBLE PRECISION := radians(lat2 - lat1);
  dLng DOUBLE PRECISION := radians(lng2 - lng1);
  a DOUBLE PRECISION;
BEGIN
  a := sin(dLat/2)^2 + cos(radians(lat1))*cos(radians(lat2))*sin(dLng/2)^2;
  RETURN r * 2 * atan2(sqrt(a), sqrt(1-a));
END;
$$;

DROP FUNCTION IF EXISTS public.check_in_zone(TEXT);
CREATE OR REPLACE FUNCTION public.check_in_zone(_zone_id TEXT, _lat DOUBLE PRECISION DEFAULT NULL, _lng DOUBLE PRECISION DEFAULT NULL)
RETURNS JSONB
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
  _max_m CONSTANT DOUBLE PRECISION := 500;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  END IF;
  IF _lat IS NULL OR _lng IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'GPS requerido. Activa la ubicación de tu dispositivo.');
  END IF;

  SELECT * INTO _zone FROM public.zones WHERE id = _zone_id;
  IF _zone.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Zona no encontrada.');
  END IF;
  IF _zone.guardian_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Solo el guardián puede registrarse aquí.');
  END IF;

  _dist := public.haversine_m(_lat, _lng, _zone.lat, _zone.lng);
  IF _dist > _max_m THEN
    RETURN jsonb_build_object('ok', false,
      'message', 'No estás en la zona. Estás a ' || round(_dist)::text || ' m de ' || _zone.name || ' (máx 500 m).');
  END IF;

  SELECT count(*) INTO _today_count FROM public.check_ins
   WHERE user_id = auth.uid() AND zone_id = _zone_id
     AND created_at >= date_trunc('day', now());
  IF _today_count > 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Ya registraste tu día en esta zona. Vuelve mañana.');
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
      THEN '¡7 días seguidos! ' || _zone.name || ' está oficialmente PROTEGIDA.'
      ELSE 'Día ' || _new_streak || '/7 registrado. ¡Sigue así!'
    END);
END;
$$;

DROP FUNCTION IF EXISTS public.report_cleanup(TEXT, NUMERIC, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.report_cleanup(
  _zone_id TEXT,
  _kilos NUMERIC,
  _notes TEXT,
  _photo_url TEXT,
  _lat DOUBLE PRECISION DEFAULT NULL,
  _lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _zone public.zones;
  _tons NUMERIC;
  _dist DOUBLE PRECISION;
  _reduction INT;
  _max_m CONSTANT DOUBLE PRECISION := 500;
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
    RETURN jsonb_build_object('ok', false, 'message', 'Zona no encontrada.');
  END IF;

  _dist := public.haversine_m(_lat, _lng, _zone.lat, _zone.lng);
  IF _dist > _max_m THEN
    RETURN jsonb_build_object('ok', false,
      'message', 'No estás en la zona. Estás a ' || round(_dist)::text || ' m de ' || _zone.name || ' (máx 500 m).');
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
