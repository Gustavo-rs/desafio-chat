import type { APICreateRoom, APIRoom, UnreadCount } from "../types/api";
import { BaseService } from "./base-service";

// Novos tipos para detalhes da sala
interface RoomParticipant {
  userId: string;
  username: string;
  messageCount: number;
  lastActiveAt: string;
}

interface RoomFile {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RoomDetails {
  id: string;
  name: string;
  createdAt: string;
  totalMessages: number;
  totalUsers: number;
  lastMessageAt: string | null;
  participants: RoomParticipant[];
  sharedFiles: RoomFile[];
}

class RoomsService extends BaseService<APIRoom, APICreateRoom> {
  constructor() {
    super("/rooms");
  }

  async getUnreadCounts() {
    return this.api.get<UnreadCount[]>(`${this.basePath}/unread-counts`);
  }

  async getRoomDetails(roomId: string) {
    return this.api.get<RoomDetails>(`${this.basePath}/${roomId}/details`);
  }

  async getRoomParticipants(roomId: string) {
    return this.api.get<{ participants: RoomParticipant[] }>(`${this.basePath}/${roomId}/participants`);
  }

  async getRoomFiles(roomId: string) {
    return this.api.get<{ files: RoomFile[] }>(`${this.basePath}/${roomId}/files`);
  }
}

export default new RoomsService();
