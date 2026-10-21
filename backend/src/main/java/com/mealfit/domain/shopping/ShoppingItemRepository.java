package com.mealfit.domain.shopping;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, Long> {

    List<ShoppingItem> findByUserIdAndStatusIn(Long userId, Collection<ShoppingItemStatus> statuses);

    List<ShoppingItem> findByUserIdOrderByIdAsc(Long userId);

    /** 구매·입고 중복 요청에서 수량을 보호한다 (BR-13). 본인 항목만 잠가서 가져온다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select item from ShoppingItem item where item.id in :ids and item.userId = :userId order by item.id")
    List<ShoppingItem> findAllForUpdate(@Param("ids") Collection<Long> ids, @Param("userId") Long userId);
}
