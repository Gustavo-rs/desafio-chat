export interface User {
  id: string;
  username: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponse {
  id: string;
  username: string;
  message: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    username: string;
  };
  token: string;
} 