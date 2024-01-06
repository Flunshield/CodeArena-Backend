#!/bin/bash

# Installer les dépendances npm
npm install

# Construire et démarrer les conteneurs Docker avec Docker Compose
docker compose build

docker compose up -d

# Attendre que les conteneurs soient prêts
sleep 20

# Exécuter une commande dans le conteneur Docker (bash dans cet exemple)
docker exec -it nest bash -c "npx prisma migrate dev"

docker compose stop

# Attendre que les containers soient bien etteint
sleep 10

docker compose up


