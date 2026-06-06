# denz-bot

Bot Discord multifonction développé en TypeScript avec [Discord.js](https://discord.js.org/). Il intègre un lecteur de musique complet (YouTube & Spotify), des notifications de live Twitch, des messages de bienvenue/départ, et des outils de modération.

---

## Fonctionnalités

- **Musique** — Lecture YouTube et Spotify, file d'attente, boucle, mélange, contrôle du volume, panneau interactif avec boutons
- **Notifications Twitch** — Alertes en live avec embed personnalisé (photo de profil, miniature du stream, viewers)
- **Bienvenue / Départ** — Embed automatique à l'arrivée et au départ des membres
- **Administration** — Configuration par serveur (salons, streamers), suppression de messages en masse
- **Utilitaires** — Infos serveur, infos membre, statut des streamers, latence

---

## Prérequis

- **Node.js** `>= 20.0.0`
- Un **bot Discord** créé sur le [portail développeur](https://discord.com/developers/applications)
- Des **credentials Twitch** créés sur la [console développeur Twitch](https://dev.twitch.tv/console/apps)
- L'intent **Server Members Intent** activé dans le portail développeur Discord (Bot → Privileged Gateway Intents)

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/ton-user/denz-bot.git
cd denz-bot

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env

# 4. Enregistrer les commandes slash auprès de Discord
npm run deploy

# 5. Lancer le bot
npm run dev        # développement (rechargement automatique)
npm start          # production (après npm run build)
```

---

## Configuration

Créer un fichier `.env` à la racine à partir de `.env.example` :

```env
# Discord — https://discord.com/developers/applications
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=        # Optionnel : pour un enregistrement instantané des commandes en dev

# Twitch — https://dev.twitch.tv/console/apps
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

> **Spotify** — Aucune credential nécessaire. Les liens Spotify sont résolus via le scraping des balises OpenGraph de la page publique, puis recherchés sur YouTube.

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le bot en mode développement avec rechargement automatique (tsx watch) |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npm start` | Lance le bot compilé (`node dist/index.js`) |
| `npm run deploy` | Enregistre les commandes slash auprès de Discord |
| `npm run deploy:clear-global` | Supprime toutes les commandes globales (utile pour nettoyer les doublons) |
| `npm run lint` | Analyse le code avec ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs ESLint |

> Avec `DISCORD_GUILD_ID` défini, `npm run deploy` enregistre les commandes uniquement sur ce serveur (instantané). Sans ce paramètre, l'enregistrement est global et peut prendre jusqu'à **1 heure**.

---

## Commandes

### 🎵 Musique

| Commande | Description |
|---|---|
| `/play <url ou recherche>` | Jouer une musique depuis YouTube, Spotify, ou une recherche texte |
| `/skip` | Passer à la chanson suivante |
| `/stop` | Arrêter la lecture et vider la file d'attente |
| `/loop` | Changer le mode de répétition : aucun → chanson → file entière |
| `/shuffle` | Mélanger aléatoirement la file d'attente |
| `/queue` | Afficher la file d'attente en cours |
| `/nowplaying` | Réafficher le panneau de lecture interactif |
| `/volume [0-100]` | Voir ou modifier le volume de lecture |

Le panneau `/nowplaying` inclut une barre de progression mise à jour toutes les 15 secondes et des boutons **Pause**, **Skip** et **Stop**.

### 🔧 Utilitaire

| Commande | Description |
|---|---|
| `/help` | Afficher toutes les commandes disponibles selon le grade de l'utilisateur |
| `/ping` | Vérifier la latence du bot et de l'API Discord |
| `/streamers` | Voir le statut live des streamers surveillés sur ce serveur |
| `/serverinfo` | Afficher les informations et statistiques du serveur |
| `/userinfo [membre]` | Afficher les informations d'un membre (soi-même si vide) |

### ⚙️ Administration

> Ces commandes sont réservées aux membres ayant la permission **Administrateur**.

| Commande | Description |
|---|---|
| `/config setchannel #salon` | Définir le salon pour les notifications Twitch |
| `/config setwelcome [#salon]` | Définir le salon de bienvenue/départ (vide = désactiver) |
| `/config addstreamer <login>` | Ajouter un streamer Twitch à surveiller |
| `/config removestreamer <login>` | Retirer un streamer de la surveillance |
| `/config list` | Afficher la configuration actuelle du serveur |
| `/config testnotif <login>` | Envoyer un embed de notification de test dans le salon configuré |
| `/clear [nombre]` | Supprimer des messages du salon (tous les récents si vide) |

> `/clear` utilise `bulkDelete` pour les messages de moins de 14 jours (rapide), et une suppression unitaire pour les plus anciens (limitation Discord).

---

## Architecture

```
src/
├── commands/
│   ├── admin/          # config, clear
│   ├── music/          # play, skip, stop, loop, shuffle, queue, nowplaying, volume
│   └── utility/        # ping, help, streamers, serverinfo, userinfo
├── events/             # clientReady, interactionCreate, voiceStateUpdate,
│                       # guildMemberAdd, guildMemberRemove
├── listeners/          # twitchStreamOnline (builder d'embed + envoi)
├── services/
│   ├── music/
│   │   ├── GuildQueue.ts       # État de la file par serveur
│   │   ├── MusicService.ts     # Singleton — gestion de la lecture
│   │   └── nowPlayingEmbed.ts  # Builder d'embed + boutons
│   ├── database.ts     # SQLite (better-sqlite3) — paramètres par serveur
│   ├── spotify.ts      # Résolution des URLs Spotify via scraping OpenGraph
│   ├── twitch.ts       # Polling Twitch API toutes les 60s, singleton
│   └── youtube.ts      # Résolution et streaming via yt-dlp (youtube-dl-exec)
├── utils/
│   └── checkVoice.ts   # Vérification du salon vocal pour les commandes musique
├── config.ts           # Lecture et validation des variables d'environnement
├── types.ts            # Interfaces partagées + augmentation discord.js
├── index.ts            # Point d'entrée — client Discord, chargement dynamique
└── deploy-commands.ts  # Script d'enregistrement des commandes slash
data/
└── guilds.db           # Base de données SQLite (créée au démarrage)
```

**Chargement dynamique** — Les commandes et événements sont chargés automatiquement depuis leurs dossiers. Ajouter une commande revient à créer un fichier dans le bon dossier et relancer `npm run deploy`.

---

## Dépendances principales

| Paquet | Version | Rôle |
|---|---|---|
| `discord.js` | ^14.16.3 | Framework Discord — slash commands, embeds, voice |
| `@discordjs/voice` | ^0.19.2 | Connexions vocales et lecture audio |
| `@discordjs/rest` | ^2.4.0 | Enregistrement des commandes via l'API REST |
| `youtube-dl-exec` | ^3.1.7 | Wrapper yt-dlp — résolution et streaming YouTube/Spotify |
| `@twurple/api` | ^7.2.0 | Client Twitch API |
| `@twurple/auth` | ^7.2.0 | Authentification Twitch (app token) |
| `better-sqlite3` | ^12.10.0 | Base de données SQLite synchrone |
| `ffmpeg-static` | ^5.2.0 | Binaire ffmpeg précompilé pour le transcodage audio |
| `opusscript` | ^0.0.8 | Encodeur Opus (audio Discord) — pur JS, sans compilation native |
| `libsodium-wrappers` | ^0.7.13 | Chiffrement des paquets vocaux Discord |
| `dotenv` | ^16.4.5 | Chargement des variables d'environnement |

### Dépendances de développement

| Paquet | Version | Rôle |
|---|---|---|
| `typescript` | ^5.4.5 | Langage — compilateur TypeScript |
| `tsx` | ^4.10.0 | Exécuteur TypeScript direct (dev watch mode) |
| `eslint` | ^8.57.0 | Linter |
| `@typescript-eslint/*` | ^7.10.0 | Règles ESLint pour TypeScript |
| `@types/*` | — | Définitions de types |

---

## Notes techniques

- **yt-dlp** est téléchargé automatiquement dans `node_modules/youtube-dl-exec/bin/` lors du `npm install`. Il est mis à jour manuellement si YouTube change ses APIs (re-run `npm install youtube-dl-exec@latest`).
- **Spotify** — Discord a fermé les nouvelles inscriptions sur son API développeur. La résolution des liens Spotify passe par le scraping des balises `og:title` / `og:description` de la page publique du morceau, sans aucune credential.
- **Intents privilégiés** — L'intent `Server Members Intent` doit être activé manuellement dans le portail Discord Developer pour que les événements d'arrivée/départ fonctionnent.
- **Limite Discord bulkDelete** — Les messages de plus de 14 jours ne peuvent pas être supprimés en masse (limitation API Discord). `/clear` les supprime un par un avec un délai de 1,1s entre chaque pour respecter le rate limit.

---

## Licence

MIT
