-- Nueva regla: la zona es tuya de inmediato; sin racha de 3 días.
DROP FUNCTION IF EXISTS public.claim_territory(double precision, double precision, text, integer);

CREATE OR REPLACE FUNCTION public.claim_territory(_lat double precision, _lng double precision, _name text, _radius_m integer DEFAULT 200, _kind text DEFAULT 'coastal'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _me public.profiles;
  _conflict public.zones;
  _conflict_owner public.profiles;
  _new_id text;
  _radius int;
  _zkind public.zone_kind;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.'); END IF;
  IF _lat IS NULL OR _lng IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'GPS requerido.'); END IF;
  IF _name IS NULL OR length(trim(_name)) = 0 THEN RETURN jsonb_build_object('ok', false, 'message', 'Ponle un nombre al territorio.'); END IF;

  _radius := COALESCE(_radius_m, 200);
  IF _radius < 50 THEN _radius := 50; END IF;
  IF _radius > 1000 THEN _radius := 1000; END IF;

  BEGIN
    _zkind := COALESCE(_kind, 'coastal')::public.zone_kind;
  EXCEPTION WHEN others THEN
    _zkind := 'coastal'::public.zone_kind;
  END;

  SELECT * INTO _me FROM public.profiles WHERE id = auth.uid();

  SELECT z.* INTO _conflict FROM public.zones z
  WHERE public.haversine_m(z.lat, z.lng, _lat, _lng) <= z.radius_m
  ORDER BY public.haversine_m(z.lat, z.lng, _lat, _lng) ASC LIMIT 1;

  IF _conflict.id IS NOT NULL THEN
    IF _conflict.guardian_id = _me.id THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Ya eres guardián de "' || _conflict.name || '" en este punto.', 'zone_id', _conflict.id);
    END IF;

    SELECT * INTO _conflict_owner FROM public.profiles WHERE id = _conflict.guardian_id;

    -- Única regla: más kilos gana. Los kilos de cada quien NO cambian.
    IF _me.total_tons <= COALESCE(_conflict_owner.total_tons, 0) THEN
      RETURN jsonb_build_object('ok', false,
        'message', 'Aquí gobierna ' || COALESCE(_conflict_owner.display_name, 'otro guardián')
                || ' con ' || round(COALESCE(_conflict_owner.total_tons, 0) * 1000)::text || ' kg. Recolecta más para arrebatársela.');
    END IF;

    UPDATE public.profiles SET zones_owned = GREATEST(0, zones_owned - 1) WHERE id = _conflict.guardian_id;
    UPDATE public.zones SET
      guardian_id = _me.id, name = _name, kind = _zkind, status = 'protected', streak = 0,
      conquered_with_tons = _me.total_tons, last_visit = now(),
      radius_m = _radius, lat = _lat, lng = _lng
    WHERE id = _conflict.id;
    UPDATE public.profiles SET zones_owned = zones_owned + 1 WHERE id = _me.id;

    RETURN jsonb_build_object('ok', true,
      'message', '¡Le arrebataste "' || _name || '" a ' || COALESCE(_conflict_owner.display_name, 'otro guardián') || '! Es oficialmente tuya.',
      'zone_id', _conflict.id);
  END IF;

  _new_id := gen_random_uuid()::text;
  INSERT INTO public.zones (id, name, kind, meters, lat, lng, guardian_id, status, streak, conquered_with_tons, last_visit, hazard_level, radius_m)
  VALUES (_new_id, _name, _zkind, _radius, _lat, _lng, _me.id, 'protected', 0, _me.total_tons, now(), 50, _radius);

  UPDATE public.profiles SET zones_owned = zones_owned + 1 WHERE id = _me.id;

  RETURN jsonb_build_object('ok', true,
    'message', '¡"' || _name || '" es oficialmente tuya!',
    'zone_id', _new_id);
END; $function$;

-- Check-in: solo historial de rondas, sin racha ni cambio de estado.
CREATE OR REPLACE FUNCTION public.check_in_zone(_zone_id text, _lat double precision DEFAULT NULL::double precision, _lng double precision DEFAULT NULL::double precision)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _zone public.zones;
  _dist DOUBLE PRECISION;
  _today_count INT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.'); END IF;
  IF _lat IS NULL OR _lng IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'GPS requerido.'); END IF;

  SELECT * INTO _zone FROM public.zones WHERE id = _zone_id;
  IF _zone.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Territorio no encontrado.'); END IF;
  IF _zone.guardian_id <> auth.uid() THEN RETURN jsonb_build_object('ok', false, 'message', 'Solo el guardián puede registrar rondas aquí.'); END IF;

  _dist := public.haversine_m(_lat, _lng, _zone.lat, _zone.lng);
  IF _dist > _zone.radius_m THEN
    RETURN jsonb_build_object('ok', false, 'message', 'No estás en el territorio. Estás a ' || round(_dist)::text || ' m (radio ' || _zone.radius_m || ' m).');
  END IF;

  SELECT count(*) INTO _today_count FROM public.check_ins
   WHERE user_id = auth.uid() AND zone_id = _zone_id AND created_at >= date_trunc('day', now());
  IF _today_count > 0 THEN RETURN jsonb_build_object('ok', false, 'message', 'Ya registraste tu ronda de hoy aquí.'); END IF;

  UPDATE public.zones SET last_visit = now() WHERE id = _zone_id;
  INSERT INTO public.check_ins (user_id, zone_id) VALUES (auth.uid(), _zone_id);

  RETURN jsonb_build_object('ok', true, 'message', 'Ronda registrada en ' || _zone.name || '. ¡Sigue corriendo!');
END; $function$;