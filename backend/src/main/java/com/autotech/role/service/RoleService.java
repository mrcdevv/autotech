package com.autotech.role.service;

import com.autotech.role.dto.RoleRequest;
import com.autotech.role.dto.RoleResponse;

import java.util.List;

public interface RoleService {

    List<RoleResponse> getAll();

    RoleResponse getById(Long id);

    RoleResponse create(RoleRequest request);

    RoleResponse update(Long id, RoleRequest request);

    void delete(Long id);
}
