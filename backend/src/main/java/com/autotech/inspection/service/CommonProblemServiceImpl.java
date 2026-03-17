package com.autotech.inspection.service;

import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.inspection.dto.CommonProblemMapper;
import com.autotech.inspection.dto.CommonProblemRequest;
import com.autotech.inspection.dto.CommonProblemResponse;
import com.autotech.inspection.model.CommonProblem;
import com.autotech.inspection.repository.CommonProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommonProblemServiceImpl implements CommonProblemService {

    private final CommonProblemRepository commonProblemRepository;
    private final CommonProblemMapper commonProblemMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CommonProblemResponse> getAll() {
        log.debug("Fetching all common problems");
        return commonProblemMapper.toResponseList(commonProblemRepository.findAllByOrderByDescriptionAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public CommonProblemResponse getById(Long id) {
        log.debug("Fetching common problem with id {}", id);
        CommonProblem problem = commonProblemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el problema común con ID " + id));
        return commonProblemMapper.toResponse(problem);
    }

    @Override
    @Transactional
    public CommonProblemResponse create(CommonProblemRequest request) {
        CommonProblem entity = commonProblemMapper.toEntity(request);
        CommonProblem saved = commonProblemRepository.save(entity);
        log.info("Created common problem with id {}", saved.getId());
        return commonProblemMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CommonProblemResponse update(Long id, CommonProblemRequest request) {
        CommonProblem existing = commonProblemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el problema común con ID " + id));
        existing.setDescription(request.description());
        CommonProblem saved = commonProblemRepository.save(existing);
        log.info("Updated common problem with id {}", saved.getId());
        return commonProblemMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        CommonProblem existing = commonProblemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el problema común con ID " + id));
        commonProblemRepository.delete(existing);
        log.info("Deleted common problem with id {}", id);
    }
}
