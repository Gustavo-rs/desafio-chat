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


