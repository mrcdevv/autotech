export type DeliveryNoteStatus = "PENDIENTE" | "PAGADA";

export interface DeliveryNoteServiceItemRequest {
  serviceName: string;
  price: number;
}

export interface DeliveryNoteServiceItemResponse {
  id: number;
  serviceName: string;
  price: number;
}

export interface DeliveryNoteProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryNoteProductResponse {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DeliveryNoteRequest {
  clientId: number;
  vehicleId: number | null;
  repairOrderId: number | null;
  estimateId: number | null;
  discountPercentage: number;
  services: DeliveryNoteServiceItemRequest[];
  products: DeliveryNoteProductRequest[];
}

export interface DeliveryNoteResponse {
  id: number;
  number: number;
  clientId: number;
  clientFullName: string;
  vehicleId: number | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  repairOrderId: number | null;
  estimateId: number | null;
  status: DeliveryNoteStatus;
  discountPercentage: number;
  total: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryNoteDetailResponse {
  id: number;
  number: number;
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
  status: DeliveryNoteStatus;
  discountPercentage: number;
  total: number | null;
  services: DeliveryNoteServiceItemResponse[];
  products: DeliveryNoteProductResponse[];
  createdAt: string;
  updatedAt: string;
}
