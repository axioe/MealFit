package com.mealfit.domain.inventory;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryLotRepository extends JpaRepository<InventoryLot, Long> {

    List<InventoryLot> findByUserIdAndStatusOrderByExpiryDateAsc(Long userId, LotStatus status);

    Optional<InventoryLot> findByIdAndUserId(Long id, Long userId);
}
