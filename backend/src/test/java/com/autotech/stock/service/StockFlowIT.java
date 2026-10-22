package com.autotech.stock.service;

import com.autotech.catalog.model.Product;
import com.autotech.catalog.repository.ProductRepository;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.repository.ClientRepository;
import com.autotech.deliverynote.dto.DeliveryNoteDetailResponse;
import com.autotech.deliverynote.dto.DeliveryNoteProductRequest;
import com.autotech.deliverynote.dto.DeliveryNoteRequest;
import com.autotech.deliverynote.service.DeliveryNoteService;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateProductRequest;
import com.autotech.estimate.dto.EstimateRequest;
import com.autotech.estimate.model.EstimateDecisionChannel;
import com.autotech.estimate.service.EstimateService;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.service.RepairOrderService;
import com.autotech.stock.model.StockMovement;
import com.autotech.stock.model.StockMovementType;
import com.autotech.stock.model.StockSourceType;
import com.autotech.stock.repository.StockMovementRepository;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

/**
 * One test per row of the agreed stock design, through the real services and a real PostgreSQL schema.
 * Each test runs in a transaction that is rolled back afterwards.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StockFlowIT {

    @Autowired private StockService stockService;
    @Autowired private EstimateService estimateService;
    @Autowired private RepairOrderService repairOrderService;
    @Autowired private DeliveryNoteService deliveryNoteService;
    @Autowired private ProductRepository productRepository;
    @Autowired private StockMovementRepository stockMovementRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private VehicleRepository vehicleRepository;

    private Product oil;
    private Product filter;
    private Client client;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        oil = productRepository.save(Product.builder().name("Aceite IT").quantity(10).minStock(2).build());
        filter = productRepository.save(Product.builder().name("Filtro IT").quantity(5).build());
        client = clientRepository.save(Client.builder()
                .firstName("Stock").lastName("Tester").phone("3510000000").clientType(ClientType.PERSONAL).build());
        vehicle = vehicleRepository.save(Vehicle.builder()
                .client(client).plate("IT" + UUID.randomUUID().toString().substring(0, 6)).build());
    }

    // ---------------------------------------------------------------------
    // Repair order lifecycle
    // ---------------------------------------------------------------------

    @Test
    void givenEstimateOnRepairOrder_whenApproved_thenReservesOnlyCatalogLinkedLines() {
        // Arrange
        Long orderId = createRepairOrder();

        // Act
        createApprovedEstimate(orderId, line(oil, 3), freeTextLine("Tornillos sueltos", 4));

        // Assert
        assertStock(oil, 10, 3);
        assertThat(movements(StockSourceType.REPAIR_ORDER, orderId))
                .extracting(StockMovement::getType, StockMovement::getQuantity)
                .containsExactly(tuple(StockMovementType.RESERVE, 3));
    }

    @Test
    void givenPendingEstimate_whenNotApprovedYet_thenNothingIsReserved() {
        // Arrange
        Long orderId = createRepairOrder();

        // Act
        estimateService.create(estimateRequest(orderId, line(oil, 3)));

        // Assert
        assertStock(oil, 10, 0);
    }

    @Test
    void givenApprovedEstimate_whenRepairOrderDeliveredWithoutDeliveryNote_thenConsumesAndReleases() {
        // Arrange
        Long orderId = createRepairOrder();
        createApprovedEstimate(orderId, line(oil, 3), line(filter, 1));

        // Act
        changeStatus(orderId, RepairOrderStatus.ENTREGADO);

        // Assert
        assertStock(oil, 7, 0);
        assertStock(filter, 4, 0);
        assertThat(movements(StockSourceType.REPAIR_ORDER, orderId))
                .extracting(StockMovement::getType)
                .containsExactlyInAnyOrder(
                        StockMovementType.RESERVE, StockMovementType.RESERVE,
                        StockMovementType.RELEASE, StockMovementType.RELEASE,
                        StockMovementType.CONSUME, StockMovementType.CONSUME);
    }

    @Test
    void givenApprovedEstimate_whenRepairOrderCancelled_thenReleasesReservation() {
        // Arrange
        Long orderId = createRepairOrder();
        createApprovedEstimate(orderId, line(oil, 3));

        // Act
        changeStatus(orderId, RepairOrderStatus.CANCELADO);

        // Assert
        assertStock(oil, 10, 0);
    }

    @Test
    void givenDeliveredOrder_whenMovedBackToRepair_thenReturnsStockAndReservesAgain() {
        // Arrange
        Long orderId = createRepairOrder();
        createApprovedEstimate(orderId, line(oil, 3));
        changeStatus(orderId, RepairOrderStatus.ENTREGADO);

        // Act
        changeStatus(orderId, RepairOrderStatus.REPARACION);

        // Assert
        assertStock(oil, 10, 3);
    }

    @Test
    void givenOrderBouncingInAndOutOfDelivered_whenDeliveredAgain_thenStockIsConsumedOnlyOnce() {
        // Arrange
        Long orderId = createRepairOrder();
        createApprovedEstimate(orderId, line(oil, 3));

        // Act
        changeStatus(orderId, RepairOrderStatus.ENTREGADO);
        changeStatus(orderId, RepairOrderStatus.ENTREGADO);
        changeStatus(orderId, RepairOrderStatus.PRUEBAS);
        changeStatus(orderId, RepairOrderStatus.ENTREGADO);

        // Assert
        assertStock(oil, 7, 0);
    }

    @Test
    void givenSyncedOrder_whenSyncedAgain_thenNoNewMovementsAreWritten() {
        // Arrange
        Long orderId = createRepairOrder();
        createApprovedEstimate(orderId, line(oil, 3));
        int before = movements(StockSourceType.REPAIR_ORDER, orderId).size();

        // Act
        stockService.syncRepairOrder(orderId);
        stockService.syncRepairOrder(orderId);

        // Assert
        assertThat(movements(StockSourceType.REPAIR_ORDER, orderId)).hasSize(before);
        assertStock(oil, 10, 3);
    }

    @Test
    void givenEstimateRejected_whenOrderOpen_thenNothingStaysReserved() {
        // Arrange
        Long orderId = createRepairOrder();
        EstimateDetailResponse estimate = estimateService.create(estimateRequest(orderId, line(oil, 3)));

        // Act
        estimateService.reject(estimate.id(), EstimateDecisionChannel.PHONE, null);

        // Assert
        assertStock(oil, 10, 0);
    }

    @Test
    void givenApprovedEstimate_whenDeleted_thenReservationIsReleased() {
        // Arrange
        Long orderId = createRepairOrder();
        Long estimateId = createApprovedEstimate(orderId, line(oil, 3));

        // Act
        estimateService.delete(estimateId);

        // Assert
        assertStock(oil, 10, 0);
    }

    @Test
    void givenStandaloneEstimate_whenApproved_thenNothingIsReserved() {
        // Arrange & Act
        createApprovedEstimate(null, line(oil, 3));

        // Assert
        assertStock(oil, 10, 0);
    }

    @Test
    void givenConsumptionAboveOnHand_whenDelivered_thenOnHandGoesNegative() {
        // Arrange
        Long orderId = createRepairOrder();
        createApprovedEstimate(orderId, line(filter, 8));

        // Act
        changeStatus(orderId, RepairOrderStatus.ENTREGADO);

        // Assert
        assertStock(filter, -3, 0);
    }

    // ---------------------------------------------------------------------
    // Delivery notes
    // ---------------------------------------------------------------------

    @Test
    void givenDeliveryNoteWithoutRepairOrder_whenCreated_thenConsumesLinkedLines() {
        // Act
        DeliveryNoteDetailResponse note = deliveryNoteService.create(
                deliveryNoteRequest(null, dnLine(oil, 2), dnFreeTextLine("Lampara", 1)));

        // Assert
        assertStock(oil, 8, 0);
        assertThat(movements(StockSourceType.DELIVERY_NOTE, note.id()))
                .extracting(StockMovement::getType)
                .containsExactly(StockMovementType.CONSUME);
    }

    @Test
    void givenDeliveryNoteWithoutRepairOrder_whenDeleted_thenReturnsStock() {
        // Arrange
        DeliveryNoteDetailResponse note = deliveryNoteService.create(deliveryNoteRequest(null, dnLine(oil, 2)));

        // Act
        deliveryNoteService.delete(note.id());

        // Assert
        assertStock(oil, 10, 0);
        assertThat(movements(StockSourceType.DELIVERY_NOTE, note.id()))
                .extracting(StockMovement::getType)
                .containsExactly(StockMovementType.CONSUME, StockMovementType.RETURN);
    }

    @Test
    void givenDeliveryNoteWithRepairOrder_whenCreated_thenStockIsLeftToTheRepairOrder() {
        // Arrange
        Long orderId = createRepairOrder();
        createApprovedEstimate(orderId, line(oil, 3));

        // Act
        deliveryNoteService.create(deliveryNoteRequest(orderId, dnLine(oil, 3)));
        changeStatus(orderId, RepairOrderStatus.ENTREGADO);

        // Assert
        assertStock(oil, 7, 0);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private Long createRepairOrder() {
        return repairOrderService.create(new RepairOrderRequest(
                client.getId(), vehicle.getId(), null, "Service", null, null, null, null)).id();
    }

    private Long createApprovedEstimate(Long orderId, EstimateProductRequest... lines) {
        EstimateDetailResponse estimate = estimateService.create(estimateRequest(orderId, lines));
        estimateService.approve(estimate.id(), EstimateDecisionChannel.IN_PERSON, null);
        return estimate.id();
    }

    private EstimateRequest estimateRequest(Long orderId, EstimateProductRequest... lines) {
        return new EstimateRequest(client.getId(), vehicle.getId(), orderId,
                BigDecimal.ZERO, BigDecimal.ZERO, List.of(), List.of(lines));
    }

    private DeliveryNoteRequest deliveryNoteRequest(Long orderId, DeliveryNoteProductRequest... lines) {
        return new DeliveryNoteRequest(client.getId(), vehicle.getId(), orderId, null,
                BigDecimal.ZERO, BigDecimal.ZERO, List.of(), List.of(lines));
    }

    private static EstimateProductRequest line(Product product, int quantity) {
        return new EstimateProductRequest(product.getName(), quantity, BigDecimal.TEN, product.getId());
    }

    private static EstimateProductRequest freeTextLine(String name, int quantity) {
        return new EstimateProductRequest(name, quantity, BigDecimal.TEN, null);
    }

    private static DeliveryNoteProductRequest dnLine(Product product, int quantity) {
        return new DeliveryNoteProductRequest(product.getName(), quantity, BigDecimal.TEN, product.getId());
    }

    private static DeliveryNoteProductRequest dnFreeTextLine(String name, int quantity) {
        return new DeliveryNoteProductRequest(name, quantity, BigDecimal.TEN, null);
    }

    private void changeStatus(Long orderId, RepairOrderStatus status) {
        repairOrderService.updateStatus(orderId, new StatusUpdateRequest(status));
    }

    private List<StockMovement> movements(StockSourceType sourceType, Long sourceId) {
        return stockMovementRepository.findBySourceTypeAndSourceIdOrderByIdAsc(sourceType, sourceId);
    }

    private void assertStock(Product product, int onHand, int reserved) {
        Product current = productRepository.findById(product.getId()).orElseThrow();
        assertThat(current.getQuantity()).as("on hand of %s", product.getName()).isEqualTo(onHand);
        assertThat(current.getReservedQuantity()).as("reserved of %s", product.getName()).isEqualTo(reserved);
    }
}
