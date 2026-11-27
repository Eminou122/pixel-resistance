export const fr = {
  meta: {
    title: 'PIXEL RESISTANCE — Le village numérique résistant',
    skip: 'Aller au contenu',
    lang: 'Langue',
  },
  common: {
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    continue: 'Continuer',
    locked: 'Verrouillé',
    xp: 'XP',
    coins: 'pièces',
    level: 'Niv.',
    cancel: 'Annuler',
    soundOn: 'Son activé',
    soundOff: 'Son coupé',
    menu: 'Menu',
    backToSite: 'Découvrir NIRD WORLD',
    new: 'Nouveau',
  },
  nav: {
    label: 'Navigation du jeu',
    village: 'Village',
    missions: 'Missions',
    enemies: 'Ennemis',
    workshop: 'Atelier',
    hq: 'QG',
  },
  levels: {
    '1': 'Recrue',
    '2': 'Éclaireur·se',
    '3': 'Bidouilleur·se',
    '4': 'Libriste',
    '5': 'Stratège',
    '6': 'Légende du village',
  },
  axes: {
    hardware: 'Matériel',
    software: 'Logiciels',
    data: 'Données',
    people: 'Humain',
    openness: 'Ouverture',
  },
  menu: {
    tagline: 'Le village numérique résistant',
    story:
      "Un empire numérique a pris le contrôle du village éducatif. Les écoles croulent sous les licences, s'enferment dans des écosystèmes fermés, voient leurs données s'envoler et jettent des ordinateurs qui marchent encore. Toi, membre de la Résistance, tu vas aider le village à reprendre la main sur son numérique.",
    skipStory: 'Afficher tout le texte',
    start: 'Nouvelle partie',
    continue: 'Continuer',
    howto: 'Comment jouer',
    about: 'La Résistance',
    progress: '{{done}}/{{total}} missions · niv. {{level}}',
    confirmTitle: 'Recommencer à zéro ?',
    confirmText: 'Ta progression actuelle (missions, XP, pièces, succès) sera effacée. Cette action est définitive.',
    confirmYes: 'Oui, nouvelle partie',
    keys: '↑ ↓ pour choisir · Entrée pour valider',
  },
  howto: {
    title: 'Comment jouer',
    items: [
      'Explore le village : déplace ton personnage avec les flèches (ou Z Q S D / W A S D), ou clique directement sur un bâtiment.',
      "Fonce dans un bâtiment pour y entrer, dans un habitant pour lui parler. Sur mobile, utilise la croix directionnelle.",
      "Les missions se jouent à l'école. Chaque choix reçoit une explication : il y a rarement une seule bonne réponse, mais il y a des choix plus solides que d'autres.",
      "Tu gagnes de l'XP et des pièces en finissant des missions, en consultant les fiches ennemies, en maîtrisant les modules de l'atelier et en rencontrant les habitants.",
      'Rejouer une mission ne rapporte que si tu bats ton meilleur score : seule la différence est ajoutée.',
      "Bloqué·e sur une question ? Un indice du mentor (5 pièces) écarte une option faible. Attention : les pièces dépensées comptent dans ton score final.",
      'Ta partie est sauvegardée automatiquement dans ce navigateur.',
    ],
  },
  about: {
    title: 'La Résistance',
    paragraphs: [
      "PIXEL RESISTANCE est un jeu éducatif créé pour la Nuit de l'Info 2025 (défi « On veut du gros pixel ! », proposé par l'IUT du Littoral Côte d'Opale, département Informatique) sur le sujet national : « Le Village Numérique Résistant : comment les établissements scolaires peuvent tenir tête aux Big Tech ? ».",
      "Il s'inspire de démarches réelles comme NIRD (Numérique Inclusif, Responsable et Durable) : réemployer le matériel, choisir des logiciels libres, protéger les données des élèves et former les équipes.",
      "L'« empire » du jeu est une caricature : beaucoup de services propriétaires sont fiables et utiles. Le jeu cherche à montrer les compromis — coûts, dépendance, compatibilité, formation — pour que chacun décide en connaissance de cause.",
      'Le code est libre (licence MIT). Tous les graphismes et sons sont originaux, dessinés en code.',
    ],
  },
  hud: {
    label: 'État du joueur',
    toNext: '{{xp}} XP avant le niveau {{level}}',
    max: 'Niveau maximum atteint',
    missions: 'Missions',
  },
  toasts: {
    achievement: 'Succès débloqué !',
    level: 'Niveau {{level}} !',
  },
  village: {
    title: 'Le village',
    intro: "Le village numérique, encore sous l'ombre de la tour de l'Empire. Chaque mission réussie libère un nouveau lieu.",
    mapLabel: 'Carte du village. Utilise les flèches pour te déplacer.',
    mapHint: 'Clique sur la carte puis utilise les flèches · Fonce dans un bâtiment pour entrer',
    pad: { up: 'Haut', down: 'Bas', left: 'Gauche', right: 'Droite' },
    places: 'Les lieux',
    lockedBy: 'Termine la mission « {{mission}} » pour débloquer ce lieu.',
    lockedAll: 'Termine les cinq missions pour libérer la tour.',
    visited: 'Visité',
    talk: 'Parler',
    bump: 'Un arbre bloque le passage.',
    water: "L'étang est trop profond !",
    intro1: "Bienvenue, recrue ! Je suis Karim, le référent numérique. L'Empire contrôle nos écoles : licences hors de prix, données qui s'envolent, ordinateurs jetés trop tôt.",
    intro2: 'Déplace-toi avec les flèches ou clique sur un bâtiment. Fonce dans un habitant pour discuter : chacun a un conseil.',
    intro3: "Commence par l'école, au centre : ta première mission t'y attend. Bonne chance !",
  },
  locations: {
    school: {
      name: 'École centrale',
      text: "Le cœur du village. Les enseignants y préparent la résistance : c'est ici que se jouent les missions, du parc informatique vieillissant à la stratégie numérique de tout le village.",
      cta: 'Voir les missions',
    },
    hq: {
      name: 'QG de la Résistance',
      text: "La cave secrète où la Résistance tient ses comptes : niveau, statistiques, succès débloqués. On y trouve aussi le bouton pour recommencer une partie.",
      cta: 'Entrer au QG',
    },
    library: {
      name: 'Bibliothèque numérique',
      text: "Les archives de l'Empire, dérobées par la Résistance. Chaque fiche décrit une menace réelle pour les écoles, avec ses conséquences, ses nuances et les parades possibles.",
      cta: 'Consulter les fiches ennemies',
    },
    workshop: {
      name: 'Atelier informatique',
      text: "Établi, tournevis et clés USB d'installation : ici, on apprend les solutions concrètes. Linux, LibreOffice, plateformes libres, réemploi, formats ouverts, accessibilité.",
      cta: "Entrer dans l'atelier",
    },
    server: {
      name: 'Le Petit Serveur',
      text: "Une salle serveur à taille humaine. Héberger certains services au plus près (par l'établissement, la collectivité ou les plateformes de l'Éducation nationale) permet de savoir où sont les données des élèves. Cela demande aussi des compétences et des sauvegardes sérieuses.",
      cta: 'Module « Services respectueux de la vie privée »',
    },
    repair: {
      name: 'Repair café',
      text: "Chaque samedi, bénévoles, élèves et parents réparent ensemble. Un ordinateur qui dure plus longtemps, c'est moins de déchets et moins de dépenses : l'essentiel de l'impact environnemental d'un ordinateur vient de sa fabrication.",
      cta: 'Module « Reconditionner le matériel »',
    },
    tower: {
      name: "Tour de l'Empire",
      text: "La tour d'où l'Empire surveillait le village. Les cinq missions accomplies, ses portes sont ouvertes : le village a repris son indépendance numérique.",
      cta: 'Voir le bilan de la victoire',
    },
  },
  npcs: {
    teacher: {
      name: 'Mme Lefèvre',
      role: 'Professeure de technologie',
      lines: [
        "Mes élèves savent utiliser un logiciel, mais savent-ils comment marche un ordinateur ? Installer un système libre en classe, c'est une leçon en soi.",
        "Changer d'outil me fait un peu peur, je l'avoue. Ce qui m'aide : essayer d'abord sur un projet, avec un collègue qui connaît déjà.",
        "Mon conseil : un format ouvert pour les documents partagés. Mes élèves les ouvrent chez eux, quel que soit leur ordinateur.",
      ],
    },
    tech: {
      name: 'Karim',
      role: 'Référent numérique',
      lines: [
        "Avant de changer quoi que ce soit, je fais l'inventaire : quelles machines, quels logiciels, quels usages. On ne résiste pas à l'aveugle.",
        'Un vieux PC avec un SSD et un Linux léger repart souvent pour plusieurs années. Je teste toujours sur quelques postes avant de généraliser.',
        "Le logiciel libre n'est pas « sans effort » : il faut des mises à jour, de la documentation, de la formation. Mais ces compétences restent chez nous.",
      ],
    },
    student: {
      name: 'Lou',
      role: 'Élève de 4e, club informatique',
      lines: [
        "Au club, on a remis en route six vieux portables ! Le plus dur, c'était d'effacer proprement les anciennes données.",
        "Chez moi, on n'avait pas d'ordinateur. Celui que l'école m'a prêté, reconditionné, m'a changé la vie pour les devoirs.",
        "J'ai appris qu'une appli « gratuite » peut se payer avec nos données. Maintenant je lis à qui je donne mes infos.",
      ],
    },
    grandpa: {
      name: 'Papy Jo',
      role: 'Bénévole du repair café',
      lines: [
        "De mon temps, on réparait tout. Un ordinateur, c'est pareil : souvent, c'est juste un disque fatigué ou une batterie usée.",
        "Le repair café, c'est aussi un endroit où l'on apprend ensemble. Les jeunes m'apprennent Linux, je leur apprends le fer à souder !",
        "Jeter un appareil qui marche, c'est jeter les métaux, l'énergie et le travail qu'il a fallu pour le fabriquer.",
      ],
    },
  },
  enemies: {
    title: 'Fiches ennemies',
    intro:
      "Les archives de l'Empire. Chaque menace est réelle, mais aucune n'est une fatalité, et toutes ne concernent pas que les géants du numérique : il s'agit de comprendre les compromis.",
    discovered: '{{count}}/{{total}} fiches consultées',
    danger: 'Menace',
    sections: {
      description: 'Ce que c’est',
      example: 'Exemple concret',
      consequences: 'Conséquences pour les écoles',
      alternatives: 'Parades possibles',
      nuance: 'Nuance',
      counters: "Modules de l'atelier utiles",
    },
    unread: 'Fiche non consultée',
    lockin: {
      name: 'Le Verrouilleur',
      threat: 'Enfermement propriétaire',
      description:
        "Quand des outils, des comptes et des formats sont tous liés à un seul fournisseur, en partir devient très coûteux. Ce n'est pas forcément voulu : chaque choix pratique, pris isolément, renforce un peu plus le lien.",
      example:
        "Un collège utilise la messagerie, le stockage, les documents et l'agenda d'un même éditeur. Le jour où les tarifs augmentent, migrer signifierait convertir des milliers de fichiers, refaire les comptes et former tout le monde.",
      consequences: [
        'Peu de marge de négociation face aux hausses de prix ou aux changements de conditions.',
        'Projets pédagogiques dépendants des choix stratégiques d’une seule entreprise.',
        'Compétences des équipes liées à un produit plutôt qu’à des notions transférables.',
      ],
      alternatives: [
        'Privilégier les formats ouverts et les outils qui savent exporter les données.',
        'Répartir les services entre plusieurs fournisseurs, dont des solutions libres.',
        "Prévoir dès le départ une « porte de sortie » : comment récupérer nos données si l'on change ?",
      ],
      nuance:
        "Un écosystème intégré est souvent simple à administrer et bien documenté. Le problème n'est pas d'utiliser un fournisseur, mais de ne plus pouvoir en changer.",
    },
    licenses: {
      name: 'Le Percepteur',
      threat: 'Licences propriétaires coûteuses',
      description:
        "Beaucoup de logiciels se paient par poste ou par utilisateur, souvent sous forme d'abonnement. Le coût revient chaque année, et grimpe avec le nombre d'élèves et d'enseignants.",
      example:
        "Un lycée renouvelle chaque année des licences de bureautique et de retouche d'image pour toutes ses salles, alors qu'une partie des usages (traitement de texte, tableur, dessin) est couverte par des logiciels libres.",
      consequences: [
        "Budget détourné d'autres projets (sorties, matériel, formation).",
        "Inégalités : les élèves n'ont pas toujours le logiciel à la maison.",
        'Risque de blocage si une licence expire ou n’est pas renouvelée.',
      ],
      alternatives: [
        "Faire l'inventaire des usages réels avant chaque renouvellement.",
        'Adopter des logiciels libres pour les usages courants (LibreOffice, GIMP, Inkscape, Krita…).',
        'Conserver des licences ciblées là où un besoin précis n’est pas couvert.',
      ],
      nuance:
        "Un logiciel libre est gratuit à installer, mais pas gratuit à déployer : installation, accompagnement et formation ont un coût en temps. Il se compare au coût total des licences, pas à zéro.",
    },
    data: {
      name: "L'Aspirateur",
      threat: 'Souveraineté et confidentialité des données',
      description:
        "Les élèves sont mineurs et leurs données (notes, travaux, comportements, voix, images) sont sensibles. Certains services, surtout « gratuits », se financent en collectant ou en exploitant ces données.",
      example:
        "Une application de quiz très populaire demande de créer un compte par élève avec nom, classe et adresse e-mail. Ses conditions d'utilisation autorisent le partage de données avec des partenaires commerciaux.",
      consequences: [
        "Non-respect possible du RGPD, dont l'établissement est responsable.",
        'Profils d’élèves constitués à leur insu, parfois hors de l’Union européenne.',
        'Perte de confiance des familles.',
      ],
      alternatives: [
        "Vérifier avec le délégué à la protection des données (DPD) de l'académie avant d'adopter un service.",
        "Préférer les services proposés par l'Éducation nationale (apps.education.fr, ENT) ou hébergés localement.",
        'Minimiser : pseudonymes, pas de données inutiles, durée de conservation courte.',
      ],
      nuance:
        "Les services payants ne sont pas automatiquement plus sûrs, et les grands fournisseurs proposent parfois des contrats adaptés à l'éducation. C'est le contrat, l'hébergement et la collecte réelle qu'il faut examiner.",
    },
    obsolescence: {
      name: 'Le Sablier',
      threat: 'Obsolescence programmée et logicielle',
      description:
        "Un ordinateur peut fonctionner parfaitement et pourtant être « condamné » : fin des mises à jour du système, logiciels toujours plus gourmands, pièces impossibles à remplacer.",
      example:
        "Depuis le 14 octobre 2025, Windows 10 ne reçoit plus de mises à jour de sécurité gratuites. Beaucoup de PC qui marchent encore ne sont pas compatibles avec Windows 11 (processeur trop ancien, absence de puce TPM 2.0).",
      consequences: [
        "Remplacements anticipés qui pèsent sur le budget de l'établissement ou de la collectivité.",
        "Déchets électroniques et impact environnemental, dont l'essentiel vient de la fabrication.",
        'Postes non mis à jour exposés aux failles de sécurité s’ils restent en service.',
      ],
      alternatives: [
        'Installer un système encore maintenu et adapté au matériel (distribution Linux légère).',
        'Améliorer le matériel : SSD, mémoire vive, batterie.',
        'Donner une seconde vie aux machines : prêt aux familles, postes d’appoint, pièces.',
      ],
      nuance:
        "Ne pas mettre à jour un système, c'est aussi un risque : garder un PC sous un système non maintenu sur le réseau de l'école n'est pas une solution. Prolonger, oui, mais en sécurité.",
    },
    cloud: {
      name: 'Le Nuage-Roi',
      threat: 'Dépendance aux plateformes cloud',
      description:
        "Quand toute l'activité passe par des services en ligne, l'école dépend de leur disponibilité, de leurs tarifs, de leurs conditions et des lois du pays où ils sont hébergés.",
      example:
        "Un jour de panne d'un grand fournisseur, plus personne n'accède aux cours, aux devoirs ni à la messagerie. Ailleurs, un service gratuit devient payant et l'école doit migrer dans l'urgence.",
      consequences: [
        'Activité pédagogique à la merci d’une panne ou d’un changement de politique commerciale.',
        'Données soumises à des lois extraterritoriales (comme le CLOUD Act américain).',
        'Difficulté à récupérer les données en cas de départ.',
      ],
      alternatives: [
        'Choisir des services hébergés en Europe, idéalement par des acteurs publics ou mutualisés.',
        'Garder des copies locales et exportables des contenus importants.',
        'Utiliser des logiciels libres auto-hébergeables (Nextcloud, Moodle, BigBlueButton…).',
      ],
      nuance:
        "Le cloud a de vrais avantages : pas de serveur à maintenir, accès partout, sauvegardes gérées. Héberger soi-même demande des compétences. L'enjeu est de garder le choix et la maîtrise.",
    },
    interop: {
      name: 'Le Mur des Formats',
      threat: "Manque d'interopérabilité",
      description:
        "Des outils qui ne se parlent pas, des fichiers qui ne s'ouvrent que dans un logiciel précis : chacun reste coincé dans sa bulle, et changer d'outil fait perdre des documents.",
      example:
        "Un élève rend son devoir dans un format que seul un logiciel payant ouvre correctement. Chez lui, la famille n'a pas ce logiciel : la mise en page est cassée.",
      consequences: [
        "Inégalités entre familles selon l'équipement.",
        'Archives scolaires difficiles à relire dans dix ans.',
        'Coûts de conversion et pertes d’information lors des migrations.',
      ],
      alternatives: [
        'Adopter des formats ouverts et normalisés : ODF (ISO/IEC 26300), PDF, PNG, HTML, CSV.',
        'Choisir des outils qui respectent les standards et permettent l’export.',
        'Exporter en PDF pour diffuser, garder le format ouvert pour modifier.',
      ],
      nuance:
        "Les formats ouverts ne règlent pas tout : la mise en page d'un document complexe peut varier d'un logiciel à l'autre. Tester les documents clés lors d'un changement d'outil évite les mauvaises surprises.",
    },
  },
  workshop: {
    title: 'Atelier de la Résistance',
    intro:
      "Sept modules pour passer de la théorie à l'action. Lis chaque fiche puis réponds à la question de contrôle pour maîtriser le module.",
    mastered: '{{count}}/{{total}} modules maîtrisés',
    masteredBadge: 'Maîtrisé',
    open: 'Ouvrir le module',
    sections: {
      what: 'En bref',
      benefits: "Ce que ça change pour l'école",
      watchouts: 'À prévoir',
      firstStep: 'Premier pas',
    },
    check: 'Question de contrôle',
    right: 'Exact ! Module maîtrisé.',
    wrong: 'Pas tout à fait. Relis la fiche et réessaie.',
    retry: 'Réessayer',
  },
  modules: {
    linux: {
      title: 'Linux et systèmes libres',
      tagline: 'Un système maintenu, gratuit, qui fait revivre les machines',
      what: "Linux est un système d'exploitation libre, décliné en « distributions » : Linux Mint ou Xubuntu pour un usage général, PrimTux pour l'école primaire, Emmabuntüs pour le réemploi. Elles reçoivent des mises à jour de sécurité et tournent souvent bien sur du matériel ancien.",
      benefits: [
        'Prolonge la vie des PC incompatibles avec les dernières versions de Windows.',
        'Aucune licence à payer par poste, y compris pour les ordinateurs prêtés aux familles.',
        "Permet d'enseigner le fonctionnement d'un système, pas seulement son usage.",
      ],
      watchouts: [
        'Vérifier que les logiciels pédagogiques utilisés fonctionnent (ou ont une version web ou libre).',
        'Prévoir la formation des enseignants et une documentation simple.',
        'Garder si besoin quelques postes sous un autre système pour des usages spécifiques.',
      ],
      firstStep: 'Tester une distribution sur deux ou trois postes pilotes, avec un enseignant volontaire.',
      quiz: {
        question: 'Quelle est la meilleure façon de passer une salle informatique sous Linux ?',
        options: [
          'Tout réinstaller pendant un week-end, sans prévenir, pour ne pas perdre de temps.',
          'Commencer par quelques postes pilotes, vérifier les logiciels utilisés et former les enseignants.',
          "Attendre que tous les ordinateurs tombent en panne pour changer d'un coup.",
        ],
        explain: "Un pilote permet de repérer les incompatibilités et de rassurer les équipes avant d'étendre.",
      },
    },
    libreoffice: {
      title: 'LibreOffice et bureautique libre',
      tagline: 'Traitement de texte, tableur, présentations sans licence',
      what: 'LibreOffice est une suite bureautique libre (Writer, Calc, Impress, Draw…) développée par une fondation. Elle fonctionne sous Windows, macOS et Linux, utilise le format ouvert ODF et sait ouvrir et enregistrer les formats courants comme .docx ou .xlsx.',
      benefits: [
        'Même logiciel à l’école et à la maison, gratuitement, pour chaque famille.',
        'Format ODF normalisé : les documents restent lisibles dans la durée.',
        'Fonctionne sans compte en ligne ni connexion.',
      ],
      watchouts: [
        'La mise en page de documents complexes peut légèrement varier avec d’autres suites.',
        "Les macros spécifiques d'un autre logiciel peuvent devoir être réécrites.",
        "Prévoir une courte prise en main : l'interface diffère un peu.",
      ],
      firstStep: "Installer LibreOffice sur tous les postes en parallèle de l'existant, et l'utiliser pour les nouveaux documents.",
      quiz: {
        question: 'Un collègue doit envoyer un document modifiable à des familles équipées de logiciels différents. Que conseiller ?',
        options: [
          "Le format propre à son logiciel payant, c'est le plus courant.",
          "Une capture d'écran du document.",
          'Le format ouvert ODF (ou un PDF si le document n’a pas à être modifié).',
        ],
        explain: "Un format ouvert s'ouvre dans de nombreux logiciels, dont des gratuits : personne n'est obligé d'acheter quoi que ce soit.",
      },
    },
    learning: {
      title: "Plateformes d'apprentissage libres",
      tagline: 'Des cours en ligne sans céder les données des élèves',
      what: "Moodle est une plateforme d'apprentissage libre utilisée dans le monde entier ; l'Éducation nationale propose Éléa, construite sur Moodle. Les contenus interactifs peuvent être créés avec H5P, et apps.education.fr fournit visioconférence, stockage et vidéos aux agents.",
      benefits: [
        "Hébergement maîtrisé par l'institution, sans exploitation commerciale des données.",
        'Contenus réutilisables et partageables entre enseignants et établissements.',
        "Pas de dépendance à l'offre gratuite d'une entreprise susceptible de changer.",
      ],
      watchouts: [
        'Une plateforme demande un hébergement, des mises à jour et un accompagnement.',
        'Privilégier les instances déjà proposées (académie, collectivité) plutôt que tout monter seul.',
        "Former les enseignants à la création de parcours, pas seulement à l'outil.",
      ],
      firstStep: "Créer un premier parcours sur la plateforme proposée par l'académie et le partager avec un collègue.",
      quiz: {
        question: 'Pourquoi passer par une plateforme institutionnelle plutôt que par une appli gratuite au hasard ?',
        options: [
          "Parce que l'hébergement et l'usage des données des élèves sont encadrés par l'institution.",
          'Parce que les plateformes institutionnelles sont toujours plus jolies.',
          "Parce qu'il est interdit d'utiliser tout autre site en classe.",
        ],
        explain: "L'enjeu principal est la maîtrise des données et la pérennité, pas l'apparence ni une interdiction générale.",
      },
    },
    refurbish: {
      title: 'Reconditionner le matériel',
      tagline: 'Réparer, améliorer, redistribuer',
      what: "Reconditionner, c'est tester un appareil, effacer ses données de façon sécurisée, remplacer les pièces fatiguées et installer un système adapté. Des associations et des entreprises de l'économie sociale et solidaire s'en sont fait une spécialité.",
      benefits: [
        "Moins de déchets électroniques : l'essentiel de l'empreinte d'un ordinateur vient de sa fabrication.",
        'Équiper des élèves et familles qui n’ont pas d’ordinateur.',
        'Un projet concret pour les élèves : diagnostic, montage, documentation.',
      ],
      watchouts: [
        'Effacer réellement les anciennes données (outil dédié, pas une simple suppression).',
        'Respecter la sécurité électrique et la filière de recyclage pour ce qui ne se répare pas.',
        'Prévoir qui assure le suivi en cas de panne une fois le matériel distribué.',
      ],
      firstStep: 'Organiser un atelier de diagnostic avec le club informatique sur quelques machines données.',
      quiz: {
        question: 'Un vieux portable démarre très lentement. Quelle amélioration a le plus souvent le meilleur effet ?',
        options: [
          'Changer le clavier.',
          'Remplacer le disque dur par un SSD.',
          'Installer un logiciel « nettoyeur » trouvé sur Internet.',
        ],
        explain: 'Le disque dur mécanique est souvent le goulot d’étranglement ; un SSD transforme la machine pour un coût modeste.',
      },
    },
    privacy: {
      title: 'Services respectueux de la vie privée',
      tagline: 'Savoir où sont les données, et qui y a accès',
      what: "Des alternatives existent pour la plupart des usages : Nextcloud pour le stockage, BigBlueButton ou Jitsi pour la visio, PeerTube pour la vidéo. Beaucoup sont proposées aux personnels de l'Éducation nationale via apps.education.fr, ou par des associations comme Framasoft.",
      benefits: [
        'Données hébergées en France ou en Europe, par des acteurs identifiés.',
        'Respect du RGPD plus simple à démontrer.',
        'Confiance des familles renforcée.',
      ],
      watchouts: [
        "Certains outils sont moins riches en fonctionnalités : vérifier qu'ils couvrent les besoins réels.",
        'Un service auto-hébergé doit être sauvegardé et mis à jour.',
        'Associer le délégué à la protection des données dès le choix.',
      ],
      firstStep: 'Lister les services en ligne utilisés avec les élèves et vérifier, pour chacun, où vont les données.',
      quiz: {
        question: 'Quelle question poser en premier avant d’utiliser un service en ligne avec des élèves ?',
        options: [
          'Est-ce que le logo est sympathique ?',
          'Combien de personnes l’utilisent déjà ?',
          'Quelles données sont collectées, où sont-elles hébergées et pour quoi faire ?',
        ],
        explain: 'La popularité ne garantit rien : ce sont la collecte, l’hébergement et la finalité qui comptent.',
      },
    },
    standards: {
      title: 'Standards ouverts et interopérabilité',
      tagline: 'Des fichiers qui survivent aux logiciels',
      what: "Un standard ouvert est une spécification publique que tout le monde peut implémenter : ODF pour la bureautique, PDF pour la diffusion, PNG et SVG pour les images, HTML pour le web, CSV pour les données. L'interopérabilité, c'est la capacité des outils à échanger grâce à ces standards.",
      benefits: [
        "Changer d'outil sans perdre ses documents.",
        'Archives lisibles dans la durée.',
        'Égalité entre élèves, quels que soient leurs logiciels.',
      ],
      watchouts: [
        'Définir des règles simples et partagées (quel format pour quoi).',
        'Tester les documents importants lors des conversions.',
        'Expliquer le pourquoi aux équipes, sinon les habitudes reviennent.',
      ],
      firstStep: "Adopter une règle d'établissement : ODF pour modifier, PDF pour diffuser.",
      quiz: {
        question: "Qu'est-ce qu'un standard ouvert ?",
        options: [
          'Une spécification publique que n’importe quel logiciel peut mettre en œuvre.',
          'Un format gratuit, mais réservé à un seul éditeur.',
          "Un logiciel installé sur tous les ordinateurs d'un pays.",
        ],
        explain: 'Ce qui compte, c’est que la spécification soit publique et implémentable par tous, sans dépendre d’un éditeur.',
      },
    },
    inclusion: {
      title: 'Inclusion et accessibilité',
      tagline: "Un numérique pour tous les élèves, pas seulement ceux qui sont déjà équipés",
      what: "L'inclusion numérique, c'est permettre à chacun d'accéder au numérique et de s'en servir : matériel, connexion, compétences. L'accessibilité, c'est que les outils soient utilisables par tous, y compris en situation de handicap (lecteurs d'écran libres comme NVDA ou Orca, navigation au clavier, contrastes, sous-titres).",
      benefits: [
        'Aucun élève laissé de côté pour les devoirs numériques.',
        "Des outils accessibles profitent à tous (clarté, lisibilité, clavier).",
        'Les familles gagnent aussi en autonomie.',
      ],
      watchouts: [
        "Vérifier l'accessibilité dès le choix d'un outil (le RGAA sert de référence pour les services publics).",
        'Accompagner les familles, pas seulement leur fournir un appareil.',
        'Ne pas supposer que tous les élèves ont un ordinateur ou une connexion à la maison.',
      ],
      firstStep: 'Recenser discrètement les élèves sans équipement et leur proposer un prêt de matériel reconditionné.',
      quiz: {
        question: "Un nouvel élève malvoyant arrive. Quand faut-il s'occuper de l'accessibilité des outils numériques ?",
        options: [
          "Plus tard, quand on aura le temps de tout refaire.",
          "Dès maintenant, et idéalement dès le choix de chaque outil.",
          "Jamais : c'est le rôle de la famille d'adapter les outils.",
        ],
        explain: "Penser l'accessibilité dès le départ coûte bien moins cher que corriger après coup, et profite à tous.",
      },
    },
  },
  missions: {
    title: 'Missions de la Résistance',
    intro: 'Cinq missions pour libérer le village. Chacune se débloque après la précédente.',
    status: {
      locked: 'Verrouillée',
      available: 'Disponible',
      done: 'Terminée',
    },
    lockedHint: 'Termine la mission précédente',
    best: 'Meilleur score : {{score}}/{{max}}',
    attempts: '{{count}} tentative(s)',
    play: 'Jouer',
    replay: 'Rejouer',
    notFound: "Cette mission n'existe pas.",
    windows10: {
      title: 'La crise Windows 10',
      intro:
        "Octobre 2025 : Windows 10 ne reçoit plus de mises à jour de sécurité gratuites. Au collège du village, les 30 PC de la salle informatique fonctionnent très bien… mais ne sont pas compatibles avec Windows 11. Le Sablier ricane : « Jetez-les, achetez du neuf ! »",
      objective: "Décider de l'avenir de 30 ordinateurs fonctionnels qui ne sont plus mis à jour.",
      q: {
        q1: {
          prompt: 'Le conseil d’administration te demande ton avis. Que faire des 30 PC ?',
          o: {
            a: {
              label: 'Les remplacer tous par des PC neufs compatibles Windows 11.',
              why: "C'est la solution la plus chère, et elle jette des machines qui marchent. La fabrication représente l'essentiel de l'impact environnemental d'un ordinateur.",
            },
            b: {
              label: 'Les garder sous Windows 10 sans rien changer.',
              why: 'Sans correctifs de sécurité, ces postes connectés au réseau de l’école deviennent une porte d’entrée pour les attaques. Prolonger, oui, mais pas sans mises à jour.',
            },
            c: {
              label: 'Payer les mises à jour de sécurité étendues (ESU) de Microsoft.',
              why: "C'est une option légitime pour gagner du temps, mais elle est payante et limitée dans la durée : le problème revient plus tard. Utile si elle sert à préparer une transition.",
            },
            d: {
              label: 'Tester une distribution Linux légère sur quelques postes pilotes, puis étendre.',
              why: 'Les machines restent utiles et reçoivent des mises à jour, sans licence. Le pilote permet de vérifier les logiciels pédagogiques et de former les équipes avant de généraliser.',
            },
          },
        },
        q2: {
          prompt: 'Le professeur de technologie utilise un logiciel de modélisation 3D qui ne fonctionne que sous Windows. Que proposes-tu ?',
          o: {
            a: {
              label: 'Renoncer à Linux pour toute la salle.',
              why: "Un besoin spécifique ne justifie pas de bloquer toute la transition. On peut traiter ce cas à part.",
            },
            b: {
              label: 'Garder quelques postes adaptés à ce besoin, et tester avec lui une alternative libre (FreeCAD, par exemple).',
              why: "Réaliste : les usages spécifiques sont respectés, la majorité des postes avance, et l'enseignant participe au choix d'une alternative au lieu de la subir.",
            },
            c: {
              label: 'Lui imposer un logiciel libre équivalent dès la rentrée.',
              why: "Bonne direction, mauvaise méthode : sans tests ni formation, il risque de rejeter le changement, et son programme pédagogique peut en souffrir.",
            },
          },
        },
        q3: {
          prompt: 'Qui accompagne la transition ?',
          o: {
            a: {
              label: "Personne : les élèves s'adapteront tout seuls.",
              why: "Les élèves s'adaptent souvent vite, mais les enseignants doivent pouvoir préparer leurs cours. Sans accompagnement, la transition échoue.",
            },
            b: {
              label: 'Un prestataire externe, chargé de tout.',
              why: "Possible pour l'installation, mais la dépendance change simplement de fournisseur. Les compétences ne restent pas dans l'établissement.",
            },
            c: {
              label: 'Le référent numérique, avec des formations courtes, une documentation simple et l’appui de la collectivité ou d’une association.',
              why: "C'est l'option la plus durable : les compétences restent sur place et l'équipe n'est pas seule face aux difficultés.",
            },
          },
        },
      },
    },
    licenses: {
      title: 'Le piège des licences',
      intro:
        "La facture de renouvellement des licences de bureautique et de retouche d'image vient d'arriver au lycée. Elle ampute le budget des sorties scolaires. Le Percepteur tend la main : « Signez, comme chaque année… »",
      objective: 'Réduire la dépendance aux licences sans casser le travail des équipes.',
      q: {
        q1: {
          prompt: 'Par où commencer ?',
          o: {
            a: {
              label: "Négocier une remise avec l'éditeur.",
              why: "Cela soulage le budget cette année, mais ne change rien à la dépendance. Utile à court terme, pas une stratégie.",
            },
            b: {
              label: "Faire l'inventaire : quels logiciels, pour quels usages, utilisés par qui et à quelle fréquence ?",
              why: "On ne remplace bien que ce que l'on connaît. L'inventaire révèle souvent des licences peu utilisées et des besoins couverts par des logiciels libres.",
            },
            c: {
              label: 'Désinstaller tous les logiciels payants pendant les vacances.',
              why: 'Brutal et risqué : des cours entiers peuvent en dépendre. Les équipes vivraient le changement comme une punition.',
            },
          },
        },
        q2: {
          prompt: 'Pour la bureautique, quelle solution proposer ?',
          o: {
            a: {
              label: 'LibreOffice sur tous les postes, avec le format ouvert ODF par défaut et un export vers les autres formats si besoin.',
              why: 'Gratuit pour l’école comme pour les familles, sans compte en ligne, avec un format normalisé. Il faut juste tester les documents complexes et prévoir une courte prise en main.',
            },
            b: {
              label: "La suite en ligne gratuite d'une grande plateforme.",
              why: "Pratique et collaborative, mais elle impose un compte par élève, pose la question des données et crée une nouvelle dépendance. À évaluer avec le délégué à la protection des données.",
            },
            c: {
              label: 'Des copies non officielles des logiciels payants.',
              why: "C'est illégal et dangereux : ces copies sont souvent porteuses de logiciels malveillants. Un établissement ne peut pas montrer cet exemple.",
            },
          },
        },
        q3: {
          prompt: "La professeure d'arts plastiques craint de perdre ses habitudes sur son logiciel de retouche. Que fais-tu ?",
          o: {
            a: {
              label: "Lui dire que c'est pareil et qu'elle s'habituera.",
              why: "Ce n'est pas tout à fait pareil, et minimiser une inquiétude crée de la résistance au changement.",
            },
            b: {
              label: 'Garder toutes les licences graphiques telles quelles.',
              why: "Ses besoins sont respectés, mais le coût reste entier pour toutes les salles. On peut faire plus fin.",
            },
            c: {
              label: "Lui présenter GIMP, Krita et Inkscape lors d'un atelier d'essai, et garder une licence ciblée si un besoin réel n'est pas couvert.",
              why: "On part de ses besoins, on teste avant de décider, et on conserve une licence seulement là où elle est justifiée.",
            },
          },
        },
      },
    },
    data: {
      title: 'La forteresse des données',
      intro:
        "Une application de quiz gratuite, très populaire, propose de créer un compte pour chaque élève. Les enseignants adorent. L'Aspirateur se frotte les mains : « Des noms, des classes, des résultats… merci ! »",
      objective: 'Protéger les données des élèves tout en gardant des outils utiles.',
      q: {
        q1: {
          prompt: "Avant d'utiliser l'application avec les élèves, que vérifier en priorité ?",
          o: {
            a: {
              label: "Rien : si c'est gratuit et populaire, c'est sans risque.",
              why: "La popularité ne garantit rien, et la gratuité se paie parfois avec les données. Or l'établissement est responsable des traitements qu'il met en place.",
            },
            b: {
              label: "Quelles données sont collectées, où elles sont hébergées, combien de temps, et si c'est conforme au RGPD, avec l'aide du délégué à la protection des données de l'académie.",
              why: "C'est la bonne démarche : on vérifie avant d'engager les données de mineurs, avec la personne compétente.",
            },
            c: {
              label: "L'utiliser sans comptes nominatifs (pseudonymes), le temps de vérifier.",
              why: 'Bon réflexe de minimisation, qui réduit le risque. Mais la vérification reste nécessaire : l’appli peut collecter d’autres données (appareil, usage).',
            },
          },
        },
        q2: {
          prompt: "Où héberger les documents partagés de l'école ?",
          o: {
            a: {
              label: "Sur un grand cloud commercial, avec un contrat adapté à l'éducation.",
              why: "Fiable et pratique, et un contrat peut apporter des garanties. Mais les données peuvent rester soumises à des lois extraterritoriales, et partir sera difficile. Un compromis à faire en connaissance de cause.",
            },
            b: {
              label: 'Sur les comptes personnels gratuits des enseignants.',
              why: "Les données des élèves se retrouvent dispersées, hors de tout contrôle de l'établissement. À éviter.",
            },
            c: {
              label: "Sur les services de l'Éducation nationale ou de la collectivité (ENT, apps.education.fr), ou un Nextcloud géré localement.",
              why: "Hébergement identifié, encadré, sans exploitation commerciale. Il faut seulement s'assurer que les services couvrent les besoins et que les sauvegardes sont assurées.",
            },
          },
        },
        q3: {
          prompt: 'Un parent demande quelles données sur son enfant sont stockées. Que réponds-tu ?',
          o: {
            a: {
              label: "Que c'est son droit (droit d'accès du RGPD) et que l'établissement, qui tient un registre de ses traitements, va lui répondre.",
              why: "Exact : les familles ont un droit d'accès, et le registre des traitements permet de répondre précisément.",
            },
            b: {
              label: "Lui transmettre les conditions d'utilisation des services utilisés.",
              why: "C'est un début de transparence, mais ce n'est pas une réponse à sa demande : il veut savoir ce qui concerne son enfant.",
            },
            c: {
              label: "Que ce n'est pas son affaire.",
              why: "Faux : le droit d'accès aux données personnelles est garanti par le RGPD.",
            },
          },
        },
      },
    },
    reuse: {
      title: 'Le défi du réemploi',
      intro:
        "Une entreprise du village donne 20 ordinateurs portables de 8 ans. Batteries fatiguées, disques durs lents. Le club informatique veut leur donner une seconde vie. Le Verrouilleur grogne : « Sans le dernier système, ils ne servent à rien ! »",
      objective: 'Rendre ces ordinateurs utiles, en sécurité, à ceux qui en ont besoin.',
      q: {
        q1: {
          prompt: 'Premier geste en recevant les machines ?',
          o: {
            a: {
              label: 'Tout démonter pour récupérer les pièces.',
              why: "Certaines pièces serviront, mais beaucoup de machines peuvent être sauvées entières. On démonte ce qui ne se répare pas, pas tout.",
            },
            b: {
              label: 'Les distribuer tout de suite aux familles, telles quelles.',
              why: "Elles contiennent peut-être encore les données de l'entreprise, et certaines sont peut-être défaillantes. Il faut d'abord diagnostiquer et effacer.",
            },
            c: {
              label: "Diagnostiquer chaque machine, effacer les données de l'entreprise avec un outil dédié, et trier ce qui est réparable.",
              why: "Méthodique et sûr : on protège les données du donateur et on sait exactement ce que l'on peut redistribuer.",
            },
          },
        },
        q2: {
          prompt: 'Quelle amélioration a souvent le meilleur rapport coût / effet sur ces vieux portables ?',
          o: {
            a: {
              label: 'Remplacer le disque dur par un SSD et, si possible, ajouter de la mémoire vive.',
              why: 'Le disque mécanique est souvent ce qui ralentit le plus ; un SSD et un peu de mémoire transforment la machine pour un coût modeste.',
            },
            b: {
              label: 'Installer un logiciel « accélérateur » miracle.',
              why: "Ces logiciels n'apportent généralement rien, et certains sont même indésirables.",
            },
            c: {
              label: 'Changer uniquement les batteries.',
              why: "Utile pour l'autonomie, mais la machine restera lente. À faire si elle doit être utilisée loin d'une prise.",
            },
          },
        },
        q3: {
          prompt: 'À qui destiner les machines remises en état ?',
          o: {
            a: {
              label: 'Les ranger dans un placard, au cas où.',
              why: 'Un ordinateur qui dort au placard vieillit sans servir à personne.',
            },
            b: {
              label: "Aux élèves et familles sans ordinateur, avec un système libre prêt à l'emploi, une courte prise en main et un contact en cas de souci.",
              why: "C'est l'inclusion numérique en action : l'élève peut faire ses devoirs, et l'accompagnement évite que l'appareil soit abandonné à la première difficulté.",
            },
            c: {
              label: 'Aux salles de classe, comme postes d’appoint.',
              why: "Utile, mais c'est passer à côté des élèves qui n'ont pas d'ordinateur à la maison.",
            },
          },
        },
      },
    },
    openvillage: {
      title: 'Le village ouvert',
      intro:
        "Le conseil du village te confie la stratégie numérique des trois écoles pour les années à venir. Le Mur des Formats se dresse : « Chacun dans son coin, c'est plus simple ! » C'est le moment de tout assembler.",
      objective: 'Concevoir un écosystème numérique scolaire plus indépendant, durable et inclusif.',
      q: {
        q1: {
          prompt: 'Comment décider des outils ?',
          o: {
            a: {
              label: 'Le référent numérique décide seul : il est compétent.',
              why: "Il est compétent, mais un choix imposé est moins bien adopté. Et s'il part, tout repose sur une seule personne.",
            },
            b: {
              label: 'Un comité réunissant enseignants, élèves, agents techniques, parents et collectivité, qui définit les besoins avant de choisir.',
              why: "Les besoins réels sont connus, les choix sont compris et partagés : c'est la meilleure garantie d'adoption.",
            },
            c: {
              label: 'Le prestataire qui fait la meilleure remise choisit.',
              why: "Le prix compte, mais laisser un fournisseur décider, c'est retomber dans la dépendance.",
            },
          },
        },
        q2: {
          prompt: 'Quelle règle adopter pour les formats de fichiers ?',
          o: {
            a: {
              label: "Imposer le format d'un seul éditeur à tout le monde.",
              why: "Tout le monde devient dépendant de cet éditeur, et les familles sans son logiciel sont pénalisées.",
            },
            b: {
              label: 'Laisser chacun utiliser le format de son logiciel.',
              why: "Liberté apparente, mais les échanges deviennent pénibles et les archives illisibles. Une règle commune simplifie la vie.",
            },
            c: {
              label: 'Privilégier les formats ouverts (ODF, PDF, PNG, HTML…) pour pouvoir changer d’outil sans perdre de documents.',
              why: "Les documents survivent aux logiciels et circulent entre tous. Il reste à tester les documents importants lors des conversions.",
            },
          },
        },
        q3: {
          prompt: 'Comment rendre le changement durable ?',
          o: {
            a: {
              label: 'Avancer par étapes avec des pilotes, mesurer, former en continu et partager avec les autres écoles.',
              why: "On apprend de chaque étape, on mutualise les efforts et les réussites encouragent les suivants.",
            },
            b: {
              label: 'Tout basculer en un week-end.',
              why: "Un changement brutal multiplie les problèmes en même temps et décourage les équipes.",
            },
            c: {
              label: "Attendre qu'une solution soit imposée d'en haut.",
              why: "Les cadres nationaux aident, mais attendre fait perdre des années. Chaque école peut déjà agir à son échelle.",
            },
          },
        },
        q4: {
          prompt: "Une élève malvoyante rejoint l'école. Que prévoit la stratégie ?",
          o: {
            a: {
              label: "L'accessibilité viendra plus tard, quand tout sera installé.",
              why: "Rattraper l'accessibilité après coup coûte cher, et l'élève est pénalisée en attendant.",
            },
            b: {
              label: "Vérifier l'accessibilité de chaque outil dès son choix (lecteur d'écran, clavier, contrastes) et former l'équipe ; des lecteurs d'écran libres comme NVDA ou Orca existent.",
              why: "L'inclusion fait partie du choix des outils, pas d'une option ajoutée ensuite. Et ces bonnes pratiques profitent à tous les élèves.",
            },
            c: {
              label: 'Lui fournir un équipement spécifique, sans changer le reste.',
              why: "Utile, mais si les plateformes et documents de l'école ne sont pas accessibles, l'équipement ne suffit pas.",
            },
          },
        },
      },
    },
  },
  play: {
    objective: 'Objectif',
    start: 'Commencer la mission',
    question: 'Question {{n}}/{{total}}',
    hint: 'Indice du mentor ({{cost}} pièces)',
    hintUsed: 'Le mentor a écarté une option faible.',
    hintPoor: 'Pas assez de pièces pour un indice.',
    removed: 'Option écartée par le mentor',
    verdict: {
      best: 'Excellent choix !',
      ok: 'Pas mal, mais il y a mieux…',
      bad: 'Aïe ! Ce choix renforce l’Empire.',
    },
    yourChoice: 'Ton choix',
    bestChoice: 'Le choix le plus solide',
    finish: 'Voir le résultat',
    resultTitle: 'Mission accomplie !',
    score: 'Score : {{score}}/{{max}}',
    firstClear: 'Première victoire !',
    newBest: 'Nouveau record !',
    noGain: "Pas de nouveau record : rejouer ne rapporte que si tu bats ton meilleur score.",
    gained: 'Gagné : +{{xp}} XP · +{{coins}} pièces',
    replay: 'Rejouer',
    nextMission: 'Mission suivante',
    toVillage: 'Retour au village',
    toVictory: 'Libérer la tour !',
    keys: 'Touches A, B, C, D pour répondre',
    quit: 'Quitter la mission',
  },
  achievements: {
    title: 'Succès',
    first_mission: { name: 'Première étincelle', desc: 'Terminer une première mission.' },
    perfect_mission: { name: 'Sans faute', desc: 'Obtenir le score maximal dans une mission.' },
    comeback: { name: 'Jamais abattu', desc: 'Rejouer une mission et battre son meilleur score.' },
    all_missions: { name: 'Village libéré', desc: 'Terminer les cinq missions.' },
    perfectionist: { name: 'Perfectionniste', desc: 'Score maximal dans toutes les missions.' },
    scholar: { name: 'Archiviste', desc: 'Consulter toutes les fiches ennemies.' },
    engineer: { name: 'Ingénieur·e libre', desc: "Maîtriser les sept modules de l'atelier." },
    explorer: { name: 'Explorateur·rice', desc: 'Visiter tous les lieux du village.' },
    sociable: { name: 'Âme du village', desc: 'Parler à tous les habitants.' },
    veteran: { name: 'Vétéran', desc: 'Atteindre le niveau 5.' },
  },
  profile: {
    title: 'QG de la Résistance',
    stats: 'Statistiques',
    xp: 'XP totale',
    coins: 'Pièces',
    coinsEarned: 'Pièces gagnées',
    coinsSpent: 'Pièces dépensées en indices',
    missions: 'Missions terminées',
    perfect: 'Missions sans faute',
    attempts: 'Tentatives',
    enemies: 'Fiches consultées',
    modules: 'Modules maîtrisés',
    places: 'Lieux visités',
    npcs: 'Habitants rencontrés',
    score: 'Score de résistance',
    achievements: 'Succès débloqués : {{count}}/{{total}}',
    lockedAchievement: 'Succès verrouillé',
    unlockedOn: 'Débloqué le {{date}}',
    victory: 'Voir le bilan de la victoire',
    reset: 'Effacer ma progression',
    resetTitle: 'Effacer la progression ?',
    resetText: 'Missions, XP, pièces et succès seront effacés de ce navigateur. Cette action est définitive.',
    resetYes: 'Oui, tout effacer',
  },
  victory: {
    title: 'VICTOIRE !',
    subtitle: 'La tour est tombée. Le village a repris son indépendance numérique.',
    locked: 'La victoire se mérite : termine les cinq missions pour libérer la tour.',
    toMissions: 'Voir les missions',
    score: 'Score de résistance',
    missions: 'Missions',
    xp: 'XP gagnée',
    achievements: 'Succès',
    summary: "Bilan d'indépendance numérique",
    summaryIntro: "D'après tes meilleurs choix dans chaque mission :",
    recs: 'Recommandations personnalisées',
    perfect: "Tes choix ont été solides sur tous les plans. Prochaine étape : partager cette démarche avec ta propre école et commencer par un inventaire, comme Karim.",
    modules: 'À revoir dans l’atelier :',
    restart: 'Nouvelle partie',
    replay: 'Rejouer des missions',
    toMenu: 'Menu principal',
  },
  recs: {
    hardware:
      "Matériel : avant de remplacer un appareil, vérifie s'il peut être amélioré (SSD, mémoire) et passer sous un système maintenu. Le réemploi est souvent le choix le plus économique et le plus écologique.",
    software:
      "Logiciels : pars des usages réels. Les logiciels libres couvrent la plupart des besoins courants, mais un pilote et des tests évitent de mauvaises surprises sur les usages spécifiques.",
    data: "Données : avant d'adopter un service, demande quelles données il collecte, où il les héberge et pour quoi. Le délégué à la protection des données de l'académie est ton allié.",
    people:
      "Humain : aucune transition ne tient sans les personnes. Associe enseignants, élèves et familles aux choix, forme-les, et pense accessibilité dès le départ.",
    openness:
      "Ouverture : des formats ouverts et des outils interopérables te laissent libre de changer. Une règle simple d'établissement (ODF pour modifier, PDF pour diffuser) suffit pour commencer.",
  },
  notFound: {
    title: 'Zone inexplorée',
    text: "Ce chemin ne mène nulle part dans le village.",
    back: 'Retour au menu',
  },
}

export type Locale = typeof fr
