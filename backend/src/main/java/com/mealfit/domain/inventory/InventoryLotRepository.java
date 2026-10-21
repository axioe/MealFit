package com.mealfit.domain.inventory;

import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryLotRepository extends JpaRepository<InventoryLot, Long> {

    List<InventoryLot> findByUserIdAndStatusOrderByExpiryDateAsc(Long userId, LotStatus status);

    Optional<InventoryLot> findByIdAndUserId(Long id, Long userId);
    List<InventoryLot> findByUserIdOrderByExpiryDateAscIdAsc(Long userId);

    // 동시 수정 시 재고 수량을 보호한다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select lot from InventoryLot lot where lot.id = :id and lot.userId = :userId")
    Optional<InventoryLot> findForUpdate(@Param("id") Long id, @Param("userId") Long userId);
}

