# Qiwam ERP — Frontend

Bienvenue sur le dépôt Frontend de **Qiwam ERP**, une solution SaaS moderne de gestion d'entreprise conçue pour les artisans, commerçants et prestataires de services.

## 🚀 Technologies Utilisées

- **Framework** : React 19 (Vite)
- **Styling** : Tailwind CSS (Charte graphique Qiwam)
- **Visualisation de Données** : Recharts
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
- `src/components` : Composants UI réutilisables (incluant le nouveau `Logo`).
- `src/services` : Couche d'abstraction API (Axios).
- `src/store` : Stores Zustand pour l'authentification et les paramètres globaux.
- `src/layouts` : Structures de mise en page (Dashboard, Auth).

---
© 2026 Qiwam ERP.
