package com.autotech.common.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private static final String CONFLICT_MESSAGE =
            "La operación entra en conflicto con datos ya existentes. Verificá la información e intentá nuevamente";

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void givenDataIntegrityViolationException_whenHandled_thenRespondWith409AndSpanishConflictMessage() throws Exception {
        mockMvc.perform(get("/throw/data-integrity-violation"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value(CONFLICT_MESSAGE));
    }

    @Test
    void givenDataIntegrityViolationExceptionWithSqlDetail_whenHandled_thenResponseDoesNotLeakSqlDetails() throws Exception {
        String body = mockMvc.perform(get("/throw/data-integrity-violation"))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(body)
                .doesNotContain("uk_delivery_note_repair_order")
                .doesNotContain("repair_order_id")
                .doesNotContain("duplicate key");
    }

    // Negative control: an unrelated runtime fault must still surface as a
    // genuine 500 so the new mapping never hides server-side errors.
    @Test
    void givenUnrelatedRuntimeException_whenHandled_thenRespondWith500AndGenericMessage() throws Exception {
        mockMvc.perform(get("/throw/runtime-exception"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }

    @RestController
    static class ThrowingController {

        @GetMapping("/throw/data-integrity-violation")
        public String throwDataIntegrityViolation() {
            throw new DataIntegrityViolationException(
                    "could not execute statement; SQL [n/a]",
                    new SQLException("ERROR: duplicate key value violates unique constraint \"uk_delivery_note_repair_order\"\n"
                            + "  Detail: Key (repair_order_id)=(5) already exists."));
        }

        @GetMapping("/throw/runtime-exception")
        public String throwRuntimeException() {
            throw new IllegalStateException("genuine internal fault");
        }
    }
}
