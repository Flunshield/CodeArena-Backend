#!/bin/bash

# Nom du conteneur
container_name="nest"

# Dossier local
local_folder="./prisma/migrations"

# Vérifier si le nom de la migration a été fourni en tant qu'argument
if [ $# -eq 0 ]; then
    echo "Veuillez fournir le nom de la migration en tant qu'argument."
    exit 1
fi

# Nom de votre migration
migration_name=$1

# Arrêter le conteneur Docker
docker-compose stop

# Lancer le conteneur Docker
docker-compose up --build -d app

# Attendre que le conteneur soit prêt (ajustez le temps d'attente en fonction de vos besoins)
sleep 10

# Récupérer l'ID du conteneur en fonction de son nom
container_id=$(docker ps -qf "name=$container_name")

# Vérifier si le conteneur existe
if [ -n "$container_id" ]; then
    # Création de la migration avec les modifications
    docker exec -it $container_name bash -c "npx prisma migrate dev --name ${migration_name}"

    # Supprimer le dossier "migrations" s'il existe déjà
    rm -rf $local_folder

    # Exécuter un script Bash à l'intérieur du conteneur pour copier les migrations Prisma
    docker cp "${container_id}":/app/prisma/migrations $local_folder

    echo "Migrations Prisma copiées avec succès."
else
    echo "Aucun conteneur trouvé avec le nom '$container_name'"
fi

# Arrêter le conteneur Docker
docker-compose stop

docker-compose up
