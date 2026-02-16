# Projet Freelancer — Gestion de tâches, temps et facturation

Application web full-stack pour gérer des projets, tâches, temps passé (chronomètre) et facturation. Un utilisateur peut créer des clients, des projets, des tâches, enregistrer le temps par tâche et générer des factures (PDF).

---

## Stack technique

| Couche      | Technologies |
|------------|--------------|
| **Frontend** | React 19, Vite 7, React Router 7, Axios, Tailwind CSS, DaisyUI, Lucide React, React Hook Form + Zod |
| **Backend**  | Node.js, Express 5, ESM (modules natifs) |
| **Base de données** | MySQL 8 (Sequelize 6, dialect `mysql2`) |
| **Auth**     | JWT (access + refresh tokens), bcryptjs |
| **Docs API** | Swagger (swagger-jsdoc, swagger-ui-express) |

---

## Architecture du projet

```
Hamma-Asma/
├── Backend/                 # API REST Node.js
│   ├── src/
│   │   ├── app.js           # Point d'entrée Express, middlewares, montage des routes
│   │   ├── config/          # Configuration (db, variables d'environnement)
│   │   ├── controllers/     # Contrôleurs (auth, dashboard, invoice, task, timeEntry, etc.)
│   │   ├── middlewares/     # Auth JWT, logger, errorHandler
│   │   ├── models/         # Modèles Sequelize (User, Client, Project, Task, Invoice, InvoiceItem, TimeEntry, Note, RefreshToken)
│   │   ├── routes/         # Définition des routes par ressource
│   │   ├── services/       # Logique métier (auth, timeEntry, invoice, etc.)
│   │   ├── utils/          # Helpers (JWT)
│   │   └── validators/     # Règles express-validator
│   ├── iniDb.js            # Création BDD, sync Sequelize, associations, seed
│   ├── package.json
│   └── .env                # Variables d'environnement (non versionné)
│
├── frontend/                # SPA React
│   ├── src/
│   │   ├── api/             # Client Axios (baseURL, intercepteur JWT), helpers auth
│   │   ├── auth/            # useAuth (contexte auth, login/logout)
│     │   ├── components/   # Header, Sidebar, FloatingTimer, composants dashboard
│   │   ├── contexts/       # TimerContext (chrono global)
│   │   ├── hooks/          # useDashboard
│   │   ├── pages/          # Login, Register, Dashboard, Tasks, Projects, Clients, Factures, Notes, AccountSettings
│   │   ├── App.jsx, main.jsx, routes.jsx
│   │   └── index.css       # Tailwind + thème DaisyUI
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Modèles de données (Backend)

- **User** : compte (email, mot de passe hashé, rôle), lié à clients, projets, factures.
- **Client** : nom, type, contact, adresse de facturation ; lié à un User et à des Projets / Factures.
- **Project** : nom, statut (actif, terminé, etc.), client, user ; contient des tâches.
- **Task** : titre, description, statut (todo, in_progress, in_review, completed), priorité, estimation (heures), projet.
- **TimeEntry** : session de temps (task_id, user_id, start_time, duration, is_running) ; une seule session en cours par utilisateur.
- **Invoice** : facture (client, projet optionnel, numéro, dates, statut, totaux HT/TVA/TTC, devise).
- **InvoiceItem** : ligne de facture (description, Nb_heure, unit_price, total, lien task/projet).
- **Note** : notes utilisateur (liées au user).
- **RefreshToken** : tokens de rafraîchissement JWT.

Les associations (User ↔ Client, Project ↔ Task, Invoice ↔ InvoiceItem, Task ↔ TimeEntry, etc.) sont configurées dans `Backend/iniDb.js`.

---

## API (Backend)

- **Base URL** : `http://localhost:8000/api`
- **Authentification** : en-tête `Authorization: Bearer <accessToken>`.
- **Documentation** : au lancement du serveur, Swagger est disponible sur `http://localhost:8000/api-docs`.

Principaux groupes de routes :

| Préfixe | Description |
|--------|-------------|
| `POST /api/auth/register`, `POST /api/auth/login` | Inscription, connexion |
| `POST /api/refresh-token` | Renouvellement du token d’accès |
| `GET/POST /api/users/...` | Gestion utilisateurs |
| `GET/POST/PUT/DELETE /api/clients` | Clients |
| `GET/POST/... /api/projects/...` | Projets |
| `GET/POST/... /api/projects/:projectId/tasks` | Tâches d’un projet |
| `POST /api/tasks/:taskId/time/start`, `POST .../time/stop` | Démarrage / arrêt du chrono par tâche |
| `GET /api/tasks/:taskId/time/total` | Temps total (cumulé) pour une tâche |
| `GET /api/time-entries/active` | Chrono actif (optionnel `project_id`) |
| `GET/POST/... /api/invoices`, `GET .../:id/download` | Factures et téléchargement PDF |
| `GET/POST/... /api/invoices/:invoiceId/items` | Lignes de facture |
| `GET /api/dashboard/...` | Données dashboard (stats, tâches récentes, etc.) |

