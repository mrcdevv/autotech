package com.autotech.bankaccount.controller;

import com.autotech.bankaccount.dto.BankAccountRequest;
import com.autotech.bankaccount.dto.BankAccountResponse;
import com.autotech.bankaccount.dto.BankResponse;
import com.autotech.bankaccount.service.BankAccountService;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.common.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BankAccountController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class BankAccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private BankAccountService bankAccountService;

    private final BankAccountResponse sampleResponse = new BankAccountResponse(
            1L, 1L, "Banco Test", "Mi Cuenta", "123456", LocalDateTime.now());

    @Test
    void givenAccountsExist_whenGetAll_thenReturn200() throws Exception {
        when(bankAccountService.getAll()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/bank-accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].alias").value("Mi Cuenta"));
    }

    @Test
    void givenValidId_whenGetById_thenReturn200() throws Exception {
        when(bankAccountService.getById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/bank-accounts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void givenNonExistentId_whenGetById_thenReturn404() throws Exception {
        when(bankAccountService.getById(99L)).thenThrow(new ResourceNotFoundException("BankAccount", 99L));

        mockMvc.perform(get("/api/bank-accounts/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        BankAccountRequest request = new BankAccountRequest(1L, "Mi Cuenta", "123456");
        when(bankAccountService.create(any(BankAccountRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/bank-accounts")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Cuenta bancaria creada"));
    }

    @Test
    void givenInvalidRequest_whenCreate_thenReturn400() throws Exception {
        BankAccountRequest request = new BankAccountRequest(null, "", null);

        mockMvc.perform(post("/api/bank-accounts")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        BankAccountRequest request = new BankAccountRequest(1L, "Updated", "999999");
        when(bankAccountService.update(eq(1L), any(BankAccountRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/bank-accounts/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cuenta bancaria actualizada"));
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        doNothing().when(bankAccountService).delete(1L);

        mockMvc.perform(delete("/api/bank-accounts/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cuenta bancaria eliminada"));
    }

    @Test
    void givenBanksExist_whenGetAllBanks_thenReturn200() throws Exception {
        when(bankAccountService.getAllBanks()).thenReturn(
                List.of(new BankResponse(1L, "Banco Test")));

        mockMvc.perform(get("/api/bank-accounts/banks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Banco Test"));
    }
}
