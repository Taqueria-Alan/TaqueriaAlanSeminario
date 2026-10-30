FROM node:24-bookworm-slim
WORKDIR /build
COPY src/front/package.json src/front/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY src/front/ ./
RUN npm run build
CMD ["node", "--version"]
