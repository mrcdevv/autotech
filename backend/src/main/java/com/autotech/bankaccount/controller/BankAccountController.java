package com.autotech.bankaccount.controller;

import com.autotech.bankaccount.dto.BankAccountRequest;
import com.autotech.bankaccount.dto.BankAccountResponse;
import com.autotech.bankaccount.dto.BankResponse;
import com.autotech.bankaccount.service.BankAccountService;
import com.autotech.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(bankAccountService.getAll()));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BankAccountResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(bankAccountService.getById(id)));
    }

    @PreAuthorize("hasAuthority('manage_config')")
    @PostMapping
    public ResponseEntity<ApiResponse<BankAccountResponse>> create(
            @Valid @RequestBody BankAccountRequest request) {
        BankAccountResponse created = bankAccountService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cuenta bancaria creada", created));
    }

    @PreAuthorize("hasAuthority('manage_config')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BankAccountResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody BankAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cuenta bancaria actualizada",
                bankAccountService.update(id, request)));
    }

    @PreAuthorize("hasAuthority('manage_config')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        bankAccountService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Cuenta bancaria eliminada", null));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/banks")
    public ResponseEntity<ApiResponse<List<BankResponse>>> getAllBanks() {
        return ResponseEntity.ok(ApiResponse.success(bankAccountService.getAllBanks()));
    }
}
