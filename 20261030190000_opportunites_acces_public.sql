-- Rend les opportunités PUBLIÉES lisibles par tous les visiteurs, même sans compte.
-- Les brouillons, les favoris et la gestion des offres restent protégés.
BEGIN;
GRANT SELECT ON public.opportunites TO anon;
CREATE POLICY opportunites_lecture_publique ON public.opportunites
  FOR SELECT TO anon USING (publie);
COMMIT;
