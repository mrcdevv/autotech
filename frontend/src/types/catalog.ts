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
  /** On-hand stock. May be negative when more was delivered than was recorded. */
  quantity: number;
  unitPrice: number | null;
  createdAt: string;
  updatedAt: string;
  minStock: number | null;
  /** Held by approved estimates of open repair orders. */
  reservedQuantity: number;
  /** quantity - reservedQuantity */
  availableQuantity: number;
  lowStock: boolean;
}

export interface ProductRequest {
  name: string;
  description: string | null;
  /** Initial on-hand stock; only used on create. Later changes go through stock adjustments. */
  quantity: number;
  unitPrice: number | null;
  minStock: number | null;
}

// ---- Stock ----

export type StockMovementType = "INITIAL" | "ADJUSTMENT" | "RESERVE" | "RELEASE" | "CONSUME" | "RETURN";

export type StockSourceType = "MANUAL" | "REPAIR_ORDER" | "DELIVERY_NOTE";

export interface StockMovementResponse {
  id: number;
  productId: number;
  type: StockMovementType;
  /** Signed delta for INITIAL / ADJUSTMENT, positive amount otherwise (the type gives the direction). */
  quantity: number;
  sourceType: StockSourceType;
  sourceId: number | null;
  reason: string | null;
  createdByName: string | null;
  createdAt: string;
}

export type StockAdjustmentMode = "INCREASE" | "DECREASE" | "SET";

export interface StockAdjustmentRequest {
  mode: StockAdjustmentMode;
  quantity: number;
  reason: string;
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
  productId?: number | null;
}

export interface CannedJobProductRequest {
  productName: string;
  quantity: number;
  unitPrice: number;
  /** Catalog product this line moves stock from; absent / null for free-text lines. */
  productId?: number | null;
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
