package com.autotech.tag.service;

import com.autotech.common.exception.DuplicateResourceException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.tag.dto.TagMapper;
import com.autotech.tag.dto.TagRequest;
import com.autotech.tag.dto.TagResponse;
import com.autotech.tag.model.Tag;
import com.autotech.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getAll() {
        log.debug("Fetching all tags");
        return tagMapper.toResponseList(tagRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public TagResponse getById(Long id) {
        log.debug("Fetching tag with id {}", id);
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", id));
        return tagMapper.toResponse(tag);
    }

    @Override
    @Transactional
    public TagResponse create(TagRequest request) {
        if (tagRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Ya existe una etiqueta con el nombre: " + request.name());
        }
        Tag entity = tagMapper.toEntity(request);
        Tag saved = tagRepository.save(entity);
        log.info("Created tag with id {}", saved.getId());
        return tagMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public TagResponse update(Long id, TagRequest request) {
        Tag entity = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", id));
        entity.setName(request.name());
        entity.setColor(request.color());
        Tag saved = tagRepository.save(entity);
        log.info("Updated tag with id {}", saved.getId());
        return tagMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tag", id);
        }
        tagRepository.deleteById(id);
        log.info("Deleted tag with id {}", id);
    }
}
