# Sistema de Link Preview

O sistema de link preview detecta automaticamente URLs nas mensagens e gera previews visuais para diferentes tipos de conteúdo.

## Tipos de Links Suportados

### 1. Imagens Diretas
- **Formatos**: .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg
- **Comportamento**: Mostra a imagem diretamente no chat
- **Exemplo**: `https://exemplo.com/imagem.jpg`

### 2. YouTube
- **URLs suportadas**: youtube.com, youtu.be
- **Comportamento**: Mostra thumbnail do vídeo com botão play e título
- **Exemplo**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

### 3. GitHub
- **Comportamento**: Mostra informações do repositório com image de opengraph
- **Exemplo**: `https://github.com/usuario/repositorio`

### 4. Imgur
- **Comportamento**: Detecta e mostra imagens do Imgur
- **Exemplo**: `https://imgur.com/a/abc123`

### 5. Google Drive
- **Comportamento**: Mostra preview de arquivos compartilhados
- **Exemplo**: `https://drive.google.com/file/d/1234567890/view`

### 6. Redes Sociais
- **Twitter/X**: `https://twitter.com/usuario/status/123`
- **Instagram**: `https://instagram.com/p/abc123`

### 7. Vídeos Diretos
- **Formatos**: .mp4, .webm, .ogg, .mov, .avi
- **Comportamento**: Mostra placeholder de vídeo

### 8. Links Genéricos
- **Comportamento**: Mostra informações básicas do domínio
- **Exemplo**: Qualquer URL não categorizada

## Funcionalidades

- ✅ **Cache inteligente**: Evita requisições desnecessárias
- ✅ **Detecção automática**: Identifica URLs no texto
- ✅ **Suporte a múltiplos links**: Uma mensagem pode ter vários previews
- ✅ **Loading states**: Mostra estado de carregamento
- ✅ **Error handling**: Tratamento de erros gracioso
- ✅ **Responsivo**: Funciona em desktop e mobile

## Como Usar

Simplesmente envie uma mensagem contendo uma URL:

```
Olha essa imagem legal: https://exemplo.com/imagem.jpg

Ou este vídeo: https://www.youtube.com/watch?v=abc123
```

O sistema detectará automaticamente os links e gerará os previews correspondentes. 