// Quatre « zones » d'aide, jamais mélangées :
//  - "accueil"  : accueil et pages publiques → fonctionnalités PRIMAIRES (compte gratuit nom + téléphone)
//  - "etudiant" : espace étudiant (étudiants pré-inscrits par un établissement partenaire)
//  - "admin"    : espace administrateur / super-administrateur
//  - "tous"     : espace étudiant ET espace administrateur (jamais l'accueil)
export type Public = "accueil" | "etudiant" | "admin" | "tous";

export type FaqItem = {
  id: string;
  categorie: string;
  publicCible: Public;
  question: string;
  variantes?: string[];
  reponse: string;
};

export const FAQ: FaqItem[] = [
  // ============ ACCUEIL — fonctionnalités PRIMAIRES (compte gratuit nom + téléphone) ============
  // Ces questions s'affichent uniquement sur l'accueil et les pages publiques. Elles ne parlent jamais
  // de pré-inscription, d'établissement partenaire ou d'administration : voir les sections ÉTUDIANT et ADMIN.
  {
    id: "acc-presentation",
    categorie: "Découvrir CampusLink",
    publicCible: "accueil",
    question: "Qu'est-ce que CampusLink et à quoi ça sert ?",
    variantes: [
      "C'est quoi CampusLink ?",
      "À quoi sert l'application ?",
      "Que puis-je faire sur CampusLink ?",
      "Quelles sont les fonctionnalités de l'application ?",
    ],
    reponse:
      "CampusLink est l'application des étudiants du Burkina Faso. Avec un simple compte gratuit, tu peux : lire ou télécharger des livres et supports de cours dans la Bibliothèque, suivre des cours en ligne (vidéo, PDF, manuscrits), réviser avec l'IA CampusLink (résumés, QCM, fiches, exercices), consulter des opportunités (stages, emplois, bourses, concours), acheter ou vendre sur le Marché étudiant, lire le Guide du nouveau bachelier, voir les événements sociaux et inviter tes amis grâce au Parrainage.",
  },
  {
    id: "acc-univ-non-partenaire",
    categorie: "Découvrir CampusLink",
    publicCible: "accueil",
    question: "Mon université n'est pas partenaire de CampusLink, puis-je utiliser l'application ?",
    variantes: [
      "Mon établissement n'est pas sur CampusLink",
      "Mon école n'est pas partenaire, est-ce que je peux m'inscrire ?",
      "Je ne suis dans aucune université partenaire",
      "Est-ce que CampusLink est réservé à certaines universités ?",
      "Dois-je être inscrit dans un établissement pour utiliser CampusLink ?",
    ],
    reponse:
      "Oui. Les fonctionnalités de l'accueil (Bibliothèque, Cours en ligne, Révision IA, Opportunités, Marché étudiant, Guide du bachelier, Parrainage) sont ouvertes à tous, même si ton université n'est pas partenaire. Il suffit de créer un compte gratuit avec ton nom, ton numéro de téléphone et un mot de passe. Aucun établissement n'a besoin de t'inscrire.",
  },
  {
    id: "acc-espace-etudiant",
    categorie: "Découvrir CampusLink",
    publicCible: "accueil",
    question: "Où trouver mes notes, mon emploi du temps et les annonces de mon université ?",
    variantes: [
      "Où est l'espace étudiant ?",
      "Je suis dans une université partenaire, où voir mes notes ?",
      "Comment voir mon emploi du temps sur CampusLink ?",
      "Comment accéder aux annonces de mon établissement ?",
    ],
    reponse:
      "Les notes, l'emploi du temps et les annonces de l'établissement se trouvent dans l'Espace étudiant, réservé aux étudiants que leur établissement partenaire a pré-inscrits. Connecte-toi depuis la page de connexion de l'espace étudiant : une aide spécifique à cet espace s'y affiche. Si ton établissement n'est pas encore partenaire, cet espace n'est pas disponible pour toi, mais tu gardes accès à toutes les fonctionnalités de l'accueil avec ton compte gratuit.",
  },
  {
    id: "acc-partenaire",
    categorie: "Découvrir CampusLink",
    publicCible: "accueil",
    question: "Comment mon établissement peut-il devenir partenaire de CampusLink ?",
    variantes: [
      "Mon université veut rejoindre CampusLink",
      "Comment inscrire mon école sur la plateforme ?",
      "Je suis responsable d'un établissement, comment devenir partenaire ?",
    ],
    reponse:
      "Ton établissement peut envoyer une demande avec la page « Devenir partenaire » de CampusLink. Tu peux aussi écrire au support sur WhatsApp au +226 57 47 67 24 pour être mis en relation.",
  },

  // ---- Compte ----
  {
    id: "acc-inscription",
    categorie: "Créer mon compte",
    publicCible: "accueil",
    question: "Comment créer mon compte CampusLink ?",
    variantes: [
      "Comment m'inscrire ?",
      "Comment faire mon inscription ?",
      "Je veux m'inscrire sur l'application",
      "Quelles informations faut-il pour créer un compte ?",
      "Comment ouvrir un compte ?",
    ],
    reponse:
      "Touche « Créer mon compte » et remplis : un nom de profil (2 à 60 caractères), ton numéro de téléphone, un mot de passe et, si tu veux, un email de récupération. L'inscription est gratuite et prend environ 30 secondes. Une fois inscrit, tu es connecté directement et ton téléphone garde ta session.",
  },
  {
    id: "acc-inscription-gratuite",
    categorie: "Créer mon compte",
    publicCible: "accueil",
    question: "L'inscription est-elle gratuite ?",
    variantes: [
      "Est-ce que CampusLink est payant ?",
      "Dois-je payer pour avoir un compte ?",
      "Combien coûte l'application ?",
    ],
    reponse:
      "Oui, le compte est gratuit, et la lecture en ligne de la Bibliothèque et des cours est gratuite. Les téléchargements se débloquent grâce au Parrainage (en invitant des amis). Seules des options facultatives du Marché étudiant (annonce « à la une », « Vendeur Pro ») sont payantes.",
  },
  {
    id: "acc-mot-de-passe-regles",
    categorie: "Créer mon compte",
    publicCible: "accueil",
    question: "Pourquoi mon mot de passe est refusé à l'inscription ?",
    variantes: [
      "Quelles sont les règles du mot de passe ?",
      "Quel mot de passe choisir ?",
      "Il manque une majuscule ou un chiffre dans mon mot de passe",
      "Mot de passe invalide",
    ],
    reponse:
      "Ton mot de passe doit contenir au moins 6 caractères, avec une lettre majuscule, une lettre minuscule et un chiffre (exemple : Awa2026). L'application te dit précisément ce qui manque.",
  },
  {
    id: "acc-telephone",
    categorie: "Créer mon compte",
    publicCible: "accueil",
    question: "Quel numéro de téléphone saisir et comment l'écrire ?",
    variantes: [
      "Faut-il mettre l'indicatif 226 ?",
      "Numéro de téléphone invalide",
      "Mon numéro n'est pas accepté",
      "Quel format de numéro utiliser ?",
    ],
    reponse:
      "Saisis ton numéro burkinabè à 8 chiffres (par exemple 70 00 00 00) : l'indicatif +226 est ajouté automatiquement. Tu peux aussi écrire le numéro avec l'indicatif. Utilise toujours le même numéro pour te connecter ensuite.",
  },
  {
    id: "acc-numero-deja-inscrit",
    categorie: "Créer mon compte",
    publicCible: "accueil",
    question: "Pourquoi l'application dit « Ce numéro est déjà inscrit » ?",
    variantes: [
      "Numéro déjà utilisé",
      "J'ai déjà un compte avec ce numéro",
      "Je n'arrive pas à créer mon compte",
      "Mon inscription ne passe pas",
      "Inscription impossible",
    ],
    reponse:
      "Cela veut dire qu'un compte existe déjà avec ce numéro (peut-être créé par toi plus tôt). Au lieu de t'inscrire, utilise « Se connecter » avec ce numéro. Si tu as oublié ton mot de passe, utilise « Mot de passe oublié ». Si les inscriptions sont momentanément fermées ou si tu vois « Trop de tentatives », patiente quelques minutes puis réessaie.",
  },
  {
    id: "acc-email-recuperation",
    categorie: "Créer mon compte",
    publicCible: "accueil",
    question: "L'email de récupération est-il obligatoire ?",
    variantes: [
      "Faut-il une adresse email pour s'inscrire ?",
      "Pourquoi donner mon email ?",
      "Je n'ai pas d'adresse email",
    ],
    reponse:
      "Non, il est facultatif. Mais il est très utile : si tu oublies ton mot de passe, le code de réinitialisation est envoyé à cet email de récupération. Sans email, contacte le support sur WhatsApp pour retrouver ton compte.",
  },

  // ---- Connexion ----
  {
    id: "acc-connexion",
    categorie: "Connexion",
    publicCible: "accueil",
    question: "Comment me connecter à mon compte ?",
    variantes: [
      "Comment se connecter ?",
      "Avec quoi je me connecte ?",
      "Je veux accéder à mon compte",
      "Connexion avec mon numéro de téléphone",
    ],
    reponse:
      "Va sur « Se connecter » et entre le numéro de téléphone avec lequel tu t'es inscrit, puis ton mot de passe. La connexion se fait avec le numéro de téléphone, pas avec un email.",
  },
  {
    id: "acc-connexion-refusee",
    categorie: "Connexion",
    publicCible: "accueil",
    question: "Pourquoi je vois « Numéro ou mot de passe incorrect » ?",
    variantes: [
      "Je n'arrive pas à me connecter",
      "Mon mot de passe ne marche pas",
      "Connexion impossible",
      "Impossible de joindre le serveur",
      "La connexion échoue",
    ],
    reponse:
      "Vérifie que tu saisis le même numéro que celui de l'inscription et un mot de passe exact (attention aux majuscules et minuscules). Si tu hésites, utilise « Mot de passe oublié ». Si le message parle de serveur injoignable, vérifie ta connexion internet puis réessaie.",
  },
  {
    id: "acc-mdp-oublie",
    categorie: "Connexion",
    publicCible: "accueil",
    question: "J'ai oublié mon mot de passe, comment le récupérer ?",
    variantes: [
      "Mot de passe oublié",
      "Comment réinitialiser mon mot de passe ?",
      "Je ne me souviens plus de mon mot de passe",
      "Je n'ai pas reçu le code de réinitialisation",
      "Code reçu par email pour changer le mot de passe",
    ],
    reponse:
      "Sur la page de connexion, touche « Mot de passe oublié » et entre ton numéro. Un code est envoyé à ton email de récupération (celui donné à l'inscription). Saisis ce code puis choisis un nouveau mot de passe. Si tu n'as pas reçu le code, regarde dans les courriers indésirables. Si tu n'avais pas renseigné d'email de récupération, écris au support sur WhatsApp au +226 57 47 67 24.",
  },
  {
    id: "acc-session-redemande",
    categorie: "Connexion",
    publicCible: "accueil",
    question: "Pourquoi on me demande de m'inscrire ou de me connecter pour ouvrir une page ?",
    variantes: [
      "Pourquoi la bibliothèque me renvoie vers l'inscription ?",
      "Pourquoi je dois créer un compte pour voir les cours ?",
      "La page me redirige vers la connexion",
      "Pourquoi je dois me reconnecter ?",
    ],
    reponse:
      "La Bibliothèque, les Cours en ligne, la Révision IA, les Opportunités, le Marché, le Guide du bachelier et le Parrainage demandent un compte gratuit. Seuls les événements sociaux sont visibles sans compte. Une fois connecté, ta session reste enregistrée sur l'appareil. Si tu changes de téléphone, vides les données du navigateur ou te déconnectes, tu dois te reconnecter.",
  },

  // ---- Bibliothèque / téléchargements ----
  {
    id: "acc-bibliotheque",
    categorie: "Bibliothèque",
    publicCible: "accueil",
    question: "Comment lire un livre ou un support de cours dans la Bibliothèque ?",
    variantes: [
      "Où trouver des livres sur CampusLink ?",
      "Comment chercher un livre ?",
      "Comment lire un PDF en ligne ?",
      "Comment ouvrir un document de la bibliothèque ?",
      "Comment regarder une vidéo de la bibliothèque ?",
    ],
    reponse:
      "Ouvre la Bibliothèque, choisis un thème ou utilise la recherche, puis touche « Lire » (ou « Regarder » pour une vidéo). Les PDF s'ouvrent en plein écran dans l'application : utilise les boutons loupe pour agrandir le texte. La lecture en ligne est toujours gratuite.",
  },
  {
    id: "acc-bibliotheque-proposer",
    categorie: "Bibliothèque",
    publicCible: "accueil",
    question: "Comment proposer un livre à ajouter dans la Bibliothèque ?",
    variantes: [
      "Je cherche un livre qui n'est pas dans la bibliothèque",
      "Comment suggérer un livre ?",
      "Puis-je demander l'ajout d'un livre ou d'un cours ?",
    ],
    reponse:
      "Dans la Bibliothèque, utilise l'option pour proposer un livre. Ta proposition est étudiée et le livre est ajouté s'il est retenu. Il y a une limite de propositions par jour : si l'application te dit d'avoir déjà envoyé plusieurs propositions, reviens le lendemain.",
  },
  {
    id: "acc-telecharger",
    categorie: "Téléchargements",
    publicCible: "accueil",
    question: "Comment télécharger un livre ou un cours ?",
    variantes: [
      "Où est le bouton télécharger ?",
      "Je veux télécharger un document",
      "Comment débloquer le téléchargement ?",
      "Pourquoi je ne peux pas télécharger ?",
      "Téléchargement bloqué",
      "Pourquoi le téléchargement est verrouillé ?",
    ],
    reponse:
      "La lecture en ligne est gratuite, mais le téléchargement se débloque grâce au Parrainage : invite des amis avec ton lien personnel. Avec 3 inscrits validés, tu débloques 1 téléchargement ; avec 5, +3 (4 au total) ; avec 10, +6 (10 au total) et le badge Ambassadeur ; avec 20, tu deviens Super Ambassadeur avec des téléchargements illimités. Ensuite, touche « Télécharger » sur la carte du document. Ton solde de téléchargements restants s'affiche sur la page Parrainage.",
  },

  // ---- Parrainage ----
  {
    id: "acc-parrainage",
    categorie: "Parrainage",
    publicCible: "accueil",
    question: "Comment fonctionne le Parrainage ?",
    variantes: [
      "C'est quoi le parrainage ?",
      "Comment inviter mes amis ?",
      "Comment gagner des téléchargements ?",
      "Qu'est-ce que le badge Ambassadeur ?",
      "Super Ambassadeur",
    ],
    reponse:
      "Chaque membre a un lien d'invitation personnel. Quand un ami s'inscrit avec ton lien, il devient ton filleul. Paliers : 3 filleuls validés = 1 téléchargement ; 5 = +3 (4 au total) ; 10 = +6 (10 au total) et badge Ambassadeur CampusLink ; 20 = Super Ambassadeur avec téléchargements illimités. Un classement des meilleurs parrains est aussi affiché.",
  },
  {
    id: "acc-parrainage-lien",
    categorie: "Parrainage",
    publicCible: "accueil",
    question: "Où trouver et comment partager mon lien de parrainage ?",
    variantes: [
      "Comment copier mon lien d'invitation ?",
      "Où est mon code de parrainage ?",
      "Comment partager mon lien sur WhatsApp ?",
    ],
    reponse:
      "Ouvre la page Parrainage : ton code et ton lien personnel y sont affichés, avec des boutons pour copier le lien et le partager (par exemple sur WhatsApp). Ton ami doit s'inscrire en passant par ce lien pour être compté comme ton filleul.",
  },
  {
    id: "acc-parrainage-non-compte",
    categorie: "Parrainage",
    publicCible: "accueil",
    question: "Pourquoi mon ami inscrit n'est pas compté dans mes filleuls ?",
    variantes: [
      "Mon filleul est en attente",
      "Le nombre de filleuls n'augmente pas",
      "Filleul rejeté",
      "Mon ami s'est inscrit mais je n'ai rien reçu",
    ],
    reponse:
      "Un filleul est compté seulement s'il s'est inscrit avec ton lien et qu'il a ensuite utilisé l'application (validation après environ 24 h : il apparaît d'abord « en attente »). Les inscriptions qui ressemblent à de l'auto-parrainage, par exemple depuis un même appareil, sont rejetées. Vérifie la page Parrainage pour voir tes filleuls validés, en attente et rejetés.",
  },

  // ---- Cours en ligne ----
  {
    id: "acc-cours-en-ligne",
    categorie: "Cours en ligne",
    publicCible: "accueil",
    question: "Comment suivre un cours en ligne ?",
    variantes: [
      "Où trouver des cours ?",
      "Comment chercher un cours par filière ou niveau ?",
      "Comment regarder une vidéo de cours ?",
      "Comment lire un cours en PDF ?",
      "Cours manuscrits",
    ],
    reponse:
      "Ouvre « Cours en ligne » et filtre par filière, niveau et module. Un cours peut être en vidéo, en PDF ou manuscrit, et un même cours peut concerner plusieurs filières et niveaux. Touche « Regarder » ou « Lire » pour l'ouvrir ; les PDF s'affichent en plein écran avec des boutons loupe pour agrandir le texte.",
  },
  {
    id: "acc-cours-video-bloquee",
    categorie: "Cours en ligne",
    publicCible: "accueil",
    question: "La vidéo ou le PDF ne s'affiche pas ou charge sans fin, que faire ?",
    variantes: [
      "La vidéo ne se lance pas",
      "Le document ne s'ouvre pas",
      "Le PDF reste blanc",
      "Chargement du document impossible",
      "Le cours ne charge pas",
    ],
    reponse:
      "Vérifie ta connexion internet (les vidéos et PDF demandent un réseau correct), puis touche « Réessayer » ou rouvre le document. Si c'est un PDF, ferme-le et rouvre-le. Si le problème continue sur plusieurs documents, écris au support sur WhatsApp en précisant le titre du cours et ce qui s'affiche.",
  },

  // ---- Révision IA ----
  {
    id: "acc-revision-ia",
    categorie: "Révision IA",
    publicCible: "accueil",
    question: "Comment utiliser la Révision IA ?",
    variantes: [
      "À quoi sert la révision IA ?",
      "Comment faire un résumé de mon cours ?",
      "Comment générer un QCM ou des fiches de révision ?",
      "IA CampusLink",
      "Comment poser une question sur mon cours à l'IA ?",
    ],
    reponse:
      "Dans « Révision & IA », importe ton cours en PDF ou en photo (JPG, PNG, 5 Mo maximum), choisis ce que tu veux (résumé, QCM, fiches de révision, exercices corrigés) ou pose une question sur le cours. Pour un cours manuscrit, prends une photo nette et bien éclairée, une page à la fois. N'envoie pas d'informations personnelles : le document est analysé par IA CampusLink.",
  },
  {
    id: "acc-revision-ia-erreur",
    categorie: "Révision IA",
    publicCible: "accueil",
    question: "Pourquoi la Révision IA affiche une erreur ou ne répond pas ?",
    variantes: [
      "IA CampusLink est indisponible",
      "Mon fichier est trop lourd",
      "La photo est trop lourde",
      "L'IA ne lit pas mon cours",
      "Erreur de l'intelligence artificielle",
    ],
    reponse:
      "Si l'IA est indisponible, réessaie un peu plus tard. Si ton fichier est refusé, c'est qu'il est trop lourd (5 Mo maximum) : envoie moins de pages à la fois ou une photo moins lourde. Pour une photo, assure-toi qu'elle est nette et bien éclairée.",
  },

  // ---- Opportunités ----
  {
    id: "acc-opportunites",
    categorie: "Opportunités",
    publicCible: "accueil",
    question: "Comment trouver des stages, des bourses ou des offres d'emploi ?",
    variantes: [
      "Où voir les opportunités ?",
      "Comment trouver une bourse d'études ?",
      "Comment postuler à un concours ?",
      "Date limite d'une offre",
      "Comment enregistrer une opportunité en favori ?",
    ],
    reponse:
      "Ouvre « Opportunités » : tu y trouves des stages, emplois, bourses d'études, concours, formations et appels à candidatures, avec la date limite de chacun. Quand tu es connecté, tu peux enregistrer des offres en favoris pour les retrouver. Pour postuler, ouvre l'offre et suis les indications de l'annonceur.",
  },
  {
    id: "acc-opportunites-publier",
    categorie: "Opportunités",
    publicCible: "accueil",
    question: "Comment publier une opportunité ou une offre ?",
    variantes: [
      "Je veux publier une offre de stage",
      "Comment ajouter une bourse ou un concours ?",
      "Je suis une entreprise, comment diffuser mon offre ?",
    ],
    reponse:
      "La publication des opportunités est réservée aux administrateurs autorisés de CampusLink. Pour proposer une offre, écris au support sur WhatsApp au +226 57 47 67 24 avec les détails (titre, description, date limite, contact).",
  },

  // ---- Marché étudiant ----
  {
    id: "acc-marche-publier",
    categorie: "Marché étudiant",
    publicCible: "accueil",
    question: "Comment vendre ou publier une annonce sur le Marché étudiant ?",
    variantes: [
      "Comment publier une annonce ?",
      "Comment vendre un livre ?",
      "Comment proposer un service ou une colocation ?",
      "Combien de photos puis-je ajouter ?",
      "Comment fixer un prix ?",
    ],
    reponse:
      "Ouvre le Marché étudiant et touche pour publier une annonce : titre, description, prix et jusqu'à 3 photos (5 Mo maximum chacune). Laisse le prix vide pour « à discuter » ou mets 0 pour « gratuit ». Publier est gratuit. Les acheteurs te contactent directement, et ton numéro n'est visible que par les personnes connectées à CampusLink.",
  },
  {
    id: "acc-marche-limite",
    categorie: "Marché étudiant",
    publicCible: "accueil",
    question: "Pourquoi je ne peux plus publier d'annonce (limite atteinte) ?",
    variantes: [
      "Limite d'annonces actives",
      "Je ne peux pas ajouter une nouvelle annonce",
      "Comment publier plus d'annonces ?",
      "Qu'est-ce que Vendeur Pro ?",
    ],
    reponse:
      "Le nombre d'annonces actives gratuites est limité. Pour en publier davantage, tu peux supprimer ou clôturer une ancienne annonce, ou devenir « Vendeur Pro » : badge Vendeur Pro et beaucoup plus d'annonces actives pendant 30 jours.",
  },
  {
    id: "acc-marche-paiement-offre",
    categorie: "Marché étudiant",
    publicCible: "accueil",
    question: "Comment payer pour mettre une annonce à la une ou devenir Vendeur Pro ?",
    variantes: [
      "Comment payer avec Orange Money ou Moov Money ?",
      "Mettre mon annonce à la une",
      "Où entrer la référence de la transaction ?",
      "Mon paiement n'est pas encore validé",
      "Combien de temps pour activer mon offre ?",
    ],
    reponse:
      "Choisis l'offre (« À la une » pour 1 semaine ou 1 mois, ou « Vendeur Pro »), puis le moyen de paiement Orange Money ou Moov Money. Envoie le montant indiqué au numéro affiché, puis remplis le formulaire avec le numéro qui a payé et la référence reçue par SMS. Un administrateur vérifie ton paiement et active ton offre, généralement dans la journée. Si rien n'est activé après ce délai, écris au support sur WhatsApp avec ta référence.",
  },
  {
    id: "acc-marche-securite",
    categorie: "Marché étudiant",
    publicCible: "accueil",
    question: "Les paiements entre étudiants passent-ils par CampusLink ? Comment acheter en sécurité ?",
    variantes: [
      "Est-ce que CampusLink garantit les ventes ?",
      "Comment éviter les arnaques sur le marché ?",
      "Comment contacter un vendeur ?",
      "Comment payer un vendeur ?",
    ],
    reponse:
      "Non : aucun paiement entre étudiants ne passe par CampusLink, les acheteurs et vendeurs se contactent directement. Vérifie l'article avant de payer, privilégie un rendez-vous dans un lieu public sur ou près du campus, et évite d'envoyer de l'argent à l'avance à quelqu'un que tu ne connais pas.",
  },

  // ---- Autres ----
  {
    id: "acc-guide-bachelier",
    categorie: "Guide du nouveau bachelier",
    publicCible: "accueil",
    question: "À quoi sert le Guide du nouveau bachelier ?",
    variantes: [
      "Comment créer mon compte Campus Faso ?",
      "Comment faire mon orientation après le bac ?",
      "Comment faire mes vœux d'inscription ?",
      "Comment consulter mes résultats d'orientation ?",
    ],
    reponse:
      "Le Guide du nouveau bachelier explique pas à pas Campus Faso : créer son compte, choisir ses vœux et son orientation, s'inscrire et suivre ses résultats. Ouvre-le depuis l'accueil de l'application.",
  },
  {
    id: "acc-evenements",
    categorie: "Événements sociaux",
    publicCible: "accueil",
    question: "Comment voir les événements (concerts, conférences, activités) ?",
    variantes: [
      "Où est l'agenda des événements ?",
      "Faut-il un compte pour voir les événements ?",
      "Comment partager un événement ?",
      "Comment voir l'affiche en grand ?",
    ],
    reponse:
      "Les événements sociaux sont visibles par tous, même sans compte. Ouvre la page Événements pour rechercher, filtrer (cette semaine, ce mois-ci), agrandir les affiches et partager un événement en un clic.",
  },
  {
    id: "acc-notifications",
    categorie: "Notifications",
    publicCible: "accueil",
    question: "Comment activer ou réactiver les notifications ?",
    variantes: [
      "Je ne reçois pas les notifications",
      "J'ai appuyé sur se désabonner",
      "J'ai bloqué les notifications par erreur",
      "Comment recevoir les alertes de CampusLink ?",
      "Notifications Chrome",
    ],
    reponse:
      "Connecté, touche la cloche de notifications pour activer les alertes et accepte la demande d'autorisation du navigateur. Si tu as touché « Se désabonner » ou « Bloquer » sur une notification, Chrome bloque les alertes de CampusLink : touche le cadenas à côté de l'adresse du site, ouvre « Paramètres du site », puis « Notifications » et choisis « Autoriser ». Installer l'application sur ton écran d'accueil aide aussi à bien recevoir les alertes.",
  },
  {
    id: "acc-installer",
    categorie: "Application",
    publicCible: "accueil",
    question: "Comment installer CampusLink sur mon téléphone ?",
    variantes: [
      "Comment mettre l'application sur l'écran d'accueil ?",
      "Comment avoir l'icône CampusLink ?",
      "Comment installer sur iPhone ?",
      "Comment installer sur Android ?",
    ],
    reponse:
      "Sur Android avec Chrome, touche le bouton « Installer » qui s'affiche en haut, ou ouvre le menu ⋮ puis « Installer l'application » (ou « Ajouter à l'écran d'accueil »). Sur iPhone, ouvre CampusLink dans Safari, touche le bouton Partager puis « Sur l'écran d'accueil ». L'application s'ouvre ensuite en un clic, comme une application classique.",
  },
  {
    id: "acc-avis",
    categorie: "Application",
    publicCible: "accueil",
    question: "Comment donner mon avis ou noter CampusLink ?",
    variantes: [
      "Comment laisser une note sur l'application ?",
      "Je veux faire une suggestion",
      "Comment évaluer la plateforme ?",
    ],
    reponse:
      "Connecte-toi avec ton compte gratuit, puis utilise la section d'avis de la plateforme : tu peux donner une note en quelques secondes et expliquer pourquoi. Ton avis aide à améliorer CampusLink.",
  },
  {
    id: "acc-technique-general",
    categorie: "Problèmes techniques",
    publicCible: "accueil",
    question: "L'application ne fonctionne pas bien (page blanche, chargement bloqué, erreur)",
    variantes: [
      "L'application plante",
      "La page est blanche",
      "Le chargement ne s'arrête pas",
      "Une erreur s'affiche",
      "Rien ne s'affiche",
    ],
    reponse:
      "Rafraîchis la page et vérifie ta connexion internet. Si tu viens d'installer l'application, ferme-la complètement puis rouvre-la. Si le problème continue, écris au support sur WhatsApp au +226 57 47 67 24 en précisant ce que tu faisais, ce qui s'est affiché et, si possible, une capture d'écran.",
  },
  {
    id: "acc-contact-support",
    categorie: "Contacter le support",
    publicCible: "accueil",
    question: "Comment contacter le support CampusLink ?",
    variantes: [
      "Comment joindre l'équipe CampusLink ?",
      "Numéro WhatsApp du support",
      "Comment signaler un problème ?",
      "Comment envoyer une capture d'écran au support ?",
    ],
    reponse:
      "Écris-nous sur WhatsApp au +226 57 47 67 24. Pour que nous t'aidions vite, indique ton numéro de profil, la page où tu étais, ce que tu essayais de faire, ce qui s'est passé (message d'erreur si possible) et une capture d'écran si tu en as une.",
  },

  // ============ ÉTUDIANT — Inscription ============
  {
    id: "etu-inscription-non-preinscrit",
    categorie: "Inscription",
    publicCible: "etudiant",
    question: "Pourquoi CampusLink me dit que je ne suis pas préinscrit ?",
    variantes: [
      "Pourquoi je n'arrive pas à créer mon compte ?",
      "J'ai été inscrit par mon établissement, mais CampusLink ne me reconnaît pas. Pourquoi ?",
      "J'ai pourtant donné les bonnes informations à mon établissement, pourquoi ça ne marche pas ?",
      "Pourquoi mon inscription reste bloquée ?",
      "Est-ce que mon établissement doit d'abord m'ajouter avant que je puisse créer mon compte ?",
      "Comment savoir si mon établissement m'a réellement préinscrit ?",
    ],
    reponse:
      "Avant de créer ton compte, ton établissement doit t'avoir ajouté comme étudiant pré-inscrit (manuellement ou par import Excel). CampusLink vérifie que ton nom, ta date de naissance et ton email correspondent exactement à ce que ton établissement a enregistré. Si l'un de ces trois éléments ne correspond pas mot pour mot (une faute de frappe, un email différent), l'inscription est refusée. Vérifie auprès de l'administration de ton établissement que tu es bien dans leur liste, avec les bonnes informations.",
  },
  {
    id: "etu-inscription-etab-filiere-niveau",
    categorie: "Inscription",
    publicCible: "etudiant",
    question: "Pourquoi mon établissement, ma filière ou mon niveau n'apparaît pas ?",
    variantes: [
      "Pourquoi mon établissement n'apparaît pas ?",
      "Pourquoi ma filière n'apparaît pas ?",
      "Pourquoi mon niveau n'apparaît pas ?",
    ],
    reponse:
      "Ces listes viennent directement de ce que ton établissement a configuré. Si un établissement, une filière ou un niveau n'apparaît pas, c'est qu'il n'a pas encore été créé côté administration. Contacte ton établissement pour qu'il l'ajoute — CampusLink ne peut pas créer ces éléments à ta place.",
  },
  {
    id: "etu-inscription-infos-refusees",
    categorie: "Inscription",
    publicCible: "etudiant",
    question: "Pourquoi mon nom, ma date de naissance ou mon email est refusé ?",
    variantes: [
      "Pourquoi mon nom n'est pas reconnu ?",
      "Pourquoi ma date de naissance est refusée ?",
      "Pourquoi mon adresse e-mail est refusée ?",
    ],
    reponse:
      "Ces informations doivent correspondre exactement à celles enregistrées par ton établissement lors de ta pré-inscription (même orthographe, même date, même email). Le moindre écart — un accent manquant, un espace en trop — empêche la vérification. Si tu es sûr d'avoir les bonnes informations, demande à ton établissement de vérifier ce qu'il a enregistré pour toi.",
  },
  {
    id: "etu-inscription-corriger-erreur",
    categorie: "Inscription",
    publicCible: "etudiant",
    question: "Je me suis trompé pendant mon inscription (établissement, filière, niveau), comment corriger ?",
    variantes: [
      "Je me suis trompé dans mes informations pendant l'inscription, comment les corriger ?",
      "J'ai choisi le mauvais établissement, comment revenir en arrière ?",
      "J'ai choisi la mauvaise filière, comment la modifier ?",
      "J'ai choisi le mauvais niveau, comment le modifier ?",
    ],
    reponse:
      "Contacte directement l'administration de ton établissement : elle seule peut corriger ou déplacer ta fiche pré-inscrite vers la bonne filière ou le bon niveau. Si le compte est déjà créé, elle peut aussi corriger ces informations depuis son espace administrateur.",
  },

  // ============ ÉTUDIANT — Confirmation du compte ============
  {
    id: "etu-confirmation-mail-absent",
    categorie: "Confirmation du compte",
    publicCible: "etudiant",
    question: "Pourquoi je n'ai pas reçu le mail de confirmation ?",
    variantes: [
      "Où est le mail de confirmation ?",
      "J'ai vérifié mes spams mais je ne trouve rien, que faire ?",
      "Je n'ai plus accès à l'adresse e-mail utilisée, que faire ?",
    ],
    reponse:
      "Vérifie d'abord ton dossier spam/courrier indésirable — c'est la cause la plus fréquente. Si tu ne le trouves toujours pas après quelques minutes, tu peux demander un renvoi du mail de confirmation depuis la page de connexion. Si tu n'as plus accès à l'adresse email utilisée à l'inscription, contacte ton établissement pour qu'il mette à jour ton email avant de recommencer l'inscription.",
  },
  {
    id: "etu-confirmation-lien-expire",
    categorie: "Confirmation du compte",
    publicCible: "etudiant",
    question: "Pourquoi le lien de confirmation dit qu'il est expiré ou ne fonctionne pas ?",
    variantes: [
      "J'ai reçu le mail mais le lien ne fonctionne pas.",
      "Pourquoi le lien me renvoie vers une autre page ?",
      "Pourquoi le lien ne m'ouvre pas CampusLink ?",
    ],
    reponse:
      "Ce lien ne peut être utilisé qu'une seule fois : dès qu'il a servi une première fois (même par erreur, ou si tu as cliqué deux fois dessus), il devient invalide. Si tu penses avoir déjà cliqué dessus, essaie simplement de te connecter directement avec ton email et ton mot de passe — ton compte est peut-être déjà actif. Sinon, demande un nouveau mail de confirmation.",
  },
  {
    id: "etu-confirmation-renvoyer",
    categorie: "Confirmation du compte",
    publicCible: "etudiant",
    question: "Comment renvoyer le mail de confirmation ?",
    variantes: ["Mon compte semble créé mais je ne peux pas me connecter."],
    reponse:
      "Depuis la page de connexion étudiant, il y a une option pour renvoyer le mail de confirmation. Renseigne ton email d'inscription et un nouveau lien te sera envoyé.",
  },

  // ============ ÉTUDIANT — Connexion ============
  {
    id: "etu-connexion-refuse",
    categorie: "Connexion",
    publicCible: "etudiant",
    question: "Pourquoi je n'arrive pas à me connecter ?",
    variantes: [
      "Mon mot de passe est correct mais CampusLink le refuse.",
      "Pourquoi CampusLink dit que mon e-mail ou mon mot de passe est incorrect ?",
      "Je pouvais me connecter avant mais maintenant je n'y arrive plus.",
      "Pourquoi mon compte ne s'ouvre pas après la connexion ?",
      "Comment savoir si mon compte est bien activé ?",
    ],
    reponse:
      "Vérifie d'abord que tu as bien confirmé ton compte via le lien reçu par email après l'inscription — sans cette étape, la connexion est refusée. Vérifie aussi que ton email est écrit correctement (sans espace, bonne orthographe) et que la touche Verr. Maj n'est pas activée sur ton mot de passe. Si le problème persiste, utilise \"Mot de passe oublié\" pour en définir un nouveau.",
  },
  {
    id: "etu-connexion-deconnecte",
    categorie: "Connexion",
    publicCible: "etudiant",
    question: "Pourquoi je suis automatiquement déconnecté ou la page tourne sans s'arrêter ?",
    variantes: ["Pourquoi la page de connexion tourne sans s'arrêter ?"],
    reponse:
      "Cela arrive généralement en cas de connexion internet instable ou de session expirée. Rafraîchis la page et reconnecte-toi. Si le problème persiste après plusieurs essais, contacte le support.",
  },

  // ============ ÉTUDIANT — Mot de passe ============
  {
    id: "etu-mdp-oublie",
    categorie: "Mot de passe",
    publicCible: "etudiant",
    question: "J'ai oublié mon mot de passe, comment le récupérer ?",
    variantes: [
      "Pourquoi je ne reçois pas le mail de récupération ?",
      "J'ai reçu le lien mais il ne fonctionne pas.",
      "Le lien de récupération a expiré, que dois-je faire ?",
      "J'ai changé mon mot de passe mais je ne peux toujours pas me connecter.",
    ],
    reponse:
      "Utilise le lien \"Mot de passe oublié\" sur la page de connexion étudiant, puis vérifie ta boîte mail (et les spams). Le lien reçu ne fonctionne qu'une seule fois : s'il a déjà été utilisé ou si tu en as redemandé un nouveau entre-temps, refais la demande pour obtenir le lien le plus récent. Si après avoir changé ton mot de passe tu n'arrives toujours pas à te connecter, vérifie que tu utilises bien la nouvelle version et pas l'ancienne enregistrée automatiquement dans ton navigateur.",
  },
  {
    id: "etu-mdp-changer",
    categorie: "Mot de passe",
    publicCible: "etudiant",
    question: "Je veux changer mon mot de passe alors que je connais encore l'ancien, comment faire ?",
    reponse:
      "Utilise la fonction \"Mot de passe oublié\" depuis la page de connexion, même si tu connais encore ton ancien mot de passe : c'est le moyen prévu pour en définir un nouveau.",
  },

  // ============ ÉTUDIANT — Informations personnelles ============
  {
    id: "etu-infos-incorrectes",
    categorie: "Informations personnelles",
    publicCible: "etudiant",
    question: "Mon nom, ma date de naissance, mon email, ma filière ou mon niveau est incorrect, comment le corriger ?",
    variantes: [
      "Mon nom est incorrect dans mon espace, comment le modifier ?",
      "Ma date de naissance est incorrecte, comment la corriger ?",
      "Mon e-mail est incorrect, comment le changer ?",
      "Ma filière est incorrecte.",
      "Mon niveau est incorrect.",
      "Pourquoi mes informations personnelles ne correspondent-elles pas à celles de mon établissement ?",
      "Qui peut modifier mes informations ?",
    ],
    reponse:
      "Tes informations personnelles sont gérées par ton établissement, pas directement par toi. Contacte l'administration de ton établissement pour qu'elle corrige tes informations depuis son espace administrateur.",
  },

  // ============ ÉTUDIANT — Notes ============
  {
    id: "etu-notes-absentes",
    categorie: "Notes",
    publicCible: "etudiant",
    question: "Pourquoi je ne vois pas mes notes (ou une note manque) ?",
    variantes: [
      "Pourquoi une de mes notes manque ?",
      "Pourquoi toutes mes notes ont disparu ?",
      "Quand est-ce que mes notes seront publiées ?",
      "Pourquoi mes camarades voient leurs notes mais pas moi ?",
      "Je vois ma matière mais pas ma note, pourquoi ?",
    ],
    reponse:
      "Les notes sont saisies et publiées par ton établissement, matière par matière. Si une note n'apparaît pas, c'est généralement qu'elle n'a pas encore été saisie par ton professeur ou ton administration — ce n'est pas un problème technique de ton côté. Renseigne-toi directement auprès de ton établissement sur le calendrier de publication.",
  },
  {
    id: "etu-notes-erreur",
    categorie: "Notes",
    publicCible: "etudiant",
    question: "Comment signaler une erreur sur une note ?",
    variantes: [
      "Pourquoi ma note est différente de celle donnée par mon professeur ?",
      "Pourquoi une mauvaise note apparaît sur mon compte ?",
      "Ma note a été corrigée par mon établissement mais l'ancienne note apparaît encore.",
      "Est-ce que CampusLink peut modifier directement ma note ?",
    ],
    reponse:
      "CampusLink affiche uniquement les notes saisies par ton établissement — nous ne pouvons pas les modifier directement. Si tu penses qu'une note est incorrecte, signale-le à ton établissement : lui seul peut la corriger. Si une correction vient d'être faite et que tu vois encore l'ancienne note, essaie de rafraîchir la page.",
  },

  // ============ ÉTUDIANT — Emploi du temps ============
  {
    id: "etu-edt-vide",
    categorie: "Emploi du temps",
    publicCible: "etudiant",
    question: "Pourquoi mon emploi du temps est vide ou incorrect ?",
    variantes: [
      "Pourquoi je ne vois pas mon emploi du temps ?",
      "Pourquoi mon emploi du temps ne correspond pas à ma filière ?",
      "Pourquoi mon emploi du temps ne correspond pas à mon niveau ?",
      "Pourquoi l'heure de mon cours est incorrecte ?",
      "Pourquoi la salle indiquée est incorrecte ?",
      "Mon emploi du temps a changé mais CampusLink affiche encore l'ancien.",
      "Quand est-ce que le nouvel emploi du temps sera disponible ?",
    ],
    reponse:
      "L'emploi du temps est entièrement géré par ton établissement pour chaque niveau. S'il est vide, incorrect, ou ne semble pas à jour, c'est que ton établissement ne l'a pas encore renseigné ou modifié de son côté. Contacte-le directement pour toute question sur le contenu ou le calendrier de mise à jour.",
  },

  // ============ ÉTUDIANT — Annonces ============
  {
    id: "etu-annonces",
    categorie: "Annonces",
    publicCible: "etudiant",
    question: "Pourquoi je ne vois pas les annonces de mon établissement ?",
    variantes: [
      "Pourquoi je ne reçois pas les notifications d'une annonce ?",
      "Pourquoi une annonce a disparu ?",
      "Pourquoi je ne peux pas ouvrir une annonce ?",
      "Pourquoi l'image d'une annonce ne s'affiche pas ?",
      "Comment retrouver une ancienne annonce ?",
    ],
    reponse:
      "Les annonces sont publiées par ton établissement pour ton niveau spécifique. Si tu ne vois rien, vérifie que tu es bien sur le bon niveau et que ton établissement a publié quelque chose récemment. Une annonce supprimée par l'établissement n'est plus visible.",
  },
  {
    id: "etu-notifications",
    categorie: "Notifications",
    publicCible: "etudiant",
    question: "Pourquoi je ne reçois aucune notification ?",
    variantes: [
      "Pourquoi les notifications arrivent en retard ?",
      "Pourquoi je reçois certaines notifications mais pas d'autres ?",
      "J'ai autorisé les notifications mais je ne reçois toujours rien.",
      "Pourquoi les notifications fonctionnent sur mon navigateur mais pas sur mon téléphone ?",
      "Comment réactiver les notifications ?",
    ],
    reponse:
      "Sur CampusLink, les notifications sont envoyées par email, pas encore sous forme de notification directe sur ton téléphone ou navigateur. Vérifie ta boîte mail (et tes spams) à l'adresse utilisée pour ton compte : c'est là qu'arrivent les informations importantes.",
  },

  // ============ ÉTUDIANT — Problèmes techniques ============
  {
    id: "etu-technique-general",
    categorie: "Problèmes techniques",
    publicCible: "etudiant",
    question: "L'application ne fonctionne pas correctement (page blanche, chargement bloqué, erreur)",
    variantes: [
      "Pourquoi CampusLink affiche une page blanche ?",
      "Pourquoi CampusLink reste bloqué sur le chargement ?",
      "Pourquoi une page ne s'ouvre pas ?",
      "Pourquoi un bouton ne fonctionne pas ?",
      "Pourquoi l'application se ferme ?",
      "Pourquoi CampusLink fonctionne sur mon téléphone mais pas sur mon ordinateur ?",
      "Pourquoi CampusLink fonctionne avec le Wi-Fi mais pas avec mes données mobiles ?",
      "Pourquoi j'ai un message d'erreur ?",
      "Est-ce un problème avec mon compte ou avec CampusLink ?",
      "Est-ce que le problème vient de mon téléphone ?",
      "Comment savoir si CampusLink rencontre actuellement une panne ?",
    ],
    reponse:
      "Essaie d'abord de rafraîchir la page ou de fermer/rouvrir l'application. Vérifie aussi ta connexion internet, en changeant de réseau si possible (Wi-Fi vers données mobiles ou inversement). Si le problème persiste sur plusieurs appareils ou réseaux différents, il est probable que ce soit un problème du côté de CampusLink — contacte le support sur WhatsApp (+226 57 47 67 24) en décrivant ce qui se passe.",
  },

  // ============ ADMIN — Compte administrateur ============
  {
    id: "admin-compte-creation",
    categorie: "Compte administrateur",
    publicCible: "admin",
    question: "Pourquoi je n'arrive pas à créer mon compte administrateur ou à accéder à mon espace ?",
    variantes: [
      "Pourquoi mon établissement n'apparaît pas ?",
      "Comment rattacher mon compte à mon établissement ?",
      "Pourquoi je n'ai pas accès à l'espace administrateur ?",
      "Pourquoi mon compte administrateur n'est-il pas activé ?",
      "Je suis administrateur mais CampusLink me considère comme un étudiant.",
      "Pourquoi je suis renvoyé vers la page de connexion ?",
      "Pourquoi je n'arrive plus à accéder à mon espace administrateur ?",
    ],
    reponse:
      "Un compte administrateur doit être pré-autorisé par CampusLink pour un établissement donné avant de pouvoir être créé. Si tu n'as pas encore de compte, vérifie que ton établissement a bien été validé auprès de CampusLink. Si ton compte existe déjà mais te redirige toujours vers la connexion, vérifie que tu as bien confirmé ton compte par email, et que tu utilises la bonne adresse email (celle liée à ton rôle d'administrateur, pas une autre).",
  },

  // ============ ADMIN — Gestion des étudiants ============
  {
    id: "admin-etudiants-ajout",
    categorie: "Gestion des étudiants",
    publicCible: "admin",
    question: "Comment ajouter, modifier ou supprimer un étudiant ?",
    variantes: [
      "Comment ajouter un étudiant ?",
      "Comment supprimer un étudiant ?",
      "Comment modifier les informations d'un étudiant ?",
      "Comment retrouver un étudiant ?",
    ],
    reponse:
      "Dans ton espace administrateur, va dans la section \"Étudiants\", choisis le niveau concerné, puis utilise le formulaire à droite pour ajouter un étudiant. Pour modifier ou supprimer un étudiant existant, utilise les icônes sur sa fiche dans la liste. Une suppression place l'étudiant dans la corbeille pendant 30 jours avant suppression définitive.",
  },
  {
    id: "admin-etudiants-refuse",
    categorie: "Gestion des étudiants",
    publicCible: "admin",
    question: "Pourquoi un étudiant est-il refusé ou apparaît deux fois ?",
    variantes: [
      "Pourquoi je n'arrive pas à ajouter un étudiant ?",
      "Pourquoi l'étudiant est-il refusé ?",
      "Pourquoi CampusLink dit que cet étudiant existe déjà ?",
      "Pourquoi un étudiant apparaît deux fois ?",
      "Pourquoi un étudiant est-il rattaché au mauvais établissement ?",
    ],
    reponse:
      "Un étudiant est refusé le plus souvent parce que son email est déjà utilisé pour ce niveau. Vérifie qu'il n'a pas déjà été ajouté (recherche-le dans la liste avant d'en créer un nouveau). Si un doublon apparaît malgré tout, tu peux supprimer la fiche en trop depuis la liste des étudiants.",
  },
  {
    id: "admin-etudiants-verif",
    categorie: "Gestion des étudiants",
    publicCible: "admin",
    question: "Comment vérifier qu'un étudiant est bien préinscrit ou pourquoi n'apparaît-il pas dans la liste ?",
    variantes: [
      "Pourquoi un étudiant que j'ai ajouté n'apparaît pas dans la liste ?",
      "Pourquoi un étudiant ne peut-il pas s'inscrire alors que je l'ai ajouté ?",
      "Comment vérifier qu'un étudiant est bien préinscrit ?",
    ],
    reponse:
      "Dans la section \"Étudiants\" de ton espace, sélectionne le niveau correspondant : la liste affiche tous les étudiants pré-inscrits pour ce niveau, avec leur statut (\"✓ Inscrit\" ou \"En attente\"). Si un étudiant que tu viens d'ajouter n'apparaît pas, vérifie que tu es bien sur le bon niveau — chaque étudiant est rattaché à un niveau précis.",
  },

  // ============ ADMIN — Import Excel ============
  {
    id: "admin-excel-comment",
    categorie: "Import Excel",
    publicCible: "admin",
    question: "Comment importer plusieurs étudiants avec un fichier Excel ?",
    variantes: [
      "Où télécharger le modèle Excel ?",
      "Est-ce que je peux utiliser mon propre modèle Excel ?",
    ],
    reponse:
      "Dans la section \"Étudiants\", choisis le niveau concerné, clique sur \"Import Excel\", puis choisis ton fichier .xlsx ou .xls. Tu n'as pas besoin d'un modèle strict : CampusLink reconnaît automatiquement plusieurs libellés de colonnes courants (voir la question sur les colonnes reconnues). Coche les options \"Fichier avec matricule\" et/ou \"Fichier avec téléphone\" avant l'import si ton fichier contient ces colonnes.",
  },
  {
    id: "admin-excel-colonnes",
    categorie: "Import Excel",
    publicCible: "admin",
    question: "Quelles colonnes dois-je mettre dans mon fichier Excel ?",
    variantes: [
      "Pourquoi CampusLink ne reconnaît pas mes colonnes ?",
      "Est-ce que je dois utiliser « Nom complet » ou « Nom » et « Prénom » ?",
      "Pourquoi CampusLink dit qu'une colonne obligatoire manque ?",
      "Pourquoi les noms et prénoms sont mal assemblés ?",
    ],
    reponse:
      "CampusLink reconnaît automatiquement plusieurs libellés (avec ou sans accents, majuscules/minuscules) : \"Nom complet\" (ou tu peux séparer \"Nom\" et \"Prénom\" dans deux colonnes distinctes, elles seront fusionnées automatiquement), \"Email\", \"Date de naissance\", et si activés pour ton établissement : \"Matricule\" et \"Téléphone\". Trois colonnes sont obligatoires : le nom (complet ou nom+prénom), l'email, et la date de naissance.",
  },
  {
    id: "admin-excel-date",
    categorie: "Import Excel",
    publicCible: "admin",
    question: "Quel format de date de naissance dois-je utiliser dans le fichier Excel ?",
    variantes: [
      "Pourquoi certaines dates de naissance sont refusées ?",
      "Pourquoi mon fichier Excel est refusé ?",
    ],
    reponse:
      "CampusLink accepte plusieurs formats de date automatiquement (JJ/MM/AAAA, AAAA-MM-JJ, ou les dates numériques générées par Excel), il n'y a pas besoin de reformater ta colonne. Si une date reste refusée, vérifie qu'elle est bien reconnue comme une date par Excel et non comme du texte libre mal formaté.",
  },
  {
    id: "admin-excel-matricule-tel",
    categorie: "Import Excel",
    publicCible: "admin",
    question: "Comment importer le matricule ou le numéro de téléphone des étudiants ?",
    variantes: [
      "Comment importer un fichier avec un matricule ?",
      "Comment importer les numéros de téléphone ?",
      "Pourquoi mon matricule n'est pas importé ?",
      "Pourquoi les numéros de téléphone disparaissent-ils ?",
    ],
    reponse:
      "Ces champs doivent d'abord être activés pour ton établissement (section Configuration). Ensuite, coche la case correspondante (\"Fichier avec matricule\" / \"Fichier avec téléphone\") avant d'importer ton fichier Excel — sinon ces colonnes sont ignorées même si elles sont présentes dans le fichier.",
  },
  {
    id: "admin-excel-erreurs",
    categorie: "Import Excel",
    publicCible: "admin",
    question: "Pourquoi certaines lignes de mon fichier sont refusées et comment les corriger ?",
    variantes: [
      "Pourquoi certaines lignes sont acceptées et d'autres refusées ?",
      "Pourquoi mon fichier contient des erreurs ?",
      "Comment corriger les erreurs d'import ?",
      "Pourquoi certains étudiants sont considérés comme des doublons ?",
      "Comment télécharger un rapport des erreurs d'import ?",
    ],
    reponse:
      "Une ligne est rejetée si le nom, l'email ou la date de naissance est manquant ou invalide (email mal formé, date illisible). Corrige la ligne concernée directement dans ton fichier Excel puis réimporte-le. Il n'y a pas de rapport d'erreurs téléchargeable pour le moment ; le message d'import t'indique le nombre de lignes rejetées.",
  },
  {
    id: "admin-excel-annuler",
    categorie: "Import Excel",
    publicCible: "admin",
    question: "Puis-je annuler un import Excel ou savoir combien d'étudiants ont été importés ?",
    variantes: [
      "Est-ce que je peux annuler un import ?",
      "J'ai importé le mauvais fichier, comment revenir en arrière ?",
      "Comment savoir combien d'étudiants ont été importés ?",
      "Pourquoi l'import reste bloqué ?",
      "Pourquoi l'import fonctionne avec 20 étudiants mais pas avec 500 ?",
    ],
    reponse:
      "Il n'y a pas d'annulation automatique d'un import : si tu as importé le mauvais fichier, tu dois supprimer manuellement les étudiants concernés depuis la liste. Le nombre d'étudiants importés s'affiche à la fin de l'import. Un import est limité à 5000 lignes à la fois ; au-delà, découpe ton fichier en plusieurs imports.",
  },
  {
    id: "admin-excel-filiere-niveau",
    categorie: "Import Excel",
    publicCible: "admin",
    question: "Comment importer les filières ou les niveaux des étudiants ?",
    variantes: ["Comment importer les filières ?", "Comment importer les niveaux ?"],
    reponse:
      "L'import Excel se fait niveau par niveau : tous les étudiants d'un même fichier sont rattachés au niveau que tu as sélectionné avant l'import. Pour importer plusieurs niveaux ou filières, prépare un fichier séparé pour chacun et importe-les un par un après avoir changé la sélection de niveau.",
  },

  // ============ ADMIN — Configuration de l'établissement ============
  {
    id: "admin-config-champs",
    categorie: "Configuration de l'établissement",
    publicCible: "admin",
    question: "Comment activer le matricule, le téléphone ou d'autres champs pour mon établissement ?",
    variantes: [
      "Comment activer le matricule pour mon établissement ?",
      "Comment activer le numéro de téléphone ?",
      "Comment activer la filière ?",
      "Comment activer le niveau ?",
      "Pourquoi un champ apparaît dans mon formulaire alors que je ne l'utilise pas ?",
      "Pourquoi le matricule n'apparaît pas ?",
      "Comment modifier les champs utilisés par mon établissement ?",
      "Est-ce que les champs activés pour Excel apparaissent aussi dans l'ajout manuel ?",
    ],
    reponse:
      "Ces options se gèrent dans la configuration de ton établissement, accessible depuis ton espace administrateur. Une fois un champ activé (matricule ou téléphone), il apparaît à la fois dans le formulaire d'ajout manuel d'étudiant et comme option disponible lors de l'import Excel.",
  },
  {
    id: "admin-filieres-niveaux",
    categorie: "Gestion des filières et niveaux",
    publicCible: "admin",
    question: "Comment créer ou gérer une filière ou un niveau ?",
    variantes: [
      "Comment ajouter une filière ?",
      "Comment supprimer une filière ?",
      "Comment ajouter un niveau ?",
      "Comment modifier un niveau ?",
      "Pourquoi ma filière n'apparaît pas dans la liste ?",
      "Pourquoi mon niveau n'apparaît pas ?",
      "Comment créer une nouvelle filière ?",
      "Comment créer un nouveau niveau ?",
      "Pourquoi une filière importée depuis Excel n'est pas reconnue ?",
      "Pourquoi le niveau de mes étudiants n'est pas correct ?",
      "Comment associer une filière à un étudiant ?",
      "Comment associer un niveau à un étudiant ?",
    ],
    reponse:
      "Va dans la section \"Filières & niveaux\" de ton espace administrateur. Tu peux y créer une filière avec un simple nom, puis ajouter des niveaux rattachés à cette filière (nom + ordre d'affichage). Un étudiant est automatiquement associé à la filière et au niveau que tu sélectionnes au moment de l'ajouter ou de l'importer — il n'y a pas d'association séparée à faire après coup, il faut re-créer ou déplacer sa fiche vers le bon niveau si besoin.",
  },

  // ============ ADMIN — Notes ============
  {
    id: "admin-notes-saisie",
    categorie: "Notes",
    publicCible: "admin",
    question: "Comment ajouter, modifier ou supprimer une note ?",
    variantes: [
      "Comment ajouter les notes d'un étudiant ?",
      "Comment modifier une note ?",
      "Comment supprimer une note ?",
      "Comment corriger une erreur de saisie de note ?",
    ],
    reponse:
      "Dans la section \"Matières\" (ou \"Notes\"), sélectionne le niveau puis la matière concernée, et saisis directement la note de chaque étudiant dans le champ prévu. Pour corriger une note déjà saisie, ressaisis simplement la nouvelle valeur au même endroit. Pour la supprimer, utilise l'icône de suppression à côté de la note existante.",
  },
  {
    id: "admin-notes-visibilite",
    categorie: "Notes",
    publicCible: "admin",
    question: "Comment publier mes notes et quand sont-elles visibles par l'étudiant ?",
    variantes: [
      "Pourquoi je n'arrive pas à enregistrer une note ?",
      "Pourquoi la note ne s'affiche pas chez l'étudiant ?",
      "Comment publier les notes ?",
      "Est-ce que l'étudiant voit immédiatement une note que j'ajoute ?",
      "Pourquoi la note que j'ai enregistrée a disparu ?",
    ],
    reponse:
      "Il n'y a pas d'étape de \"publication\" séparée : dès qu'une note est enregistrée, elle est immédiatement visible par l'étudiant concerné dans son espace. Si l'enregistrement échoue, vérifie ta connexion et réessaie. Si une note semble avoir disparu, vérifie que tu regardes bien le bon niveau et la bonne matière.",
  },

  // ============ ADMIN — Emploi du temps ============
  {
    id: "admin-edt",
    categorie: "Emploi du temps",
    publicCible: "admin",
    question: "Comment créer, modifier ou supprimer un cours dans l'emploi du temps ?",
    variantes: [
      "Comment créer un emploi du temps ?",
      "Pourquoi mon emploi du temps ne s'affiche pas ?",
      "Pourquoi les étudiants ne voient-ils pas mon emploi du temps ?",
      "Comment modifier un cours ?",
      "Comment supprimer un cours ?",
      "Comment changer une salle ?",
      "Comment changer l'heure d'un cours ?",
      "Comment publier un nouvel emploi du temps ?",
    ],
    reponse:
      "Dans la section \"Emploi du temps\", sélectionne le niveau concerné, puis clique sur \"Ajouter\" dans le bloc jour/créneau souhaité pour créer un cours (matière, heures, professeur, salle). Utilise les icônes crayon/corbeille sur un cours existant pour le modifier ou le supprimer. Les changements sont visibles immédiatement côté étudiant, sans étape de publication séparée.",
  },

  // ============ ADMIN — Annonces ============
  {
    id: "admin-annonces",
    categorie: "Annonces",
    publicCible: "admin",
    question: "Comment publier, modifier ou supprimer une annonce ?",
    variantes: [
      "Comment publier une annonce ?",
      "Pourquoi mon annonce n'apparaît-elle pas ?",
      "Pourquoi les étudiants ne voient-ils pas mon annonce ?",
      "Comment modifier une annonce ?",
      "Comment supprimer une annonce ?",
      "Comment savoir si mon annonce a bien été publiée ?",
    ],
    reponse:
      "Dans la section \"Annonces\", sélectionne le niveau concerné et utilise le formulaire pour publier une nouvelle annonce (titre, contenu, urgence optionnelle). Elle apparaît immédiatement dans la liste et côté étudiant du niveau choisi. Pour la supprimer, utilise l'icône de suppression sur l'annonce concernée. Si les étudiants ne la voient pas, vérifie que tu as bien publié sur le bon niveau.",
  },
  {
    id: "admin-annonces-image",
    categorie: "Annonces",
    publicCible: "admin",
    question: "Comment ajouter une image à une annonce ou un événement ?",
    variantes: ["Comment ajouter une image ?", "Pourquoi mon image ne se télécharge pas ?"],
    reponse:
      "Pour les événements, un champ \"Affiche (image)\" est disponible dans le formulaire de création — choisis simplement ton fichier image. Si le téléchargement échoue, vérifie que le fichier est bien une image (jpg, png) et qu'il n'est pas trop volumineux.",
  },

  // ============ ADMIN — Problèmes généraux ============
  {
    id: "admin-technique-general",
    categorie: "Problèmes généraux",
    publicCible: "admin",
    question: "Mon espace administrateur ne fonctionne pas correctement, que faire ?",
    variantes: [
      "Pourquoi mon espace administrateur est-il vide ?",
      "Pourquoi certaines données ont-elles disparu ?",
      "Pourquoi mes modifications ne sont-elles pas enregistrées ?",
      "Pourquoi un bouton ne fonctionne-t-il pas ?",
      "Pourquoi CampusLink affiche-t-il une erreur ?",
      "Pourquoi la page reste-t-elle bloquée ?",
      "Pourquoi je suis déconnecté automatiquement ?",
      "Pourquoi CampusLink fonctionne chez moi mais pas au bureau ?",
      "Est-ce que le problème vient de mon établissement ou de CampusLink ?",
    ],
    reponse:
      "Essaie d'abord de rafraîchir la page. Si des données semblent manquantes, vérifie que tu es bien sur le bon niveau ou la bonne filière — beaucoup de sections filtrent par niveau sélectionné. Si le problème persiste sur différents réseaux ou appareils, contacte le support sur WhatsApp (+226 57 47 67 24) en précisant ce que tu faisais et ce qui s'est affiché.",
  },
  {
    id: "admin-contact-support",
    categorie: "Problèmes généraux",
    publicCible: "tous",
    question: "Comment contacter le support CampusLink ?",
    variantes: [
      "Comment signaler un problème technique à CampusLink ?",
      "Comment envoyer une capture d'écran au support ?",
      "Quelles informations dois-je fournir au support pour qu'il puisse résoudre mon problème ?",
    ],
    reponse:
      "Écris-nous sur WhatsApp au +226 57 47 67 24. Pour nous aider à résoudre ton problème rapidement, indique : ton établissement, si tu es étudiant ou administrateur, ce que tu essayais de faire, ce qui s'est passé (message d'erreur si possible), et une capture d'écran si tu en as une.",
  },
];

