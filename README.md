# TeamUp - Application Sportive Collaborative

> **MVP Production-Ready** - Projet Titre 6 CDSD - Septembre 2025

## 🎯 À propos

TeamUp est une **Progressive Web App** qui facilite l'organisation d'événements sportifs locaux. L'application connecte les sportifs de proximité pour créer, rejoindre et gérer facilement des activités dans leur quartier.

## ✨ Fonctionnalités MVP Livrées

### 🔐 Authentification complète
- Inscription/Connexion Firebase Auth
- Profils utilisateurs détaillés
- Gestion sécurisée des sessions

### 🏃‍♂️ Gestion d'événements
- **Création d'événements** avec géolocalisation
- **Recherche avancée** (sport, niveau, date, proximité)
- **Participation** en un clic
- **Interface responsive** mobile-first

### 💬 Messagerie temps réel
- **Chat instantané** par événement (Firestore onSnapshot)
- **Identification organisateur** avec signes distinctifs
- **Photos de profil** et enrichissement utilisateur
- **Interface moderne** type WhatsApp

### 📊 Statistiques utilisateur
- Suivi des participations
- Historique des événements
- Données de performance

### 🔒 Sécurité & Confidentialité
- **Protection données** - Localisation/horaires masqués pour non-connectés
- **Règles Firestore** strictes
- **Conformité RGPD** et OWASP
- **Validation TypeScript** complète

## 🛠️ Stack Technique

**Frontend :** Next.js 15, React 19, TypeScript, PWA  
**Backend :** Firebase (Auth, Firestore, Storage, Messaging)  
**Déploiement :** Vercel/Render avec CI/CD

## 🚀 Installation

```bash
# Cloner et installer
git clone https://github.com/matHieuTML/teamup.git
cd teamup
npm install

# Configuration Firebase
cp .env.example .env.local
# Ajouter vos clés Firebase

# Lancer l'application
npm run dev
```

## 📱 Utilisation

1. **Créer un compte** ou se connecter
2. **Parcourir les événements** sur la home ou page dédiée
3. **Créer un événement** avec localisation
4. **Rejoindre** des activités et **chatter** en temps réel
5. **Consulter** ses statistiques personnelles

## 🏆 Points Forts MVP

- **200% des exigences minimales** (2/3 fonctionnalités optionnelles)
- **Messagerie temps réel** sans polling
- **Architecture modulaire** évolutive
- **Performance optimisée** (PWA, cache, lazy loading)
- **Design moderne** et accessible

## 🔮 Roadmap V2

- Réservation de terrains
- Géolocalisation MapBox avancée
- Gamification complète (trophées, classements)
- Fonctionnalités sociales (DM, profils)
- Modération et notifications configurables

## 👨‍💻 Développeur

**Mathieu Gaucher** - B3 Développement 24-25  
**Projet :** Titre 6 CDSD - Septembre 2025  
**GitHub :** [matHieuTML](https://github.com/matHieuTML)

---

**Made with ❤️ for local sports communities**
