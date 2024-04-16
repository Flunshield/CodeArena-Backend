# Nom du conteneur
$container_name = "nest"

# Dossier local
$local_folder = ".\prisma"

# Installer les dépendances npm
npm install

if ((Test-Path -Path ".\prisma\migrations")) {
    # Supprimer le dossier "migrations" s'il existe déjà
    Remove-Item -Path ".\prisma\migrations" -Recurse -Force
}

# Construire et démarrer les conteneurs Docker avec Docker Compose
docker compose build
docker compose up -d

# Attendre que les conteneurs soient prêts, notamment mariadb qui prend du temps
Start-Sleep -Seconds 30

# Récupérer l'ID du conteneur en fonction de son nom
$container_id = docker ps -qf "name=$container_name"


if ($container_id -ne "") {
        # Création de la migration avec les modifications
        docker exec -it $container_name npx prisma migrate dev --name Init
    
        # Attendre que les conteneurs soient bien éteints
        Start-Sleep -Seconds 10
    
        # Exécuter un script Bash à l'intérieur du conteneur pour jouer les migrations Prisma
        docker cp ${container_id}:app/prisma/migrations ".\prisma"
        Write-Host "Migrations Prisma copiées avec succès."
} else {
    Write-Host "Aucun conteneur trouvé avec le nom '${container_name}'"
}

# Arrêter les conteneurs Docker avec Docker Compose
docker compose stop

# Attendre que les conteneurs soient bien éteints
Start-Sleep -Seconds 10

# Redémarrer les conteneurs Docker avec Docker Compose
docker compose up -d

# Attendre que les conteneurs soient bien démarrés
Start-Sleep -Seconds 10
