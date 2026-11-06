-- CampusLink — Notifications push pour TOUS les visiteurs (même sans compte)
-- À EXÉCUTER UNE FOIS dans Supabase (SQL Editor -> New query -> Run). Peut être relancé sans risque.
BEGIN;

-- Un visiteur non inscrit n'a pas d'identifiant utilisateur : user_id devient facultatif.
ALTER TABLE public.push_subscriptions ALTER COLUMN user_id DROP NOT NULL;

-- Enregistrement d'un abonnement (visiteur ou connecté). Si la personne est connectée, l'abonnement
-- est rattaché à son compte ; sinon user_id reste vide. Fonction sécurisée : pas d'accès direct à la table.
CREATE OR REPLACE FUNCTION public.enregistrer_abonnement_push(p_endpoint text, p_p256dh text, p_auth text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_endpoint IS NULL OR length(p_endpoint) NOT BETWEEN 10 AND 2000
     OR p_endpoint NOT LIKE 'https://%'
     OR p_p256dh IS NULL OR length(p_p256dh) > 200
     OR p_auth IS NULL OR length(p_auth) > 100 THEN
    RAISE EXCEPTION 'abonnement invalide';
  END IF;
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES (auth.uid(), p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_id = COALESCE(auth.uid(), public.push_subscriptions.user_id),
        updated_at = now();
END $$;
GRANT EXECUTE ON FUNCTION public.enregistrer_abonnement_push(text, text, text) TO anon, authenticated;

-- Désabonnement (la personne retire elle-même son appareil).
CREATE OR REPLACE FUNCTION public.supprimer_abonnement_push(p_endpoint text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint;
$$;
GRANT EXECUTE ON FUNCTION public.supprimer_abonnement_push(text) TO anon, authenticated;

COMMIT;
