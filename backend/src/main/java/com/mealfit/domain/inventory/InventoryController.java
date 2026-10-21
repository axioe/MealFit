package com.mealfit.domain.inventory;

import com.mealfit.domain.inventory.dto.InventoryResponse;
import com.mealfit.domain.inventory.dto.LotResponse;
import com.mealfit.domain.inventory.dto.StockInRequest;
import com.mealfit.domain.inventory.dto.TransactionResponse;
import com.mealfit.domain.inventory.dto.UpdateLotRequest;
import com.mealfit.global.web.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Inventory", description = "냉장고 재고 및 변경 이력")
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @Operation(summary = "사용자별 재료 합계 및 재고 묶음 조회")
    @GetMapping("/lots")
    public InventoryResponse getInventory(@CurrentUserId Long userId) {
        return inventoryService.getInventory(userId);
    }

    @Operation(summary = "새 재고 묶음 입고")
    @PostMapping("/lots")
    public ResponseEntity<LotResponse> stockIn(@CurrentUserId Long userId,
                                             @Valid @RequestBody StockInRequest request) {
        LotResponse response = inventoryService.stockIn(userId, request);
        return ResponseEntity.created(URI.create("/api/v1/inventory/lots/" + response.id())).body(response);
    }

    @Operation(summary = "재고 수량 및 정보 조정 또는 부분·전량 폐기",
            description = "ADJUST는 최종 수량, DISPOSE는 폐기 수량입니다. 생략한 수정 필드는 유지합니다. 소진·폐기 로트는 수정할 수 없습니다.")
    @PatchMapping("/lots/{id}")
    public LotResponse update(@CurrentUserId Long userId, @PathVariable Long id,
                              @Valid @RequestBody UpdateLotRequest request) {
        return inventoryService.update(userId, id, request);
    }

    @Operation(summary = "본인 재고 변경 이력 조회", description = "lotId를 지정하면 해당 로트의 이력만 조회합니다.")
    @GetMapping("/transactions")
    public List<TransactionResponse> getTransactions(@CurrentUserId Long userId,
                                                     @RequestParam(required = false) Long lotId) {
        return inventoryService.getTransactions(userId, lotId);
    }
}
