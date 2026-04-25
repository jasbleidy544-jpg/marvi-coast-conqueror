
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Tighten zones UPDATE: only the current guardian, OR conquering an unowned/lower-tons zone
DROP POLICY IF EXISTS "Authenticated can update zones" ON public.zones;

CREATE POLICY "Guardian can update own zone"
  ON public.zones FOR UPDATE TO authenticated
  USING (guardian_id = auth.uid())
  WITH CHECK (guardian_id = auth.uid());

-- Conquest happens via SECURITY DEFINER RPC (created below), so no broad UPDATE needed.

-- Tighten reports bucket: do not allow listing
DROP POLICY IF EXISTS "Report photos public read" ON storage.objects;
-- Public read by exact path is still allowed via the public URL signing; we restrict listing.
CREATE POLICY "Report photos read by authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'reports');

-- ============ RPC: conquer_zone ============
CREATE OR REPLACE FUNCTION public.conquer_zone(_zone_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me public.profiles;
  _zone public.zones;
  _owner public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  END IF;

  SELECT * INTO _me FROM public.profiles WHERE id = auth.uid();
  SELECT * INTO _zone FROM public.zones WHERE id = _zone_id;

  IF _zone.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Zona no encontrada.');
  END IF;

  IF _zone.guardian_id IS NOT NULL THEN
    SELECT * INTO _owner FROM public.profiles WHERE id = _zone.guardian_id;
    IF _owner.id = _me.id THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Ya eres el guardián de esta zona.');
    END IF;
    IF _me.total_tons <= _owner.total_tons THEN
      RETURN jsonb_build_object('ok', false,
        'message', 'Necesitas más toneladas que ' || _owner.display_name || ' (' || _owner.total_tons || ' t).');
    END IF;
    -- decrement old owner
    UPDATE public.profiles SET zones_owned = GREATEST(0, zones_owned - 1) WHERE id = _owner.id;
  END IF;

  UPDATE public.zones SET
    guardian_id = _me.id,
    status = 'vulnerable',
    streak = 1,
    conquered_with_tons = _me.total_tons,
    last_visit = now(),
    hazard_level = GREATEST(20, hazard_level - 30)
  WHERE id = _zone_id;

  UPDATE public.profiles SET zones_owned = zones_owned + 1 WHERE id = _me.id;

  RETURN jsonb_build_object('ok', true, 'message', '¡' || _zone.name || ' es tuya! Mantenla 7 días para protegerla.');
END;
$$;

-- ============ RPC: report_cleanup ============
CREATE OR REPLACE FUNCTION public.report_cleanup(_zone_id TEXT, _kilos NUMERIC, _notes TEXT, _photo_url TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tons NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  END IF;
  IF _kilos <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Cantidad inválida.');
  END IF;

  _tons := _kilos / 1000.0;

  INSERT INTO public.reports (user_id, zone_id, kilos, notes, photo_url)
  VALUES (auth.uid(), _zone_id, _kilos, _notes, _photo_url);

  UPDATE public.zones SET
    total_tons_collected = total_tons_collected + _tons,
    hazard_level = GREATEST(0, hazard_level - LEAST(20, (_kilos / 5)::int)),
    last_visit = now()
  WHERE id = _zone_id;

  UPDATE public.profiles SET total_tons = total_tons + _tons WHERE id = auth.uid();

  RETURN jsonb_build_object('ok', true,
    'message', 'Registrados ' || _kilos || ' kg (' || round(_tons, 3) || ' t). ¡Tu poder de conquista creció!');
END;
$$;

-- ============ RPC: check_in_zone (streak) ============
CREATE OR REPLACE FUNCTION public.check_in_zone(_zone_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _zone public.zones;
  _new_streak INT;
  _became_protected BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  END IF;
  SELECT * INTO _zone FROM public.zones WHERE id = _zone_id;
  IF _zone.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Zona no encontrada.');
  END IF;
  IF _zone.guardian_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Solo el guardián puede registrarse aquí.');
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
