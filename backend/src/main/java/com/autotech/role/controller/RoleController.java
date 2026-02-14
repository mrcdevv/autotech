package com.autotech.role.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.role.dto.RoleResponse;
import com.autotech.role.model.Role;
import com.autotech.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAll() {
        List<RoleResponse> roles = roleRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    private RoleResponse toResponse(Role role) {
        return new RoleResponse(role.getId(), role.getName(), role.getDescription());
    }
}
