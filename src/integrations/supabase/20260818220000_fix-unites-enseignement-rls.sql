-- Correction policy trop permissive sur unites_enseignement (USING true)
-- Remplacée par la vérification établissement actif, cohérent avec filieres/niveaux

DROP POLICY IF EXISTS "ue_select_etablissement" ON public.unites_enseignement;

CREATE POLICY "ue_select_etablissement" ON public.unites_enseignement
FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.niveaux n
  JOIN public.filieres f ON f.id = n.filiere_id
  JOIN public.etablissements e ON e.id = f.etablissement_id
  WHERE n.id = unites_enseignement.niveau_id AND e.statut = 'actif'
));
