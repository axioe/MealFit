package com.mealfit.domain.inventory;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByLotIdOrderByCreatedAtDesc(Long lotId);

    List<InventoryTransaction> findByCookingEventId(Long cookingEventId);
    @EntityGraph(attributePaths = "lot")
    List<InventoryTransaction> findByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    @EntityGraph(attributePaths = "lot")
    List<InventoryTransaction> findByUserIdAndLotIdOrderByCreatedAtDescIdDesc(Long userId, Long lotId);
}

