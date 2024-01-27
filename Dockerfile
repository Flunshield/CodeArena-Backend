FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install dotenv
RUN npm ci

COPY . .

# Renommer le fichier dans l'image
RUN mv /app/.env-docker /app/.env

RUN npm run build
RUN npx prisma generate

EXPOSE 3000

CMD [ "npm", "run", "start:dev" ]
