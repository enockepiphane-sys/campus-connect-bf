-- ============================================================
-- Simplification du système super admin
-- - Crée/met à jour le compte Supabase Auth pour enocksaouadogo@gmail.com
--   avec email confirmé automatiquement (pas d'email de vérification)
-- - Lie ce user_id dans la table super_admins
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Chercher si l'utilisateur Auth existe déjà
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'enocksaouadogo@gmail.com';

  IF v_user_id IS NULL THEN
    -- Créer le compte avec email confirmé automatiquement
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'enocksaouadogo@gmail.com',
      crypt('@#epiphane226#@', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Créer l'identité email associée (nécessaire pour signInWithPassword)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'enocksaouadogo@gmail.com', 'email_verified', true),
      'email',
      'enocksaouadogo@gmail.com',
      now(),
      now(),
      now()
    );

  ELSE
    -- Mettre à jour le mot de passe et confirmer l'email si nécessaire
    UPDATE auth.users SET
      encrypted_password = crypt('@#epiphane226#@', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- S'assurer que la ligne existe dans super_admins, avec user_id lié et inscrit = true
  INSERT INTO public.super_admins (email, user_id, inscrit)
  VALUES ('enocksaouadogo@gmail.com', v_user_id, true)
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    inscrit = true;

END $$;
