package com.autotech.deliverynote.repository;

import com.autotech.deliverynote.model.DeliveryNoteServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryNoteServiceItemRepository extends JpaRepository<DeliveryNoteServiceItem, Long> {

    List<DeliveryNoteServiceItem> findByDeliveryNoteId(Long deliveryNoteId);

    void deleteByDeliveryNoteId(Long deliveryNoteId);
}
