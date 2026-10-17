CREATE TYPE public.app_role AS ENUM ('admin','tester');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

CREATE OR REPLACE FUNCTION public.qa_action(p_action text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE u uuid := auth.uid();
BEGIN
  IF u IS NULL OR NOT public.has_role(u, 'tester') THEN RAISE EXCEPTION 'Not a tester'; END IF;
  IF p_action = 'fill' THEN
    UPDATE profiles SET monere_energy=100, last_energy_drain=now() WHERE user_id=u;
  ELSIF p_action = 'reset_claim' THEN
    UPDATE profiles SET last_energy_claim_date=NULL, last_care_claim_date=NULL, daily_care_claimed=false WHERE user_id=u;
  ELSIF p_action = 'topup' THEN
    INSERT INTO point_credits(user_id,source,reference,points) VALUES (u,'qa','qa:'||gen_random_uuid(),99999);
    INSERT INTO token_credits(user_id,source,reference,tokens) VALUES (u,'qa','qa:'||gen_random_uuid(),99999);
  ELSIF p_action = 'club' THEN
    UPDATE profiles SET subscription_tier='monere_club' WHERE user_id=u;
  ELSE RAISE EXCEPTION 'Unknown action';
  END IF;
  RETURN jsonb_build_object('ok', true);
END $$;
REVOKE ALL ON FUNCTION public.qa_action(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.qa_action(text) TO authenticated;

INSERT INTO public.user_roles(user_id, role) VALUES ('73349d52-5ba0-43dc-a64d-79b161f41324','tester') ON CONFLICT DO NOTHING;