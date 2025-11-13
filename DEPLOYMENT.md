# Guide de Déploiement - Frontend sur Netlify

Ce guide vous explique comment déployer le frontend Angular sur Netlify (version gratuite).

## Prérequis

1. Un compte Netlify (gratuit) : https://netlify.com
2. Un compte GitHub/GitLab/Bitbucket pour le repository
3. L'URL de votre backend Vercel

## Étapes de Déploiement

### 1. Préparer le Repository

Assurez-vous que votre code est poussé sur GitHub/GitLab/Bitbucket.

### 2. Mettre à jour l'Environnement de Production

Le fichier `src/environments/environment.prod.ts` est déjà configuré avec :

```typescript
apiUrl: 'https://jaaymaa-back.vercel.app/api';
```

Si votre URL Vercel est différente, modifiez cette valeur.

### 3. Créer un Site sur Netlify

#### Option A : Via l'Interface Netlify

1. Connectez-vous à [Netlify](https://netlify.com)
2. Cliquez sur "Add new site" > "Import an existing project"
3. Connectez votre repository GitHub/GitLab/Bitbucket
4. Configurez les paramètres :
   - **Base directory**: `ShopLux`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/shoplux-frontend/browser` ou `dist/jaaymaa-frontend/browser` (selon votre configuration Angular)

#### Option B : Via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
cd ShopLux
netlify init
```

### 4. Variables d'Environnement (Optionnel)

Si vous utilisez des variables d'environnement, ajoutez-les dans :

- Netlify Dashboard > Site Settings > Environment Variables

### 5. Configuration du Build

Le fichier `netlify.toml` est déjà configuré avec :

- Build command: `npm run build`
- Publish directory: `dist/shoplux-frontend/browser`
- Redirections pour SPA (Single Page Application)

### 6. Déployer

1. Netlify détectera automatiquement les changements
2. Le déploiement se fera automatiquement à chaque push sur la branche principale
3. Vous recevrez une URL comme : `https://your-app.netlify.app`

### 7. Mettre à jour le Backend

Une fois que vous avez l'URL Netlify, mettez à jour la variable d'environnement `FRONTEND_URL` dans Vercel :

- Vercel Dashboard > Project Settings > Environment Variables
- Mettez à jour `FRONTEND_URL` avec votre URL Netlify

### 8. Mettre à jour Google OAuth

Dans Google Cloud Console, ajoutez l'URL Netlify :

- **Authorized JavaScript origins**: `https://your-app.netlify.app`

## Configuration du Fichier netlify.toml

Le fichier `netlify.toml` est déjà configuré avec :

- Redirections pour SPA
- Headers de sécurité
- Cache pour les assets statiques

## Limitations de la Version Gratuite

- **Bandwidth**: 100 GB/mois
- **Build minutes**: 300 minutes/mois
- **Sites**: Illimités
- **Concurrent builds**: 1

## Notes Importantes

1. **Build**: Assurez-vous que le build fonctionne localement avant de déployer
2. **API URL**: Vérifiez que `environment.prod.ts` pointe vers votre backend Vercel
3. **CORS**: Le backend doit autoriser votre domaine Netlify dans les CORS

## Dépannage

### Erreur de Build

- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que le build fonctionne localement : `npm run build -- --configuration production`

### Erreur 404 sur les Routes

- Vérifiez que les redirections sont configurées dans `netlify.toml`
- Toutes les routes doivent rediriger vers `/index.html`

### Erreur CORS

- Vérifiez que le backend autorise votre domaine Netlify
- Vérifiez que `FRONTEND_URL` est correctement configuré dans Vercel

### Assets non chargés

- Vérifiez que le `baseHref` est correct dans `angular.json`
- Vérifiez que les chemins des assets sont relatifs
