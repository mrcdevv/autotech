package com.autotech.notification.controller;

import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.notification.dto.PublicUnsubscribeResponse;
import com.autotech.notification.service.UnsubscribeService;
import com.autotech.security.CustomUserDetailsService;
import com.autotech.security.JwtTokenProvider;
import com.autotech.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicUnsubscribeController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class PublicUnsubscribeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UnsubscribeService unsubscribeService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void givenAnonymousUser_whenUnsubscribe_thenReturn200() throws Exception {
        when(unsubscribeService.unsubscribe("tok")).thenReturn(new PublicUnsubscribeResponse("Ana", true));

        mockMvc.perform(post("/api/public/unsubscribe/tok"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.optedOut").value(true));
    }
}
