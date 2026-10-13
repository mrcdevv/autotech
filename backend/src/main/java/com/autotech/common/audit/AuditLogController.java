package com.autotech.common.audit;

import com.autotech.common.audit.dto.AuditEntryResponse;
import com.autotech.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * History of one entity, newest first. Example:
     * GET /api/audit-logs?entityType=ESTIMATE&entityId=5
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditEntryResponse>>> getHistory(
            @RequestParam String entityType, @RequestParam Long entityId) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getHistory(entityType, entityId)));
    }
}
