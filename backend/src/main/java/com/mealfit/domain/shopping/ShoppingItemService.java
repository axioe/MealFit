package com.mealfit.domain.shopping;

import com.mealfit.domain.inventory.InventoryService;
import com.mealfit.domain.inventory.dto.LotResponse;
import com.mealfit.domain.inventory.dto.StockInRequest;
import com.mealfit.domain.shopping.dto.ShoppingItemResponse;
import com.mealfit.domain.shopping.dto.ShoppingPurchaseRequest;
import com.mealfit.domain.shopping.dto.ShoppingStockInRequest;
import com.mealfit.domain.shopping.dto.ShoppingStockInResponse;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 장보기 목록 조회, 부분 구매 반영, 구매분 냉장고 입고 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShoppingItemService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final String STOCK_IN_MEMO = "장보기 입고";

    private final ShoppingItemRepository shoppingItemRepository;
    private final ShoppingListService shoppingListService;
    private final InventoryService inventoryService;

    /**
     * 장보기 목록. 냉장고 입고·조정·조리로 재고가 바뀌었을 수 있으니 조회할 때마다 부족분을 다시 계산한다.
     */
    @Transactional
    public List<ShoppingItemResponse> getItems(Long userId) {
        return shoppingListService.recalculate(userId, LocalDate.now(ZONE)).stream()
                .map(ShoppingItemResponse::from)
                .toList();
    }

    /** 부분 구매 반영 (FR-SHOP-02). 0 → NEEDED, 일부 → PARTIAL, 필요량 이상 → PURCHASED */
    @Transactional
    public List<ShoppingItemResponse> recordPurchases(Long userId, ShoppingPurchaseRequest request) {
        Map<Long, ShoppingItem> items = lockItems(userId,
                request.items().stream().map(ShoppingPurchaseRequest.Item::id).toList());
        request.items().forEach(item -> items.get(item.id()).recordPurchase(item.purchasedQty()));
        return shoppingItemRepository.findByUserIdOrderByIdAsc(userId).stream()
                .map(ShoppingItemResponse::from)
                .toList();
    }

    /**
     * 구매분 냉장고 입고 (FR-SHOP-03). 실제로 넣은 수량만 재고 묶음과 STOCK_IN 이력으로 저장하고,
     * 같은 수량을 장보기 구매량에서 뺀 뒤 부족분을 다시 계산한다. 같은 요청을 다시 보내면 구매량이 부족해 거부된다.
     */
    @Transactional
    public ShoppingStockInResponse stockIn(Long userId, ShoppingStockInRequest request) {
        Map<Long, ShoppingItem> items = lockItems(userId,
                request.items().stream().map(ShoppingStockInRequest.Item::id).toList());
        List<LotResponse> lots = new ArrayList<>();
        for (ShoppingStockInRequest.Item target : request.items()) {
            ShoppingItem item = items.get(target.id());
            BigDecimal quantity = target.quantity() != null ? target.quantity() : item.getPurchasedQty();
            item.stockIn(quantity);
            lots.add(inventoryService.stockIn(userId, new StockInRequest(item.getIngredientName(), quantity,
                    item.getUnit(), target.expiryDate(), target.storageLocation(), target.minStockQty(),
                    STOCK_IN_MEMO)));
        }
        List<ShoppingItemResponse> shoppingItems = shoppingListService.recalculate(userId, LocalDate.now(ZONE))
                .stream()
                .map(ShoppingItemResponse::from)
                .toList();
        return new ShoppingStockInResponse(lots, shoppingItems);
    }

    /** 요청한 항목을 잠가서 가져온다. 중복 id, 없는 항목, 남의 항목은 거부한다. */
    private Map<Long, ShoppingItem> lockItems(Long userId, List<Long> ids) {
        if (new HashSet<>(ids).size() != ids.size()) {
            throw new BusinessException(ErrorCode.SHOPPING_DUPLICATE_ITEM);
        }
        Map<Long, ShoppingItem> items = shoppingItemRepository.findAllForUpdate(ids, userId).stream()
                .collect(Collectors.toMap(ShoppingItem::getId, Function.identity()));
        if (items.size() != ids.size()) {
            throw new BusinessException(ErrorCode.SHOPPING_ITEM_NOT_FOUND);
        }
        return items;
    }
}
