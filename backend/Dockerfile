# Dockerfile
FROM node:18

WORKDIR /app

# Copia apenas os arquivos de dependência primeiro para usar o cache de build
COPY package*.json ./

# Instala dependências (inclui @prisma/client e prisma)
RUN npm install

# Copia o restante do código
COPY . .

# Gera o Prisma Client (necessário para rodar depois)
RUN npx prisma generate

# Compila o projeto TypeScript
RUN npm run build

# Expõe a porta (ajuste se necessário)
EXPOSE 3000

# Cria script de inicialização que configura o banco e depois inicia o servidor
RUN echo '#!/bin/bash\necho "🗄️ Setting up database..."\nnpx prisma db push --accept-data-loss\necho "✅ Database ready!"\necho "🚀 Starting server..."\nnode dist/server.js' > /app/start.sh
RUN chmod +x /app/start.sh

# Inicia com o script que roda migrações primeiro
CMD ["/app/start.sh"]
