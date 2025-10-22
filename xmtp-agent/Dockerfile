FROM node:22-alpine

WORKDIR /app

# Install python and build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache g++ make python3

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Create directory for database files
RUN mkdir -p /app/data

# Run the agent
CMD ["npm", "start"]
