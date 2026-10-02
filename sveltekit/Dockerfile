# Pin the image to a specific version to avoid update breakages.
ARG NODE="node:26.4-alpine3.24"

# Build Stage
FROM ${NODE} AS builder

WORKDIR /app

COPY . /app

# Package to set timezone
RUN apk add --no-cache tzdata

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

RUN npm run build

# Docs Stage
FROM ${NODE} AS docs
RUN apk add --no-cache doxygen graphviz python3
WORKDIR /app
COPY Doxyfile doxygen_svelte_filter.py ./
COPY src ./src
RUN doxygen Doxyfile

# Dev Stage
FROM ${NODE} AS dev

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY . /app

EXPOSE 3000

CMD ["npm", "run", "dev"]


# Run Stage
FROM ${NODE} AS runner

RUN npm install -g tsx

WORKDIR /app

# Set timezone to Paris
COPY --from=builder /usr/share/zoneinfo/Europe/Paris /usr/share/zoneinfo/Europe/Paris
RUN ln -s /usr/share/zoneinfo/Europe/Paris /etc/localtime

COPY --from=builder /app/build /app
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/src /app/src
COPY server.ts /app/server.ts

CMD ["npx", "tsx", "server.ts"]
