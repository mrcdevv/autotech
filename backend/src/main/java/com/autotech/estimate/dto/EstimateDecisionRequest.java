package com.autotech.estimate.dto;

import com.autotech.estimate.model.EstimateDecisionChannel;
import jakarta.validation.constraints.NotNull;

public record EstimateDecisionRequest(

        @NotNull(message = "Indicá por qué medio respondió el cliente")
        EstimateDecisionChannel channel
) {}
