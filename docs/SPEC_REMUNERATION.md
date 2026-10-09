# Vynl — Rémunération des artistes et données associées

> **Statut :** brouillon v0.1 — 9 oct. 2026
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

> **Vocabulaire.** Pour éviter les confusions : la **part artistes** est la tranche de 8,50 $
> d'*un* abonnement ; la **pool commune** est le fonds collectif de la plateforme (D3, D6, D7).

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

Revenus bruts d'un artiste sur le mois (somme de toutes les parts reçues)
 ├─ prélèvement progressif au-delà des paliers (D6) ──→ pool commune
 └─ le reste revient à l'artiste (puis se répartit entre ayants droit selon les splits)

Pool commune
 ← entrées : argent non réparti (D3) + prélèvements (D6) + autres revenus futurs
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

---

## 6. Capture des écoutes

### 6.1 Pourquoi pas à la délivrance de l'URL

Aujourd'hui `GET /tracks/:id/stream` renvoie une URL signée **valable 6 h**. Le lecteur reprend
et rejoue sur la même URL sans rappeler le serveur : compter à la délivrance **sous-compterait**
les rejeux et serait facile à contourner. On compte donc des **battements de cœur** envoyés par
le lecteur et **validés par le serveur**.

### 6.2 Protocole *(proposé)*

1. `POST /plays` — `{ track_id, source_context, source_id, client_session_id }`
   → `{ play_id, url, format, heartbeat_every_seconds }`. Remplace `/tracks/:id/stream` pour
   la lecture ; crée la ligne de lecture.
2. `POST /plays/:id/heartbeat` — `{ seq, position_seconds, state }` environ toutes les 15 s,
   et à chaque pause, changement de morceau ou fin.
3. Le serveur calcule à chaque battement :
   `validées += min(Δposition, Δtemps_serveur)`, plafonné à la durée du morceau.
4. `seq` croissant et `play_id` côté serveur rendent les battements **idempotents** (un
   réseau instable ne double-compte pas).
5. Une lecture non terminée proprement (onglet fermé) est clôturée par le serveur après un
   délai sans battement ; les secondes déjà validées sont conservées.

Le lecteur de la webapp pilote déjà son état par les événements `<audio>` (`play`, `pause`,
`ended`, `waiting`, `timeupdate`) : y brancher ces battements est direct.

### 6.3 Garde-fous anti-fraude *(proposé)*

- **Un seul flux simultané par compte** (le second est refusé ou coupe le premier).
- Secondes plafonnées au temps réel ; lecture accélérée ou sauts ne créent pas de secondes.
- Signaux conservés pour analyse : pays dérivé de l'IP (pas l'IP elle-même), empreinte d'IP
  salée à rotation, type d'appareil, rythme d'écoute (nombre de lectures par heure).
- Une lecture suspecte est **exclue** (`counted = false`, avec motif), jamais supprimée.

---

## 7. Données à enregistrer

> Ce sont les **entités et champs clés**, pas encore le SQL. Les noms sont proposés.

### 7.1 Écoutes

