FROM node:24-bookworm-slim AS frontend
WORKDIR /build
COPY src/front/package.json src/front/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY src/front/ ./
RUN npm run build
RUN npm exec -- vitest run src/app/core/pedidos/pedido.model.spec.ts --reporter=default --reporter=junit --outputFile.junit=/build/acs-vitest.xml
CMD ["node", "--version"]

FROM scratch AS acs-report
COPY --from=frontend /build/acs-vitest.xml /vitest.xml

FROM frontend AS runtime
