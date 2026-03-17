package com.autotech.inspection.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.inspection.dto.InspectionResponse;
import com.autotech.inspection.dto.SaveInspectionItemsRequest;
import com.autotech.inspection.service.InspectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/repair-orders/{repairOrderId}/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InspectionResponse>>> getByRepairOrder(
            @PathVariable Long repairOrderId) {
        return ResponseEntity.ok(ApiResponse.success(inspectionService.getByRepairOrder(repairOrderId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InspectionResponse>> create(
            @PathVariable Long repairOrderId,
            @RequestParam Long templateId) {
        InspectionResponse created = inspectionService.createForRepairOrder(repairOrderId, templateId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inspección creada", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InspectionResponse>> getById(
            @PathVariable Long repairOrderId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inspectionService.getById(id)));
    }

    @PutMapping("/{id}/items")
    public ResponseEntity<ApiResponse<InspectionResponse>> saveItems(
            @PathVariable Long repairOrderId,
            @PathVariable Long id,
            @Valid @RequestBody SaveInspectionItemsRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Inspección guardada",
                inspectionService.saveItems(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long repairOrderId,
            @PathVariable Long id) {
        inspectionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Inspección eliminada", null));
    }
}
