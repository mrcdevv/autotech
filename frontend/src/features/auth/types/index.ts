export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  mustChangePassword: boolean;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface CurrentUserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
