package com.autotech.repairorder.model;

import com.autotech.client.model.Client;
import com.autotech.common.model.BaseEntity;
import com.autotech.employee.model.Employee;
import com.autotech.tag.model.Tag;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.appointment.model.Appointment;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "repair_orders")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RepairOrder extends BaseEntity {

    @Column(name = "title", length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "client_source", length = 100)
    private String clientSource;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RepairOrderStatus status = RepairOrderStatus.INGRESO_VEHICULO;

    @Column(name = "mechanic_notes", columnDefinition = "TEXT")
    private String mechanicNotes;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "repair_order_employees",
            joinColumns = @JoinColumn(name = "repair_order_id"),
            inverseJoinColumns = @JoinColumn(name = "employee_id")
    )
    @Builder.Default
    private Set<Employee> employees = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "repair_order_tags",
            joinColumns = @JoinColumn(name = "repair_order_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RepairOrder other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
