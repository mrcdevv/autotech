package com.autotech.tag.service;

import com.autotech.tag.dto.TagRequest;
import com.autotech.tag.dto.TagResponse;

import java.util.List;

public interface TagService {

    List<TagResponse> getAll();

    TagResponse getById(Long id);

    TagResponse create(TagRequest request);

    TagResponse update(Long id, TagRequest request);

    void delete(Long id);
}
