import type { APICreateRoom, APIRoom, UnreadCount, AvailableUser, RoomMember } from "../types/api";
import { BaseService } from "./base-service";
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
  created_at: string;
  creator: {
    id: string;
    username: string;
  };
  totalMessages: number;
  totalUsers: number;
  lastMessageAt: string | null;
  participants: RoomParticipant[];
  sharedFiles: RoomFile[];
  members: RoomMember[];
  userRole: 'ADMIN' | 'MEMBER';
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

  async addMemberToRoom(roomId: string, userIdToAdd: string) {
    return this.api.post(`${this.basePath}/${roomId}/members`, { userIdToAdd });
  }

  async removeMemberFromRoom(roomId: string, userId: string) {
    return this.api.delete(`${this.basePath}/${roomId}/members/${userId}`);
  }

  async getAvailableUsers(roomId: string) {
    return this.api.get<AvailableUser[]>(`${this.basePath}/${roomId}/available-users`);
  }

  async getAllUsers(roomId: string) {
    return this.api.get<AvailableUser[]>(`${this.basePath}/${roomId}/all-users`);
  }
}

export default new RoomsService();
