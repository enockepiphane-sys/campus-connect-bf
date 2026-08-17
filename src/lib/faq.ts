export type Public = "etudiant" | "admin" | "tous";

export type FaqItem = {
  id: string;
  categorie: string;
  publicCible: Public;
  question: string;
  variantes?: string[];
  reponse: string;
};

export const FAQ: FaqItem[] = [
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
      "Essaie d'abord de rafraîchir la page ou de fermer/rouvrir l'application. Vérifie aussi ta connexion internet, en changeant de réseau si possible (Wi-Fi vers données mobiles ou inversement). Si le problème persiste sur plusieurs appareils ou réseaux différents, il est probable que ce soit un problème du côté de CampusLink — contacte le support à team@campuslink-bf.app en décrivant ce qui se passe.",
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
      "Essaie d'abord de rafraîchir la page. Si des données semblent manquantes, vérifie que tu es bien sur le bon niveau ou la bonne filière — beaucoup de sections filtrent par niveau sélectionné. Si le problème persiste sur différents réseaux ou appareils, contacte le support à team@campuslink-bf.app en précisant ce que tu faisais et ce qui s'est affiché.",
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
      "Écris-nous à team@campuslink-bf.app. Pour nous aider à résoudre ton problème rapidement, indique : ton établissement, si tu es étudiant ou administrateur, ce que tu essayais de faire, ce qui s'est passé (message d'erreur si possible), et une capture d'écran si tu en as une.",
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
