# Nom du conteneur
$container_name = "nest"

# Dossier local
$local_folder = ".\prisma\migrations"

# Vérifier si le nom de la migration a été fourni en tant qu'argument
if ($args.Length -eq 0) {
    Write-Host "Veuillez fournir le nom de la migration en tant qu'argument."
    exit 1
}

# Nom de votre migration
$migration_name = $args[0]

# Arrêter le conteneur Docker
docker compose stop app

# Lancer le conteneur Docker
docker compose up --build -d app

# Attendre que le conteneur soit prêt (ajustez le temps d'attente en fonction de vos besoins)
Start-Sleep -Seconds 10

# Récupérer l'ID du conteneur en fonction de son nom
$container_id = docker ps -qf "name=$container_name"

# Vérifier si le conteneur existe
if ($container_id -ne "") {

    if ((Test-Path -Path $local_folder)) {
    # Supprimer le dossier "migrations" s'il existe déjà
    Remove-Item -Path $local_folder -Recurse -Force
    }

    # Création de la migration avec les modifications
    docker exec -it $container_name npx prisma migrate dev --name ${migration_name}

    # Attendre que les conteneurs soient bien éteints
    Start-Sleep -Seconds 10

    # Exécuter un script Bash à l'intérieur du conteneur pour copier les migrations Prisma
    docker cp ${container_id}:app/prisma/migrations $local_folder

    Write-Host "Migrations Prisma copiées avec succès."
} else {
    Write-Host "Aucun conteneur trouvé avec le nom '${container_name}'"
}

# Arrêter le conteneur Docker
docker compose stop

docker compose up
