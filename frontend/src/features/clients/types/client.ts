export type ClientType = "PERSONAL" | "EMPRESA" | "TEMPORAL";

export interface Client {
    id: number;
    firstName: string;
    lastName: string;
    dni: string | null;
    commercialName: string | null;
    email: string | null;
    phone: string;
    address: string | null;
    province: string | null;
    country: string | null;
    clientType: ClientType;
    entryDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ClientRequest {
    firstName: string;
    lastName: string;
    dni?: string;
    commercialName?: string;
    email?: string;
    phone: string;
    address?: string;
    province?: string;
    country?: string;
    clientType: ClientType;
    entryDate?: string;
}

export interface ClientUpgradeRequest {
    dni: string;
    commercialName?: string;
    email?: string;
    address: string;
    province: string;
    country: string;
    clientType: "PERSONAL" | "EMPRESA";
    entryDate?: string;
}

export type ClientResponse = Client;
