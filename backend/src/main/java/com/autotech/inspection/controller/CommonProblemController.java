package com.autotech.inspection.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.inspection.dto.CommonProblemRequest;
import com.autotech.inspection.dto.CommonProblemResponse;
import com.autotech.inspection.service.CommonProblemService;
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
@RequestMapping("/api/common-problems")
@RequiredArgsConstructor
public class CommonProblemController {

    private final CommonProblemService commonProblemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommonProblemResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(commonProblemService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonProblemResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(commonProblemService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommonProblemResponse>> create(
            @Valid @RequestBody CommonProblemRequest request) {
        CommonProblemResponse created = commonProblemService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Problema común creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonProblemResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CommonProblemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Problema común actualizado",
                commonProblemService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        commonProblemService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Problema común eliminado", null));
    }
}
