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
}

export interface APIRooms {
    rooms: APIRoom[];
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
    createdAt: string;
    updatedAt: string;
    user: User;
    status: MessageStatus;
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
}

export interface MessageResponse {
    messages: APIMessage[];
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

export interface Message {
    id: string;
    user: {
      id: string;
      username: string;
    };
    content: string;
    createdAt: string;
    updatedAt: string;
    status: MessageStatus;
    isDeleted?: boolean;
    isEdited?: boolean;
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
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

