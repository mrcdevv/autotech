package com.autotech.client.model;

import com.autotech.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
// import java.util.ArrayList;
// import java.util.List;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Client extends BaseEntity {

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "dni", length = 20)
    private String dni;

    @Column(name = "commercial_name", length = 150)
    private String commercialName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "client_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ClientType clientType;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    /*
     * @OneToMany(mappedBy = "client", fetch = FetchType.LAZY)
     * 
     * @Builder.Default
     * private List<Vehicle> vehicles = new ArrayList<>();
     */
}
