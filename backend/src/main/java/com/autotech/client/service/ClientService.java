package com.autotech.client.service;

import com.autotech.client.dto.ClientAutocompleteResponse;
import com.autotech.client.dto.ClientRequest;
import com.autotech.client.dto.ClientResponse;
import com.autotech.client.dto.ClientUpgradeRequest;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ClientService {

    Page<ClientResponse> getAll(Pageable pageable);

    ClientResponse getById(Long id);

    Client findEntityById(Long id);

    List<ClientAutocompleteResponse> autocomplete(String query);

    ClientResponse create(ClientRequest request);

    ClientResponse update(Long id, ClientRequest request);

    void delete(Long id);

    Page<ClientResponse> search(String query, Pageable pageable);

    Page<ClientResponse> findByClientType(ClientType clientType, Pageable pageable);

    ClientResponse upgradeToRegistered(Long id, ClientUpgradeRequest request);

    byte[] exportToExcel();
}
