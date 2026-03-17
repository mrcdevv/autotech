package com.autotech.inspection.service;

import com.autotech.inspection.dto.InspectionTemplateRequest;
import com.autotech.inspection.dto.InspectionTemplateResponse;

import java.util.List;

public interface InspectionTemplateService {

    List<InspectionTemplateResponse> getAll();

    InspectionTemplateResponse getById(Long id);

    InspectionTemplateResponse create(InspectionTemplateRequest request);

    InspectionTemplateResponse update(Long id, InspectionTemplateRequest request);

    void delete(Long id);

    InspectionTemplateResponse duplicate(Long id);
}
