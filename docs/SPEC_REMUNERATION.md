# Vynl — Rémunération des artistes et données associées

> **Statut :** brouillon v0.4 — 9 oct. 2026 (v0.2 : publicité, D9 · v0.3 : D10 à D12 validées · v0.4 : table `plays` et suivi par battements implémentés)
> **Décisions :** @Nono · **Rédaction :** avec Claude
> **Portée :** ce qu'il faut enregistrer et calculer pour (1) payer les artistes, (2) produire des statistiques, (3) prouver où va l'argent des abonnés.

Ce document remplace les « échanges précédents » auxquels renvoyait le README de l'API
(`ARCHITECTURE.md` et `DATA_FLOW.md` n'existent plus). Il distingue trois niveaux :

- **Décidé** : validé par @Nono (section 2).
- **Proposé** : ma recommandation, à valider (marqué *Proposé*).
- **Ouvert** : une question qui attend une réponse (section 12).

---

## 1. Principes

1. **Ton argent suit tes écoutes.** Rémunération *user-centric*, comme promis sur
   `vynl.com/transparency` : l'abonnement de chaque abonné est réparti entre les artistes
   *qu'il* a écoutés.
2. **Tout se prouve.** Chaque centime versé à un artiste se retrace jusqu'aux écoutes et au
   paiement qui l'ont produit.
3. **Le comptable ne se modifie pas et ne se supprime pas.** On ajoute des écritures ; une
   correction est une nouvelle écriture, jamais une modification.
4. **On capte tôt.** Une écoute non enregistrée est perdue : elle ne se reconstitue pas.
5. **Les règles sont des paramètres datés, pas du code en dur.** Une période close doit
   pouvoir être recalculée à l'identique des mois plus tard.

---

## 2. Décisions validées (9 oct. 2026)

| # | Sujet | Décision |
|---|---|---|
| D1 | Écoute comptée | Une écoute est **qualifiée** à partir de **30 s** d'écoute effective, ou dès la fin du morceau s'il dure moins de 30 s. |
| D2 | Poids d'une écoute | Le **temps écouté** (secondes), pas le nombre d'écoutes. |
| D3 | Argent non réparti | Il va dans une **pool commune**, redistribuée ensuite. D'autres revenus s'ajouteront plus tard à cette même pool. |
| D4 | Partage d'un abonnement | Sur **10 $**, **1,50 $** (15 %) vont à la plateforme. Les frais de transaction sont pris sur cette part : environ **1 $** réellement conservé par abonnement. Les **8,50 $** restants vont aux artistes écoutés. *(Interprétation à confirmer, voir Q1.)* |
| D5 | Égalité entre artistes | **Tous les artistes ont les mêmes droits à la rémunération.** Aucune distinction (label humain / IA, artiste vérifié, notoriété, genre). |
| D6 | Prélèvement sur les très gros revenus | À partir d'un certain revenu mensuel d'un artiste, la plateforme prélève un pourcentage qui va dans la pool commune. Exemple : au-delà de **100 k/mois → 5 %**, au-delà de **200 k/mois → 10 %**. Les paliers sont donnés à titre d'exemple. *(Voir Q2.)* |
| D7 | Usage de la pool | Événements, promotions, réductions sur les abonnements, autres usages. **Le reste est redistribué aux artistes de façon cohérente.** *(Règle exacte : voir Q4.)* |
| D8 | Traçabilité | Tout est consigné dans ce document, dans le dossier du projet. |
| D9 | Publicité *(prévu après la bêta)* | Les comptes **gratuits** écoutent avec de la **publicité**, une coupure **toutes les 4 à 5 musiques**. Les revenus publicitaires sont **répartis entre les artistes et la pool commune**, comme l'argent des abonnements. Mise en place **une fois la bêta terminée et l'app en ligne**, mais le modèle de données l'anticipe dès maintenant (sections 6.4 et 7.6). *(Règles : Q11 à Q14.)* |
| D10 | Unité des montants | Tout montant **calculé** (relevés, lignes, pool, journal, publicité) est stocké en **micro-unités** (1 $ = 1 000 000 µ$, `bigint`, colonnes `_micros`). Les **encaissements et virements réels** restent en centimes (`_cents`). L'arrondi au centime n'a lieu qu'**une fois**, sur le total versé. **Règle à appliquer à toute nouvelle table d'argent** ; les colonnes `_cents` des tables `royalty_allocations` et `creator_wallets` ne sont pas converties, ces tables étant remplacées (section 8). |
| D11 | Coupure publicitaire | **Le serveur décide** quand une publicité est due, jamais le client : `POST /plays` ne délivre pas le morceau tant que la coupure due n'est pas close (section 6.4). Sans cela, un bloqueur de publicité suffirait à faire disparaître le revenu des artistes. À construire après la bêta. |
| D12 | Droit d'écoute | Chaque écoute porte, **figé**, à quel titre elle a lieu : `beta`, `subscriber`, `free_ad_supported` ou `trial`. La colonne `entitlement` existe déjà (migration `20261009000001_listening_entitlement.sql`), **sans valeur par défaut** : l'API devra toujours le préciser, pour qu'un oubli ne classe pas en silence l'écoute d'un abonné comme non rémunérée. |
| D13 | Numéros permanents | Chaque **artiste, release et morceau** reçoit à sa création un numéro (`catalog_number`), issu d'une séquence : **jamais réutilisé, immuable**, même si la ligne disparaît (des trous sont normaux). Code affichable : `VYN-A-000007` (artiste), `VYN-R-…` (release), `VYN-T-…` (morceau). C'est la référence stable pour les relevés, les litiges et la comptabilité, avant comme après la suppression d'un compte. |
| D14 | Suppression de compte *(à faire valider par une fiduciaire / un juriste suisse)* | L'artiste est **anonymisé** : nom → « Deleted artist VYN-A-… », bio, images, pays et lien avec le compte effacés ; morceaux et releases **archivés** ; followers et favoris le concernant retirés. **Conservés 10 ans** (art. 958f CO, à compter de la fin de l'exercice) : écoutes, royalties, répartitions, paiements, identité minimale du bénéficiaire (table à accès restreint, à construire avec les étapes 3 à 6). **Conservés comme preuve** : numéro, titre, durée, ISRC, **empreinte SHA-256** du fichier, déclarations IA et de droits. **Supprimés après 30 jours** (`purge_after`, `npm run purge:anonymized`) : fichiers audio, covers, avatar, bannière. Un **gel légal** (`artists.legal_hold`) suspend la suppression des fichiers pendant un litige. Un solde non versé se verse avant la fermeture. L'anonymisation est automatique (trigger sur `users`) et ne fait jamais échouer la suppression d'un compte. |
| D15 | Noms d'artistes | **Uniques**, sans tenir compte des majuscules, des accents ni de `. - _ ' & !` (« Rafale », « RAFALE », « R.A.F.A.L.E » sont le même nom) ; imposé par un index unique en base. 2 à 40 caractères ; lettres (toutes écritures), chiffres, espace et `. - _ ' & !` ; commence par une lettre ou un chiffre ; au moins une lettre ; ni lien ni adresse web ; pas de mélange latin / cyrillique / grec. **Mots réservés** (table `reserved_artist_names` : `vynl…`, admin, support, official, staff, « various artists »…). Le nom d'un artiste anonymisé est **libéré**. Le créateur ne peut pas changer son nom lui-même. Un compte = un artiste. |
| D16 | Numéros attribués à la création | Le numéro est attribué dès le **brouillon**, pas à la publication : un brouillon supprimé ou une création refusée laisse un trou, sans conséquence. |

> **Vocabulaire.** Pour éviter les confusions : la **part artistes** est la tranche de 8,50 $
> d'*un* abonnement ; la **pool commune** est le fonds collectif de la plateforme (D3, D6, D7).
> Un **auditeur gratuit** est un compte sans abonnement payant, qui écoute avec publicité ; le
> **revenu publicitaire** est l'argent *effectivement reçu* du prestataire de publicité (D9).

---

## 3. Flux d'argent

```
Un abonné paie 10,00 $
 ├─ frais de transaction (variables) ──┐ pris sur la part plateforme
 ├─ part plateforme : 1,50 $ (15 %) ───┘ → ≈ 1 $ net conservé
 └─ part artistes : 8,50 $ (85 %)
      ├─ répartie entre les artistes écoutés par CET abonné ce mois-là,
      │  au prorata de ses secondes qualifiées de chaque artiste
      └─ si l'abonné n'a aucune écoute qualifiée → 8,50 $ vont à la pool commune

Un auditeur gratuit (avec publicité) — après la bêta (D9)
 ├─ une coupure publicitaire toutes les 4 à 5 musiques → des impressions
 ├─ le prestataire publicitaire verse un revenu agrégé et en retard : seul le revenu
 │  EFFECTIVEMENT REÇU est réparti, jamais une estimation
 ├─ frais du prestataire déduits en premier, puis part plateforme (Q11)
 └─ part artistes : répartie entre les artistes écoutés par CET auditeur, au prorata de ses
    secondes qualifiées (même règle que pour un abonné) ;
    sans écoute qualifiée, ou revenu non attribuable → pool commune

Revenus bruts d'un artiste sur le mois (somme de toutes les parts reçues)
 ├─ prélèvement progressif au-delà des paliers (D6) ──→ pool commune
 └─ le reste revient à l'artiste (puis se répartit entre ayants droit selon les splits)

Pool commune
 ← entrées : argent non réparti (D3) + prélèvements (D6) + publicité non attribuée (D9)
             + autres revenus futurs
 → sorties : événements, promotions, réductions d'abonnement (budget) (D7)
             + le reste redistribué aux artistes (D7)
```

