# Chat em Tempo Real

Uma aplicação de chat moderna e responsiva construída com React, Node.js, Socket.io e Redis. O projeto oferece comunicação em tempo real, gerenciamento de salas, upload de arquivos e muito mais.

> **Nota:** Este é um projeto de desafio técnico, portanto as configurações de ambiente já estão incluídas no repositório para facilitar a execução e avaliação.

**Desenvolvido por:** [Gustavo](https://github.com/Gustavo-rs)

## 🚀 Funcionalidades

### Chat em Tempo Real
- Mensagens instantâneas com Socket.io
- Indicador de digitação
- Status de usuários online
- Notificações de mensagens não lidas

### Gerenciamento de Salas
- Criação e exclusão de salas
- Sistema de permissões (Admin/Membro)
- Adição e remoção de membros
- Detalhes da sala com estatísticas

### Mensagens
- Envio de texto com suporte a Markdown
- Upload de múltiplos arquivos (imagens e documentos)
- Edição e exclusão de mensagens
- Preview de links automático
- Histórico paginado

### Autenticação
- Sistema de login/registro
- Autenticação via JWT com cookies
- Proteção de rotas

### Interface
- Design responsivo para mobile e desktop
- Tema moderno com Tailwind CSS
- Componentes reutilizáveis com shadcn/ui
- Experiência de usuário otimizada

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderna
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de interface
- **Socket.io Client** - Comunicação em tempo real
- **React Router** - Roteamento
- **Zustand** - Gerenciamento de estado
- **React Markdown** - Renderização de markdown

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Socket.io** - WebSocket para tempo real
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Multer** - Upload de arquivos
- **Zod** - Validação de dados

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Docker](https://www.docker.com/) (para PostgreSQL e Redis)
- [Git](https://git-scm.com/)

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/Gustavo-rs/desafio-chat
cd desafio-chat
```

### 2. Configuração do Backend

```bash
cd backend
npm install
```

#### Configuração do Banco de Dados

1. Inicie os serviços PostgreSQL e Redis com Docker:
```bash
docker-compose up -d
```
> O Docker Compose criará automaticamente o banco de dados PostgreSQL, mas as tabelas serão criadas pelo Prisma no próximo passo.

2. As variáveis de ambiente já estão configuradas no arquivo `.env` do projeto:
```env
# Database (configurado para usar o container Docker)
DATABASE_URL="postgresql://chatuser:chatpass@localhost:5432/chatdb"

# JWT
JWT_SECRET="seu_jwt_secret_muito_seguro_aqui"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Server
PORT="3001"
NODE_ENV="development"

# Frontend URL
BASE_URL_FRONTEND="http://localhost:5173"
```

3. Crie as tabelas do banco de dados com Prisma:
```bash
npx prisma db push
npx prisma generate
```
> Este comando aplicará o schema do Prisma ao banco de dados, criando todas as tabelas necessárias (users, rooms, messages, etc.).

### 3. Configuração do Frontend

```bash
cd ../frontend
npm install
```

As variáveis de ambiente já estão configuradas no arquivo `.env` do projeto:
```env
VITE_API_URL=http://localhost:3001
```

### 4. Configuração dos Serviços

Os serviços PostgreSQL e Redis já foram iniciados no passo 2.1 com o Docker Compose.

Para verificar se estão rodando:
```bash
# Verificar PostgreSQL
docker ps | grep postgres

# Verificar Redis
docker ps | grep redis
```

## 🚀 Executando o Projeto

### Desenvolvimento

1. **Inicie o backend:**
```bash
cd backend
npm run dev
```
O servidor estará disponível em `http://localhost:3001`

2. **Inicie o frontend:**
```bash
cd frontend
npm run dev
```
A aplicação estará disponível em `http://localhost:5173`

## 🎯 Decisões Arquitetônicas

### Tecnologias Escolhidas

**Backend:**
- **Node.js + Express** - Escolhido pela maturidade e amplo ecossistema
- **Socket.io** - Solução robusta para WebSocket com fallbacks automáticos
- **Prisma + PostgreSQL** - ORM type-safe com banco relacional para consistência de dados
- **Redis** - Cache em memória para sessões e otimização de performance
- **TypeScript** - Tipagem estática para maior confiabilidade do código

**Frontend:**
- **React 18** - Biblioteca moderna com excelente performance
- **Vite** - Build tool rápida para desenvolvimento ágil
- **Tailwind CSS + shadcn/ui** - Design system consistente e responsivo
- **Zustand** - Gerenciamento de estado simples e eficiente

### Escalabilidade e Performance

**Comunicação em Tempo Real:**
- Implementação de rooms do Socket.io para segmentação eficiente
- Sistema de typing indicators otimizado
- Controle de usuários online por sala

**Otimizações Implementadas:**
- Paginação de mensagens para reduzir carga inicial
- Cache Redis para sessões e dados frequentes
- Rate limiting para prevenir spam e ataques
- Lazy loading de componentes React

**Arquitetura Distribuída:**
- Separação clara entre frontend e backend
- API RESTful para operações CRUD
- WebSocket para comunicação em tempo real
- Containerização com Docker para deploy

## 🚀 Funcionalidades Implementadas

### ✅ Requisitos Básicos
- [x] Sistema de chat em tempo real
- [x] Criação e gerenciamento de salas
- [x] Autenticação de usuários (login/registro)
- [x] Interface responsiva inspirada no Discord
- [x] TypeScript em todo o projeto

### ✅ Funcionalidades Avançadas
- [x] **Mensagens Enriquecidas:**
  - Upload de múltiplos arquivos (imagens, documentos)
  - Renderização de Markdown
  - Preview automático de links
  - Edição e exclusão de mensagens

- [x] **Notificações em Tempo Real:**
  - Indicador de mensagens não lidas
  - Notificações de typing
  - Status de usuários online
  - Alertas de entrada/saída de membros

- [x] **Persistência e Histórico:**
  - Histórico completo de mensagens por sala
  - Sistema de paginação eficiente
  - Armazenamento organizado de arquivos por data

- [x] **Gerenciamento de Salas:**
  - Sistema de permissões (Admin/Membro)
  - Adição/remoção de membros
  - Estatísticas da sala
  - Controle de acesso

### 🔧 Aspectos Técnicos Avançados

**Segurança:**
- Autenticação JWT com cookies httpOnly
- Validação de dados com Zod
- Rate limiting por IP e usuário
- Sanitização de uploads de arquivos

**Performance:**
- Otimização de queries do banco de dados
- Cache inteligente com Redis
- Compressão de assets
- Lazy loading de componentes

**Monitoramento:**
- Logs estruturados
- Métricas de performance
- Health checks para serviços

## 📊 Testes de Performance

### Métricas Implementadas
- Tempo de resposta das APIs
- Latência do WebSocket
- Throughput de mensagens por segundo
- Uso de memória e CPU

## 🎨 Interface e UX

### Design System
- Componentes reutilizáveis com shadcn/ui
- Tema consistente e moderno
- Animações suaves e responsivas
- Acessibilidade (ARIA labels, navegação por teclado)

### Experiência Mobile
- Layout responsivo para todas as telas
- Performance otimizada para dispositivos móveis

## 🔄 Prioridades de Desenvolvimento

### Fase 1 - Core (Implementado)
1. Autenticação básica
2. Chat em tempo real
3. Criação de salas
4. Interface responsiva

### Fase 2 - Avançado (Implementado)
1. Upload de arquivos
2. Edição/exclusão de mensagens
3. Sistema de permissões
4. Otimizações de performance

### Fase 3 - Escalabilidade (Implementado)
1. Cache Redis
2. Rate limiting
3. Monitoramento
4. Testes de carga

## 📁 Estrutura do Projeto

```
desafio-chat/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (DB, Redis)
│   │   ├── middlewares/     # Middlewares Express
│   │   ├── models/          # Modelos de dados
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Lógica de negócio
│   │   ├── utils/           # Utilitários
│   │   └── server.ts        # Servidor principal
│   ├── prisma/              # Schema e migrações
│   └── uploads/             # Arquivos enviados
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Serviços de API
│   │   ├── store/           # Gerenciamento de estado
│   │   └── types/           # Tipos TypeScript
│   └── public/              # Arquivos estáticos
└── README.md
```

## 🔌 API Endpoints

### Autenticação
- `POST /users/register` - Registro de usuário
- `POST /users/login` - Login
- `POST /users/logout` - Logout
- `GET /users/verify` - Verificar token

### Salas
- `GET /rooms` - Listar salas do usuário
- `POST /rooms` - Criar sala
- `DELETE /rooms/:id` - Deletar sala
- `GET /rooms/:id/details` - Detalhes da sala
- `POST /rooms/:id/members` - Adicionar membro
- `DELETE /rooms/:id/members/:userId` - Remover membro

### Mensagens
- `GET /messages/:roomId` - Listar mensagens
- `POST /messages/:roomId` - Enviar mensagem
- `PUT /messages/:messageId` - Editar mensagem
- `DELETE /messages/:messageId` - Deletar mensagem
- `GET /messages/unread/count` - Contagem de não lidas

## 🔄 WebSocket Events

### Cliente → Servidor
- `join_room` - Entrar em uma sala
- `leave_room` - Sair de uma sala
- `start_typing` - Começar a digitar
- `stop_typing` - Parar de digitar
- `start_viewing_room` - Começar a visualizar sala
- `stop_viewing_room` - Parar de visualizar sala

### Servidor → Cliente
- `receive_message` - Nova mensagem recebida
- `message_deleted` - Mensagem deletada
- `message_updated` - Mensagem editada
- `user_start_typing` - Usuário começou a digitar
- `user_stop_typing` - Usuário parou de digitar
- `room_users_updated` - Lista de usuários online atualizada
- `unread_message` - Nova mensagem não lida

## 🧪 Testes

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## 🐳 Docker

Para executar com Docker:

```bash
# Subir serviços (PostgreSQL e Redis)
docker-compose up -d

# Verificar status dos containers
docker ps
```

## 🚨 Solução de Problemas

### Erro de conexão com PostgreSQL
1. Verifique se o PostgreSQL está rodando: `docker ps | grep postgres`
2. Confirme as credenciais no `.env`
3. Teste a conexão: `npx prisma db pull`

### Erro de conexão com Redis
1. Verifique se o Redis está rodando: `docker ps | grep redis`
2. Confirme a configuração no `.env`

### Problemas de CORS
1. Verifique se `BASE_URL_FRONTEND` está correto no backend
2. Confirme se `VITE_API_URL` está correto no frontend

### Upload de arquivos não funciona
1. Verifique permissões da pasta `uploads/`
2. Confirme se o diretório existe
3. Verifique limites de tamanho

## 📝 Considerações Finais

Este projeto foi desenvolvido como um desafio técnico fullstack, priorizando:

1. **Qualidade do código** - TypeScript, ESLint, estrutura organizada
2. **Funcionalidade completa** - Todos os requisitos básicos e avançados implementados
3. **Arquitetura sólida** - Separação de responsabilidades, escalabilidade
4. **Performance** - Otimizações de cache, paginação, lazy loading
5. **UX/UI** - Interface moderna, responsiva e intuitiva

O sistema demonstra competência em desenvolvimento fullstack moderno, com foco em comunicação em tempo real, escalabilidade e boas práticas de desenvolvimento.

---

**Desenvolvido com ❤️ por [Gustavo](https://github.com/Gustavo-rs)**

*Desafio Técnico Fullstack - Sistema de Chat em Tempo Real*

## 👨‍💻 Autor

**Gustavo**
- GitHub: [@Gustavo-rs](https://github.com/Gustavo-rs)
- LinkedIn: [Seu LinkedIn](https://www.linkedin.com/in/gustavo-ribeiro-da-silva-042604222/)

---

*Projeto desenvolvido como desafio técnico demonstrando competências em desenvolvimento fullstack.*

# Quick Start
git clone https://github.com/Gustavo-rs/desafio-chat
cd desafio-chat/backend
npm install && docker-compose up -d
npx prisma db push && npx prisma generate
npm run dev &
cd ../frontend && npm install && npm run dev