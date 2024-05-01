
# README

Ce document fournit toutes les informations nécessaires pour installer, lancer, et contribuer au projet.


## Section Lancement

Renommer le fichier ``.env.example`` en ``.env``

Puis lancer la commande : **A lancer depuis la racine du projet**
```bash
npm install

docker compose up --build

docker exec -it nest npx prisma migrate deploy
```

Pour alimenter la bdd, vous pouvez utiliser les requetes SQL se trouvant dans :
**script/requeteSql/script**

## Section commandes utiles

Pour une utilisation efficace du projet, les commandes suivantes sont disponibles :

- Linter le projet :

Pour vérifier et corriger les problèmes de style et de syntaxe dans le code :
```bash
npm run lint
```

- Lancer les Tests Localement :

Pour exécuter les tests end 2 end :
```bash
npm run test:e2e
```

## Section Prisma

Pas d'injection SQL grâce à prisma.

**Video youtube a regarder**
```
https://www.youtube.com/watch?v=akP9E1vURBU&ab_channel=AKDEV
```

Pour créer une migration après avoir modifier le fichier **schema.prisma** (docker compsoe lancé)
```bash
docker exec -it nest npx prisma migrate dev --create-only --name nom-de-la-migration
```

Pour récupérer le dossier migration depuis le container
```bash
docker cp nest:/usr/src/app/prisma/migrations ./prisma
```

Pour généré les migrations non joué (a utiliser si il y a de nouvelles migrations) :
```bash
docker exec -it nest npx prisma migrate deploy
```

APRES AVOIR Jouer les migrations :
```bash
docker compose down
npx prisma generate
docker compose up --build
```

Pour lancer prisma studio (Port par défault 5555) :
```bash
npx prisma studio
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

- Penser à créer un fichier .ts dans le dossier entity lorsque vous créer une nouvelle table dans la base de donnée.
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

