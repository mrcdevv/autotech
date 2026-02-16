// ---- Services ----

export interface CatalogServiceResponse {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogServiceRequest {
  name: string;
  description: string | null;
  price: number | null;
}

// ---- Products ----

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number | null;
}

// ---- Canned Jobs ----

export interface CannedJobServiceResponse {
  id: number;
  serviceName: string;
  price: number;
}

export interface CannedJobServiceRequest {
  serviceName: string;
  price: number;
}

export interface CannedJobProductResponse {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CannedJobProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CannedJobResponse {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CannedJobDetailResponse {
  id: number;
  title: string;
  description: string | null;
  services: CannedJobServiceResponse[];
  products: CannedJobProductResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CannedJobRequest {
  title: string;
  description: string | null;
  services: CannedJobServiceRequest[];
  products: CannedJobProductRequest[];
}
