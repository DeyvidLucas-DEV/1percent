FROM oven/bun:1.1.42-alpine

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "src/index.ts"]
