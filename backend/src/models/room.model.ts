import { User } from './user.model';

export interface Room {
  id: string;
  name: string;
  createdAt: Date;
  messages?: Message[];
  lastMessage?: Message | null;
}

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  user: Pick<User, 'id' | 'username'>;
  roomId: string;
}

export interface RoomResponse {
  id: string;
  name: string;
  createdAt: Date;
  lastMessage: Message | null;
}

export interface RoomListResponse {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
  rooms: RoomResponse[];
} 