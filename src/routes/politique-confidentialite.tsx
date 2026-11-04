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
          "Comment CampusLink utilise et protège vos données : comptes, notes, cours en ligne, bibliothèque, marché étudiant, parrainage et Révision & IA.",
      },
      { property: "og:title", content: "Politique de confidentialité — CampusLink" },
      { property: "og:description", content: "Comment CampusLink utilise et protège vos données personnelles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
      <p className="text-sm text-muted-foreground">Dernière mise à jour : 4 novembre 2026</p>

      <p className="mt-4">
        CampusLink est une plateforme qui relie les universités, leurs administrateurs et leurs étudiants du Burkina Faso, et qui propose
        aussi des outils ouverts à tous les étudiants : Révision &amp; IA, Cours en ligne, Bibliothèque, Opportunités, Guide du nouveau
        bachelier, Marché étudiant et Événements sociaux. Cette page explique, simplement, quelles données nous utilisons et pourquoi.
      </p>

      <div className="mt-5 rounded-2xl border border-primary/20 bg-primary-soft p-5">
        <p className="font-display text-lg font-bold text-foreground">En bref</p>
        <List>
          <li>Nous ne vendons jamais vos données et nous n’affichons aucune publicité ciblée.</li>
          <li>Vos notes et vos informations personnelles ne sont jamais publiques : vous seul (et l’administration de votre établissement) y avez accès.</li>
          <li>Un compte CampusLink gratuit suffit pour utiliser les outils étudiants. Les événements sociaux sont visibles par tous.</li>
          <li>N’envoyez pas d’informations personnelles ou confidentielles dans les documents confiés à Révision &amp; IA.</li>
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
        <p className="font-semibold text-foreground">Si vous avez un compte CampusLink</p>
        <List>
          <li>Votre nom, votre numéro de téléphone et, si vous le souhaitez, une adresse e-mail pour récupérer votre compte.</li>
          <li>Votre mot de passe, conservé sous forme chiffrée (personne ne peut le lire, pas même notre équipe).</li>
          <li>Les contenus que vous publiez volontairement : annonces du Marché étudiant, propositions de livres, favoris.</li>
          <li>Pour le parrainage : votre lien personnel, les inscriptions faites grâce à ce lien et vos téléchargements débloqués.</li>
        </List>
        <p className="font-semibold text-foreground">Si vous avez un compte étudiant d’établissement</p>
        <List>
          <li>Nom complet, adresse e-mail et date de naissance (utilisés pour vérifier votre pré-inscription par votre établissement).</li>
          <li>Établissement, filière et niveau.</li>
          <li>Vos notes et résultats, saisis ou importés par l’administration de votre établissement.</li>
          <li>Vos réactions et commentaires sur les annonces.</li>
        </List>
        <p className="font-semibold text-foreground">Si vous êtes administrateur d’établissement</p>
        <List>
          <li>Nom, adresse e-mail, date de naissance et établissement rattaché, vérifiés lors de l’inscription.</li>
        </List>
        <p className="font-semibold text-foreground">Si vous activez les notifications</p>
        <List>
          <li>Un identifiant technique de votre téléphone ou navigateur, nécessaire pour vous envoyer les alertes.</li>
        </List>
        <p className="font-semibold text-foreground">Si vous utilisez Révision &amp; IA</p>
        <List>
          <li>Le document (PDF ou photo) et la consigne que vous envoyez, uniquement le temps de générer la réponse (voir le point 3).</li>
        </List>
      </Section>

      <Section n={3} title="Révision & IA : ce qui arrive à votre document">
        <p>
          Quand vous cliquez sur « Générer », votre document et votre consigne sont analysés par un service d’intelligence artificielle afin de
          produire le résumé, le QCM, les fiches ou la réponse demandée.
        </p>
        <List>
          <li>CampusLink n’enregistre pas votre document ni la réponse générée.</li>
          <li>
            <strong>N’envoyez pas de données personnelles ou confidentielles</strong> (pièces d’identité, coordonnées, relevés de notes
            nominatifs, etc.).
          </li>
          <li>Pour éviter les abus, le nombre de demandes est limité de façon temporaire.</li>
          <li>Les réponses d’IA CampusLink peuvent contenir des erreurs : vérifiez-les avec votre cours.</li>
        </List>
      </Section>

      <Section n={4} title="Pourquoi nous utilisons ces données">
        <List>
          <li>Créer et sécuriser votre compte, et vérifier, le cas échéant, votre inscription dans votre établissement.</li>
          <li>Vous montrer les annonces, emplois du temps, événements et notes qui concernent votre établissement, votre filière et votre niveau.</li>
          <li>Faire fonctionner les outils étudiants : cours en ligne, bibliothèque, opportunités, guide, marché, événements et Révision &amp; IA.</li>
          <li>Gérer le parrainage, vérifier que les inscriptions sont réelles et attribuer les récompenses.</li>
          <li>Vous envoyer des notifications, si vous les avez activées.</li>
          <li>Améliorer la plateforme et la protéger contre les abus, la fraude et les robots.</li>
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
            <strong>L’administration de votre établissement :</strong> elle gère uniquement les étudiants, annonces, emplois du temps et
            résultats de son établissement.
          </li>
          <li>
            <strong>L’équipe CampusLink :</strong> uniquement pour faire fonctionner, entretenir et sécuriser la plateforme.
          </li>
          <li>
            <strong>Les autres utilisateurs :</strong> seulement ce que vous choisissez de publier (par exemple une annonce du Marché
            étudiant), ainsi que votre nom de profil dans le classement des parrains.
          </li>
          <li>
            <strong>Le public :</strong> seuls les contenus destinés à être publics sont visibles par tous (événements sociaux, offres
            publiées). Ils ne contiennent aucune donnée personnelle d’étudiant.
          </li>
        </List>
      </Section>

      <Section n={6} title="Stockage dans votre navigateur ou votre application">
        <p>CampusLink utilise le stockage de votre navigateur ou de l’application installée uniquement pour son fonctionnement :</p>
        <List>
          <li>garder votre session de connexion ;</li>
          <li>mémoriser vos préférences d’affichage ;</li>
          <li>retenir un lien de parrainage le temps de votre inscription ;</li>
          <li>retenir que vous avez fermé la proposition d’installer l’application.</li>
        </List>
        <p>Nous n’utilisons pas de cookies publicitaires. Vous pouvez effacer ces données à tout moment dans les réglages de votre navigateur (vous serez alors déconnecté).</p>
      </Section>

      <Section n={7} title="Sécurité">
        <List>
          <li>Chaque espace a ses propres droits : un utilisateur n’accède qu’à ce qui le concerne.</li>
          <li>Les règles d’accès sont appliquées directement au niveau des données, et pas seulement à l’affichage.</li>
          <li>Les informations personnelles et les résultats ne sont jamais affichés publiquement.</li>
        </List>
        <p>Aucun système n’est infaillible. Si vous constatez un problème de sécurité, prévenez-nous rapidement par WhatsApp.</p>
      </Section>

      <Section n={8} title="Combien de temps gardons-nous vos données ?">
        <List>
          <li>Les données de compte sont conservées tant que votre compte est actif.</li>
          <li>Les données académiques sont conservées tant que votre établissement utilise CampusLink.</li>
          <li>Les annonces et propositions sont gardées le temps de leur publication ou de leur examen.</li>
          <li>Les documents envoyés à Révision &amp; IA ne sont pas conservés par CampusLink.</li>
        </List>
      </Section>

      <Section n={9} title="Vos droits">
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
          en indiquant votre nom et le numéro ou l’e-mail de votre compte.
        </p>
      </Section>

      <Section n={10} title="Modifications de cette politique">
        <p>
          Nous pouvons mettre à jour cette politique lorsque la plateforme évolue. La date de dernière mise à jour est indiquée en haut de
          cette page.
        </p>
      </Section>

      <Section n={11} title="Nous contacter">
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
