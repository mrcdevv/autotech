package com.autotech.catalog.controller;

import com.autotech.catalog.dto.CannedJobDetailResponse;
import com.autotech.catalog.dto.CannedJobRequest;
import com.autotech.catalog.dto.CannedJobResponse;
import com.autotech.catalog.service.CannedJobService;
import com.autotech.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

@RestController
@RequestMapping("/api/canned-jobs")
@RequiredArgsConstructor
public class CannedJobController {

    private final CannedJobService cannedJobService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CannedJobResponse>>> search(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 12, sort = "title") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(cannedJobService.search(query, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CannedJobDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(cannedJobService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CannedJobDetailResponse>> create(
            @Valid @RequestBody CannedJobRequest request) {
        CannedJobDetailResponse created = cannedJobService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Trabajo enlatado creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CannedJobDetailResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CannedJobRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Trabajo enlatado actualizado", cannedJobService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        cannedJobService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Trabajo enlatado eliminado", null));
    }
}
