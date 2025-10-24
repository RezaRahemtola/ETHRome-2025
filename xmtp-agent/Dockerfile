FROM node:22-slim

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Create directory for database files
RUN mkdir -p /app/data

# Run the agent
CMD ["npm", "start"]
