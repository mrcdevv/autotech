package com.autotech.inspection.service;

import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.inspection.dto.InspectionGroupWithItemsResponse;
import com.autotech.inspection.dto.InspectionItemRequest;
import com.autotech.inspection.dto.InspectionMapper;
import com.autotech.inspection.dto.InspectionResponse;
import com.autotech.inspection.dto.SaveInspectionItemsRequest;
import com.autotech.inspection.model.Inspection;
import com.autotech.inspection.model.InspectionItem;
import com.autotech.inspection.model.InspectionItemStatus;
import com.autotech.inspection.model.InspectionTemplate;
import com.autotech.inspection.model.InspectionTemplateGroup;
import com.autotech.inspection.model.InspectionTemplateItem;
import com.autotech.inspection.repository.InspectionRepository;
import com.autotech.inspection.repository.InspectionTemplateRepository;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InspectionServiceImpl implements InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionTemplateRepository templateRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final InspectionMapper inspectionMapper;

    @Override
    @Transactional
    public InspectionResponse createForRepairOrder(Long repairOrderId, Long templateId) {
        RepairOrder repairOrder = repairOrderRepository.findById(repairOrderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la orden de reparación con ID " + repairOrderId));

        InspectionTemplate template = templateRepository.findWithGroupsAndItemsById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la plantilla de inspección con ID " + templateId));

        Inspection inspection = Inspection.builder()
                .repairOrder(repairOrder)
                .template(template)
                .build();

        for (InspectionTemplateGroup group : template.getGroups()) {
            for (InspectionTemplateItem templateItem : group.getItems()) {
                InspectionItem item = InspectionItem.builder()
                        .inspection(inspection)
                        .templateItem(templateItem)
                        .status(InspectionItemStatus.NO_APLICA)
                        .build();
                inspection.getItems().add(item);
            }
        }

        Inspection saved = inspectionRepository.save(inspection);
        log.info("Created inspection {} for repair order {} from template {}",
                saved.getId(), repairOrderId, templateId);
        return buildResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InspectionResponse> getByRepairOrder(Long repairOrderId) {
        if (!repairOrderRepository.existsById(repairOrderId)) {
            throw new ResourceNotFoundException(
                    "No se encontró la orden de reparación con ID " + repairOrderId);
        }
        List<Inspection> inspections = inspectionRepository.findByRepairOrderId(repairOrderId);
        return inspections.stream().map(this::buildResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InspectionResponse getById(Long id) {
        Inspection inspection = inspectionRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la inspección con ID " + id));
        return buildResponse(inspection);
    }

    @Override
    @Transactional
    public InspectionResponse saveItems(Long inspectionId, SaveInspectionItemsRequest request) {
        Inspection inspection = inspectionRepository.findWithItemsById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la inspección con ID " + inspectionId));

        Map<Long, InspectionItem> existingItems = inspection.getItems().stream()
                .collect(Collectors.toMap(InspectionItem::getId, Function.identity()));

        for (InspectionItemRequest itemRequest : request.items()) {
            InspectionItem item = existingItems.get(itemRequest.id());
            if (item == null) {
                throw new ResourceNotFoundException(
                        "No se encontró el ítem de inspección con ID " + itemRequest.id());
            }
            item.setStatus(itemRequest.status());
            item.setComment(itemRequest.comment());
        }

        Inspection saved = inspectionRepository.save(inspection);
        log.info("Saved items for inspection {}", inspectionId);
        return buildResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Inspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la inspección con ID " + id));
        inspectionRepository.delete(inspection);
        log.info("Deleted inspection with id {}", id);
    }

    private InspectionResponse buildResponse(Inspection inspection) {
        Map<Long, List<InspectionItem>> itemsByGroupId = inspection.getItems().stream()
                .collect(Collectors.groupingBy(item -> item.getTemplateItem().getGroup().getId()));

        InspectionTemplate fullTemplate = templateRepository.findWithGroupsAndItemsById(
                inspection.getTemplate().getId()).orElse(inspection.getTemplate());

        List<InspectionGroupWithItemsResponse> groups = fullTemplate.getGroups().stream()
                .filter(group -> itemsByGroupId.containsKey(group.getId()))
                .sorted(Comparator.comparing(InspectionTemplateGroup::getSortOrder))
                .map(group -> new InspectionGroupWithItemsResponse(
                        group.getId(),
                        group.getTitle(),
                        group.getSortOrder(),
                        itemsByGroupId.get(group.getId()).stream()
                                .sorted(Comparator.comparing(item -> item.getTemplateItem().getSortOrder()))
                                .map(inspectionMapper::toItemResponse)
                                .toList()
                ))
                .toList();

        return new InspectionResponse(
                inspection.getId(),
                inspection.getRepairOrder().getId(),
                fullTemplate.getId(),
                fullTemplate.getTitle(),
                groups,
                inspection.getCreatedAt(),
                inspection.getUpdatedAt()
        );
    }
}
