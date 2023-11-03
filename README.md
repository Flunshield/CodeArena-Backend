
# README

Ce document fournit toutes les informations nécessaires pour installer, lancer, et contribuer au projet.


## Section Lancement

Renommer le fichier ``.env.example`` en ``.env``

Pour démarrer l'environnement de développement (assurez-vous que docker soit lancé), exécutez :

```bash
docker compose up
```

## Section commandes utiles

Pour une utilisation efficace du projet, les commandes suivantes sont disponibles :

- Linter le projet :

Pour vérifier et corriger les problèmes de style et de syntaxe dans le code :
```bash
npm run lint
```

- Lancer les Tests Localement :

Pour exécuter les tests unitaires et d'intégration :
```bash
npm run test
```

## Section commit

Les messages de commit doivent suivre des conventions précises pour une meilleure traçabilité et compréhension :

Le message doit être de la forme **type(scope): message** où type peut être feat, fix, etc., et scope représente le contexte du commit.

Exemples de messages de commit valides :

```bash
feat(auth): add login functionality
fix(server): resolve memory leak issue
```

# Bonnes Pratiques

- Documenter un maximum les fonctions créés comme ceci :
```js
/*
* Description de la fonction
 * @param {number} a Le premier nombre.
 * @param {number} b Le second nombre.
 * @returns {number} La somme de a et b.
 */
```

- Gardez votre code aussi simple et direct que possible. Les solutions complexes sont plus difficiles à maintenir et sont plus sujettes aux erreurs.

- Évitez la duplication du code. Utilisez des fonctions, des classes et des modules pour réutiliser le code.

- N'ajoutez pas de fonctionnalité tant qu'elle n'est pas nécessaire. Cela évite la complexité inutile.

- Nommez les variables, les fonctions et les classes de manière à ce qu'elles décrivent leur fonction ou leur usage. Utilisez des commentaires seulement quand c'est nécessaire pour expliquer le "pourquoi" plutôt que le "comment".

- Écrivez des tests unitaires et d'intégration pour votre code. Cela aide à détecter les erreurs tôt et facilite la refonte.

- Gardez vos commits atomiques, c'est-à-dire focalisés sur une seule tâche ou correction.

- Écrivez des messages de commit clairs et descriptifs pour expliquer pourquoi et comment les changements ont été faits.

