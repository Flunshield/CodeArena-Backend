FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install dotenv
RUN npm install

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]