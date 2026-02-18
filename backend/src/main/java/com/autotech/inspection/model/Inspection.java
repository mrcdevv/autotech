package com.autotech.inspection.model;

import com.autotech.common.model.BaseEntity;
import com.autotech.repairorder.model.RepairOrder;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
@Table(name = "inspections")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Inspection extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_order_id", nullable = false)
    private RepairOrder repairOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private InspectionTemplate template;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<InspectionItem> items = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Inspection other)) return false;
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
