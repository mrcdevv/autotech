package com.autotech.tag.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.tag.dto.TagRequest;
import com.autotech.tag.dto.TagResponse;
import com.autotech.tag.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(tagService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tagService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> create(@Valid @RequestBody TagRequest request) {
        TagResponse created = tagService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Etiqueta creada", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TagRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Etiqueta actualizada", tagService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        tagService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Etiqueta eliminada", null));
    }
}
