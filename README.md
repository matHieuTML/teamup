# TeamUp - Application sportive collaborative

![TeamUp Logo](public/teamup-logo.svg)

## 📋 À propos du projet

TeamUp est une Progressive Web App (PWA) qui facilite l'organisation d'événements sportifs locaux. L'application permet aux utilisateurs de créer, rejoindre et gérer facilement des activités sportives dans leur quartier, favorisant ainsi le lien social et la pratique sportive de proximité.

### 🎯 Objectifs
- **Encourager le sport local** de manière libre et spontanée
- **Renforcer les liens sociaux** au sein des quartiers
- **Supprimer les freins** à l'organisation d'événements sportifs
- **Offrir une plateforme éco-conçue** et accessible

## 🛠️ Stack technique

### Frontend
- **Next.js 15+** avec App Router
- **React 19** avec TypeScript
- **PWA** avec Service Workers
- **CSS Modules** (éco-conçu, sans framework)

### Backend
- **Next.js API Routes** (serverless)
- **Firebase Firestore** (base NoSQL)
- **Firebase Auth** (authentification)
- **Firebase Cloud Messaging** (notifications)

### Déploiement
- **Vercel/Render** (hébergement)
- **Git Actions** (CI/CD)
- **SSL/HTTPS** automatique

## 🏗️ Architecture

```
/src
  /app                    # App Router Next.js 13+
    /api                  # API Routes backend
    /dashboard           # Interface utilisateur connecté
    /events              # Gestion événements
    /profile             # Profil utilisateur
  /components            # Composants réutilisables
    /ui                  # Composants de base
    /features            # Fonctionnalités métier
  /lib                   # Configuration & utilitaires
  /types                 # Types TypeScript
```

## 🚀 Fonctionnalités MVP

### ✅ Version actuelle
- [x] Architecture projet et types TypeScript
- [x] Configuration Next.js + PWA
- [x] Structure modulaire organisée
- [ ] Authentification Firebase
- [ ] CRUD Événements
- [ ] Messagerie temps réel
- [ ] Géolocalisation
- [ ] Notifications push

### 📅 Roadmap V2
- API réservation terrains
- Dashboard administrateur
- Statistiques avancées
- Mode hors ligne étendu

## 🏃‍♂️ Démarrage rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Firebase (gratuit)

### Installation
```bash
# Cloner le repository
git clone https://github.com/matHieuTML/teamup.git
cd teamup

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Remplir avec vos clés Firebase

# Lancer en développement
npm run dev
```

### Configuration Firebase
1. Créer un projet Firebase
2. Activer Authentication (Email/Password)
3. Créer une base Firestore
4. Activer Cloud Messaging
5. Copier les clés dans `.env.local`

## 📱 Développement

### Scripts disponibles
```bash
npm run dev        # Serveur de développement avec Turbopack
npm run build      # Build optimisé pour production
npm run start      # Serveur de production
npm run lint       # Vérification ESLint
```

### Standards de code
- **TypeScript strict** activé
- **ESLint + Prettier** pour la cohérence
- **Commits conventionnels** (feat:, fix:, docs:)
- **Tests** avec Jest + Testing Library

## 🌍 Éco-conception

TeamUp respecte les principes de sobriété numérique :
- **SSR/ISR** pour performances optimales
- **Images WebP** et lazy loading
- **Cache intelligent** (SWR)
- **Bundle optimisé** (<150KB initial)
- **PWA** pour réduire l'impact environnemental

## 🔒 Sécurité & RGPD

- **Authentification Firebase** sécurisée
- **Validation Zod** client/serveur
- **Données minimales** collectées
- **Consentement** explicite utilisateur
- **Export de données** sur demande

## 👥 Contribution

Ce projet suit la méthodologie Agile avec des sprints de 1-1,5 semaine :

1. **Sprint 1** : ✅ Base technique et architecture
2. **Sprint 2** : 🔄 Authentification et événements
3. **Sprint 3** : ⏳ Messagerie et notifications
4. **Sprint 4** : ⏳ Tests et finalisation MVP

### Guidelines
- Consulter `/memory_bank/coding_standards.md`
- Tests obligatoires pour nouvelles fonctionnalités
- Reviews de PR avant merge
- Documentation mise à jour

## 📞 Contact & Support

- **Développeur** : Mathieu Gaucher (B3 Dev 24-25)
- **GitHub** : [matHieuTML](https://github.com/matHieuTML)
- **Projet** : Titre 6 CDSD - Septembre 2025

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Made with ❤️ for local sports communities**
