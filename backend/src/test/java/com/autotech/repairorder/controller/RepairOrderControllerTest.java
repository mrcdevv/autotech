package com.autotech.repairorder.controller;

import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.estimate.service.EstimateService;
import com.autotech.invoice.service.InvoiceService;
import com.autotech.repairorder.dto.RepairOrderDetailResponse;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.RepairOrderResponse;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.dto.TitleUpdateRequest;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.service.RepairOrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RepairOrderController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class RepairOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RepairOrderService repairOrderService;

    @MockitoBean
    private EstimateService estimateService;

    @MockitoBean
    private InvoiceService invoiceService;

    private final RepairOrderResponse sampleResponse = new RepairOrderResponse(
            1L, "OT-1 Perez - ABC123", RepairOrderStatus.INGRESO_VEHICULO,
            1L, "Juan", "Perez", "1234567890",
            1L, "ABC123", "Toyota", "Corolla", 2020,
            List.of(), List.of(),
            LocalDateTime.now(), LocalDateTime.now()
    );

    private final RepairOrderDetailResponse sampleDetailResponse = new RepairOrderDetailResponse(
            1L, "OT-1 Perez - ABC123", RepairOrderStatus.INGRESO_VEHICULO,
            "Engine noise", null, null, null,
            1L, "Juan", "Perez", null, "1234567890", null,
            1L, "ABC123", "Toyota", "Corolla", 2020, null,
            List.of(), List.of(), List.of(),
            LocalDateTime.now(), LocalDateTime.now()
    );

    @Test
    void getAll_returns200WithList() throws Exception {
        when(repairOrderService.getAll()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/repair-orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("OT-1 Perez - ABC123"));
    }

    @Test
    void getById_returns200WithDetail() throws Exception {
        when(repairOrderService.getById(1L)).thenReturn(sampleDetailResponse);

        mockMvc.perform(get("/api/repair-orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("OT-1 Perez - ABC123"));
    }

    @Test
    void getById_nonExistentId_returns404() throws Exception {
        when(repairOrderService.getById(999L)).thenThrow(new ResourceNotFoundException("RepairOrder", 999L));

        mockMvc.perform(get("/api/repair-orders/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        RepairOrderRequest request = new RepairOrderRequest(1L, 1L, null, "Engine noise", null, null, null);
        when(repairOrderService.create(any(RepairOrderRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/repair-orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("OT-1 Perez - ABC123"));
    }

    @Test
    void create_missingClientId_returns400() throws Exception {
        RepairOrderRequest request = new RepairOrderRequest(null, 1L, null, null, null, null, null);

        mockMvc.perform(post("/api/repair-orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_missingVehicleId_returns400() throws Exception {
        RepairOrderRequest request = new RepairOrderRequest(1L, null, null, null, null, null, null);

        mockMvc.perform(post("/api/repair-orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_validRequest_returns200() throws Exception {
        RepairOrderRequest request = new RepairOrderRequest(1L, 1L, null, "Updated", null, null, null);
        when(repairOrderService.update(eq(1L), any(RepairOrderRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/repair-orders/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void delete_existingId_returns200() throws Exception {
        doNothing().when(repairOrderService).delete(1L);

        mockMvc.perform(delete("/api/repair-orders/1").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void updateStatus_validStatus_returns200() throws Exception {
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.REPARACION);
        when(repairOrderService.updateStatus(eq(1L), any(StatusUpdateRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/repair-orders/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void updateStatus_invalidStatus_returns400() throws Exception {
        StatusUpdateRequest request = new StatusUpdateRequest(RepairOrderStatus.INGRESO_VEHICULO);
        when(repairOrderService.updateStatus(eq(1L), any(StatusUpdateRequest.class)))
                .thenThrow(new IllegalArgumentException("estados iniciales"));

        mockMvc.perform(patch("/api/repair-orders/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateTitle_validTitle_returns200() throws Exception {
        TitleUpdateRequest request = new TitleUpdateRequest("New Title");
        when(repairOrderService.updateTitle(eq(1L), any(TitleUpdateRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/repair-orders/1/title")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void updateTitle_blankTitle_returns400() throws Exception {
        TitleUpdateRequest request = new TitleUpdateRequest("");

        mockMvc.perform(patch("/api/repair-orders/1/title")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void search_returns200() throws Exception {
        when(repairOrderService.search("test")).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/repair-orders/search").param("query", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("OT-1 Perez - ABC123"));
    }

    @Test
    void assignEmployees_returns200() throws Exception {
        when(repairOrderService.assignEmployees(eq(1L), any())).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/repair-orders/1/employees")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[1, 2]"))
                .andExpect(status().isOk());
    }

    @Test
    void assignTags_returns200() throws Exception {
        when(repairOrderService.assignTags(eq(1L), any())).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/repair-orders/1/tags")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[1, 2]"))
                .andExpect(status().isOk());
    }
}
