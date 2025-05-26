/////////////////////////////////////////
// User
/////////////////////////////////////////

export interface APIAuthUser {
    username: string;
    password: string;
}

export interface APIUser {
    message: string;
    user: User;
}

export interface User {
    id: string;
    username: string;
}

// Novo tipo para usuários online
export interface OnlineUser {
    userId: string;
    username: string;
}

/////////////////////////////////////////
// Rooms
/////////////////////////////////////////

export interface APICreateRoom {
    name: string;
}

export interface APIRoom {
    newRoom: any;
    id: string;
    name: string;
    lastMessage?: Message;
    unreadCount: number;
    creator?: {
        id: string;
        username: string;
    };
    members?: RoomMember[];
}

export interface RoomMember {
    id: string;
    user_id: string;
    room_id: string;
    role: 'ADMIN' | 'MEMBER';
    joined_at: string;
    user: {
        id: string;
        username: string;
    };
}

export interface AvailableUser {
    id: string;
    username: string;
}

export interface APIRooms {
    rooms: APIRoom[];
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
    members: RoomMember[];
    userRole: 'ADMIN' | 'MEMBER';
    sharedFiles?: {
        id: string;
        fileName: string;
        fileUrl: string;
        fileType: string;
        uploadedBy: string;
        uploadedAt: string;
    }[];
    participants?: {
        userId: string;
        username: string;
        messageCount: number;
        lastActiveAt: string;
    }[];
}

/////////////////////////////////////////
// Messages
/////////////////////////////////////////

export type MessageStatus = 'ACTIVE' | 'EDITED' | 'DELETED';

export interface APICreateMessage {
    content: string;
    roomId: string;
}

export interface APIMessage {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user: User;
    status: MessageStatus;
    file_name?: string;
    file_url?: string;
    file_type?: string;
    file_size?: number;
    files?: MessageFile[];
}

export interface MessageResponse {
    messages: APIMessage[];
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

export interface MessageFile {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    created_at: string;
}

export interface Message {
    id: string;
    user: {
      id: string;
      username: string;
    };
    content: string;
    created_at: string;
    updated_at: string;
    status: MessageStatus;
    files?: MessageFile[];
    isSystemMessage?: boolean;
    systemMessageType?: 'user_joined' | 'user_left' | 'member_added' | 'member_removed';
}

export interface ChatPageProps {
    roomId?: string;
    roomName?: string;
}

/////////////////////////////////////////
// Unread Messages
/////////////////////////////////////////

export interface UnreadCount {
    roomId: string;
    count: number;
}

