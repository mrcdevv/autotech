package com.autotech.catalog.service;

import com.autotech.catalog.dto.ProductRequest;
import com.autotech.catalog.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {

    /** @param lowStock when true, only products whose available stock is below their minimum */
    Page<ProductResponse> search(String query, boolean lowStock, Pageable pageable);

    /** Every low-stock product, the ones furthest below their minimum first. */
    List<ProductResponse> getLowStock();

    ProductResponse getById(Long id);

    ProductResponse create(ProductRequest request);

    ProductResponse update(Long id, ProductRequest request);

    void delete(Long id);
}
