/////////////////////////////////////////
// User
/////////////////////////////////////////

export interface APIAuthUser {
    username: string;
    password: string;
}

export interface APIUser {
    message: string;
    token: string;
    user: User;
}

export interface User {
    id: number;
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
    id: number;
    name: string;
}

export interface APIRooms {
    rooms: APIRoom[];
}

/////////////////////////////////////////
// Messages
/////////////////////////////////////////

export interface APICreateMessage {
    content: string;
    roomId: number;
}

export interface APIMessage {
    messages: Message[];
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

export interface Message {
    id: number;
    content: string;
    createdAt: string;
    user: User;
}

/////////////////////////////////////////
// Unread Messages
/////////////////////////////////////////

export interface UnreadCount {
    roomId: number;
    count: number;
  }
