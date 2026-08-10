/**
 * Répare les comptes super admin qui ont été créés manuellement en SQL
 * (via les migrations `20260716130000_simplify-super-admin-auth.sql` et
 * `20260719060147_add_campuslink_super_admin.sql.sql`).
 *
 * Ces comptes ont été insérés directement dans `auth.users` avec un mot de
 * passe chiffré à la main (`crypt(... , gen_salt('bf'))`). Cela peut provoquer
 * des connexions « mot de passe incorrect » à cause :
 *   - de facteurs de coût bcrypt / formats de hash incohérents avec GoTrue,
 *   - de lignes `auth.identities` mal formées ou manquantes,
 *   - de doublons de comptes pour la même adresse.
 *
 * Ce script utilise l'API Admin de Supabase (clé service_role) pour :
 *   1. lister les comptes correspondant aux emails super admin,
 *   2. signaler les éventuels doublons,
 *   3. re-hacher proprement le mot de passe via GoTrue lui-même
 *      (`admin.updateUserById`), en confirmant l'email.
 *
 * ⚠️  À exécuter manuellement, JAMAIS depuis le code de l'app.
 *
 * Variables d'environnement requises :
 *   - SUPABASE_URL                 (ex: https://etahlugfsoxsaxcmelzq.supabase.co)
 *   - SUPABASE_SERVICE_ROLE_KEY    (clé service_role, dashboard → Settings → API)
 *
 * Utilisation :
 *   # mode diagnostic (par défaut) — n'écrit rien :
 *   node scripts/repair-super-admins.mjs
 *
 *   # mode réparation — réinitialise réellement les mots de passe :
 *   node scripts/repair-super-admins.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Comptes super admin à réparer. Adaptez les mots de passe si nécessaire :
// ce sont ceux définis dans les migrations SQL d'origine.
// ---------------------------------------------------------------------------
const SUPER_ADMINS = [
  { email: "enocksaouadogo@gmail.com", password: "@#epiphane226#@" },
  { email: "campuslink226@gmail.com", password: "@#campuslink226#@" },
];

const APPLY = process.argv.includes("--apply");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "[repair] Variables manquantes. Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Récupère tous les users d'un email donné (pour détecter les doublons). */
async function findUsersByEmail(email) {
  const matches = [];
  let page = 1;
  const perPage = 200;
  // listUsers est paginé ; on parcourt jusqu'à épuisement.
  // (le nombre total de users reste raisonnable pour cette app)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      if ((u.email || "").toLowerCase() === email.toLowerCase()) matches.push(u);
    }
    if (users.length < perPage) break;
    page += 1;
  }
  return matches;
}

async function run() {
  console.log(
    `[repair] Mode : ${APPLY ? "RÉPARATION (--apply)" : "DIAGNOSTIC (lecture seule)"}`,
  );

  for (const { email, password } of SUPER_ADMINS) {
    console.log(`\n[repair] === ${email} ===`);
    let users;
    try {
      users = await findUsersByEmail(email);
    } catch (e) {
      console.error(`[repair] Erreur listUsers pour ${email}:`, e.message);
      continue;
    }

    if (users.length === 0) {
      console.warn(`[repair] Aucun compte trouvé pour ${email}.`);
      continue;
    }
    if (users.length > 1) {
      console.warn(
        `[repair] ⚠️  ${users.length} comptes trouvés pour ${email} (doublon probable) :`,
      );
      users.forEach((u) =>
        console.warn(
          `          - id=${u.id} created_at=${u.created_at} confirmé=${!!u.email_confirmed_at} identities=${(u.identities || []).length}`,
        ),
      );
      console.warn(
        "          Résolvez le doublon manuellement (conservez le plus ancien lié à super_admins), puis relancez.",
      );
    }

    for (const u of users) {
      const identities = u.identities || [];
      const hasEmailIdentity = identities.some((i) => i.provider === "email");
      console.log(
        `[repair] user id=${u.id} confirmé=${!!u.email_confirmed_at} identité_email=${hasEmailIdentity}`,
      );

      if (!APPLY) {
        console.log(
          "[repair] (diagnostic) mot de passe NON modifié. Relancez avec --apply pour réparer.",
        );
        continue;
      }

      // GoTrue re-hache proprement le mot de passe avec ses propres paramètres,
      // ce qui écrase le hash SQL manuel et fiabilise signInWithPassword.
      const { error } = await admin.auth.admin.updateUserById(u.id, {
        password,
        email_confirm: true,
      });
      if (error) {
        console.error(`[repair] ❌ Échec updateUserById id=${u.id}:`, error.message);
      } else {
        console.log(`[repair] ✅ Mot de passe réinitialisé proprement pour id=${u.id}`);
      }
    }
  }

  console.log("\n[repair] Terminé.");
}

run().catch((e) => {
  console.error("[repair] Erreur fatale:", e);
  process.exit(1);
});
