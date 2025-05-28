import { BaseService } from '../shared/BaseService';
import { RoomRepositoryService } from './RoomRepositoryService';
import { RoomMembershipService } from './RoomMembershipService';
import { RoomDetailsService } from './RoomDetailsService';
import { MessageService } from '../message/MessageService';
import { io } from '../../server';

export class RoomService extends BaseService {
  private roomRepository: RoomRepositoryService;
  private roomMembership: RoomMembershipService;
  private roomDetails: RoomDetailsService;
  private messageService: MessageService;

  constructor() {
    super();
    this.roomRepository = new RoomRepositoryService();
    this.roomMembership = new RoomMembershipService();
    this.roomDetails = new RoomDetailsService();
    this.messageService = new MessageService();
  }

  async createRoom(name: string, creatorId: string) {
    const room = await this.roomRepository.createRoom(name, creatorId);
    
    const memberIds = room.members.map((member: { user_id: string }) => member.user_id);
    io.to(memberIds).emit('room_created', room);
    
    return room;
  }

  async deleteRoom(id: string, userId: string) {
    const result = await this.roomRepository.deleteRoom(id, userId);
    
    io.emit('room_deleted', { id });
    
    return result;
  }

  async getRoomById(id: string, userId: string) {
    return this.roomRepository.getRoomById(id, userId);
  }

  async getRooms(userId: string) {
    return this.roomRepository.getRooms(userId);
  }

  async getRoomMessages(roomId: string, userId: string) {
    const room = await this.roomRepository.getRoomById(roomId, userId);
    await this.messageService.markMessagesAsRead(userId, roomId);
    return room.messages;
  }

  async addMemberToRoom(roomId: string, userIdToAdd: string, adminUserId: string) {
    const newMember = await this.roomMembership.addMemberToRoom(roomId, userIdToAdd, adminUserId);
    
    const allMembers = await this.db.room_member.findMany({
      where: { room_id: roomId },
      select: { user_id: true },
    });
    
    const memberIds = allMembers.map((member: { user_id: string }) => member.user_id);
    io.to(memberIds).emit('member_added', {
      roomId,
      member: newMember,
    });

    return newMember;
  }

  async removeMemberFromRoom(roomId: string, userIdToRemove: string, adminUserId: string) {
    const result = await this.roomMembership.removeMemberFromRoom(roomId, userIdToRemove, adminUserId);
    
    const remainingMembers = await this.db.room_member.findMany({
      where: { room_id: roomId },
      select: { user_id: true },
    });
    
    const memberIds = remainingMembers.map((member: { user_id: string }) => member.user_id);
    const allNotificationIds = [...memberIds, userIdToRemove];
    
    io.to(allNotificationIds).emit('member_removed', {
      roomId,
      removedUserId: userIdToRemove,
    });

    return result;
  }

  async getAvailableUsers(roomId: string, adminUserId: string) {
    return this.roomMembership.getAvailableUsers(roomId, adminUserId);
  }

  async getRoomMembers(roomId: string, userId: string) {
    return this.roomMembership.getRoomMembers(roomId, userId);
  }

  async isRoomMember(roomId: string, userId: string): Promise<boolean> {
    return this.roomMembership.isRoomMember(roomId, userId);
  }

  async getRoomDetails(roomId: string, userId: string) {
    return this.roomDetails.getRoomDetails(roomId, userId);
  }

  async getRoomParticipants(roomId: string, userId: string) {
    return this.roomDetails.getRoomParticipants(roomId, userId);
  }

  async getRoomFiles(roomId: string, userId: string) {
    return this.roomDetails.getRoomFiles(roomId, userId);
  }

  async roomExists(id: string): Promise<boolean> {
    return this.roomRepository.roomExists(id);
  }
} 