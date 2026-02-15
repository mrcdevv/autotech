package com.autotech.client.controller;

import com.autotech.client.dto.ClientRequest;
import com.autotech.client.dto.ClientResponse;
import com.autotech.client.dto.ClientUpgradeRequest;
import com.autotech.client.model.ClientType;
import com.autotech.client.service.ClientService;
import com.autotech.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ClientResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortSplit = sort.split(",");
        String sortParam = sortSplit[0];
        Sort.Direction sortDir = sortSplit.length > 1 ? Sort.Direction.fromString(sortSplit[1]) : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortParam));

        return ResponseEntity.ok(ApiResponse.success(clientService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(clientService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClientResponse>> create(
            @Valid @RequestBody ClientRequest request) {
        ClientResponse created = clientService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cliente creado exitosamente", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ClientRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cliente actualizado exitosamente", clientService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Cliente eliminado exitosamente", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ClientResponse>>> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(clientService.search(query, pageable)));
    }

    @GetMapping("/by-type")
    public ResponseEntity<ApiResponse<Page<ClientResponse>>> findByType(
            @RequestParam ClientType clientType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(clientService.findByClientType(clientType, pageable)));
    }

    @PatchMapping("/{id}/upgrade")
    public ResponseEntity<ApiResponse<ClientResponse>> upgrade(
            @PathVariable Long id,
            @Valid @RequestBody ClientUpgradeRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cliente actualizado exitosamente",
                        clientService.upgradeToRegistered(id, request)));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportToExcel() {
        byte[] excelBytes = clientService.exportToExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=clientes.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }
}