---

## 4. Exemple chiffré

### 4.1 Un abonné, un mois

Abonnement de 10,00 $, soit **850 ¢** pour la part artistes. L'abonné a écouté, en écoutes qualifiées :

| Artiste | Secondes | Part du temps | Montant exact | Arrondi |
|---|---:|---:|---:|---:|
| A | 10 800 (3 h) | 69,23 % | 588,46 ¢ | 589 ¢ |
| B | 3 600 (1 h) | 23,08 % | 196,15 ¢ | 196 ¢ |
| C | 1 200 (20 min) | 7,69 % | 65,38 ¢ | 65 ¢ |
| **Total** | **15 600** | **100 %** | **850,00 ¢** | **850 ¢** |

**Règle d'arrondi** *(proposé)* : on arrondit chaque montant vers le bas (588 + 196 + 65 = 849 ¢),
puis on attribue les centimes restants aux plus grandes parties décimales (ici A : 0,46).
Départage par `artist_id` pour que le résultat soit déterministe. Le total reste exact.
*(L'exemple est en centimes pour la lisibilité ; en pratique la même règle s'applique en
micro-unités, voir section 7 et l'exemple 4.3.)*

### 4.2 Le prélèvement progressif (D6)

Deux lectures possibles de « au-delà de 100 k, 5 % » :

| Revenu mensuel brut | **Par tranche** *(proposé)* | **Par palier** |
|---:|---:|---:|
| 100 000 | 0 → net 100 000 | 0 → net 100 000 |
| 100 001 | ≈ 0 → net ≈ 100 001 | 5 000 → **net 95 001** |
| 150 000 | 2 500 (5 % de la tranche 100 k–150 k) | 7 500 (5 % du tout) |
| 250 000 | 10 000 (5 % × 100 k + 10 % × 50 k) | 25 000 (10 % du tout) |

Avec la lecture « par palier », un artiste gagne **moins** en gagnant un dollar de plus
(95 001 au lieu de 100 000). La lecture « par tranche » évite cet effet. *(Voir Q2.)*

### 4.3 Un auditeur gratuit, un mois (D9) — **illustratif**

Un auditeur gratuit écoute 30 morceaux dans le mois : une coupure toutes les 4 à 5 musiques
donne environ **6 impressions**. Hypothèses pour l'exemple : environ 4 $ pour mille impressions
(soit **4 000 micro-dollars**, 0,4 ¢ par impression) et une part plateforme de 15 % (Q11).
Le vrai revenu dépend du prestataire, du pays et de la saison.

| Étape | Montant |
|---|---:|
| Revenu net reçu, attribué à cet auditeur (6 × 4 000) | 24 000 µ$ (2,4 ¢) |
| Part plateforme (15 %) | 3 600 µ$ |
| **Part artistes (85 %)** | **20 400 µ$** |
| Artiste A — 5 400 s (60 %) | 12 240 µ$ (1,22 ¢) |
| Artiste B — 3 600 s (40 %) | 8 160 µ$ (0,82 ¢) |

**Pourquoi des micro-unités.** Au centime, A et B toucheraient chacun 1 ¢ : B recevrait 22 %
de plus que son dû, A 18 % de moins, et ce sur *chaque* auditeur gratuit. Les montants
calculés se font donc dans une unité plus fine (section 7), et l'arrondi au centime n'a lieu
qu'**une fois**, sur le total versé à l'artiste.

---

## 5. Définitions

| Terme | Définition |
|---|---|
| **Lecture** (*play*) | Une écoute d'un morceau, de son démarrage à l'arrêt, au changement de morceau ou à la fin. Rejouer le même morceau crée une **nouvelle** lecture. |
| **Secondes validées** | Secondes réellement écoutées, calculées **par le serveur** : jamais plus que le temps réel écoulé, pauses exclues, sauts en avant exclus. |
| **Écoute qualifiée** | Lecture dont les secondes validées atteignent `min(30 s, durée du morceau)` (D1). |
| **Poids** | Secondes validées des écoutes qualifiées (D2). *(Q3 : les secondes des lectures non qualifiées comptent-elles ?)* |
| **Période** | Un mois calendaire (UTC). |
| **Exclue** | Lecture marquée suspecte (fraude) : conservée, mais non comptée. |
| **Droit d'écoute** (*entitlement*) | Ce qui autorise une lecture à l'instant où elle a lieu : `beta` (aucun revenu, la bêta), `subscriber` (abonnement payant actif), `free_ad_supported` (gratuit, avec publicité), `trial` (essai). **Figé dans la lecture** (D12) : il détermine de quel « pot » ses secondes relèvent (D9). |
| **Coupure publicitaire** | Une pause publicitaire entre deux morceaux d'un auditeur gratuit ; elle contient une ou plusieurs publicités. |
| **Impression** | Une publicité effectivement diffusée dans une coupure. C'est l'unité de revenu publicitaire. |

---

## 6. Capture des écoutes

### 6.1 Pourquoi pas à la délivrance de l'URL

Aujourd'hui `GET /tracks/:id/stream` renvoie une URL signée **valable 6 h**. Le lecteur reprend
et rejoue sur la même URL sans rappeler le serveur : compter à la délivrance **sous-compterait**
les rejeux et serait facile à contourner. On compte donc des **battements de cœur** envoyés par
le lecteur et **validés par le serveur**.

### 6.2 Protocole *(implémenté, étape 2 — non déployé)*

1. `POST /plays` — `{ track_id, source_context?, source_id?, client_session_id?, app_version? }`
   → `{ play_id, url, format, heartbeat_every_seconds }`. Remplace `/tracks/:id/stream` pour
   la lecture. Le serveur **copie** dans la lecture l'artiste, l'album et la durée du morceau,
   fige le droit d'écoute (`entitlement`) et **ferme l'éventuelle lecture précédente** du
   compte. `client_session_id` rend la requête rejouable : la même requête renvoie la même
   lecture (200), et `409` si elle est déjà close.
2. `POST /plays/:id/heartbeat` — `{ seq, position_seconds, state }`, `state` ∈ `playing`,
   `paused`, `ended` (morceau terminé), `closed` (changement de morceau, arrêt). Le lecteur
   en envoie au démarrage réel de la lecture, toutes les 15 s, à la pause, à la reprise,
   **avant et après** chaque saut dans le morceau, à la fin, et à la fermeture. Réponse `200`
   avec un `status` : `ok`, `duplicate`, `closed` (lecture déjà close : le client doit
   s'arrêter) ou `conflict` (un autre battement est passé en même temps).
3. **Règle de calcul** (`API/src/modules/plays/heartbeat.ts`, fonction pure, 23 tests). Le
   temps écoulé depuis le battement précédent n'est crédité que si **celui-ci** disait
   `playing`, et au plus :
   - l'avancée de la position (un saut en arrière ne rapporte rien) ;
   - le temps réellement écoulé côté serveur : au plus 1 s par seconde, donc une lecture
     accélérée ou un client qui ment ne crée pas de secondes.
   Le total d'une lecture est plafonné à la durée du morceau (4 h si elle est inconnue) :
   se replacer sans cesse au début ne gonfle rien ; réécouter ouvre une nouvelle lecture.
   **Un battement perdu ne fait rien perdre** : le suivant crédite tout l'intervalle d'après la
   position atteinte.
4. **Qualification** : au battement qui atteint 30 s (D1). Pour un morceau de moins de 30 s :
   sa durée moins 1 s de tolérance (le dernier battement arrive un peu avant la fin).
5. **Idempotence** : `seq` strictement croissant par lecture ; un battement déjà vu ou plus
   ancien est ignoré. La mise à jour est conditionnelle (`last_seq` inchangé), et chaque
   battement est tracé dans `play_heartbeats` (échec de la trace sans effet sur la mesure).
6. **Un seul flux par compte, imposé par la base** : index unique sur les lectures ouvertes
   d'un compte. Démarrer un morceau en ferme un autre ; la fin retenue est le **dernier
   battement reçu**, pas « maintenant ». Si le serveur répond `closed` à un battement alors
   que le lecteur joue, un autre appareil a pris le relais : le lecteur se met en pause avec
   un message.
7. **Reprise après panne** (URL signée expirée, réseau coupé) : le lecteur ferme la lecture
   et en ouvre une nouvelle à la même position. Les secondes s'additionnent bien, mais le
   morceau compte alors pour deux lectures dans les statistiques « nombre d'écoutes ».

**Limites connues :**
- **Fermeture ou rechargement de la page : fait (10 oct. 2026, non déployé).** Au `pagehide`, le
  lecteur envoie un dernier battement `closed` en `sendBeacon` vers `/api/plays/close` (route de la
  webapp, même origine donc sans CORS), qui le transmet à l'API avec la session du cookie. La
  lecture est close et les secondes depuis le dernier battement sont créditées. Reste la
  **coupure brutale** (crash, batterie, réseau) : la lecture reste ouverte jusqu'au prochain
  démarrage du compte, qui la clôt à la position du dernier battement reçu (15 s au plus perdues).
  Une lecture ouverte depuis plus de 2 min est affichée comme terminée dans l'admin.
- `ip_hash`, `country_code` et `device_type` : la webapp appelle l'API depuis son serveur,
  donc l'adresse vue par l'API est celle du serveur. **Fait (10 oct. 2026, non déployé) :**
  la webapp transmet le pays (`x-vercel-ip-country`, absent en local), le user-agent et l'IP du
  visiteur sous `x-vynl-client-*` (`src/app/actions/player.ts`) ; l'API (`lib/clientInfo.ts`)
  en tire un pays ISO, un appareil (`mobile` / `tablet` / `desktop`) et une **empreinte d'IP
  salée dont le sel change chaque jour** (`IP_HASH_SECRET`, facultatif : sans lui `ip_hash`
  reste vide ; l'IP elle-même n'est jamais stockée). **Limite assumée :** ces en-têtes sont
  *déclarés* par l'appelant, l'API ne peut pas les vérifier. Suffisant pour des statistiques ;
  **avant de répartir un revenu publicitaire par pays (D9), authentifier la webapp** (secret
  partagé). Les lectures d'avant le déploiement restent sans pays ni appareil (« Inconnu »).
- `play_heartbeats` n'a pas encore de **purge** (conservation courte, Q10).
- L'ancienne route `GET /tracks/:id/stream` existe encore et **ne compte rien** : à
  supprimer dès que la webapp est déployée sur `POST /plays`.

### 6.3 Garde-fous anti-fraude *(proposé)*

- **Un seul flux simultané par compte** (le second est refusé ou coupe le premier).
- Secondes plafonnées au temps réel ; lecture accélérée ou sauts ne créent pas de secondes.
- Signaux conservés pour analyse : pays dérivé de l'IP (pas l'IP elle-même), empreinte d'IP
  salée à rotation, type d'appareil, rythme d'écoute (nombre de lectures par heure).
- Une lecture suspecte est **exclue** (`counted = false`, avec motif), jamais supprimée.

### 6.4 Publicité : le serveur décide quand elle est due *(décidé, D11 ; à construire après la bêta)*

Pour un auditeur gratuit, une publicité toutes les 4 à 5 musiques (D9). Si le **client** décide
seul quand l'insérer, il suffit de ne pas l'afficher (bloqueur de publicité, client modifié)
pour la supprimer : le revenu disparaît, et les artistes avec. Donc :

1. Le serveur **compte** les lectures depuis la dernière coupure de chaque auditeur gratuit.
   Seuil atteint (4 ou 5, paramètre : Q12), `POST /plays` répond `ad_required: true` avec un
   `ad_break_id`, **sans l'URL du morceau**.
2. Le lecteur diffuse la publicité (SDK du prestataire), puis déclare chaque impression
   (`POST /ad-breaks/:id/impressions` : identifiant du prestataire, durée, complète ou non)
   et clôt la coupure.
3. Le serveur délivre alors l'URL du morceau. Qui saute la publicité n'a pas le morceau suivant.
4. **Aucune publicité disponible** (rien à diffuser) : la musique continue, aucun revenu, la
   coupure est marquée `failed` (Q13).
5. Les impressions suspectes (rythme impossible, durée nulle, même appareil en boucle) sont
   **exclues**, jamais supprimées, comme les lectures.

**Rien de cela n'est construit avant la fin de la bêta.** La seule pièce qui ne pouvait pas
attendre est le champ `entitlement` (D12), sans lequel on ne saurait pas, plus tard, quelles
lectures relèvent d'un abonnement, de la publicité ou de la bêta : **elle est faite**
(migration `20261009000001_listening_entitlement.sql`, à appliquer avec la première).

---

## 7. Données à enregistrer

> Ce sont les **entités et champs clés**, pas encore le SQL. Les noms sont proposés.
>
> **Unité des montants** *(décidé, D10)*. Une impression publicitaire rapporte environ 0,4 ¢ et une
> part d'abonné à un artiste se compte en fractions de centime (section 4.3) : stocker les
> montants **calculés** en centimes fausserait chaque ligne. Tout ce qui est calculé (relevés,
> lignes, pool, journal, publicité) est donc en **micro-unités** (`_micros`, 1 $ = 1 000 000 µ$,
> `bigint`). Les **encaissements et virements réels** restent en centimes (`_cents`), parce
> que le prestataire de paiement parle en centimes ; la conversion se fait à cette frontière,
> et l'arrondi au centime une seule fois, sur le total versé.

### 7.1 Écoutes

| Entité | Rôle | Champs clés |
|---|---|---|
| `plays` | Une lecture | `id`, `user_id` (annulable à l'anonymisation), `track_id`, **`artist_id` copié au moment de la lecture**, `album_id`, `started_at`, `ended_at`, **`validated_seconds`**, **`track_duration_seconds` (copie)**, `qualified`, `qualified_at`, `counted`, `excluded_reason`, **`entitlement`** (`beta`, `subscriber`, `free_ad_supported`, `trial` — figé à la lecture), `ad_break_id` (la coupure qui précède, s'il y en a une), `source_context` + `source_id` (album, playlist, recherche…), `device_type`, `country_code`, `ip_hash`, `client_session_id`, `app_version` |
| `play_heartbeats` | Battements bruts | `play_id`, `seq`, `position_seconds`, `received_at` — **conservation courte** (sert au contrôle et à la fraude) |

Copier l'artiste et la durée dans `plays` fige l'historique : changer ensuite le titre, l'album
ou la durée d'un morceau ne change pas ce qui a été écouté.

### 7.2 Argent entrant

| Entité | Rôle | Champs clés |
|---|---|---|
| `plans` | Offres | `code`, `name`, `price_cents`, `currency`, `interval`, **`ad_supported`** — le niveau gratuit est un plan à 0 avec `ad_supported = true` |
| `subscriptions` *(existant, à étendre)* | Abonnement d'un utilisateur | `plan_id`, `status`, période courante, fournisseur + identifiant fournisseur |
| `payments` | Chaque encaissement | `user_id`, `subscription_id`, `provider`, `provider_payment_id` (unique), **`gross_cents`**, **`tax_cents`**, **`fee_cents`**, **`net_cents`**, `currency`, `status`, `paid_at`, remboursement éventuel |

### 7.3 Calcul d'une période

| Entité | Rôle | Champs clés |
|---|---|---|
| `royalty_periods` *(existant, à étendre)* | Un mois | `period_start`, `period_end`, `status` (`open → closed → computed → published`) |
| `period_parameters` | **Photo des règles** de la période | part plateforme (en points de base), seuil de qualification (30 s), paliers du prélèvement, règle d'arrondi, **cadence publicitaire (4 à 5) et part plateforme sur la publicité**, version |
| `period_runs` | Chaque exécution du calcul | `period_id`, `run_number`, `created_at`, motif — un recalcul crée un **nouveau run**, il n'écrase rien |
| `user_period_statements` | **Relevé d'un abonné ou d'un auditeur gratuit** | `user_id`, `run_id`, **`kind` (`subscription` ou `ads`)**, montant reçu, taxes, frais, part plateforme, **part artistes**, secondes totales, montant non réparti (→ pool). Un utilisateur qui change de formule en cours de mois a **un relevé de chaque type** : ses secondes se rangent selon l'`entitlement` de chaque lecture |
| `user_period_artist_lines` | Détail d'un relevé | `statement_id`, `artist_id`, `seconds`, `amount_micros` |
| `artist_period_earnings` | Revenus d'un artiste | `artist_id`, `run_id`, brut, **prélèvement progressif**, redistribution de la pool reçue, net |
| `payee_period_lines` | Part de chaque ayant droit après splits | `artist_earning_id`, `payee`, `split_percentage` (copie), `amount_micros` |

La page « où va mon argent » de l'abonné se lit directement dans `user_period_statements` et
`user_period_artist_lines`.

### 7.4 Pool commune et journal comptable

| Entité | Rôle | Champs clés |
|---|---|---|
| `pool_entries` | Mouvements de la pool | `period_id`, sens (entrée / sortie), **nature** (`unallocated`, `ad_unallocated`, `artist_levy`, `other_revenue`, `event`, `promotion`, `subscription_discount`, `redistribution`…), `amount_micros`, référence |
| `ledger_accounts` | Comptes | abonnés (encaissements), taxes, frais, plateforme, part artistes, pool commune, dû à chaque artiste, **publicité à recevoir et frais du prestataire publicitaire** |
| `ledger_entries` | Écritures **append-only**, partie double | `transaction_id`, compte, débit/crédit, `amount_micros`, référence — somme des débits = somme des crédits par transaction |

Le **solde d'un portefeuille artiste n'est plus stocké** : il se calcule depuis le journal.
Un compteur modifiable n'est pas auditable.

### 7.5 Droits, splits, paiements

| Entité | Rôle | Champs clés |
|---|---|---|
| `splits` *(existant, à versionner)* | Répartition entre ayants droit | `track_id`, `effective_from`, lignes (artiste ou ayant droit, pourcentage) ; **somme = 100 %** vérifiée à la publication |
| `payout_accounts` | Où payer | identité vérifiée (KYC), pays fiscal, coordonnées du compte de paiement |
| `payouts` *(existant, à étendre)* | Un virement | lien vers le journal, frais, statut, `provider_payout_id` |

### 7.6 Publicité *(après la bêta, à prévoir)*

Le prestataire publicitaire ne verse pas « un revenu par auditeur » : il rapporte un total
**agrégé** (par jour, par pays, par emplacement), **avec des semaines de retard**, et le
corrige ensuite (trafic invalide). Notre propre enregistrement des impressions et l'argent
réellement reçu sont donc deux choses **distinctes**, rapprochées au calcul.

| Entité | Rôle | Champs clés |
|---|---|---|
| `ad_breaks` | Une coupure publicitaire | `id`, `user_id` (annulable), `started_at`, `after_play_id`, `plays_since_last_break` (4 ou 5 au moment), `provider`, `placement`, `status` (`requested`, `served`, `completed`, `skipped`, `failed`), `country_code`, `entitlement` |
| `ad_impressions` | Une publicité diffusée | `ad_break_id`, `provider_impression_id` (**unique**, rend la déclaration idempotente), `served_at`, `duration_seconds`, `completed`, `estimated_revenue_micros` (estimation, jamais distribuée), `counted`, `excluded_reason` |
| `ad_revenue_reports` | Ce que le prestataire a **réellement** rapporté | `provider`, `period_start`, `period_end`, `country_code`, `gross_micros`, `provider_fees_micros`, `invalid_traffic_micros`, `net_micros`, `currency`, `status` (`estimated` ou `final`), `report_ref` (unique), `received_at` |
| `consents` | Consentements (publicité personnalisée…) | `user_id`, finalité, état, version du texte, horodatage — l'historique est conservé |

**Du rapport au relevé** *(proposé)* : le revenu net `final` d'une période et d'un pays est réparti
entre les impressions **comptées** de cette période et de ce pays (au prorata, ou au prorata
de leur durée), puis regroupé par auditeur : c'est le montant du relevé `kind = ads` de cet
auditeur. Seul un rapport `final` est réparti ; un rapport `estimated` s'affiche « en attente ».

Les montants d'impressions sont en micro-unités (section 7, unité des montants).

---

## 8. Existant → cible

| Table actuelle | Verdict |
|---|---|
| `listening_sessions` | **Fait** : renommée `plays` et étendue (secondes validées, copies figées, qualification, exclusion, suivi par battements) par la migration `20261009000002_plays.sql`. `entitlement` (D12) y est déjà |
| `listening_events` | **Fait** : remplacée par `play_heartbeats` (la migration refuse de la supprimer si elle contient des lignes). Durée de conservation courte, purge à écrire |
| `royalty_periods` | **Garder et étendre** (statut, paramètres, runs) |
| `royalty_allocations` | **Remplacer** : décrit un pot global par morceau/artiste, donc le modèle *pooled* que la page transparency critique. Remplacé par relevés d'abonnés et lignes par artiste |
| `creator_wallets` | **Remplacer** par un solde dérivé du journal |
| `payouts` | **Garder et étendre** |
| `rights`, `splits` | **Garder**, versionner, utiliser à la publication |
| `fraud_events`, `fraud_scores` | **Garder** ; alimentent `plays.counted` |
| `subscriptions` | **Étendre** (lien `plans`) ; ajouter `plans` et `payments` |
| *(n'existent pas)* | **Ajouter plus tard** (après la bêta) : `ad_breaks`, `ad_impressions`, `ad_revenue_reports`, `consents` (section 7.6) ; et dès l'étape 2, le champ `plays.entitlement` |

---

## 9. Cycle d'une période *(proposé)*

1. **Ouverte** — les lectures et les paiements s'accumulent.
2. **Clôture** — quelques jours après la fin du mois, pour laisser arriver les battements en retard. Plus aucune écriture dans la période.
3. **Calcul** — un *run* applique les `period_parameters` figés : relevés d'abonnés, revenus d'artistes, prélèvement, pool.
4. **Contrôle** — anomalies, lectures exclues, écarts de somme (le total réparti doit égaler le total à répartir).
5. **Publication** — relevés abonnés, revenus artistes, état de la pool.
6. **Paiement** — virements ; chaque virement est une écriture du journal.

Une erreur découverte plus tard n'ouvre pas la période : elle produit une **écriture
corrective** dans la période suivante (ou un nouveau run, publié avec son motif).

**Publicité (D9).** Elle n'a pas le même rythme : le revenu d'une période n'est réparti
qu'une fois le **rapport final** du prestataire reçu, souvent plusieurs semaines après la
clôture. Les relevés `subscription` et `ads` d'une même période sont donc calculés à des
moments différents. Les corrections tardives du prestataire (trafic invalide, remises)
passent par des **écritures correctives**, comme tout le reste.

---

## 10. Transparence : ce que voit chacun

| Qui | Ce qu'il voit |
|---|---|
| **Abonné** | Ce qu'il a payé, les taxes, la part plateforme, la part artistes, et **la liste des artistes qu'il a écoutés** avec les secondes et le montant de chacun |
| **Auditeur gratuit** *(D9)* | Les publicités entendues, **ce qu'elles ont rapporté** (une fois le revenu confirmé), la part plateforme, et **les artistes qui en bénéficient** avec le montant de chacun. Même transparence qu'un abonné : *son* écoute finance *ses* artistes |
| **Artiste** | Ses secondes validées et lectures qualifiées, ses revenus bruts, le prélèvement éventuel, la redistribution de la pool, le net ; l'historique de ses paiements |
| **Public** | Les règles en vigueur (part plateforme, seuil de 30 s, paliers), et chaque mois : total encaissé, total versé aux artistes, **état de la pool** (entrées et usages) ; avec la publicité, **le revenu publicitaire reçu, les frais du prestataire, la part plateforme et la part artistes** |

---

## 11. Garde-fous d'intégrité

Issus du contrôle du 9 oct. 2026 (voir le rapport du même jour) :

- **Plus de `on delete cascade`** vers les écoutes, relevés, journal, paiements. Un morceau ou
  un artiste se **retire** (`archived`), il ne se supprime pas.
- **Un morceau publié ne repasse jamais en brouillon**, et la suppression exige
  `published_at is null` (aujourd'hui, un créateur peut publier → brouillon → supprimer).
- **Suppression de compte = anonymisation** : `plays.user_id` passe à `null`, les relevés
  suivent la durée de conservation légale. Pour un **créateur**, l'artiste lui-même est
  anonymisé et ses fichiers purgés après 30 jours : voir D13 à D16 (migration
  `20261011000000_catalog_numbers_and_artist_names.sql`, dépôt de l'API). **Écrit le
  11 oct. 2026**, testé sur une base jetable ; à appliquer à la base réelle (ordre : migration,
  puis API). La purge des pièces comptables après 10 ans reste à écrire.
- **Périodes closes immuables**, imposé en base (trigger), pas seulement par l'application.
- **Splits** : somme à 100 % vérifiée ; versionnés avec date d'effet ; **copiés** dans
  `payee_period_lines` au calcul.
- **Durée du morceau obligatoire à la publication**, mesurée sur le fichier et non déclarée.
- **Fichiers audio validés** : existence dans le stockage, format réel, taille réelle,
  `checksum` calculé.
- **Publication par un administrateur** (route dédiée), avec qui et quand ; relecture des
  déclarations IA.
- **Publicité (D9) : le serveur décide** quand une coupure est due (section 6.4), pas le client.
  Les impressions et les rapports du prestataire sont **append-only** ; les rapports `final`
  ne se modifient pas (une correction du prestataire est une nouvelle écriture).
- **On ne distribue que l'argent reçu** : jamais une estimation d'impression, jamais un
  rapport `estimated`.
- **Consentement tracé** avant toute publicité personnalisée (qui, quoi, quelle version du
  texte, quand), et conservé même après retrait.

---

## 12. Questions ouvertes

| # | Question | Recommandation |
|---|---|---|
| **Q1** | Les 10 $ incluent-ils la **TVA** ? Les frais de transaction sont-ils bien **pris sur la part plateforme** (D4) ? | Calculer les parts sur le montant encaissé **hors taxes**, la taxe n'appartenant à personne. Frais pris sur la part plateforme : les artistes reçoivent 85 % quel que soit le prestataire de paiement. |
| **Q2** | Prélèvement progressif (D6) : **par tranche ou par palier** ? Paliers exacts, **devise**, base de calcul ? (Tu as écrit « dégressif » ; le mécanisme décrit **augmente** avec le revenu, donc c'est un prélèvement *progressif*.) | **Par tranche** (section 4.2). Base : revenu brut mensuel du **compte artiste**, avant splits. Paliers et devise en paramètres de période. |
| **Q3** | Les secondes des lectures de **moins de 30 s** comptent-elles dans le poids ? | **Non** : seules les écoutes qualifiées pèsent. Elles restent enregistrées. |
| **Q4** | **Redistribution du reste de la pool** : quelle règle « cohérente » ? Qui fixe le budget événements / promotions / réductions ? | Budget fixé et **publié avant** chaque période. Le reste est réparti **au prorata des secondes qualifiées totales** de chaque artiste sur la période, après prélèvement du budget. |
| **Q5** | **Réductions d'abonnement financées par la pool** : la part artistes se calcule-t-elle sur le prix payé ou sur le tarif plein ? | Sur le **tarif plein**, la pool couvrant l'écart : les artistes ne subissent pas les promotions (cohérent avec D7). |
| **Q6** | **Essais gratuits** et comptes gratuits : leurs écoutes sont-elles rémunérées ? | **Essais** (ni paiement ni publicité) : enregistrées, **non rémunérées**. **Comptes gratuits avec publicité** : rémunérées par le revenu publicitaire qu'ils génèrent (D9). **Pendant la bêta** (`entitlement = beta`) : enregistrées, non rémunérées. |
| **Q7** | **Remboursements et rétrofacturations** | Écriture inverse dans la période suivante ; jamais de modification d'une période close. |
| **Q8** | **Seuil minimum de paiement**, devise unique, rythme des virements | Un seuil à fixer, avec cumul reporté sous le seuil. Une seule devise au départ (le schéma met `USD` par défaut). |
| **Q9** | **Plusieurs appareils, hors ligne** | Un flux simultané par compte (section 6.3). Le hors-ligne, plus tard, avec envoi différé des battements. |
| **Q10** | **Conservation des données** | Battements bruts : courte durée. Lectures : durée à fixer avec un conseil juridique. Relevés et journal : durée d'archivage comptable. |
| **Q11** | **Publicité : attribution et part plateforme.** Le revenu généré par un auditeur gratuit va-t-il aux artistes **qu'il** a écoutés (comme un abonné), ou entièrement dans la pool commune ? Quelle **part plateforme** sur la publicité, et les frais du prestataire sont-ils déduits avant ? | **Comme un abonné** : cohérent avec la promesse publique (« ton écoute décide ») et sans dilution entre auditeurs. Part plateforme = **paramètre propre** à la publicité, pas forcément 15 %. Frais du prestataire déduits **en premier**. Revenu non attribuable (aucune écoute qualifiée) → pool commune. |
| **Q12** | **Cadence** : 4 ou 5 musiques, fixe ou tirée au hasard ? Qu'est-ce qui compte pour « une musique » ? Une publicité à l'ouverture ? Un plafond par heure ? | Tirer entre 4 et 5 à chaque coupure (paramètres de période). Compter les **écoutes qualifiées**, avec un **plafond de sécurité sur les lectures démarrées** pour que sauter à 29 s n'évite pas la publicité. Pas de publicité à l'ouverture. |
| **Q13** | **Revenu en retard, publicité absente ou bloquée.** Avance-t-on l'argent aux artistes avant la confirmation du prestataire ? Que fait-on si aucune publicité n'est servie, ou si le client la bloque ? | **Pas d'avance** : on ne répartit que le revenu confirmé. Aucune publicité disponible → la musique continue, aucun revenu. Publicité bloquée côté client → pas de morceau suivant (section 6.4), avec un message clair. |
| **Q14** | **Consentement, âge, pays.** La publicité personnalisée exige un consentement dans plusieurs pays (notamment l'UE) et celle destinée aux mineurs est encadrée. | Avis juridique **avant le lancement**. Enregistrer le consentement **dès maintenant** (`consents`). Publicité **non personnalisée** par défaut sans consentement ; aucune publicité pour les comptes déclarés mineurs ; `country_code` sur chaque coupure. |

---

## 12 bis. Vie privée et consentement *(proposé, 11 oct. 2026 — à valider par un juriste)*

Marchés visés au lancement : **Suisse et UE**, donc le régime le plus strict (consentement
préalable pour la publicité et les traceurs tiers). Détail et inventaire : `PRIVACY_POLICY_DRAFT.md`.

| # | Sujet | Proposition |
|---|---|---|
| P1 | Géographie | **Pays et région du monde seulement**, jamais la ville. La région se déduit du pays (nomenclature M49 + UE + Suisse). |
| P2 | « Qui écoute quoi » | **Agrégé** par défaut. L'historique d'UN compte ne s'ouvre qu'à un admin (double facteur), via une page dont l'ouverture est **écrite au journal d'audit avant l'affichage**. |
| P3 | Consentements | Table `consents` : une ligne par décision, **jamais modifiée** (trigger) ; l'état actuel est la ligne la plus récente de chaque finalité ; version du texte et origine enregistrées. Finalités obligatoires : `terms` (conditions + politique, pour la version affichée) et `age_16`. Finalités facultatives (`ads_personalization`, `analytics`) : **non demandées tant qu'on ne les active pas**. |
| P4 | Âge | Case « j'ai au moins 16 ans » (valeur prudente UE ; la finalité porte le seuil, donc le relever redemande). Aucune publicité pour les mineurs (Q14). |
| P5 | Nouvelle version du texte | Une étiquette de version ; chaque nouvelle version redemande les conditions (pas l'âge). |
| P6 | Écran d'accueil | Derrière l'interrupteur `PRIVACY_GATE`, **éteint** tant que la politique n'est pas publiée. Le cookie « version acceptée » n'est posé qu'après vérification auprès de l'API. |
| P7 | Conservation (Q10) | Battements bruts : **30 jours** ; empreinte d'IP : **30 jours** ; les écoutes ne sont pas supprimées (pièces de la rémunération). Fonction `privacy_retention_run`, **non planifiée** tant que les durées ne sont pas confirmées. |
| P8 | Cookies | Aujourd'hui : session d'authentification seulement. Le site vitrine et les apps restent **sans traceur tiers** ; un bandeau n'est nécessaire qu'avec la publicité ou un outil de mesure tiers. |

---

## 13. Étapes de mise en œuvre

1. **Migration corrective « sans regret »** : clés étrangères protégées, garde-fous sur le
   statut des morceaux, colonnes manquantes (section 11). À faire **avant** tout nouvel utilisateur.
   **État (9 oct. 2026) : préparée, testée sur une base jetable, pas encore appliquée à la base
   Supabase.** Fichier : `API/supabase/migrations/20261009000000_integrity_guards.sql`
   (dépôt de l'API, avec les contrôles 409 correspondants dans `creator/routes.ts`), suivie de
   `20261009000001_listening_entitlement.sql` (D12). Les deux se rejouent sans risque et
   s'appliquent dans n'importe quel ordre (testé dans les deux sens).
   - **Couvert :** fin des cascades vers écoutes, allocations, portefeuilles, paiements,
     abonnements ; compte supprimé = historique anonymisé ; un morceau publié ne repasse jamais
     en brouillon et ne se supprime pas ; durée et fichier exigés à la publication ; ISRC
     contrôlé ; colonnes `published_by`, `track_files.duration_seconds` et `verified_at`.
   - **Pas encore couvert** (renvoyé aux étapes suivantes) : immutabilité d'une période close
     (étape 4), splits versionnés et somme à 100 % (étapes 4-5), route d'administration pour
     publier (étape 5), `plays` (étape 2).
   - **Préparé à part** (9 oct. 2026, dépôt de l'API, non déployé) : la **mesure automatique**
     d'un fichier audio quand l'artiste l'envoie. Le serveur relit le fichier dans le stockage
     et en mesure le format réel (sur le contenu, pas l'extension), la durée, le débit, la taille
     et l'empreinte SHA-256 ; ce que déclare le client est ignoré. La durée du morceau est mise à
     jour d'après le fichier réellement streamé (le plus ancien). Formats acceptés : MP3, FLAC,
     WAV (PCM, 24 et 32 bits compris), Ogg (Vorbis, Opus), M4A (AAC) ; refusés : ALAC, AIFF,
     WAV compressé, fichiers vidéo. **Dépend de la migration** (colonnes `track_files.duration_seconds`
     et `verified_at`) : à déployer après elle. Limite connue : un MP3 ou un FLAC **tronqué**
     garde la durée d'origine inscrite dans son en-tête (les secondes payées viennent de l'écoute
     validée côté serveur, pas de cette durée).
   - **Rattrapage des fichiers déjà envoyés** (script `npm run backfill:audio`, dépôt de l'API).
     Il mesure les fichiers uploadés avant la mesure automatique (format « unknown », taille
     déclarée, aucune durée), puis aligne la durée des morceaux. **Simulation par défaut**
     (`--apply` pour écrire), **ne supprime jamais rien** (un fichier illisible est signalé, pas
     retiré), ne touche que les fichiers jamais mesurés, rejouable. À lancer **après** la migration
     et le déploiement de l'API : d'abord en simulation, puis un morceau (`--track`), puis tout.
2. **Lectures** : table `plays`, routes `POST /plays` et battements, instrumentation du
   lecteur. La bêta commence alors à collecter. Le champ `entitlement` (D12) est renseigné à
   chaque lecture, sans valeur par défaut. Les montants de cette étape et des suivantes
   suivent D10 (micro-unités).
   **État (9 oct. 2026) : implémentée et testée, pas encore déployée.**
   - **Base :** migration `API/supabase/migrations/20261009000002_plays.sql` (testée sur base
     jetable : rejouable, conserve une ligne d'écoute existante, un seul flux ouvert par compte).
   - **API :** `modules/plays` (routes + règle de calcul pure), `lib/entitlement.ts`
     (`ENTITLEMENT_MODE` : `beta` par défaut, `live` déduit de l'abonnement), `lib/clock.ts`.
   - **Webapp :** le lecteur démarre chaque lecture côté serveur et envoie ses battements ;
     l'origine de la lecture (album, playlist, artiste, découverte, recherche, bibliothèque)
     est enregistrée avec l'écoute.
   - **Ordre de déploiement : migration, puis API, puis webapp.** Une webapp déployée avant
     l'API appellerait une route inexistante et le lecteur ne démarrerait plus.
   - **Statistiques de lecture côté créateur (10 oct. 2026, non déployées) :** migration
     `API/supabase/migrations/20261010000000_creator_stats.sql` (4 fonctions SQL en lecture
     seule, réservées à `service_role`, testées sur base jetable : bornes de fenêtre, lectures
     exclues ou non qualifiées, compte anonymisé, isolation entre artistes, jours en UTC), route
     `GET /creator/stats?range=7d|30d|90d[&track_id=]`, pages Overview / Audience / Analytics /
     détail d'un morceau du Studio. Définitions : une **écoute** = lecture comptée et qualifiée
     (30 s) ; **auditeurs** = comptes distincts (un compte supprimé n'est plus compté comme
     auditeur, ses écoutes restent) ; **temps d'écoute** = secondes validées des écoutes
     qualifiées. Tant que la migration n'est pas appliquée, la route répond 503 et le Studio
     affiche « Coming ». **Ordre de déploiement : migration `…creator_stats`, puis API, puis
     Studio.**
   - **Reste à faire** (limites de la section 6.2) : purge des battements, suppression de
     `GET /tracks/:id/stream`, déploiement de ce qui précède.
3. **Argent entrant** : `plans` (dont le plan gratuit `ad_supported`), `payments`, branchement
   du prestataire de paiement.
4. **Calcul** : paramètres de période, runs, relevés d'abonnés, revenus d'artistes, pool.
5. **Administration** : publication, relecture IA, contrôle fraude.
6. **Journal et virements** : écritures comptables, comptes de paiement, `payouts`.
7. **Publicité** *(après la bêta, une fois l'app en ligne — D9)* : `ad_breaks`, `ad_impressions`,
   `ad_revenue_reports`, `consents` ; coupures décidées par le serveur (section 6.4) ;
   relevés `kind = ads` ; comptes du journal pour la publicité ; passage de la bêta au niveau
   gratuit avec publicité (`entitlement` : `beta` → `free_ad_supported`).
8. **Croissance et volumétrie** *(section 14)* : décisions S1 à S7 avant l'étape 4, puis les paliers
   1 à 3 quand leur déclencheur est atteint.
9. **Droits d'auteur et contenu IA** *(section 15)* : avis juridique et contact avec SUISA, conditions
   artistes, déclaration IA étendue, contrôle avant publication, retrait et blocage des ré-envois,
   retenue sur les virements. **Obligatoire avant l'ouverture publique** ; l'avis juridique démarre
   dès maintenant, en parallèle.
10. **Conservation, suppression de compte et archive comptable** *(section 16)* : à construire avec
   l'étape 8 de la liste ci-dessus.

Les étapes 1 et 2 ne dépendent d'aucune réponse de la section 12. Les étapes 3 à 6 attendent
Q1, Q2, Q4 et Q5 ; l'étape 7 attend Q11 à Q14.

L'étape 8 (section 14, croissance et volumétrie) ne dépend d'aucune réponse de la section 12 ;
ses points « à décider maintenant » sont à traiter **avant** l'étape 4, tant que `plays` est presque vide.

---

## 14. Croissance et volumétrie *(proposé, 12 oct. 2026)*

Ordres de grandeur calculés sur le schéma réel, **pas des mesures**. Hypothèses : 30 % des
utilisateurs actifs par jour, 15 écoutes par jour et par utilisateur actif, un battement toutes
les 15 s (≈ 15 par écoute), 350 octets par écoute (ligne + index), 200 octets par battement
(ligne + index), 5 Mo d'audio servis par écoute. À recalculer si l'une d'elles change.

**Point de départ mesuré le 12 oct. 2026** (Supabase, bêta fermée) : 5 comptes, 53 écoutes,
450 battements, 1 paiement ; la plus grosse table pèse 272 ko. Requête pour le refaire :
`select relname, n_live_tup, pg_size_pretty(pg_total_relation_size(relid)) from pg_stat_user_tables order by pg_total_relation_size(relid) desc limit 10;`

### 14.1 Ce que ça donne

| Utilisateurs actifs / mois | Écoutes / jour | `plays` / an | Battements / jour | Battements (30 j) | Audio servi / mois |
|---|---|---|---|---|---|
| 10 000 | 45 000 | ~6 Go | 0,7 M | ~4 Go | ~7 To |
| 100 000 | 450 000 | ~57 Go | 6,7 M | ~40 Go | ~70 To |
| 1 million | 4,5 M | ~575 Go (1,6 milliard de lignes) | 67 M (~780 / s en moyenne) | ~400 Go | ~675 To |
| 10 millions | 45 M | ~5,7 To | 675 M | ~4 To | ~7 Po |

Les tables d'argent (`payments`, `stripe_events`, `consents`, journal d'audit) restent à quelques
millions de lignes par an : le volume vient des écoutes et de l'audio, pas de l'argent.

### 14.2 Ce qui cède en premier

1. **Le trajet d'un battement** : chaque battement fait un appel à Supabase Auth, un contrôle du
   statut du compte, une lecture, une mise à jour et une insertion. L'API et l'authentification
   saturent vers 50 000 à 100 000 utilisateurs actifs, bien avant le disque.
2. **Les statistiques et le calcul d'une période** : les fonctions `admin_stats_*` et le calcul
   des parts parcourent `plays` avec des regroupements. Sur ~1,6 milliard de lignes par an, une
   page Analytics prendrait des minutes.
3. **Le trafic audio** : plus coûteux que la base. L'API sert aujourd'hui le fichier original de
   l'artiste (jusqu'à 200 Mo, un WAV de 35 Mo pour un titre de 3 min 30).
4. **La purge à 30 jours des battements** (P7) : encore ~400 Go en régime stable à 1 million.

### 14.3 Paliers

| Palier | Déclencheur | Actions |
|---|---|---|
| 0 | moins de 10 000 actifs | Planifier la purge, sauvegardes restaurables, surveiller la taille des tables. |
| 1 | ~50 à 100 M de lignes dans `plays`, ou une page Analytics à plus de 2 s | Cumuls journaliers (artiste, titre, pays, appareil, formule), lus par l'admin et par le calcul des parts. `plays` découpée par mois. Battements gardés 7 jours. Jeton vérifié localement, statut du compte en cache court. Transcodage (AAC, plusieurs débits) et CDN. Réplica en lecture pour les traitements lourds. |
| 2 | ~1 million d'actifs | État de l'écoute en cours dans un stockage rapide (Redis ou petite table), **une seule écriture dans l'historique à la fin de l'écoute**, battements groupés. Entrepôt analytique séparé. Archivage des vieilles écoutes en fichiers compressés. API sur plusieurs instances. |
| 3 | 10 millions et plus | Plateforme de données dédiée, flux d'événements. |

### 14.4 À décider maintenant (peu coûteux tant que la base est presque vide)

| # | Sujet | Proposition |
|---|---|---|
| S1 | Écoute en cours / historique | Sortir la règle « un seul flux ouvert par compte » (index unique partiel sur `plays`) vers une petite table d'état : Postgres refuse un index unique sur une table découpée sans la clé de découpage. Condition pour pouvoir découper `plays` par mois. |
| S2 | Table des battements | Clé `(play_id, seq)` à la place de l'uuid aléatoire (un index de moins, pas de gonflement). Durée de conservation à 7 jours plutôt que 30 (P7, à revoir avec Q10). |
| S3 | Cumuls | Tables de cumuls journaliers créées avec le calcul des parts (étape 4) : l'admin et le calcul lisent les cumuls, jamais `plays` brut. Sans identifiant d'utilisateur quand c'est possible. |
| S4 | Audio | Plan de transcodage et de CDN **avant** que les artistes envoient des fichiers lourds ; limites de taille et de type sur le bucket `track-audio` (aujourd'hui vérifiées seulement après l'envoi). |
| S5 | Identifiants | Pour les nouvelles grosses tables, préférer un identifiant ordonné dans le temps (uuid v7 ou entier) à l'uuid aléatoire. |
| S6 | Conservation par table | Tableau des durées, à valider avec le juriste (Q10). Proposition : écoutes brutes ~24 mois en base puis archivées, cumuls sans identifiant gardés sans limite, battements 7 jours, empreintes d'IP 30 jours, paiements / journal / relevés 10 ans (art. 958f CO), événements Stripe traités ~90 jours (relisibles chez Stripe), consentements tant que le compte existe puis durée de preuve à fixer. |
| S7 | Suppression de compte | **Anonymiser, ne pas supprimer** : déjà le modèle (`purge.ts`), à garder, car supprimer des lignes d'une table de plusieurs milliards est trop coûteux. |

### 14.5 Surveillance

Relever tous les mois : taille et nombre de lignes de `plays` et `play_heartbeats`, durée de la
page Analytics, battements par seconde (moyenne et pointe du soir), volume d'audio servi, coût
par utilisateur actif. Passer au palier suivant quand un déclencheur de 14.3 est atteint, pas avant.

### 14.6 Hébergement cible et coûts *(12 oct. 2026, tarifs publics consultés ce jour)*

- **Supabase** : Pro à partir de 25 $/mois (base 8 Go incluse, disque supplémentaire 0,125 $/Go ; stockage 100 Go
  inclus, 0,0213 $/Go ; sortie 250 Go + 250 Go « en cache » inclus, puis 0,09 $/Go ou 0,03 $/Go en cache ;
  envoi jusqu'à 500 Go par fichier ; sauvegardes 7 jours, restauration à la seconde près +100 $/mois). Le plan gratuit
  limite la base à 500 Mo, la sortie à 5 Go, l'envoi à 50 Mo par fichier et n'a pas de sauvegardes. Disque jusqu'à 60 To,
  serveur jusqu'à 64 cœurs. Un changement de disque : 4 par 24 h ; un import de plus de 1,5 fois la taille met la
  base en lecture seule.
- **Région** : Zurich (`eu-central-2`) ou Francfort (`eu-central-1`) ; la région d'un projet ne se change pas
  (nouveau projet puis migrations). Choisir tant que la base ne contient que des comptes de test.
- **Cible** : base et authentification sur Supabase (Zurich) ; API sur Render (Francfort, instance payante) ;
  application sur Vercel ; copies de diffusion (AAC) sur Cloudflare R2 (0,015 $/Go/mois, sortie gratuite, 10 Go
  offerts) derrière un CDN ; **originaux des artistes** dans un stockage objet suisse ou UE (Exoscale, Infomaniak) ;
  archive comptable dans un stockage suisse. Pendant la bêta : tout reste sur Supabase.
- **Coûts estimés par mois** (hypothèses de 14, Supabase Storage pour l'audio) : 10 000 actifs ≈ 25 à 50 $ de base
  et 200 à 600 $ d'audio ; 100 000 ≈ 300 $ et 2 000 à 6 300 $ ; 1 million ≈ 1 000 à 2 500 $ et 20 000 à 60 000 $.
  L'audio coûte 10 à 40 fois plus que la base : servir des AAC (≈ 5 Mo) plutôt que les originaux (jusqu'à 35 Mo).
- Le code touche l'audio à une dizaine d'endroits (`track_files.storage_provider` existe déjà) ; l'accès à la base
  passe par ~237 appels du client Supabase dans 25 fichiers : quitter Supabase pour la base serait un vrai chantier.

---

## 15. Droits d'auteur et contenu IA *(proposé, 12 oct. 2026 — à valider par un avocat en propriété intellectuelle)*

**Positionnement** : catalogue d'artistes indépendants, de la musique générée par IA. C'est là que se concentrent les
litiges (procès de maisons de disques contre les générateurs, jugement du tribunal de Munich contre Suno en faveur de la
GEMA) : le risque de plagiat ou de reprise d'œuvres protégées est plus élevé qu'ailleurs.

### 15.1 Constats (sources en bas de section)

- **SUISA** gère les droits des auteurs, compositeurs et éditeurs en Suisse. Elle indique qu'une œuvre **entièrement
  générée par IA ne peut pas être inscrite** chez elle, que ses membres s'engagent à ne pas l'inscrire, que les œuvres
  hybrides (part humaine) sont examinées séparément, et qu'elle ne peut pas toujours dire si une œuvre est protégée.
  Je n'ai **pas trouvé de tarif SUISA pour le streaming musical** (seulement les jeux vidéo) : à demander à SUISA.
- **Une clause « l'artiste est responsable » ne suffit pas** à dégager la plateforme.
  - *UE* (directive 2019/790, art. 17) : une plateforme qui donne accès à des œuvres envoyées par ses utilisateurs
    effectue elle-même la communication au public ; elle doit obtenir une autorisation, ou prouver ses meilleurs efforts
    (contacter les sociétés de gestion, empêcher l'accès aux œuvres signalées, retirer vite, empêcher le ré-envoi). Les
    services récents et petits ont un régime allégé. La Commission considère le contact proactif avec les sociétés de
    gestion comme un minimum.
  - *Suisse* (art. 39d LDA, depuis le 1er avril 2020) : un hébergeur dont le service présente un risque particulier doit,
    après signalement, empêcher qu'une œuvre soit remise à disposition (« stay down »), dans la mesure raisonnable. Pas
    d'obligation générale de surveillance.
  - La clause donne un **recours contre l'artiste** et prouve la bonne foi, rien de plus.
- **Un service de reconnaissance « style Shazam »** (ACRCloud, Audible Magic, Pex) retrouve les enregistrements identiques
  ou peu modifiés, et certains annoncent la détection de reprises par la mélodie. Il **ne détecte pas** de façon fiable un
  morceau nouveau, généré par IA, qui ressemble à une œuvre protégée. Les détecteurs « généré par IA » donnent une
  probabilité, pas une preuve. Pas de taux d'erreur publiés par les fournisseurs : à mesurer sur un jeu de test.

### 15.2 Conséquence pour un catalogue 100 % IA

- Pour un morceau **entièrement généré** : SUISA n'a rien à licencier, mais l'œuvre n'est probablement pas protégée non
  plus (elle peut être copiée), et le risque vient des œuvres reproduites par le modèle.
- Pour un morceau **hybride** (paroles, mélodie ou arrangement d'un humain) : protégé ; si l'auteur est membre d'une
  société, il lui a cédé ses droits, **il ne peut pas les licencier lui-même** à Vynl. SUISA ne couvre que la Suisse ;
  l'UE suppose d'autres sociétés. Voir R1 et R2.
- Les conditions des outils IA diffèrent (certains réservent l'usage commercial aux formules payantes) : l'artiste doit
  déclarer l'outil et la formule utilisés.

### 15.3 Contrôles proposés (couches)

| # | Contrôle | Détail |
|---|---|---|
| C1 | Conditions artistes | Garanties (droits sur le morceau, usage commercial autorisé par l'outil, pas d'œuvre protégée reproduite, pas de voix clonée d'une personne réelle), indemnisation, autorisation de retirer et de **retenir ou reprendre** les sommes. |
| C2 | Déclaration IA étendue | Outil, version, formule, date, part humaine (paroles, mélodie, voix), « 100 % IA » ou « hybride ». S'appuie sur le modèle existant (`ai_declarations`, relecture admin). |
| C3 | Contrôle avant publication | Empreinte (reconnaissance d'enregistrements connus), détecteur IA (vérifie la déclaration), nom d'artiste (déjà en place). Un morceau douteux reste en relecture. |
| C4 | Signalement et retrait | Formulaire public pour les ayants droit, délai de réponse court, retrait journalisé, **liste de blocage** (empreintes des morceaux retirés) contre le ré-envoi, suspension des récidivistes. |
| C5 | Retenue sur les virements | Première rémunération retenue quelques semaines ; sommes contestées gardées en attente ; reprise par écriture inverse (Q7). |
| C6 | Étiquetage | Les morceaux IA sont signalés comme tels aux auditeurs (le règlement européen sur l'IA prévoit de la transparence : à vérifier). |

### 15.4 Décisions à prendre

| # | Question | Proposition |
|---|---|---|
| R1 | Quel catalogue exactement ? | **DÉCIDÉ (12 oct. 2026) : la bêta commence 100 % IA.** Les morceaux déclarés `hybrid` sont **mis en attente**, pas refusés (voir 15.5). **La provenance `human` est supprimée** (décision du 12 oct. 2026) : plus proposée, refusée par l'API. L'hybride exigera plus tard la confirmation que l'auteur n'a pas cédé ces œuvres à une société de gestion. |
| R2 | Territoires au lancement | Suisse seule réduit le nombre de licences ; Suisse + UE (choix actuel) ajoute l'art. 17 et des sociétés étrangères. |
| R3 | Licences | Avis d'un avocat PI, puis contact avec SUISA (et les sociétés étrangères si l'UE est visée) **avant** le lancement. |
| R4 | Retenue C5 | Durée à fixer (par exemple 30 à 60 jours) ; à écrire dans les conditions. |
| R5 | Outil d'empreinte | Pilote sur un jeu de morceaux (connus, reprises, 100 % IA) avant de choisir et de payer. |
| R6 | Voix clonées | Interdites ; à contrôler à la relecture. |

Sources : SUISA, « Les chansons générées par IA et le droit d'auteur » (blog.suisa.ch) et communiqué de mars 2024 ;
art. 39d LDA (fedlex) ; directive (UE) 2019/790 art. 17 et lignes directrices de la Commission (COM(2021) 288) ;
documentation ACRCloud et Pex. Les affirmations sur les fournisseurs viennent de leur propre documentation.

### 15.5 Détection : principe, noms d'artiste, doublons *(proposé, 12 oct. 2026)*

**Principe.** Aucun contrôle n'est sûr à 100 % : ni les prestataires de reconnaissance, ni nous. Le droit demande des
« meilleurs efforts » (UE) et des mesures « raisonnables » (Suisse), pas la perfection. Il faut donc :
(1) **plusieurs signaux indépendants** ; (2) une **décision graduée** : chaque contrôle rend `ok` / `warn` / `fail`
(mécanisme déjà prévu dans `moderation.ts` ; un `fail` bloque la publication, un `warn` demande une relecture humaine) ;
(3) une **trace de chaque contrôle**, qui est la preuve de diligence ; (4) des contrôles **après** publication aussi
(nouveaux signalements, bases de référence qui s'enrichissent chaque jour). Le risque résiduel est traité par C4
(retrait et blocage des ré-envois), C5 (retenue), C1 (indemnisation), et éventuellement une assurance de responsabilité.

**Règle de la bêta (décidée).** Seuls les morceaux déclarés `ai` se publient. `hybrid` est **enregistré
mais en attente** : un contrôle bloquant « held » côté serveur (même mécanisme que `rejected`), levé par un réglage
(`ACCEPTED_PROVENANCES`) le jour où l'on ouvre l'hybride. Le Studio l'explique clairement (« enregistré, pas encore
accepté pendant la bêta »). **`human` est supprimé** (12 oct. 2026) : le Studio ne le propose plus (formulaire de candidature
et déclaration IA) et l'API le refuse avec un message explicite (`lib/provenance.ts`). La valeur reste dans l'énumération
`provenance_type` de la base (Postgres ne retire pas une valeur d'énumération) et dans l'historique des déclarations
(ajout seul) ; une ancienne déclaration `human` s'affiche avec une invitation à la refaire.

**Noms d'artiste** (aujourd'hui : unicité interne sans accents, casse ni ponctuation ; mots réservés ; mélange de
caractères latins et cyrilliques refusé). On ne peut pas prouver qu'un nom n'existe pas ailleurs, et plusieurs artistes
peuvent légitimement le partager : on réduit le risque d'**imitation** d'un artiste connu.

| # | Contrôle | Détail |
|---|---|---|
| N1 | Unicité interne | En place. |
| N2 | Ressemblance interne | À ajouter : similarité (trigrammes Postgres `pg_trgm`) et phonétique, pour attraper « Daftpunk », « Dafft Punk ». `warn`. |
| N3 | Artistes réels connus | À ajouter : recherche automatique dans **MusicBrainz** (données de base en CC0 ; un appel par seconde sur le service public, copie locale pour le volume ; usage commercial du service public sous formule payante). Un second catalogue (Deezer) à confirmer, ses conditions n'ayant pas été vérifiées. Correspondance exacte ou proche avec un artiste établi : `warn`. |
| N4 | Marques | Swissreg (Suisse) et TMview (UE) : vérification manuelle à la relecture au début. |
| N5 | Imitation | Titres, descriptions et noms contenant un nom d'artiste connu, « type beat », « in the style of », « (AI) » : `warn`. Voix clonée interdite (R6). |
| N6 | Affichage | Badge « IA » visible à côté du nom ; le numéro de catalogue de l'artiste lève l'ambiguïté. |

**Morceaux et doublons** (aujourd'hui : un même fichier ne peut pas être attaché deux fois **au même morceau** ; ISRC unique).

| # | Contrôle | Détail |
|---|---|---|
| D1 | Même fichier, tout le catalogue | **Gain rapide, gratuit.** Étendre la comparaison de l'empreinte SHA-256 à tous les morceaux : `fail` (« ce fichier existe déjà sur Vynl »), sans dire chez qui. |
| D2 | Même enregistrement ré-encodé ou coupé | Empreinte acoustique de **notre propre catalogue** : Chromaprint (libre) ou « custom bucket » d'un prestataire (ACRCloud propose le dédoublonnage de ses buckets). Chromaprint lit les deux premières minutes et semble sensible aux changements de tempo et de hauteur (déduit de sa conception : à tester). |
| D3 | Enregistrements existants hors Vynl | Prestataire d'empreintes (ACRCloud, Audible Magic, Pex) : version identique, reprises et mélodie. Tarif ACRCloud visible seulement dans sa console (essai de 14 jours) : **pilote** avant de choisir (R5). |
| D4 | Métadonnées | ISRC unique (en place) ; même titre et durée à ±2 s : `warn`. |
| D5 | Détecteur « généré par IA » | Vérifie la déclaration `ai` et, si possible, l'outil. Un score « humain » élevé : `warn`. Probabilité, pas preuve. |
| D6 | Preuve de création | Outil, formule, identifiant ou lien de la génération, pistes séparées si l'outil les fournit ; marquages de provenance (filigrane, C2PA) lus quand ils existent. Facultatif d'abord, requis ensuite. |
| D7 | Nouveau contrôle périodique | Tout le catalogue est re-scanné à chaque mise à jour de la base de référence, au moins chaque mois. |
| D8 | Journal des contrôles | Table `track_scans` : prestataire, version, score, référence trouvée, date, décision humaine. Ne jamais révéler à l'artiste qui détient le morceau qui ressemble. |

Sources : documentation ACRCloud (bucket personnalisé, dédoublonnage, reprises) ; AcoustID et Chromaprint ;
MusicBrainz (limite d'un appel par seconde, données de base en CC0, usage commercial du service public sous plan).

---

## 16. Conservation, suppression de compte et archive comptable *(proposé, 12 oct. 2026 — à valider par une fiduciaire / un juriste)*

**Principe** : la société tient **sa propre comptabilité 10 ans** (art. 958f CO, à compter de la fin de l'exercice),
lisible et consultable à tout moment ; Stripe n'est pas une archive (si le compte est limité ou fermé, l'accès est
perdu). Le lieu de conservation (hors Suisse) n'a pas pu être confirmé : à demander à la fiduciaire ; une copie en Suisse
rend la question sans objet. Le KYC des créateurs est fait par Stripe ; faire valider qu'un virement via Stripe Connect
ne fait pas de Vynl un intermédiaire financier.

| Donnée | Après suppression du compte | Durée |
|---|---|---|
| E-mail, identité d'authentification, nom, avatar, playlists, bibliothèque, abonnements aux artistes | **Supprimés** | après le délai de grâce |
| Empreinte d'IP, battements, appareil | **Supprimés** | 30 jours / 7 jours |
| Écoutes brutes | **Anonymisées** (lien au compte retiré) | ~24 mois, puis cumuls sans identifiant |
| Paiements, TVA, relevés de redevances, virements, écritures | **Gardés** | **10 ans** |
| Identité légale de l'artiste, conditions acceptées | **Gardées** | 10 ans après le dernier paiement |
| Pièces d'identité (KYC) | Chez Stripe, jamais chez nous | n/a |
| Journal d'audit | Gardé | 2 ans (actions financières : 10 ans) |
| Modération, déclarations IA, litiges de droits | Gardés | délai de prescription (à fixer) |
| Consentements | Preuve gardée sans identité directe | à fixer |
| Journaux techniques | Supprimés | 30 à 90 jours |

**Archive comptable à construire** : export mensuel des factures et des mouvements Stripe, copie de `payments`, relevés
de redevances et de virements, dans un stockage suisse, non modifiable, avec contrôle de lecture à intervalles réguliers.

**Cookies** : aujourd'hui seulement la session et `vynl_policy` (nécessaires : pas de bandeau, mais à citer dans la
politique). Les statistiques d'écoute sont mesurées par nos serveurs, sans cookie. Un bandeau n'est requis qu'avec la
publicité ou un outil tiers : la Suisse exige l'information et un droit de refus (art. 45c LTC, lignes directrices du
PFPDT révisées en octobre 2025), l'UE l'accord préalable ; on applique le plus strict. **Aucun outil de mesure tiers
avant la publicité.**

**Genre** : les morceaux n'ont aucun champ de genre aujourd'hui. Ajouter une liste fermée (une trentaine de valeurs,
éventuellement un sous-genre, la langue et l'ambiance), obligatoire avant la relecture, puis une dimension « genre »
dans les cumuls (14.4, S3). Les statistiques par genre et par pays restent agrégées. Google Ads (achat de publicité)
ne fournit aucune donnée d'écoute : les écoutes de Vynl restent la seule base de calcul des parts.
