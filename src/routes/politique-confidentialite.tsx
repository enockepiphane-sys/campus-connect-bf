import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/politique-confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — CampusLink" },
      {
        name: "description",
        content:
          "Comment CampusLink collecte, utilise et protège vos données : comptes, notes, Révision & IA, bibliothèque, opportunités et statistiques de visites.",
      },
    ],
  }),
  component: Page,
});

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="flex items-center gap-3 font-display text-xl font-bold text-foreground">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">{n}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-6 marker:text-primary">{children}</ul>;
}

function Page() {
  return (
    <PageShell title="Politique de confidentialité">
      <p className="text-sm text-muted-foreground">Dernière mise à jour : 1er novembre 2026</p>

      <p className="mt-4">
        CampusLink est une plateforme qui relie les universités, leurs administrateurs et leurs étudiants du Burkina Faso, et qui propose
        aussi des outils ouverts à tous les étudiants : Révision &amp; IA, Opportunités, Bibliothèque et Événements sociaux. Cette page
        explique, simplement, quelles données nous utilisons et pourquoi.
      </p>

      <div className="mt-5 rounded-2xl border border-primary/20 bg-primary-soft p-5">
        <p className="font-display text-lg font-bold text-foreground">En bref</p>
        <List>
          <li>Nous ne vendons jamais vos données et nous n’affichons aucune publicité.</li>
          <li>Vos notes et vos informations personnelles ne sont jamais publiques : vous seul (et l’administration de votre établissement) y avez accès.</li>
          <li>Révision &amp; IA, Opportunités, Bibliothèque et Événements sont utilisables sans compte.</li>
          <li>Les documents envoyés à l’IA sont traités par Google Gemini : n’y mettez pas d’informations personnelles.</li>
          <li>Les visites du site sont comptées de façon anonyme, sans nom ni e-mail.</li>
        </List>
      </div>

      <Section n={1} title="Qui sommes-nous ?">
        <p>
          CampusLink est édité par <strong>SWEE Social-Services</strong> (SAOUADOGO W. E. Epiphane), au Burkina Faso. Nous sommes responsables
          des données traitées sur la plateforme. Pour toute question : WhatsApp au{" "}
          <a href="https://wa.me/22657476724" className="font-semibold text-primary underline" target="_blank" rel="noopener noreferrer">
            +226 57 47 67 24
          </a>
          .
        </p>
      </Section>

      <Section n={2} title="Les données que nous collectons">
        <p className="font-semibold text-foreground">Si vous avez un compte étudiant</p>
        <List>
          <li>Nom complet, adresse e-mail et date de naissance (utilisés pour vérifier votre pré-inscription par votre établissement).</li>
          <li>Établissement, filière et niveau.</li>
          <li>Votre mot de passe, conservé sous forme chiffrée par le service d’authentification (nous ne pouvons pas le lire).</li>
          <li>Vos notes et résultats, saisis ou importés par l’administration de votre établissement.</li>
          <li>Vos réactions et commentaires sur les annonces, vos opportunités enregistrées en favoris.</li>
        </List>
        <p className="font-semibold text-foreground">Si vous êtes administrateur d’établissement</p>
        <List>
          <li>Nom, adresse e-mail, date de naissance et établissement rattaché, vérifiés lors de l’inscription.</li>
        </List>
        <p className="font-semibold text-foreground">Si vous activez les notifications</p>
        <List>
          <li>Un identifiant technique de votre navigateur ou téléphone, nécessaire pour vous envoyer les alertes.</li>
        </List>
        <p className="font-semibold text-foreground">Pour tous les visiteurs (même sans compte)</p>
        <List>
          <li>
            <strong>Statistiques de visite :</strong> un identifiant aléatoire enregistré dans votre navigateur, la section visitée
            (site, Révision &amp; IA, Opportunités, Bibliothèque), la date et l’heure, et le type d’appareil et de navigateur. Ces données ne
            sont liées ni à votre nom ni à votre e-mail.
          </li>
          <li>
            <strong>Propositions de livres :</strong> le titre, l’auteur et le commentaire que vous saisissez. Aucune identité n’est demandée.
          </li>
          <li>
            <strong>Révision &amp; IA :</strong> le document (PDF ou photo) et la question que vous envoyez, uniquement pour générer la réponse
            (voir le point 3).
          </li>
        </List>
      </Section>

      <Section n={3} title="Révision & IA : ce qui arrive à votre document">
        <p>
          Quand vous cliquez sur « Générer », votre document et votre consigne sont transmis, par un serveur de CampusLink, au service
          d’intelligence artificielle <strong>Google Gemini</strong>, qui produit le résumé, le QCM, les fiches ou la réponse.
        </p>
        <List>
          <li>CampusLink n’enregistre pas votre document ni la réponse générée.</li>
          <li>
            Google traite le contenu selon ses propres conditions. Avec l’offre gratuite de l’API Gemini, Google peut utiliser les contenus
            envoyés pour améliorer ses services. <strong>N’envoyez donc pas de données personnelles ou confidentielles</strong> (pièces
            d’identité, coordonnées, relevés de notes nominatifs, etc.).
          </li>
          <li>Pour éviter les abus, le nombre de demandes est limité par visiteur, de façon temporaire.</li>
          <li>Les réponses de l’IA peuvent contenir des erreurs : vérifiez-les avec votre cours.</li>
        </List>
      </Section>

      <Section n={4} title="Pourquoi nous utilisons ces données">
        <List>
          <li>Créer et sécuriser votre compte, et vérifier que vous êtes bien inscrit dans votre établissement.</li>
          <li>Vous montrer les annonces, emplois du temps, événements et notes qui concernent votre établissement, votre filière et votre niveau.</li>
          <li>Permettre à l’administration de gérer ses étudiants et de publier ses informations.</li>
          <li>Faire fonctionner Révision &amp; IA, Opportunités, la Bibliothèque et les Événements sociaux.</li>
          <li>Vous envoyer des notifications, si vous les avez activées.</li>
          <li>Mesurer la fréquentation de la plateforme (statistiques anonymes) et l’améliorer.</li>
          <li>Protéger la plateforme contre les abus et les robots.</li>
        </List>
        <p>Nous n’utilisons pas vos données pour vous profiler à des fins publicitaires et nous ne les revendons jamais.</p>
      </Section>

      <Section n={5} title="Qui peut voir vos données ?">
        <List>
          <li>
            <strong>Vous :</strong> vous consultez vos propres informations et vos propres notes. Un étudiant ne peut jamais voir les notes
            d’un autre étudiant.
          </li>
          <li>
            <strong>L’administration de votre établissement :</strong> elle gère les étudiants, les annonces, les emplois du temps et les
            résultats de son établissement uniquement. Un administrateur ne peut pas consulter les données d’un autre établissement.
          </li>
          <li>
            <strong>L’équipe CampusLink :</strong> uniquement pour faire fonctionner, entretenir et sécuriser la plateforme.
          </li>
          <li>
            <strong>Le public :</strong> seuls les contenus destinés à être publics sont visibles par tous (offres d’opportunités publiées,
            documents de la bibliothèque, événements). Ils ne contiennent aucune donnée personnelle d’étudiant.
          </li>
        </List>
      </Section>

      <Section n={6} title="Les services techniques que nous utilisons">
        <List>
          <li>
            <strong>Supabase :</strong> authentification, base de données et stockage des fichiers.
          </li>
          <li>
            <strong>Vercel :</strong> hébergement du site.
          </li>
          <li>
            <strong>Google (Gemini) :</strong> uniquement pour la fonction Révision &amp; IA, comme expliqué au point 3.
          </li>
        </List>
        <p>Ces prestataires traitent les données pour notre compte, afin de faire fonctionner la plateforme.</p>
      </Section>

      <Section n={7} title="Cookies et stockage dans votre navigateur">
        <p>CampusLink utilise le stockage de votre navigateur uniquement pour son fonctionnement :</p>
        <List>
          <li>garder votre session de connexion ;</li>
          <li>mémoriser vos préférences d’affichage (par exemple le mode sombre) ;</li>
          <li>enregistrer l’identifiant anonyme utilisé pour compter les visiteurs ;</li>
          <li>retenir que vous avez fermé la proposition d’installer l’application.</li>
        </List>
        <p>Nous n’utilisons pas de cookies publicitaires. Vous pouvez effacer ces données à tout moment dans les réglages de votre navigateur (vous serez alors déconnecté).</p>
      </Section>

      <Section n={8} title="Sécurité">
        <List>
          <li>Les espaces sont séparés : étudiants, administrateurs d’établissement et super administrateur n’ont pas les mêmes droits.</li>
          <li>L’accès aux espaces personnels nécessite une connexion, et les règles d’accès sont appliquées directement au niveau de la base de données.</li>
          <li>Les opérations sensibles (gestion des étudiants, publication, notes) sont réservées aux comptes autorisés.</li>
          <li>Les informations personnelles et les résultats ne sont jamais affichés publiquement.</li>
        </List>
        <p>Aucun système n’est infaillible. Si vous constatez un problème de sécurité, prévenez-nous rapidement par WhatsApp.</p>
      </Section>

      <Section n={9} title="Combien de temps gardons-nous vos données ?">
        <List>
          <li>Les données de compte et la vie académique sont conservées tant que votre compte et votre établissement utilisent CampusLink.</li>
          <li>Les statistiques de visite sont conservées de façon anonyme pour suivre la fréquentation.</li>
          <li>Les propositions de livres sont gardées le temps d’être examinées.</li>
          <li>Les documents envoyés à Révision &amp; IA ne sont pas conservés par CampusLink.</li>
        </List>
      </Section>

      <Section n={10} title="Vos droits">
        <p>
          Conformément à la réglementation applicable au Burkina Faso en matière de protection des données personnelles, vous pouvez demander
          à accéder à vos données, à les faire corriger, à les faire supprimer ou vous opposer à leur utilisation. Pour les notes et les
          informations académiques, certaines corrections doivent d’abord être faites par l’administration de votre établissement.
        </p>
        <p>
          Pour exercer vos droits, écrivez-nous sur WhatsApp au{" "}
          <a href="https://wa.me/22657476724" className="font-semibold text-primary underline" target="_blank" rel="noopener noreferrer">
            +226 57 47 67 24
          </a>{" "}
          en indiquant votre nom et l’e-mail de votre compte.
        </p>
      </Section>

      <Section n={11} title="Modifications de cette politique">
        <p>
          Nous pouvons mettre à jour cette politique lorsque la plateforme évolue. La date de dernière mise à jour est indiquée en haut de
          cette page.
        </p>
      </Section>

      <Section n={12} title="Nous contacter">
        <List>
          <li>
            Site web : <strong>www.campuslink-bf.app</strong>
          </li>
          <li>
            Support &amp; contact WhatsApp :{" "}
            <a href="https://wa.me/22657476724" className="font-semibold text-primary underline" target="_blank" rel="noopener noreferrer">
              +226 57 47 67 24
            </a>
          </li>
        </List>
      </Section>

      <div className="mt-10 border-t border-border pt-6 text-center">
        <p className="text-base font-semibold text-foreground">SWEE Social-Services</p>
        <p className="mt-1 text-xs text-muted-foreground">© SAOUADOGO W. E. Epiphane</p>
      </div>
    </PageShell>
  );
}
