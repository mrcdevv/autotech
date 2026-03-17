package com.autotech.inspection.service;

import com.autotech.inspection.dto.CommonProblemRequest;
import com.autotech.inspection.dto.CommonProblemResponse;

import java.util.List;

public interface CommonProblemService {

    List<CommonProblemResponse> getAll();

    CommonProblemResponse getById(Long id);

    CommonProblemResponse create(CommonProblemRequest request);

    CommonProblemResponse update(Long id, CommonProblemRequest request);

    void delete(Long id);
}
