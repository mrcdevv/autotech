import type { RoleResponse } from "@/types/role";

export type EmployeeStatus = "ACTIVO" | "INACTIVO";

export interface EmployeeResponse {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  email: string | null;
  phone: string;
  address: string | null;
  province: string | null;
  city: string | null;
  country: string | null;
  maritalStatus: string | null;
  childrenCount: number;
  entryDate: string | null;
  status: EmployeeStatus;
  roles: RoleResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  dni: string;
  email: string | null;
  phone: string;
  address: string | null;
  province: string | null;
  city: string | null;
  country: string | null;
  maritalStatus: string | null;
  childrenCount: number;
  entryDate: string | null;
  status: EmployeeStatus;
  roleIds: number[];
}
