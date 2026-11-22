# Paiement en ligne des abonnements avec GeniusPay

BoutikBF sait encaisser les abonnements (Essentiel, Pro, mensuel ou annuel) par
Orange Money, Moov Money et MTN grâce à l'agrégateur **GeniusPay** (https://pay.genius.ci).
Tant que les clés ne sont pas configurées, **rien ne change** : le bouton « Payer en ligne »
n'apparaît pas et le paiement manuel par transfert continue de fonctionner.

## Comment ça marche

1. Le propriétaire clique sur « Payer en ligne » (écran de fin d'essai ou page Paramètres).
2. Le **serveur** calcule le montant d'après la formule (jamais le navigateur), crée le paiement
   chez GeniusPay et renvoie le lien de la page de paiement.
3. Le client choisit son opérateur et paie sur la page GeniusPay.
4. GeniusPay prévient BoutikBF (webhook) **et** renvoie le client sur `/paiement/retour`.
5. Dans les deux cas, le serveur **relit le paiement chez GeniusPay avec ses clés secrètes** et ne
   l'active que si le statut est « completed », le montant exact et la référence correspondent.
6. La formule est activée, le paiement est inscrit au registre des abonnements (onglet
   Abonnements d'une boutique) et visible dans **Super admin > Paiements**.

Une notification falsifiée ou rejouée ne peut donc rien activer. Deux chemins indépendants
(notification et page de retour) activent la formule : si l'un échoue, l'autre prend le relais.

## Mise en route (une seule fois)

### 1. Base de données
Dans Supabase > SQL Editor, copier et lancer **tout** le fichier
`supabase/APPLIQUER_PAIEMENTS_EN_LIGNE.sql` (peut être relancé sans risque).
Ces tables et fonctions ne sont accessibles qu'au serveur, jamais depuis un navigateur.

### 2. Compte GeniusPay
- Créer le compte marchand sur https://pay.genius.ci et faire valider le dossier (KYC).
- Dans le tableau de bord développeur, relever la clé **publique** (`pk_...`) et la clé **secrète**
  (`sk_...`). Commencer avec les clés **sandbox** (`pk_sandbox_...`).
- **Confirmer par écrit avec GeniusPay** : les frais exacts pour le Burkina Faso (l'API renvoie
  les frais de chaque paiement et BoutikBF les enregistre), et la couverture Orange Money,
  Moov Money et MTN au Burkina. Wave n'est pas disponible au Burkina : ne pas l'annoncer.

### 3. Notification (webhook)
Dans GeniusPay > Webhooks, ajouter :
- URL : `https://VOTRE-SITE/api/webhooks/geniuspay`
- Événements : `payment.success`, `payment.failed`, `payment.cancelled`, `payment.refunded`,
  `payment.expired`
- Noter le secret `whsec_...` affiché **une seule fois**.

### 4. Variables d'environnement (Vercel > Settings > Environment Variables)
| Variable | Valeur |
|---|---|
| `GENIUSPAY_API_KEY` | clé publique `pk_...` |
| `GENIUSPAY_API_SECRET` | clé secrète `sk_...` |
| `GENIUSPAY_WEBHOOK_SECRET` | secret `whsec_...` |
| `SITE_URL` | adresse publique du site, sans « / » final |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | déjà utilisées par l'application |

Puis redéployer. Ne **jamais** mettre ces clés dans le code, dans un fichier commité, ni les
envoyer par message.

## Tester avant de passer en réel

1. Sur un déploiement de **test** (Preview), mettre les clés **sandbox** et
   `GENIUSPAY_ALLOW_SANDBOX=1`.
2. Faire un paiement test : la formule d'une boutique de test doit s'activer, et le paiement
   apparaître dans Super admin > Paiements avec l'étiquette « test ».
3. En **production**, ne **jamais** mettre `GENIUSPAY_ALLOW_SANDBOX`. Même avec une clé de test
   par erreur, un paiement de test n'activera alors aucune vraie formule.

## Passage en réel : liste de contrôle

- [ ] Fichier SQL lancé dans Supabase
- [ ] Clés **live** (`pk_live_...`, `sk_live_...`) et secret du webhook mis sur Vercel (Production)
- [ ] `SITE_URL` = l'adresse publique réelle
- [ ] Webhook créé avec l'adresse de **production**
- [ ] Un vrai paiement de 200 F (minimum GeniusPay) fait avec un vrai numéro, puis vérifié dans
      Super admin > Paiements
- [ ] Frais réels notés et prix éventuellement ajustés

## Si un paiement reste « en attente »
Ouvrir Super admin > Paiements et cliquer sur **Vérifier** : le serveur relit le paiement chez
GeniusPay et applique le résultat.

## Limites connues
- **Fin d'abonnement** : la date de fin est enregistrée au registre, mais rien ne rétrograde
  automatiquement une boutique dont l'abonnement est arrivé à son terme. Aujourd'hui c'est le
  super admin qui le fait. À automatiser avant d'avoir beaucoup de clients.
- **Frais** : GeniusPay prélève ses frais sur le montant reçu. Le client paie le prix affiché,
  BoutikBF reçoit le montant moins les frais.
- **Remboursement** : un remboursement est signalé dans Super admin > Paiements mais ne
  rétrograde pas la formule : à traiter à la main.
- **Signature des notifications** : la vérification suit la documentation GeniusPay (HMAC-SHA256
  de `horodatage.corps`) et accepte les variantes d'écriture JSON connues. Si une notification
  réelle était refusée, la page de retour et le bouton « Vérifier » continuent d'activer les
  paiements, en toute sécurité.
