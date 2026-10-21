package com.mealfit.domain.shopping;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, Long> {

    List<ShoppingItem> findByUserIdAndStatusIn(Long userId, Collection<ShoppingItemStatus> statuses);

    List<ShoppingItem> findByUserIdOrderByIdAsc(Long userId);
}
