import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type {
  InspectionTemplateResponse,
  InspectionTemplateRequest,
  CommonProblemResponse,
  CommonProblemRequest,
  InspectionResponse,
  SaveInspectionItemsRequest,
} from "@/features/inspections/types";

// Inspection Templates
export const inspectionTemplatesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<InspectionTemplateResponse[]>>("/inspection-templates"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<InspectionTemplateResponse>>(`/inspection-templates/${id}`),

  create: (data: InspectionTemplateRequest) =>
    apiClient.post<ApiResponse<InspectionTemplateResponse>>("/inspection-templates", data),

  update: (id: number, data: InspectionTemplateRequest) =>
    apiClient.put<ApiResponse<InspectionTemplateResponse>>(`/inspection-templates/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/inspection-templates/${id}`),

  duplicate: (id: number) =>
    apiClient.post<ApiResponse<InspectionTemplateResponse>>(`/inspection-templates/${id}/duplicate`),
};

// Common Problems
export const commonProblemsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<CommonProblemResponse[]>>("/common-problems"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<CommonProblemResponse>>(`/common-problems/${id}`),

  create: (data: CommonProblemRequest) =>
    apiClient.post<ApiResponse<CommonProblemResponse>>("/common-problems", data),

  update: (id: number, data: CommonProblemRequest) =>
    apiClient.put<ApiResponse<CommonProblemResponse>>(`/common-problems/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/common-problems/${id}`),
};

// Inspections (within Repair Orders)
export const inspectionsApi = {
  getByRepairOrder: (repairOrderId: number) =>
    apiClient.get<ApiResponse<InspectionResponse[]>>(
      `/repair-orders/${repairOrderId}/inspections`
    ),

  create: (repairOrderId: number, templateId: number) =>
    apiClient.post<ApiResponse<InspectionResponse>>(
      `/repair-orders/${repairOrderId}/inspections`,
      null,
      { params: { templateId } }
    ),

  getById: (repairOrderId: number, inspectionId: number) =>
    apiClient.get<ApiResponse<InspectionResponse>>(
      `/repair-orders/${repairOrderId}/inspections/${inspectionId}`
    ),

  saveItems: (repairOrderId: number, inspectionId: number, data: SaveInspectionItemsRequest) =>
    apiClient.put<ApiResponse<InspectionResponse>>(
      `/repair-orders/${repairOrderId}/inspections/${inspectionId}/items`,
      data
    ),

  delete: (repairOrderId: number, inspectionId: number) =>
    apiClient.delete<ApiResponse<void>>(
      `/repair-orders/${repairOrderId}/inspections/${inspectionId}`
    ),
};
