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
}

export interface APIRooms {
    rooms: APIRoom[];
}

/////////////////////////////////////////
// Messages
/////////////////////////////////////////

export interface APICreateMessage {
    content: string;
    roomId: string;
}

export interface APIMessage {
    messages: Message[];
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

export interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: User;
}

/////////////////////////////////////////
// Unread Messages
/////////////////////////////////////////

export interface UnreadCount {
    roomId: string;
    count: number;
}
