package com.autotech.catalog.service;

import com.autotech.catalog.dto.CannedJobDetailResponse;
import com.autotech.catalog.dto.CannedJobRequest;
import com.autotech.catalog.dto.CannedJobResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CannedJobService {

    Page<CannedJobResponse> search(String query, Pageable pageable);

    CannedJobDetailResponse getById(Long id);

    CannedJobDetailResponse create(CannedJobRequest request);

    CannedJobDetailResponse update(Long id, CannedJobRequest request);

    void delete(Long id);
}
