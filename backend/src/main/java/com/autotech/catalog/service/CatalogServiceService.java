package com.autotech.catalog.service;

import com.autotech.catalog.dto.CatalogServiceRequest;
import com.autotech.catalog.dto.CatalogServiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CatalogServiceService {

    Page<CatalogServiceResponse> search(String query, Pageable pageable);

    CatalogServiceResponse getById(Long id);

    CatalogServiceResponse create(CatalogServiceRequest request);

    CatalogServiceResponse update(Long id, CatalogServiceRequest request);

    void delete(Long id);
}
