FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install dotenv
RUN npm ci

# Copy the rest of the application files
COPY . .

# Installer les dépendances WebSocket
RUN npm install @nestjs/websockets

# Build the application#
RUN npx prisma generate

# Command to run your application
CMD ["npm", "run", "start:dev"]