Réponses typiques : `{ success: true, data: ..., pagination?: ... }`. Erreurs : `{ success: false, message: "..." }` avec codes HTTP adaptés (404 pour « Facture non trouvée », etc.).

---

## Frontend (React)

- **Routing** : React Router. Routes publiques : `/login`, `/register`. Routes protégées sous `/dashboard` (clients, projects, projects/:projectId/tasks, factures, notes, settings). Redirection `/` → `/dashboard`.
- **Auth** : Contexte `useAuth` (user, login, logout). Token stocké en `localStorage` ; le client Axios attache `Authorization: Bearer <token>` à chaque requête.
- **Chrono** : `TimerContext` (tâche active, secondes totales, base). `FloatingTimer` : panneau déplaçable (position en localStorage), visible sur le dashboard et la page tâches ; démarrage/arrêt du chrono et affichage du temps cumulé.
- **Pages principales** : Dashboard (vue d’ensemble, cartes stats), Liste des tâches par projet (colonnes titre, statut, priorité, estimation, **temps affiché**, actions Start/Stop, stats, édition, suppression), Clients, Projets, Factures (liste, détail, téléchargement PDF), Notes, Paramètres compte.
- **UI** : Tailwind + DaisyUI, composants (Header, Sidebar, cartes dashboard), formulaire de login/register avec validation.

---

## Prérequis

- **Node.js** 18+ (recommandé 20+)
- **MySQL** 8 (serveur local ou distant)
- **npm** (ou yarn/pnpm)

---

## Installation et démarrage

### 1. Backend

```bash
cd Backend
npm install
```

Créer un fichier `.env` à la racine de `Backend/` avec au minimum :

```env
PORT=8000
HOST=localhost
DB_USER=root
PASSWORD=votre_mot_de_passe_mysql
DATABASE=db_freelancer
DIALECT=mysql
PORT_DATABASE=3306
JWT_SECRET=une_cle_secrete_longue_et_aleatoire
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=autre_cle_secrete_refresh
JWT_REFRESH_EXPIRES_IN=7d
```

Au premier démarrage, `iniDb.js` crée la base si elle n’existe pas, synchronise les tables et exécute le seed (données de test). Voir `Backend/SEED_DATA.md` pour les comptes de test.

```bash
npm start
```

Le serveur écoute sur `http://localhost:8000`. Documentation Swagger : `http://localhost:8000/api-docs`. Health check : `GET http://localhost:8000/health`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

L’app est servie en dev sur `http://localhost:5173` (Vite). L’API est appelée sur `http://localhost:8000/api` (configurable dans `frontend/src/api/client.js`).

### 3. Build de production (frontend)

```bash
cd frontend
npm run build
```

Les fichiers statiques sont générés dans `frontend/dist/`. En production, il faut servir cette build et faire pointer l’API (variable d’environnement ou `baseURL`) vers l’URL réelle du backend.

---

## Sécurité et bonnes pratiques

- **CORS** : configuré pour une origine (ex. `http://localhost:5173` en dev).
- **Helmet** : en-têtes HTTP sécurisés.
- **Rate limiting** : global sur `/api/` ; limite stricte sur login/register.
- **Validation** : express-validator côté backend ; schémas Zod + React Hook Form côté frontend pour les formulaires sensibles.
- **Mots de passe** : hashés avec bcryptjs ; jamais stockés en clair.
- **JWT** : access token court (ex. 15 min), refresh token plus long (ex. 7 j) ; renouvellement via `POST /api/refresh-token`.

---

## Tests (Backend)

```bash
cd Backend
npm test
```

Environnement de test : `NODE_ENV=test`, avec configuration dédiée si nécessaire (base de test, secrets de test).

---

## Résumé technique

- **Backend** : API REST Express 5 (ESM), MySQL via Sequelize, JWT + refresh, rate limit, Swagger, seed au démarrage.
- **Frontend** : SPA React 19 (Vite), routing et auth par contexte, chrono global (TimerContext + FloatingTimer), affichage du temps par tâche et téléchargement de factures PDF.
- **Fonctionnalités clés** : gestion clients/projets/tâches, suivi du temps (start/stop, temps total par tâche), dashboard, facturation et génération PDF.

Pour plus de détails sur les données de test, voir `Backend/SEED_DATA.md`.
