export type EstimateStatus = "PENDIENTE" | "ACEPTADO" | "RECHAZADO";

// ---- Service Line Item ----

export interface EstimateServiceItemRequest {
  serviceName: string;
  price: number;
}

export interface EstimateServiceItemResponse {
  id: number;
  serviceName: string;
  price: number;
}

// ---- Product Line Item ----

export interface EstimateProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface EstimateProductResponse {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ---- Estimate ----

export interface EstimateRequest {
  clientId: number;
  vehicleId: number;
  repairOrderId: number | null;
  discountPercentage: number;
  taxPercentage: number;
  services: EstimateServiceItemRequest[];
  products: EstimateProductRequest[];
}

export interface EstimateResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleModel: string;
  repairOrderId: number | null;
  status: EstimateStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateDetailResponse {
  id: number;
  clientId: number;
  clientFullName: string;
  clientDni: string | null;
  clientPhone: string;
  clientEmail: string | null;
  vehicleId: number;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  repairOrderId: number | null;
  mechanicNotes: string | null;
  inspectionIssues: InspectionIssueResponse[];
  status: EstimateStatus;
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
  services: EstimateServiceItemResponse[];
  products: EstimateProductResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface InspectionIssueResponse {
  inspectionItemId: number;
  itemName: string;
  status: string;
  comment: string | null;
}

export interface EstimateInvoiceDataResponse {
  estimateId: number;
  clientId: number;
  vehicleId: number;
  repairOrderId: number | null;
  services: EstimateServiceItemResponse[];
  products: EstimateProductResponse[];
  discountPercentage: number;
  taxPercentage: number;
  total: number | null;
}
