package com.autotech.client.dto;

import com.autotech.client.model.Client;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ClientMapper {

    public ClientResponse toResponse(Client entity) {
        if (entity == null)
            return null;
        return new ClientResponse(
                entity.getId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getDni(),
                entity.getCommercialName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getAddress(),
                entity.getProvince(),
                entity.getCountry(),
                entity.getClientType(),
                entity.getEntryDate(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    public Client toEntity(ClientRequest request) {
        if (request == null)
            return null;
        return Client.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .dni(request.dni())
                .commercialName(request.commercialName())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .province(request.province())
                .country(request.country())
                .clientType(request.clientType())
                .entryDate(request.entryDate())
                .build();
    }

    public List<ClientResponse> toResponseList(List<Client> entities) {
        if (entities == null)
            return List.of();
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
