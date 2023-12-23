FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install dotenv
RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

CMD [ "npm", "run", "start:dev" ]