package com.autotech.deliverynote.repository;

import com.autotech.deliverynote.model.DeliveryNoteProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryNoteProductRepository extends JpaRepository<DeliveryNoteProduct, Long> {

    List<DeliveryNoteProduct> findByDeliveryNoteId(Long deliveryNoteId);

    void deleteByDeliveryNoteId(Long deliveryNoteId);
}
