#!/bin/bash

# Nom du conteneur
container_name="nest"

# Dossier local
local_folder="./prisma"

# Installer les dépendances npm
npm install

# Supprimer le dossier "migrations" s'il existe déjà
if [ -d "$local_folder/migrations" ]; then
    rm -rf "$local_folder/migrations"
fi

# Construire et démarrer les conteneurs Docker avec Docker Compose
docker compose build
docker compose up -d

# Attendre que les conteneurs soient prêts, notamment mariadb qui prend du temps
sleep 30

# Récupérer l'ID du conteneur en fonction de son nom
container_id=$(docker ps -qf "name=$container_name")

if [ ! -z "$container_id" ]; then
    # Création de la migration avec les modifications
    docker exec -it $container_name npx prisma migrate dev --name Init

    # Attendre que les conteneurs soient bien éteints
    sleep 10

    # Exécuter un script Bash à l'intérieur du conteneur pour jouer les migrations Prisma
    docker cp ${container_id}:app/prisma/migrations "$local_folder"
    echo "Migrations Prisma copiées avec succès."
else
    echo "Aucun conteneur trouvé avec le nom '${container_name}'"
fi

# Arrêter les conteneurs Docker avec Docker Compose
docker compose stop

# Attendre que les conteneurs soient bien éteints
sleep 10

# Redémarrer les conteneurs Docker avec Docker Compose
docker compose up -d

# Attendre que les conteneurs soient bien démarrés
sleep 10
