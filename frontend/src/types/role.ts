export interface PermissionResponse {
  id: number;
  code: string;
  description: string;
}

export interface RoleResponse {
  id: number;
  name: string;
  description: string | null;
  permissions: PermissionResponse[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RoleRequest {
  name: string;
  description?: string | null;
  permissionIds?: number[];
}
