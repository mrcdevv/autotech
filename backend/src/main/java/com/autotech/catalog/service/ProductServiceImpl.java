package com.autotech.catalog.service;

import com.autotech.catalog.dto.ProductMapper;
import com.autotech.catalog.dto.ProductRequest;
import com.autotech.catalog.dto.ProductResponse;
import com.autotech.catalog.model.Product;
import com.autotech.catalog.repository.ProductRepository;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final StockService stockService;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String query, boolean lowStock, Pageable pageable) {
        log.debug("Searching products with query: '{}', lowStock: {}", query, lowStock);
        if (lowStock) {
            String pattern = "%" + (query == null ? "" : query.trim().toLowerCase()) + "%";
            return productRepository.findLowStock(pattern, pageable)
                    .map(productMapper::toResponse);
        }
        if (query == null || query.isBlank()) {
            return productRepository.findAll(pageable)
                    .map(productMapper::toResponse);
        }
        return productRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query, pageable)
                .map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStock() {
        return productRepository.findAllLowStock().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        log.debug("Fetching product with id {}", id);
        Product entity = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return productMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product entity = productMapper.toEntity(request);
        Product saved = productRepository.save(entity);
        stockService.recordInitial(saved);
        log.info("Created product with id {}", saved.getId());
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product entity = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        productMapper.updateEntity(request, entity);
        Product saved = productRepository.save(entity);
        log.info("Updated product with id {}", saved.getId());
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", id);
        }
        productRepository.deleteById(id);
        log.info("Deleted product with id {}", id);
    }
}
