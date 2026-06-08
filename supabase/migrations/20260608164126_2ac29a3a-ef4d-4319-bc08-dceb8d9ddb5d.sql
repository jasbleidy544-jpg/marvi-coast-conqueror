CREATE OR REPLACE FUNCTION public.claim_territory(_lat double precision, _lng double precision, _name text, _radius_m integer DEFAULT 200, _kind text DEFAULT 'coastal')
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
  _days_idle numeric;
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
      RETURN jsonb_build_object('ok', false, 'message', 'Ya eres guardián de "' || _conflict.name || '" en este punto.');
    END IF;
    SELECT * INTO _conflict_owner FROM public.profiles WHERE id = _conflict.guardian_id;

    _days_idle := EXTRACT(EPOCH FROM (now() - COALESCE(_conflict.last_visit, _conflict.created_at))) / 86400.0;

    IF _me.total_tons <= COALESCE(_conflict_owner.total_tons, 0) THEN
      RETURN jsonb_build_object('ok', false,
        'message', 'Aquí gobierna ' || COALESCE(_conflict_owner.display_name, 'otro guardián')
                || ' con ' || COALESCE(_conflict_owner.total_tons, 0) || ' t. Recolecta más para retarle.');
    END IF;

    IF _conflict.status = 'protected' AND _days_idle < 3 THEN
      RETURN jsonb_build_object('ok', false,
        'message', '"' || _conflict.name || '" está protegida y ' || COALESCE(_conflict_owner.display_name, 'su guardián')
                || ' la cuidó hace ' || round(_days_idle, 1) || ' días. Vuelve cuando lleve 3 días sin check-in.');
    END IF;

    UPDATE public.profiles SET zones_owned = GREATEST(0, zones_owned - 1) WHERE id = _conflict.guardian_id;
    UPDATE public.zones SET
      guardian_id = _me.id, name = _name, kind = _zkind, status = 'vulnerable', streak = 1,
      conquered_with_tons = _me.total_tons, last_visit = now(),
      hazard_level = GREATEST(20, hazard_level - 30),
      radius_m = _radius, lat = _lat, lng = _lng
    WHERE id = _conflict.id;
    UPDATE public.profiles SET zones_owned = zones_owned + 1 WHERE id = _me.id;
    RETURN jsonb_build_object('ok', true,
      'message', '¡Conquistaste "' || _name || '" a ' || COALESCE(_conflict_owner.display_name, 'otro guardián') || '!',
      'zone_id', _conflict.id);
  END IF;

  _new_id := gen_random_uuid()::text;
  INSERT INTO public.zones (id, name, kind, meters, lat, lng, guardian_id, status, streak, conquered_with_tons, last_visit, hazard_level, radius_m)
  VALUES (_new_id, _name, _zkind, _radius, _lat, _lng, _me.id, 'vulnerable', 1, _me.total_tons, now(), 50, _radius);

  UPDATE public.profiles SET zones_owned = zones_owned + 1 WHERE id = _me.id;

  RETURN jsonb_build_object('ok', true,
    'message', '¡"' || _name || '" es tuyo! Mantenlo 3 días para protegerlo.',
    'zone_id', _new_id);
END; $function$;