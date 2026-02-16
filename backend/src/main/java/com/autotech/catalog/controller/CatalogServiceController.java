package com.autotech.catalog.controller;

import com.autotech.catalog.dto.CatalogServiceRequest;
import com.autotech.catalog.dto.CatalogServiceResponse;
import com.autotech.catalog.service.CatalogServiceService;
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
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class CatalogServiceController {

    private final CatalogServiceService catalogServiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CatalogServiceResponse>>> search(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 12, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(catalogServiceService.search(query, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CatalogServiceResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(catalogServiceService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CatalogServiceResponse>> create(
            @Valid @RequestBody CatalogServiceRequest request) {
        CatalogServiceResponse created = catalogServiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Servicio creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CatalogServiceResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CatalogServiceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Servicio actualizado", catalogServiceService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        catalogServiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Servicio eliminado", null));
    }
}
