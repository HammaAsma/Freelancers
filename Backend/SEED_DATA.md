# Données de test (seed)

Au démarrage du backend, des données de test sont insérées en base (hors production).

## Comptes de connexion

| Email            | Mot de passe  | Rôle        |
|-----------------|---------------|-------------|
| admin@test.com  | **Password123!** | Admin (user_id: 1) |
| dev@test.com    | **Password123!** | Dev (user_id: 2)   |

## Données créées

- **User 1 (admin@test.com)** : 5 clients, 4 projets (dont 2 actifs, 1 terminé), 7 tâches, 5 notes, 2 factures ce mois, time entries (dont 1 chrono actif).
- **User 2 (dev@test.com)** : 1 client, 1 projet, 2 tâches, 1 note, 1 facture, time entries.

Pour réinitialiser les données, supprime la base et redémarre le serveur (ou utilise des migrations avec seed).
