export type InvoiceStatus = "PENDIENTE" | "PAGADA";

export interface InvoiceServiceItemRequest {
  serviceName: string;
  price: number;
}

export interface InvoiceServiceItemResponse {
  id: number;
  serviceName: string;
  price: number;
}

export interface InvoiceProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceProductResponse {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceRequest {
  clientId: number;
  vehicleId: number | null;
  repairOrderId: number | null;
  estimateId: number | null;
  discountPercentage: number;
  taxPercentage: number;
  services: InvoiceServiceItemRequest[];
  products: InvoiceProductRequest[];
}

export interface InvoiceResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  vehicleId: number | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  repairOrderId: number | null;
  estimateId: number | null;
  status: InvoiceStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetailResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  clientDni: string | null;
  clientPhone: string;
  clientEmail: string | null;
  clientType: string;
  vehicleId: number | null;
  vehiclePlate: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  repairOrderId: number | null;
  estimateId: number | null;
  status: InvoiceStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  services: InvoiceServiceItemResponse[];
  products: InvoiceProductResponse[];
  createdAt: string;
  updatedAt: string;
}
