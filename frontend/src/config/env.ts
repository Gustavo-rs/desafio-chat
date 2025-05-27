export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://desafio-chat-production.up.railway.app',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'https://desafio-chat-production.up.railway.app',
} as const; 