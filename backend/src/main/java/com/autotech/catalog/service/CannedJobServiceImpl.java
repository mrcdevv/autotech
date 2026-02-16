package com.autotech.catalog.service;

import com.autotech.catalog.dto.CannedJobDetailResponse;
import com.autotech.catalog.dto.CannedJobMapper;
import com.autotech.catalog.dto.CannedJobProductRequest;
import com.autotech.catalog.dto.CannedJobRequest;
import com.autotech.catalog.dto.CannedJobResponse;
import com.autotech.catalog.dto.CannedJobServiceRequest;
import com.autotech.catalog.model.CannedJob;
import com.autotech.catalog.model.CannedJobProduct;
import com.autotech.catalog.repository.CannedJobRepository;
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
public class CannedJobServiceImpl implements CannedJobService {

    private final CannedJobRepository cannedJobRepository;
    private final CannedJobMapper cannedJobMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<CannedJobResponse> search(String query, Pageable pageable) {
        log.debug("Searching canned jobs with query: '{}'", query);
        if (query == null || query.isBlank()) {
            return cannedJobRepository.findAll(pageable)
                    .map(cannedJobMapper::toResponse);
        }
        return cannedJobRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query, pageable)
                .map(cannedJobMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CannedJobDetailResponse getById(Long id) {
        log.debug("Fetching canned job with id {}", id);
        CannedJob entity = cannedJobRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CannedJob", id));
        return cannedJobMapper.toDetailResponse(entity);
    }

    @Override
    @Transactional
    public CannedJobDetailResponse create(CannedJobRequest request) {
        CannedJob entity = cannedJobMapper.toEntity(request);
        addChildEntities(entity, request);
        CannedJob saved = cannedJobRepository.save(entity);
        log.info("Created canned job with id {}", saved.getId());
        return cannedJobMapper.toDetailResponse(saved);
    }

    @Override
    @Transactional
    public CannedJobDetailResponse update(Long id, CannedJobRequest request) {
        CannedJob entity = cannedJobRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CannedJob", id));

        entity.setTitle(request.title());
        entity.setDescription(request.description());

        entity.getServices().clear();
        entity.getProducts().clear();
        addChildEntities(entity, request);

        CannedJob saved = cannedJobRepository.save(entity);
        log.info("Updated canned job with id {}", saved.getId());
        return cannedJobMapper.toDetailResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!cannedJobRepository.existsById(id)) {
            throw new ResourceNotFoundException("CannedJob", id);
        }
        cannedJobRepository.deleteById(id);
        log.info("Deleted canned job with id {}", id);
    }

    private void addChildEntities(CannedJob entity, CannedJobRequest request) {
        if (request.services() != null) {
            for (CannedJobServiceRequest svcReq : request.services()) {
                com.autotech.catalog.model.CannedJobService svc =
                        com.autotech.catalog.model.CannedJobService.builder()
                                .cannedJob(entity)
                                .serviceName(svcReq.serviceName())
                                .price(svcReq.price())
                                .build();
                entity.getServices().add(svc);
            }
        }
        if (request.products() != null) {
            for (CannedJobProductRequest prodReq : request.products()) {
                CannedJobProduct prod = CannedJobProduct.builder()
                        .cannedJob(entity)
                        .productName(prodReq.productName())
                        .quantity(prodReq.quantity())
                        .unitPrice(prodReq.unitPrice())
                        .build();
                entity.getProducts().add(prod);
            }
        }
    }
}
