
-- check_in_zone: racha de 3 días + insignia
CREATE OR REPLACE FUNCTION public.check_in_zone(_zone_id text, _lat double precision DEFAULT NULL, _lng double precision DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _zone public.zones;
  _new_streak INT;
  _became_protected BOOLEAN := false;
  _dist DOUBLE PRECISION;
  _today_count INT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.'); END IF;
  IF _lat IS NULL OR _lng IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'GPS requerido.'); END IF;

  SELECT * INTO _zone FROM public.zones WHERE id = _zone_id;
  IF _zone.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Territorio no encontrado.'); END IF;
  IF _zone.guardian_id <> auth.uid() THEN RETURN jsonb_build_object('ok', false, 'message', 'Solo el guardián puede registrarse aquí.'); END IF;

  _dist := public.haversine_m(_lat, _lng, _zone.lat, _zone.lng);
  IF _dist > _zone.radius_m THEN
    RETURN jsonb_build_object('ok', false, 'message', 'No estás en el territorio. Estás a ' || round(_dist)::text || ' m (radio ' || _zone.radius_m || ' m).');
  END IF;

  SELECT count(*) INTO _today_count FROM public.check_ins
   WHERE user_id = auth.uid() AND zone_id = _zone_id AND created_at >= date_trunc('day', now());
  IF _today_count > 0 THEN RETURN jsonb_build_object('ok', false, 'message', 'Ya registraste tu día aquí. Vuelve mañana.'); END IF;

  _new_streak := LEAST(3, COALESCE(_zone.streak, 0) + 1);
  IF _new_streak >= 3 AND _zone.status <> 'protected' THEN _became_protected := true; END IF;

  UPDATE public.zones SET
    streak = _new_streak,
    status = CASE WHEN _new_streak >= 3 THEN 'protected'::zone_status ELSE 'vulnerable'::zone_status END,
    last_visit = now()
  WHERE id = _zone_id;

  INSERT INTO public.check_ins (user_id, zone_id) VALUES (auth.uid(), _zone_id);

  IF _became_protected THEN
    UPDATE public.profiles SET badge = 'Guardián Oficial' WHERE id = auth.uid() AND (badge IS NULL OR badge = 'Aprendiz del Mar');
  END IF;

  RETURN jsonb_build_object('ok', true,
    'message', CASE WHEN _became_protected
      THEN '¡3 días seguidos! ' || _zone.name || ' está oficialmente PROTEGIDA. Ganaste la insignia Guardián Oficial.'
      ELSE 'Día ' || _new_streak || '/3 registrado. ¡Sigue así!' END);
END; $$;

-- claim_territory: takeover si más toneladas Y dueño inactivo 3+ días (o zona aún vulnerable)
CREATE OR REPLACE FUNCTION public.claim_territory(_lat double precision, _lng double precision, _name text, _radius_m integer DEFAULT 200)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me public.profiles;
  _conflict public.zones;
  _conflict_owner public.profiles;
  _new_id text;
  _radius int;
  _days_idle numeric;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.'); END IF;
  IF _lat IS NULL OR _lng IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'GPS requerido.'); END IF;
  IF _name IS NULL OR length(trim(_name)) = 0 THEN RETURN jsonb_build_object('ok', false, 'message', 'Ponle un nombre al territorio.'); END IF;

  _radius := COALESCE(_radius_m, 200);
  IF _radius < 50 THEN _radius := 50; END IF;
  IF _radius > 1000 THEN _radius := 1000; END IF;

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

    -- Necesitas más toneladas siempre
    IF _me.total_tons <= COALESCE(_conflict_owner.total_tons, 0) THEN
      RETURN jsonb_build_object('ok', false,
        'message', 'Aquí gobierna ' || COALESCE(_conflict_owner.display_name, 'otro guardián')
                || ' con ' || COALESCE(_conflict_owner.total_tons, 0) || ' t. Recolecta más para retarle.');
    END IF;

    -- Si la zona está protegida, sólo se puede arrebatar si el dueño la descuidó 3+ días
    IF _conflict.status = 'protected' AND _days_idle < 3 THEN
      RETURN jsonb_build_object('ok', false,
        'message', '"' || _conflict.name || '" está protegida y ' || COALESCE(_conflict_owner.display_name, 'su guardián')
                || ' la cuidó hace ' || round(_days_idle, 1) || ' días. Vuelve cuando lleve 3 días sin check-in.');
    END IF;

    UPDATE public.profiles SET zones_owned = GREATEST(0, zones_owned - 1) WHERE id = _conflict.guardian_id;
    UPDATE public.zones SET
      guardian_id = _me.id, name = _name, status = 'vulnerable', streak = 1,
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
  VALUES (_new_id, _name, 'coastal', _radius, _lat, _lng, _me.id, 'vulnerable', 1, _me.total_tons, now(), 50, _radius);

  UPDATE public.profiles SET zones_owned = zones_owned + 1 WHERE id = _me.id;

  RETURN jsonb_build_object('ok', true,
    'message', '¡"' || _name || '" es tuyo! Mantenlo 3 días para protegerlo.',
    'zone_id', _new_id);
END; $$;
