package com.autotech.repairorder.repository;

import com.autotech.repairorder.dto.RepairOrderFilter;
import com.autotech.repairorder.model.RepairOrder;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class RepairOrderSpecifications {

    private RepairOrderSpecifications() {
    }

    public static Specification<RepairOrder> from(RepairOrderFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.statuses() != null && !filter.statuses().isEmpty()) {
                predicates.add(root.get("status").in(filter.statuses()));
            }

            if (filter.from() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("updatedAt"), filter.from().atStartOfDay()));
            }

            if (filter.to() != null) {
                predicates.add(cb.lessThan(
                        root.get("updatedAt"), filter.to().plusDays(1).atStartOfDay()));
            }

            if (filter.employeeId() != null) {
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<RepairOrder> subRoot = subquery.from(RepairOrder.class);
                subquery.select(subRoot.get("id"))
                        .where(cb.equal(subRoot.join("employees").get("id"), filter.employeeId()));
                predicates.add(root.get("id").in(subquery));
            }

            if (filter.tagId() != null) {
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<RepairOrder> subRoot = subquery.from(RepairOrder.class);
                subquery.select(subRoot.get("id"))
                        .where(cb.equal(subRoot.join("tags").get("id"), filter.tagId()));
                predicates.add(root.get("id").in(subquery));
            }

            if (filter.query() != null && !filter.query().isBlank()) {
                String like = "%" + filter.query().trim().toLowerCase() + "%";
                var clientJoin = root.join("client", JoinType.INNER);
                var vehicleJoin = root.join("vehicle", JoinType.INNER);
                var brandJoin = vehicleJoin.join("brand", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(clientJoin.get("firstName")), like),
                        cb.like(cb.lower(clientJoin.get("lastName")), like),
                        cb.like(cb.lower(vehicleJoin.get("plate")), like),
                        cb.like(cb.lower(brandJoin.get("name")), like),
                        cb.like(cb.lower(vehicleJoin.get("model")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
