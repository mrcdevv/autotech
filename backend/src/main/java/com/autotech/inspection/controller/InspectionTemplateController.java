package com.autotech.inspection.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.inspection.dto.InspectionTemplateRequest;
import com.autotech.inspection.dto.InspectionTemplateResponse;
import com.autotech.inspection.service.InspectionTemplateService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inspection-templates")
@RequiredArgsConstructor
public class InspectionTemplateController {

    private final InspectionTemplateService inspectionTemplateService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InspectionTemplateResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(inspectionTemplateService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InspectionTemplateResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inspectionTemplateService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InspectionTemplateResponse>> create(
            @Valid @RequestBody InspectionTemplateRequest request) {
        InspectionTemplateResponse created = inspectionTemplateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Plantilla de inspección creada", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InspectionTemplateResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody InspectionTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Plantilla de inspección actualizada",
                inspectionTemplateService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        inspectionTemplateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Plantilla de inspección eliminada", null));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<InspectionTemplateResponse>> duplicate(@PathVariable Long id) {
        InspectionTemplateResponse duplicated = inspectionTemplateService.duplicate(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Plantilla duplicada", duplicated));
    }
}
