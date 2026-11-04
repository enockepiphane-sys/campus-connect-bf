-- Cours en ligne : un même cours peut concerner plusieurs niveaux (ex. L1, L2, L3).
-- La colonne « niveau » reste (= premier niveau) ; « niveaux » contient la liste complète.
-- Sans risque à relancer.
ALTER TABLE public.cours_en_ligne ADD COLUMN IF NOT EXISTS niveaux text[];
UPDATE public.cours_en_ligne SET niveaux = ARRAY[niveau] WHERE niveaux IS NULL OR cardinality(niveaux) = 0;
ALTER TABLE public.cours_en_ligne ALTER COLUMN niveaux SET NOT NULL;
ALTER TABLE public.cours_en_ligne DROP CONSTRAINT IF EXISTS cours_niveaux_check;
ALTER TABLE public.cours_en_ligne ADD CONSTRAINT cours_niveaux_check
  CHECK (cardinality(niveaux) BETWEEN 1 AND 9
    AND niveaux <@ ARRAY['L1','L2','L3','M1','M2','Doctorat','BTS 1','BTS 2','Autre']::text[]);
CREATE INDEX IF NOT EXISTS cours_en_ligne_niveaux_idx ON public.cours_en_ligne USING gin (niveaux);
NOTIFY pgrst, 'reload schema';
