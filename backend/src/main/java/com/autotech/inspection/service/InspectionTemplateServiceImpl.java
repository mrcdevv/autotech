package com.autotech.inspection.service;

import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.inspection.dto.InspectionTemplateGroupRequest;
import com.autotech.inspection.dto.InspectionTemplateItemRequest;
import com.autotech.inspection.dto.InspectionTemplateMapper;
import com.autotech.inspection.dto.InspectionTemplateRequest;
import com.autotech.inspection.dto.InspectionTemplateResponse;
import com.autotech.inspection.model.InspectionTemplate;
import com.autotech.inspection.model.InspectionTemplateGroup;
import com.autotech.inspection.model.InspectionTemplateItem;
import com.autotech.inspection.repository.InspectionTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InspectionTemplateServiceImpl implements InspectionTemplateService {

    private final InspectionTemplateRepository templateRepository;
    private final InspectionTemplateMapper templateMapper;

    @Override
    @Transactional(readOnly = true)
    public List<InspectionTemplateResponse> getAll() {
        log.debug("Fetching all inspection templates");
        return templateMapper.toResponseList(templateRepository.findAllByOrderByTitleAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public InspectionTemplateResponse getById(Long id) {
        log.debug("Fetching inspection template with id {}", id);
        InspectionTemplate template = templateRepository.findWithGroupsAndItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la plantilla de inspección con ID " + id));
        return templateMapper.toResponse(template);
    }

    @Override
    @Transactional
    public InspectionTemplateResponse create(InspectionTemplateRequest request) {
        InspectionTemplate template = InspectionTemplate.builder()
                .title(request.title())
                .build();

        for (InspectionTemplateGroupRequest groupReq : request.groups()) {
            InspectionTemplateGroup group = InspectionTemplateGroup.builder()
                    .template(template)
                    .title(groupReq.title())
                    .sortOrder(groupReq.sortOrder())
                    .build();

            for (InspectionTemplateItemRequest itemReq : groupReq.items()) {
                InspectionTemplateItem item = InspectionTemplateItem.builder()
                        .group(group)
                        .name(itemReq.name())
                        .sortOrder(itemReq.sortOrder())
                        .build();
                group.getItems().add(item);
            }

            template.getGroups().add(group);
        }

        InspectionTemplate saved = templateRepository.save(template);
        log.info("Created inspection template with id {}", saved.getId());
        return templateMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public InspectionTemplateResponse update(Long id, InspectionTemplateRequest request) {
        InspectionTemplate template = templateRepository.findWithGroupsAndItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la plantilla de inspección con ID " + id));

        template.setTitle(request.title());

        Set<Long> requestGroupIds = request.groups().stream()
                .map(InspectionTemplateGroupRequest::id)
                .filter(gId -> gId != null)
                .collect(Collectors.toSet());

        template.getGroups().removeIf(g -> !requestGroupIds.contains(g.getId()));

        Map<Long, InspectionTemplateGroup> existingGroupsMap = template.getGroups().stream()
                .collect(Collectors.toMap(InspectionTemplateGroup::getId, g -> g));

        List<InspectionTemplateGroup> orderedGroups = new ArrayList<>();

        for (InspectionTemplateGroupRequest groupReq : request.groups()) {
            InspectionTemplateGroup group;

            if (groupReq.id() != null && existingGroupsMap.containsKey(groupReq.id())) {
                group = existingGroupsMap.get(groupReq.id());
                group.setTitle(groupReq.title());
                group.setSortOrder(groupReq.sortOrder());

                Set<Long> requestItemIds = groupReq.items().stream()
                        .map(InspectionTemplateItemRequest::id)
                        .filter(iId -> iId != null)
                        .collect(Collectors.toSet());

                group.getItems().removeIf(i -> !requestItemIds.contains(i.getId()));

                Map<Long, InspectionTemplateItem> existingItemsMap = group.getItems().stream()
                        .collect(Collectors.toMap(InspectionTemplateItem::getId, i -> i));

                List<InspectionTemplateItem> orderedItems = new ArrayList<>();

                for (InspectionTemplateItemRequest itemReq : groupReq.items()) {
                    InspectionTemplateItem item;
                    if (itemReq.id() != null && existingItemsMap.containsKey(itemReq.id())) {
                        item = existingItemsMap.get(itemReq.id());
                        item.setName(itemReq.name());
                        item.setSortOrder(itemReq.sortOrder());
                    } else {
                        item = InspectionTemplateItem.builder()
                                .group(group)
                                .name(itemReq.name())
                                .sortOrder(itemReq.sortOrder())
                                .build();
                        group.getItems().add(item);
                    }
                    orderedItems.add(item);
                }
            } else {
                group = InspectionTemplateGroup.builder()
                        .template(template)
                        .title(groupReq.title())
                        .sortOrder(groupReq.sortOrder())
                        .build();

                for (InspectionTemplateItemRequest itemReq : groupReq.items()) {
                    InspectionTemplateItem item = InspectionTemplateItem.builder()
                            .group(group)
                            .name(itemReq.name())
                            .sortOrder(itemReq.sortOrder())
                            .build();
                    group.getItems().add(item);
                }

                template.getGroups().add(group);
            }

            orderedGroups.add(group);
        }

        InspectionTemplate saved = templateRepository.save(template);
        log.info("Updated inspection template with id {}", saved.getId());
        return templateMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        InspectionTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la plantilla de inspección con ID " + id));
        templateRepository.delete(template);
        log.info("Deleted inspection template with id {}", id);
    }

    @Override
    @Transactional
    public InspectionTemplateResponse duplicate(Long id) {
        InspectionTemplate original = templateRepository.findWithGroupsAndItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la plantilla de inspección con ID " + id));

        InspectionTemplate copy = InspectionTemplate.builder()
                .title(original.getTitle() + " (Copia)")
                .build();

        for (InspectionTemplateGroup originalGroup : original.getGroups()) {
            InspectionTemplateGroup groupCopy = InspectionTemplateGroup.builder()
                    .template(copy)
                    .title(originalGroup.getTitle())
                    .sortOrder(originalGroup.getSortOrder())
                    .build();

            for (InspectionTemplateItem originalItem : originalGroup.getItems()) {
                InspectionTemplateItem itemCopy = InspectionTemplateItem.builder()
                        .group(groupCopy)
                        .name(originalItem.getName())
                        .sortOrder(originalItem.getSortOrder())
                        .build();
                groupCopy.getItems().add(itemCopy);
            }

            copy.getGroups().add(groupCopy);
        }

        InspectionTemplate saved = templateRepository.save(copy);
        log.info("Duplicated inspection template {} to new template {}", id, saved.getId());
        return templateMapper.toResponse(saved);
    }
}
