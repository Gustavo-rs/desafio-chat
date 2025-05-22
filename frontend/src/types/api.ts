/////////////////////////////////////////
// User
/////////////////////////////////////////

export interface APIAuthUser {
    name: string;
    password: string;
}

export interface APIUser {
    message: string;
    token: string;
    user: User;
}

export interface User {
    id: number;
    name: string;
}
