FROM node:24-bookworm-slim
WORKDIR /build
COPY src/front/package.json src/front/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY src/front/ ./
RUN npm exec -- vitest run src/app/core/pedidos/pedido.model.spec.ts
RUN npm run build
CMD ["node", "--version"]
