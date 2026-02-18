package com.autotech.bankaccount.repository;

import com.autotech.bankaccount.model.BankAccount;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    @EntityGraph(attributePaths = {"bank"})
    List<BankAccount> findAllByOrderByAliasAsc();

    @EntityGraph(attributePaths = {"bank"})
    Optional<BankAccount> findWithBankById(Long id);

    List<BankAccount> findByBankId(Long bankId);
}
