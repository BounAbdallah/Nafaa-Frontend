# Nafaa ERP - Frontend 🎨

Une interface utilisateur moderne, fluide et intuitive pour **Nafaa ERP**. Construite avec **React**, **Vite** et **Tailwind CSS** pour offrir une expérience utilisateur premium.

## 🌟 Fonctionnalités Clés
- **Dashboard Dynamique** : Visualisation en temps réel des statistiques de vente et de stock.
- **Terminal POS (Point de Vente)** : Interface optimisée pour la caisse avec gestion du panier et paiements multiples.
- **Catalogue Produit** : Gestion complète avec support d'images, catégories et alertes de stock bas.
- **CRM Intégré** : Fiches clients détaillées avec historique d'achat et statistiques de dépenses.
- **Responsive Design** : Utilisable sur tablette et ordinateur.

## 🛠️ Stack Technique
- **Core** : React 18 (Hooks, Context)
- **Build Tool** : Vite
- **Styling** : Tailwind CSS (Design System customisé)
- **Icônes** : Lucide React
- **Gestion de Formulaires** : React Hook Form + Zod (Validation)
- **State Management** : Zustand
- **Notifications** : React Hot Toast

## ⚙️ Installation Rapide

1. **Cloner le dépôt**
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   # Modifiez VITE_API_URL pour pointer vers votre backend (ex: http://localhost:8000/api/v1)
   ```
4. **Lancer le développement**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture des Dossiers
- `src/pages` : Pages principales (POS, Products, Customers, etc.).
- `src/components` : Composants UI réutilisables.
- `src/services` : Couche d'abstraction API (Axios).
- `src/store` : Stores Zustand pour l'authentification et les paramètres globaux.
- `src/layouts` : Structures de mise en page (Dashboard, Auth).

---
© 2026 Nafaa ERP.
