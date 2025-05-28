import { User } from './userModel';

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  status?: 'ACTIVE' | 'EDITED' | 'DELETED';
  user: {
    id: string;
    username: string;
  };
  roomId: string;
  files?: MessageFile[];
}

export interface MessageFile {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  messageId: string;
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