| Entité | Rôle | Champs clés |
|---|---|---|
| `plays` | Une lecture | `id`, `user_id` (annulable à l'anonymisation), `track_id`, **`artist_id` copié au moment de la lecture**, `album_id`, `started_at`, `ended_at`, **`validated_seconds`**, **`track_duration_seconds` (copie)**, `qualified`, `qualified_at`, `counted`, `excluded_reason`, `source_context` + `source_id` (album, playlist, recherche…), `device_type`, `country_code`, `ip_hash`, `client_session_id`, `app_version` |
| `play_heartbeats` | Battements bruts | `play_id`, `seq`, `position_seconds`, `received_at` — **conservation courte** (sert au contrôle et à la fraude) |

Copier l'artiste et la durée dans `plays` fige l'historique : changer ensuite le titre, l'album
ou la durée d'un morceau ne change pas ce qui a été écouté.

### 7.2 Argent entrant

| Entité | Rôle | Champs clés |
|---|---|---|
| `plans` | Offres | `code`, `name`, `price_cents`, `currency`, `interval` |
| `subscriptions` *(existant, à étendre)* | Abonnement d'un utilisateur | `plan_id`, `status`, période courante, fournisseur + identifiant fournisseur |
| `payments` | Chaque encaissement | `user_id`, `subscription_id`, `provider`, `provider_payment_id` (unique), **`gross_cents`**, **`tax_cents`**, **`fee_cents`**, **`net_cents`**, `currency`, `status`, `paid_at`, remboursement éventuel |

### 7.3 Calcul d'une période

| Entité | Rôle | Champs clés |
|---|---|---|
| `royalty_periods` *(existant, à étendre)* | Un mois | `period_start`, `period_end`, `status` (`open → closed → computed → published`) |
| `period_parameters` | **Photo des règles** de la période | part plateforme (en points de base), seuil de qualification (30 s), paliers du prélèvement, règle d'arrondi, version |
| `period_runs` | Chaque exécution du calcul | `period_id`, `run_number`, `created_at`, motif — un recalcul crée un **nouveau run**, il n'écrase rien |
| `user_period_statements` | **Relevé d'un abonné** | `user_id`, `run_id`, montant encaissé, taxes, frais, part plateforme, **part artistes**, secondes totales, montant non réparti (→ pool) |
| `user_period_artist_lines` | Détail d'un relevé | `statement_id`, `artist_id`, `seconds`, `amount_cents` |
| `artist_period_earnings` | Revenus d'un artiste | `artist_id`, `run_id`, brut, **prélèvement progressif**, redistribution de la pool reçue, net |
| `payee_period_lines` | Part de chaque ayant droit après splits | `artist_earning_id`, `payee`, `split_percentage` (copie), `amount_cents` |

La page « où va mon argent » de l'abonné se lit directement dans `user_period_statements` et
`user_period_artist_lines`.

### 7.4 Pool commune et journal comptable

| Entité | Rôle | Champs clés |
|---|---|---|
| `pool_entries` | Mouvements de la pool | `period_id`, sens (entrée / sortie), **nature** (`unallocated`, `artist_levy`, `other_revenue`, `event`, `promotion`, `subscription_discount`, `redistribution`…), `amount_cents`, référence |
| `ledger_accounts` | Comptes | abonnés (encaissements), taxes, frais, plateforme, part artistes, pool commune, dû à chaque artiste |
| `ledger_entries` | Écritures **append-only**, partie double | `transaction_id`, compte, débit/crédit, `amount_cents`, référence — somme des débits = somme des crédits par transaction |

Le **solde d'un portefeuille artiste n'est plus stocké** : il se calcule depuis le journal.
Un compteur modifiable n'est pas auditable.

### 7.5 Droits, splits, paiements

| Entité | Rôle | Champs clés |
|---|---|---|
| `splits` *(existant, à versionner)* | Répartition entre ayants droit | `track_id`, `effective_from`, lignes (artiste ou ayant droit, pourcentage) ; **somme = 100 %** vérifiée à la publication |
| `payout_accounts` | Où payer | identité vérifiée (KYC), pays fiscal, coordonnées du compte de paiement |
| `payouts` *(existant, à étendre)* | Un virement | lien vers le journal, frais, statut, `provider_payout_id` |

---

## 8. Existant → cible

| Table actuelle | Verdict |
|---|---|
| `listening_sessions` | **Étendre** → `plays` (secondes validées, copies figées, qualification, exclusion) |
| `listening_events` | **Garder** comme `play_heartbeats`, avec durée de conservation courte |
| `royalty_periods` | **Garder et étendre** (statut, paramètres, runs) |
| `royalty_allocations` | **Remplacer** : décrit un pot global par morceau/artiste, donc le modèle *pooled* que la page transparency critique. Remplacé par relevés d'abonnés et lignes par artiste |
| `creator_wallets` | **Remplacer** par un solde dérivé du journal |
| `payouts` | **Garder et étendre** |
| `rights`, `splits` | **Garder**, versionner, utiliser à la publication |
| `fraud_events`, `fraud_scores` | **Garder** ; alimentent `plays.counted` |
| `subscriptions` | **Étendre** (lien `plans`) ; ajouter `plans` et `payments` |

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

---

## 10. Transparence : ce que voit chacun

| Qui | Ce qu'il voit |
|---|---|
| **Abonné** | Ce qu'il a payé, les taxes, la part plateforme, la part artistes, et **la liste des artistes qu'il a écoutés** avec les secondes et le montant de chacun |
| **Artiste** | Ses secondes validées et lectures qualifiées, ses revenus bruts, le prélèvement éventuel, la redistribution de la pool, le net ; l'historique de ses paiements |
| **Public** | Les règles en vigueur (part plateforme, seuil de 30 s, paliers), et chaque mois : total encaissé, total versé aux artistes, **état de la pool** (entrées et usages) |

---

## 11. Garde-fous d'intégrité

Issus du contrôle du 9 oct. 2026 (voir le rapport du même jour) :

- **Plus de `on delete cascade`** vers les écoutes, relevés, journal, paiements. Un morceau ou
  un artiste se **retire** (`archived`), il ne se supprime pas.
- **Un morceau publié ne repasse jamais en brouillon**, et la suppression exige
  `published_at is null` (aujourd'hui, un créateur peut publier → brouillon → supprimer).
- **Suppression de compte = anonymisation** : `plays.user_id` passe à `null`, les relevés
  suivent la durée de conservation légale.
- **Périodes closes immuables**, imposé en base (trigger), pas seulement par l'application.
- **Splits** : somme à 100 % vérifiée ; versionnés avec date d'effet ; **copiés** dans
  `payee_period_lines` au calcul.
- **Durée du morceau obligatoire à la publication**, mesurée sur le fichier et non déclarée.
- **Fichiers audio validés** : existence dans le stockage, format réel, taille réelle,
  `checksum` calculé.
- **Publication par un administrateur** (route dédiée), avec qui et quand ; relecture des
  déclarations IA.

---

## 12. Questions ouvertes

| # | Question | Recommandation |
|---|---|---|
| **Q1** | Les 10 $ incluent-ils la **TVA** ? Les frais de transaction sont-ils bien **pris sur la part plateforme** (D4) ? | Calculer les parts sur le montant encaissé **hors taxes**, la taxe n'appartenant à personne. Frais pris sur la part plateforme : les artistes reçoivent 85 % quel que soit le prestataire de paiement. |
| **Q2** | Prélèvement progressif (D6) : **par tranche ou par palier** ? Paliers exacts, **devise**, base de calcul ? (Tu as écrit « dégressif » ; le mécanisme décrit **augmente** avec le revenu, donc c'est un prélèvement *progressif*.) | **Par tranche** (section 4.2). Base : revenu brut mensuel du **compte artiste**, avant splits. Paliers et devise en paramètres de période. |
| **Q3** | Les secondes des lectures de **moins de 30 s** comptent-elles dans le poids ? | **Non** : seules les écoutes qualifiées pèsent. Elles restent enregistrées. |
| **Q4** | **Redistribution du reste de la pool** : quelle règle « cohérente » ? Qui fixe le budget événements / promotions / réductions ? | Budget fixé et **publié avant** chaque période. Le reste est réparti **au prorata des secondes qualifiées totales** de chaque artiste sur la période, après prélèvement du budget. |
| **Q5** | **Réductions d'abonnement financées par la pool** : la part artistes se calcule-t-elle sur le prix payé ou sur le tarif plein ? | Sur le **tarif plein**, la pool couvrant l'écart : les artistes ne subissent pas les promotions (cohérent avec D7). |
| **Q6** | **Essais gratuits** et comptes gratuits : leurs écoutes sont-elles rémunérées ? | Enregistrées, **non rémunérées** tant qu'aucun argent n'est encaissé. |
| **Q7** | **Remboursements et rétrofacturations** | Écriture inverse dans la période suivante ; jamais de modification d'une période close. |
| **Q8** | **Seuil minimum de paiement**, devise unique, rythme des virements | Un seuil à fixer, avec cumul reporté sous le seuil. Une seule devise au départ (le schéma met `USD` par défaut). |
| **Q9** | **Plusieurs appareils, hors ligne** | Un flux simultané par compte (section 6.3). Le hors-ligne, plus tard, avec envoi différé des battements. |
| **Q10** | **Conservation des données** | Battements bruts : courte durée. Lectures : durée à fixer avec un conseil juridique. Relevés et journal : durée d'archivage comptable. |

---

## 13. Étapes de mise en œuvre

1. **Migration corrective « sans regret »** : clés étrangères protégées, garde-fous sur le
   statut des morceaux, colonnes manquantes (section 11). À faire **avant** tout nouvel utilisateur.
2. **Lectures** : table `plays`, routes `POST /plays` et battements, instrumentation du
   lecteur. La bêta commence alors à collecter.
3. **Argent entrant** : `plans`, `payments`, branchement du prestataire de paiement.
4. **Calcul** : paramètres de période, runs, relevés d'abonnés, revenus d'artistes, pool.
5. **Administration** : publication, relecture IA, contrôle fraude.
6. **Journal et virements** : écritures comptables, comptes de paiement, `payouts`.

Les étapes 1 et 2 ne dépendent d'aucune réponse de la section 12. Les étapes 3 à 6 attendent Q1, Q2, Q4 et Q5.
