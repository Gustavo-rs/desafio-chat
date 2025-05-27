# Usa imagem oficial do Node
FROM node:18

# Cria diretório da aplicação
WORKDIR /app

# Copia apenas arquivos de dependência primeiro para usar cache do Docker
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia todo o código da aplicação
COPY . .

# Compila TypeScript para JavaScript
RUN npm run build

# Inicia o servidor
CMD ["node", "dist/server.js"]
