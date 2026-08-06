CREATE POLICY "Affiches lisibles par les connectes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'affiches-evenements');

CREATE POLICY "Admins peuvent ajouter des affiches"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'affiches-evenements' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins peuvent modifier des affiches"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'affiches-evenements' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins peuvent supprimer des affiches"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'affiches-evenements' AND public.has_role(auth.uid(), 'admin'::public.app_role));