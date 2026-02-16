package com.autotech.client.service;

import com.autotech.client.dto.ClientMapper;
import com.autotech.client.dto.ClientRequest;
import com.autotech.client.dto.ClientResponse;
import com.autotech.client.dto.ClientUpgradeRequest;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final ClientMapper clientMapper;

    // --- CRUD ---

    @Override
    @Transactional(readOnly = true)
    public Page<ClientResponse> getAll(Pageable pageable) {
        return clientRepository.findAll(pageable).map(clientMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ClientResponse getById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));
        return clientMapper.toResponse(client);
    }

    @Override
    @Transactional
    public ClientResponse create(ClientRequest request) {
        validateClientType(request);
        validateDniUniqueness(request.dni());
        Client client = clientMapper.toEntity(request);
        Client saved = clientRepository.save(client);
        log.info("Created client with id {}", saved.getId());
        return clientMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ClientResponse update(Long id, ClientRequest request) {
        Client existing = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));
        validateClientType(request);
        validateDniUniquenessForUpdate(request.dni(), id);

        existing.setFirstName(request.firstName());
        existing.setLastName(request.lastName());
        existing.setDni(request.dni());
        existing.setCommercialName(request.commercialName());
        existing.setEmail(request.email());
        existing.setPhone(request.phone());
        existing.setAddress(request.address());
        existing.setProvince(request.province());
        existing.setCountry(request.country());
        existing.setClientType(request.clientType());
        existing.setEntryDate(request.entryDate());

        Client saved = clientRepository.save(existing);
        log.info("Updated client with id {}", saved.getId());
        return clientMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client not found with id: " + id);
        }
        // TODO: Check for dependencies (Vehicles, Orders, etc.) once implemented
        clientRepository.deleteById(id);
        log.info("Deleted client with id {}", id);
    }

    // --- Search & Filter ---

    @Override
    @Transactional(readOnly = true)
    public Page<ClientResponse> search(String query, Pageable pageable) {
        return clientRepository.search(query, pageable).map(clientMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClientResponse> findByClientType(ClientType clientType, Pageable pageable) {
        return clientRepository.findByClientType(clientType, pageable).map(clientMapper::toResponse);
    }

    // --- Upgrade ---

    @Override
    @Transactional
    public ClientResponse upgradeToRegistered(Long id, ClientUpgradeRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));

        if (client.getClientType() != ClientType.TEMPORAL) {
            throw new IllegalStateException("Solo los clientes TEMPORAL pueden ser actualizados");
        }
        if (request.clientType() == ClientType.TEMPORAL) {
            throw new IllegalArgumentException("El tipo de cliente destino no puede ser TEMPORAL");
        }

        validateDniUniqueness(request.dni());

        client.setDni(request.dni());
        client.setCommercialName(request.commercialName());
        client.setEmail(request.email());
        client.setAddress(request.address());
        client.setProvince(request.province());
        client.setCountry(request.country());
        client.setClientType(request.clientType());
        client.setEntryDate(request.entryDate());

        Client saved = clientRepository.save(client);
        log.info("Upgraded client {} from TEMPORAL to {}", id, request.clientType());
        return clientMapper.toResponse(saved);
    }

    // --- Export ---

    @Override
    @Transactional(readOnly = true)
    public byte[] exportToExcel() {
        List<Client> clients = clientRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Clientes");

            // Header
            Row headerRow = sheet.createRow(0);
            String[] headers = { "ID", "Nombre", "Apellido", "DNI", "Nombre Comercial", "Email", "Teléfono",
                    "Dirección", "Provincia", "País", "Tipo", "Fecha Entrada" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }

            // Data
            int rowIdx = 1;
            for (Client client : clients) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(client.getId());
                row.createCell(1).setCellValue(client.getFirstName());
                row.createCell(2).setCellValue(client.getLastName());
                row.createCell(3).setCellValue(client.getDni() != null ? client.getDni() : "");
                row.createCell(4).setCellValue(client.getCommercialName() != null ? client.getCommercialName() : "");
                row.createCell(5).setCellValue(client.getEmail() != null ? client.getEmail() : "");
                row.createCell(6).setCellValue(client.getPhone());
                row.createCell(7).setCellValue(client.getAddress() != null ? client.getAddress() : "");
                row.createCell(8).setCellValue(client.getProvince() != null ? client.getProvince() : "");
                row.createCell(9).setCellValue(client.getCountry() != null ? client.getCountry() : "");
                row.createCell(10).setCellValue(client.getClientType().name());
                row.createCell(11).setCellValue(client.getEntryDate() != null ? client.getEntryDate().toString() : "");
            }

            // Auto size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Error exporting clients to Excel", e);
            throw new RuntimeException("Error al exportar clientes a Excel", e);
        }
    }

    // --- Private helpers ---

    private void validateClientType(ClientRequest request) {
        if (request.clientType() == ClientType.PERSONAL || request.clientType() == ClientType.EMPRESA) {
            if (request.dni() == null || request.dni().isBlank()) {
                throw new IllegalArgumentException("El DNI es obligatorio para clientes PERSONAL y EMPRESA");
            }
            if (request.address() == null || request.address().isBlank()) {
                throw new IllegalArgumentException("La dirección es obligatoria para clientes PERSONAL y EMPRESA");
            }
            if (request.province() == null || request.province().isBlank()) {
                throw new IllegalArgumentException("La provincia es obligatoria para clientes PERSONAL y EMPRESA");
            }
            if (request.country() == null || request.country().isBlank()) {
                throw new IllegalArgumentException("El país es obligatorio para clientes PERSONAL y EMPRESA");
            }
        }
    }

    private void validateDniUniqueness(String dni) {
        if (dni != null && !dni.isBlank() && clientRepository.existsByDni(dni)) {
            throw new IllegalArgumentException("Ya existe un cliente con el DNI: " + dni);
        }
    }

    private void validateDniUniquenessForUpdate(String dni, Long clientId) {
        if (dni != null && !dni.isBlank()) {
            clientRepository.findByDniContaining(dni, Pageable.unpaged())
                    .stream()
                    .filter(c -> !c.getId().equals(clientId))
                    .findAny()
                    .ifPresent(c -> {
                        throw new IllegalArgumentException("Ya existe un cliente con el DNI: " + dni);
                    });
        }
    }
}
