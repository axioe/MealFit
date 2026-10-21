package com.mealfit.domain.shopping;

import com.mealfit.domain.shopping.dto.ShoppingItemResponse;
import com.mealfit.domain.shopping.dto.ShoppingPurchaseRequest;
import com.mealfit.domain.shopping.dto.ShoppingStockInRequest;
import com.mealfit.domain.shopping.dto.ShoppingStockInResponse;
import com.mealfit.global.web.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Shopping", description = "자동 장보기")
@RestController
@RequestMapping("/api/v1/shopping-items")
@RequiredArgsConstructor
public class ShoppingItemController {

    private final ShoppingItemService shoppingItemService;

    @Operation(summary = "장보기 부족분 목록 (조회할 때 현재 재고로 다시 계산)")
    @GetMapping
    public List<ShoppingItemResponse> getItems(@CurrentUserId Long userId) {
        return shoppingItemService.getItems(userId);
    }

    @Operation(summary = "부분 구매 반영 (항목별 지금까지 산 수량으로 덮어쓰기)")
    @PatchMapping
    public List<ShoppingItemResponse> recordPurchases(@CurrentUserId Long userId,
                                                      @Valid @RequestBody ShoppingPurchaseRequest request) {
        return shoppingItemService.recordPurchases(userId, request);
    }

    @Operation(summary = "구매분 냉장고 입고 (재고 묶음·STOCK_IN 이력 저장 후 부족분 재계산)")
    @PostMapping("/stock-in")
    @ResponseStatus(HttpStatus.CREATED)
    public ShoppingStockInResponse stockIn(@CurrentUserId Long userId,
                                           @Valid @RequestBody ShoppingStockInRequest request) {
        return shoppingItemService.stockIn(userId, request);
    }
}
