import { User } from './userModel';

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
  };
  roomId: string;
}

export interface MessageResponse {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
  messages: Message[];
}

export interface UnreadCount {
  roomId: string;
  count: number;
}

export interface UnreadCountResponse {
  unreadCounts: UnreadCount[];
}

export interface ErrorResponse {
  message: string;
} 