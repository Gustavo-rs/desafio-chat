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

# Inicia o servidor com o código já compilado
CMD ["node", "dist/server.js"]
