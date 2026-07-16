-- ============================================================
-- Correction sécurité : policy INSERT sur demandes_partenariat
-- ============================================================
-- Problème : WITH CHECK (true) permettait à n'importe qui (via
-- appel API direct en contournant le formulaire) d'insérer une
-- demande avec statut='accepte' ou 'refuse' d'emblée.
--
-- Fix : restreindre le WITH CHECK à statut = 'en_attente' pour
-- que seul le super-admin puisse modifier le statut (via l'UPDATE
-- policy existante), jamais l'auteur de la demande à l'insertion.
-- ============================================================

DROP POLICY IF EXISTS "Tout le monde peut soumettre une demande" ON public.demandes_partenariat;

CREATE POLICY "Tout le monde peut soumettre une demande"
ON public.demandes_partenariat FOR INSERT TO anon, authenticated
WITH CHECK (statut = 'en_attente');
