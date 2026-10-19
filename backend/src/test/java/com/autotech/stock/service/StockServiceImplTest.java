package com.autotech.stock.service;

import com.autotech.catalog.model.Product;
import com.autotech.catalog.repository.ProductRepository;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.stock.model.StockMovement;
import com.autotech.stock.model.StockMovementType;
import com.autotech.stock.model.StockSourceType;
import com.autotech.stock.repository.StockMovementRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceImplTest {

    private static final Long ORDER_ID = 50L;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private StockServiceImpl stockService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void givenSourceAlreadyAtTarget_whenApplyTarget_thenLocksNothingAndWritesNothing() {
        // Arrange
        Product oil = product(1L, 10, 3);
        when(stockMovementRepository.findBySourceTypeAndSourceIdOrderByIdAsc(StockSourceType.REPAIR_ORDER, ORDER_ID))
                .thenReturn(List.of(movement(oil, StockMovementType.RESERVE, 3)));

        // Act
        stockService.applyTarget(StockSourceType.REPAIR_ORDER, ORDER_ID, Map.of(1L, 3), Map.of());

        // Assert
        verify(productRepository, never()).findAllByIdInForUpdate(any());
        verify(stockMovementRepository, never()).saveAll(any());
    }

    @Test
    void givenReservedSource_whenTargetBecomesConsumed_thenReleasesThenConsumes() {
        // Arrange
        Product oil = product(1L, 10, 3);
        when(stockMovementRepository.findBySourceTypeAndSourceIdOrderByIdAsc(StockSourceType.REPAIR_ORDER, ORDER_ID))
                .thenReturn(List.of(movement(oil, StockMovementType.RESERVE, 3)));
        when(productRepository.findAllByIdInForUpdate(any())).thenReturn(List.of(oil));

        // Act
        stockService.applyTarget(StockSourceType.REPAIR_ORDER, ORDER_ID, Map.of(), Map.of(1L, 3));

        // Assert
        assertThat(oil.getQuantity()).isEqualTo(7);
        assertThat(oil.getReservedQuantity()).isZero();
        assertThat(savedMovements())
                .extracting(StockMovement::getType, StockMovement::getQuantity)
                .containsExactly(tuple(StockMovementType.RELEASE, 3), tuple(StockMovementType.CONSUME, 3));
    }

    @Test
    void givenReservedSource_whenLinesGrow_thenReservesOnlyTheDifference() {
        // Arrange
        Product oil = product(1L, 10, 3);
        when(stockMovementRepository.findBySourceTypeAndSourceIdOrderByIdAsc(StockSourceType.REPAIR_ORDER, ORDER_ID))
                .thenReturn(List.of(movement(oil, StockMovementType.RESERVE, 3)));
        when(productRepository.findAllByIdInForUpdate(any())).thenReturn(List.of(oil));

        // Act
        stockService.applyTarget(StockSourceType.REPAIR_ORDER, ORDER_ID, Map.of(1L, 5), Map.of());

        // Assert
        assertThat(oil.getReservedQuantity()).isEqualTo(5);
        assertThat(savedMovements())
                .extracting(StockMovement::getType, StockMovement::getQuantity)
                .containsExactly(tuple(StockMovementType.RESERVE, 2));
    }

    @Test
    void givenConsumedThenReturnedHistory_whenConsumedAgain_thenNetsPreviousMovements() {
        // Arrange
        Product oil = product(1L, 10, 0);
        when(stockMovementRepository.findBySourceTypeAndSourceIdOrderByIdAsc(StockSourceType.DELIVERY_NOTE, 7L))
                .thenReturn(List.of(
                        movement(oil, StockMovementType.CONSUME, 2),
                        movement(oil, StockMovementType.RETURN, 2)));
        when(productRepository.findAllByIdInForUpdate(any())).thenReturn(List.of(oil));

        // Act
        stockService.applyTarget(StockSourceType.DELIVERY_NOTE, 7L, Map.of(), Map.of(1L, 2));

        // Assert
        assertThat(oil.getQuantity()).isEqualTo(8);
        assertThat(savedMovements())
                .extracting(StockMovement::getType, StockMovement::getQuantity)
                .containsExactly(tuple(StockMovementType.CONSUME, 2));
    }

    @Test
    void givenLoggedInEmployee_whenStockMoves_thenMovementRecordsWhoDidIt() {
        // Arrange
        Product oil = product(1L, 10, 0);
        Employee employee = Employee.builder().email("jefe@taller.com").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("jefe@taller.com", null, List.of()));
        when(employeeRepository.findByEmail("jefe@taller.com")).thenReturn(Optional.of(employee));
        when(stockMovementRepository.findBySourceTypeAndSourceIdOrderByIdAsc(StockSourceType.DELIVERY_NOTE, 7L))
                .thenReturn(List.of());
        when(productRepository.findAllByIdInForUpdate(any())).thenReturn(List.of(oil));

        // Act
        stockService.applyTarget(StockSourceType.DELIVERY_NOTE, 7L, Map.of(), Map.of(1L, 1));

        // Assert
        assertThat(savedMovements()).extracting(StockMovement::getCreatedBy).containsExactly(employee);
    }

    @SuppressWarnings("unchecked")
    private List<StockMovement> savedMovements() {
        ArgumentCaptor<List<StockMovement>> captor = ArgumentCaptor.forClass(List.class);
        verify(stockMovementRepository).saveAll(captor.capture());
        return captor.getValue();
    }

    private static Product product(Long id, int onHand, int reserved) {
        Product product = Product.builder().name("Producto " + id).quantity(onHand).reservedQuantity(reserved).build();
        product.setId(id);
        return product;
    }

    private static StockMovement movement(Product product, StockMovementType type, int quantity) {
        return StockMovement.builder().product(product).type(type).quantity(quantity).build();
    }
}
