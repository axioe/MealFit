package com.mealfit.domain.inventory;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByLotIdOrderByCreatedAtDesc(Long lotId);

    List<InventoryTransaction> findByCookingEventId(Long cookingEventId);
}