export function rechercherFaq(items: FaqItem[], requete: string): FaqItem[] {
  const q = requete.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [item.question, ...(item.variantes ?? []), item.reponse, item.categorie]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

const MOTS_VIDES = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "que", "qui", "quoi",
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles", "mon", "ma", "mes",
  "ton", "ta", "tes", "son", "sa", "ses", "pourquoi", "comment", "est", "ce", "cette",
  "pour", "avec", "dans", "sur", "pas", "ne", "n", "d", "l", "à", "au", "aux", "quand",
]);

function motsSignificatifs(texte: string): string[] {
  return texte
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((m) => m.length > 2 && !MOTS_VIDES.has(m));
}

/**
 * Classe les questions de la FAQ par pertinence par rapport à une question
 * tapée librement par l'utilisateur (recherche par mots-clés partagés,
 * pas juste une sous-chaîne exacte). Retourne les meilleurs résultats,
 * du plus pertinent au moins pertinent ; un score de 0 est exclu.
 */
export function trouverMeilleuresReponses(items: FaqItem[], question: string, limite = 3): FaqItem[] {
  const motsRequete = motsSignificatifs(question);
  if (motsRequete.length === 0) return [];

  const scored = items.map((item) => {
    const cibles = [item.question, ...(item.variantes ?? [])];
    let meilleurScore = 0;
    for (const cible of cibles) {
      const motsCible = new Set(motsSignificatifs(cible));
      let communs = 0;
      for (const m of motsRequete) if (motsCible.has(m)) communs++;
      // Bonus si la requête est une sous-chaîne quasi exacte d'une question/variante.
      const bonusExact = cible.toLowerCase().includes(question.trim().toLowerCase()) && question.trim().length > 4 ? 3 : 0;
      const score = communs + bonusExact;
      if (score > meilleurScore) meilleurScore = score;
    }
    return { item, score: meilleurScore };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map((s) => s.item);
}

/** Zone d'aide selon la page ouverte. Chaque zone a sa propre banque de questions. */
export function contexteAide(pathname: string): Exclude<Public, "tous"> {
  if (pathname.startsWith("/admin") || pathname.startsWith("/super-admin")) return "admin";
  if (
    pathname.startsWith("/etudiant") ||
    pathname.startsWith("/confirmer-compte") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/reinitialiser-mot-de-passe")
  ) {
    return "etudiant";
  }
  return "accueil";
}

/** Questions visibles dans une zone : les siennes, plus celles marquées « tous » (étudiant et admin seulement). */
export function faqPourContexte(contexte: Exclude<Public, "tous">): FaqItem[] {
  return FAQ.filter((f) => f.publicCible === contexte || (f.publicCible === "tous" && contexte !== "accueil"));
}
