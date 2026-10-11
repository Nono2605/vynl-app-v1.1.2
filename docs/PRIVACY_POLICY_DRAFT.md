# Vynl — Politique de confidentialité : squelette pour relecture juridique

> **Statut :** brouillon technique du 11 oct. 2026, **à soumettre à un juriste** (droit suisse :
> nLPD ; UE : RGPD). Ce n'est pas un texte juridique et il n'est **publié nulle part**.
> **Rédaction :** avec Claude, à partir du code. Chaque fait de la section 2 a été relevé dans le
> code des dépôts (API, app auditeur, Studio, admin) à cette date ; il faut le revérifier si le
> produit change. Les `[…]` sont à remplir ; les **Questions** (section 6) attendent une réponse.

Ce document sert à deux choses : donner au juriste un **inventaire exact** de ce que Vynl fait
des données personnelles aujourd'hui, et proposer le **plan** de la politique publique.

---

## 1. Contexte

- Vynl est une plateforme d'écoute de musique (beta) : auditeurs, créateurs (artistes), admin.
- **Marchés visés au lancement : Suisse et Union européenne** (décision du 11 oct. 2026). On
  retient donc le régime le plus strict (consentement préalable pour la publicité et les
  traceurs tiers).
- La société est probablement établie en Suisse (conservation comptable de 10 ans, art. 958f CO,
  mentionnée en spec D14) : **[à confirmer : raison sociale, adresse, pays d'établissement]**.
- La publicité (comptes gratuits) arrivera **après** la bêta (spec D9, sections 6.4 et 7.6).

## 2. Ce que le produit fait des données aujourd'hui (inventaire)

| Catégorie | Données | Source | Pourquoi (finalité) |
|---|---|---|---|
| Compte | email ; mot de passe (stocké sous forme de hachage par le fournisseur d'authentification, illisible par Vynl) ; rôle (auditeur, créateur, admin) ; statut | l'utilisateur | créer et sécuriser le compte |
| Profil | nom d'utilisateur ; nom affiché, avatar, bio, pays, langue (facultatifs) ; préférences (contenu explicite, genres favoris) | l'utilisateur | identité publique, personnalisation |
| Activité sociale | playlists (publiques ou non), bibliothèque (favoris), abonnements à des artistes et à des utilisateurs | l'utilisateur | fonctionnement du service |
| **Écoutes** (`plays`) | quel morceau, quel artiste, quand ; secondes réellement écoutées ; origine de la lecture (album, playlist, recherche, bibliothèque…) ; **type d'appareil** (mobile, tablette, ordinateur, déduit du user-agent) ; **pays** (déduit de l'adresse IP par l'hébergeur, l'adresse n'est pas stockée) ; version de l'application ; droit d'écoute (beta, abonné, gratuit, essai) | mesure faite par le serveur | **rémunérer les artistes** selon l'écoute, statistiques d'audience pour les artistes (agrégées), lutte contre la fraude |
| Battements de lecture (`play_heartbeats`) | position et état toutes les ~15 s pendant une écoute | mesure du serveur | contrôle de la mesure, fraude. **Conservation courte (proposition : 30 jours)** |
| Empreinte d'IP (`plays.ip_hash`) | empreinte salée dont le sel change chaque jour ; **non activée en production à ce jour** | serveur | fraude (reconnaître un même visiteur dans la journée). **Proposition : effacée après 30 jours** |
| Abonnement | formule, statut, période | Vynl / prestataire de paiement (Stripe, à venir) | facturation |
| Créateurs | conditions acceptées (version, date) ; provenance déclarée du contenu ; droits ; fichiers audio, images ; déclarations IA ; données de paiement et d'identité (vérification KYC) **gérées par le prestataire de paiement** (à venir) | le créateur | publication, rémunération, conformité |
| Journal d'audit de l'admin | qui (admin) a fait quoi, sur quel compte, quand ; **y compris l'ouverture de l'historique d'écoute d'un compte** | système | sécurité, responsabilité, preuve |
| Fraude | événements et scores liés à un compte ou une écoute | système | lutte contre la fraude |
| Consentements (`consents`, nouveau) | décision (oui/non), finalité, version du texte, date, origine (écran d'accueil, réglages) | l'utilisateur | prouver ce qui a été accepté |

**Cookies :** uniquement les cookies de session de l'authentification (strictement nécessaires)
et, si l'écran d'accueil est activé, un cookie technique « version acceptée ». **Aucun cookie
publicitaire, aucun outil de mesure d'audience tiers** dans l'app auditeur, le Studio, l'admin
ou le site vitrine.

**Sous-traitants (hébergement et services)** : Supabase (base de données, authentification,
fichiers) ; Vercel (hébergement des applications web) ; Render (API) ; Stripe (paiements et
vérification d'identité des créateurs, à venir) ; régie publicitaire (à choisir, après la
bêta) ; service d'envoi d'emails d'authentification (celui de Supabase). **[région d'hébergement de
chaque service et garanties de transfert hors Suisse/UE à documenter]**

## 3. Ce que Vynl s'interdit (principes déjà appliqués dans le code)

- Ne **jamais stocker l'adresse IP** (seulement un pays, et, si activée, une empreinte salée à
  rotation quotidienne).
- Pas de géolocalisation plus fine que le pays.
- Les statistiques de l'admin sont **agrégées** ; l'historique d'écoute d'un compte ne s'ouvre
  qu'à un admin authentifié (double facteur) et **chaque ouverture est inscrite au journal**.
- Les écoutes d'un compte supprimé sont **anonymisées** (le compte est détaché), pas conservées
  avec son identité.
- Pas de publicité aujourd'hui ; avant toute publicité personnalisée : consentement préalable,
  enregistré, retirable (spec section 11).

## 4. Plan de la politique publique (à rédiger avec le juriste)

1. Qui est responsable du traitement (identité, adresse, contact) ; représentant dans l'UE si
   exigé ; conseiller à la protection des données le cas échéant.
2. Quelles données, pour quelles finalités, sur quelle base légale (contrat, intérêt légitime,
   consentement, obligation légale) — table de la section 2 comme point de départ.
3. À qui elles sont communiquées (sous-traitants) et où elles sont hébergées ; transferts hors
   Suisse/UE.
4. Combien de temps (section 5).
5. Cookies et traceurs (aujourd'hui : strictement nécessaires seulement).
6. Droits : accès, rectification, effacement, portabilité, opposition, retrait du consentement ;
   comment les exercer ; délai de réponse ; droit de plainte (PFPDT en Suisse, autorité du pays
   de résidence dans l'UE).
7. Mineurs : âge minimum d'utilisation (section 6, Q1).
8. Sécurité (accès admin à double facteur, journal d'audit, accès à la base réservé à l'API).
9. Modifications du texte et réacceptation (le produit sait redemander l'acceptation à chaque
   nouvelle version).
10. Publicité (à ajouter **avant** son lancement) : finalités, partenaires, consentement.

## 5. Durées de conservation : état et propositions

| Donnée | Aujourd'hui | Proposition (à valider, spec Q10) |
|---|---|---|
| Battements de lecture | conservés **sans limite** (aucune purge planifiée) | 30 jours |
| Empreinte d'IP | non collectée en production | 30 jours si activée |
| Écoutes (`plays`) | conservées | pièces justificatives de la rémunération : durée comptable (10 ans, art. 958f CO) ; **question : durée pour les écoutes elles-mêmes** une fois anonymisées |
| Relevés, journal comptable, paiements | n'existent pas encore | 10 ans |
| Journal d'audit admin | conservé, inaltérable | **[à fixer]** |
| Consentements | conservés tant que le compte existe ; supprimés avec lui | **[preuve de consentement après suppression du compte : oui ou non ?]** |
| Compte supprimé | anonymisé (artistes : fichiers supprimés après 30 jours, sauf gel légal) | à valider (spec D14) |

Une fonction de purge est prête (`privacy_retention_run`) mais **n'est pas planifiée** tant que
les durées ne sont pas confirmées.

## 6. Questions pour le juriste

1. **Âge minimum.** 16 ans partout (valeur prudente dans l'UE) ou autre ? Et pour la Suisse ?
   Le produit enregistre « j'ai au moins 16 ans » ; la publicité personnalisée est-elle interdite
   en dessous de 18 ans (DSA, art. 28) ?
2. **Base légale de la mesure d'écoute** (rémunération des artistes, statistiques agrégées pour
   les artistes) : contrat / intérêt légitime ? Faut-il un droit d'opposition ?
3. **Publicité sur les comptes gratuits.** Quel dispositif de consentement (bandeau, cadre
   IAB TCF exigé par les régies) ? Le modèle « gratuit avec publicité ou payant » est-il
   acceptable sans consentement à la publicité personnalisée ? La publicité non personnalisée
   par SDK tiers exige-t-elle aussi un consentement (UE) ?
4. **Durées de conservation** de la section 5, en particulier les écoutes anonymisées et la preuve
   de consentement.
5. **Transferts hors Suisse/UE** (Vercel, Render, Stripe, régie) : garanties à documenter.
6. **Représentant dans l'UE** (art. 27 RGPD) si la société n'y est pas établie ; registre des
   activités de traitement ; analyse d'impact (AIPD) nécessaire ou non.
7. **Droits des personnes** : procédure et délais ; faut-il un formulaire dans l'app (aujourd'hui :
   un contact par email) ; export des données (format) ; suppression du compte (spec D14).
8. **Créateurs** : politique distincte ou section dédiée (KYC et paiements par Stripe, droits
   d'auteur, déclarations IA).
9. **Langue** de la politique publique (anglais comme l'interface ? français ?) et des conditions
   d'utilisation (aucune CGU auditeur n'existe aujourd'hui ; seules les conditions créateur sont
   sur le site).

## 7. Ce qui est déjà prêt côté produit (rien n'est activé pour les utilisateurs)

- Table `consents` (historique inaltérable) et routes `GET /me/privacy`, `POST /me/consents`.
- Écran d'accueil « âge + conditions » et page « Privacy & data » dans l'app auditeur, derrière
  l'interrupteur `PRIVACY_GATE` (éteint par défaut) ; la version du texte est une étiquette
  (`PRIVACY_POLICY_VERSION`) qui redemande l'acceptation à chaque changement.
- Choix facultatifs (publicité personnalisée, mesure d'usage) : le mécanisme existe, aucun n'est
  demandé tant qu'on ne l'active pas (`PRIVACY_OPTIONAL_PURPOSES`).
- Fonctions de purge (battements, empreintes d'IP), non planifiées.
- Journal d'accès aux historiques d'écoute individuels (admin).

**Pour activer l'écran d'accueil :** publier la politique et les conditions, appliquer les
migrations de l'API, définir `PRIVACY_POLICY_VERSION`, `PRIVACY_POLICY_URL`, `TERMS_URL`,
`PRIVACY_CONTACT_EMAIL`, puis `PRIVACY_GATE=on` sur Vercel (app auditeur) et redéployer.
