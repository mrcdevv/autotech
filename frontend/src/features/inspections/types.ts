// Inspection item status
export type InspectionItemStatus = "OK" | "REVISAR" | "PROBLEMA" | "NO_APLICA";

// Template types
export interface InspectionTemplateItemResponse {
  id: number;
  name: string;
  sortOrder: number;
}

export interface InspectionTemplateGroupResponse {
  id: number;
  title: string;
  sortOrder: number;
  items: InspectionTemplateItemResponse[];
}

export interface InspectionTemplateResponse {
  id: number;
  title: string;
  groups: InspectionTemplateGroupResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface InspectionTemplateItemRequest {
  id: number | null;
  name: string;
  sortOrder: number;
}

export interface InspectionTemplateGroupRequest {
  id: number | null;
  title: string;
  sortOrder: number;
  items: InspectionTemplateItemRequest[];
}

export interface InspectionTemplateRequest {
  title: string;
  groups: InspectionTemplateGroupRequest[];
}

// Common problem types
export interface CommonProblemResponse {
  id: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommonProblemRequest {
  description: string;
}

// Inspection types (within repair order)
export interface InspectionItemResponse {
  id: number;
  templateItemId: number;
  templateItemName: string;
  status: InspectionItemStatus;
  comment: string | null;
}

export interface InspectionGroupWithItemsResponse {
  groupId: number;
  groupTitle: string;
  sortOrder: number;
  items: InspectionItemResponse[];
}

export interface InspectionResponse {
  id: number;
  repairOrderId: number;
  templateId: number;
  templateTitle: string;
  groups: InspectionGroupWithItemsResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface InspectionItemRequest {
  id: number;
  status: InspectionItemStatus;
  comment: string | null;
}

export interface SaveInspectionItemsRequest {
  items: InspectionItemRequest[];
}

export interface NotesUpdateRequest {
  reason: string | null;
  mechanicNotes: string | null;
}
