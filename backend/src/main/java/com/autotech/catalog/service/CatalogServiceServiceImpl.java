package com.autotech.catalog.service;

import com.autotech.catalog.dto.CatalogServiceMapper;
import com.autotech.catalog.dto.CatalogServiceRequest;
import com.autotech.catalog.dto.CatalogServiceResponse;
import com.autotech.catalog.model.CatalogService;
import com.autotech.catalog.repository.CatalogServiceRepository;
import com.autotech.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogServiceServiceImpl implements CatalogServiceService {

    private final CatalogServiceRepository catalogServiceRepository;
    private final CatalogServiceMapper catalogServiceMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<CatalogServiceResponse> search(String query, Pageable pageable) {
        log.debug("Searching services with query: '{}'", query);
        if (query == null || query.isBlank()) {
            return catalogServiceRepository.findAll(pageable)
                    .map(catalogServiceMapper::toResponse);
        }
        return catalogServiceRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query, pageable)
                .map(catalogServiceMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CatalogServiceResponse getById(Long id) {
        log.debug("Fetching service with id {}", id);
        CatalogService entity = catalogServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        return catalogServiceMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public CatalogServiceResponse create(CatalogServiceRequest request) {
        CatalogService entity = catalogServiceMapper.toEntity(request);
        CatalogService saved = catalogServiceRepository.save(entity);
        log.info("Created service with id {}", saved.getId());
        return catalogServiceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CatalogServiceResponse update(Long id, CatalogServiceRequest request) {
        CatalogService entity = catalogServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        catalogServiceMapper.updateEntity(request, entity);
        CatalogService saved = catalogServiceRepository.save(entity);
        log.info("Updated service with id {}", saved.getId());
        return catalogServiceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!catalogServiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Service", id);
        }
        catalogServiceRepository.deleteById(id);
        log.info("Deleted service with id {}", id);
    }
}
