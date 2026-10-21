package com.mealfit.domain.inventory;

import com.mealfit.domain.inventory.dto.InventoryResponse;
import com.mealfit.domain.inventory.dto.LotResponse;
import com.mealfit.domain.inventory.dto.StockInRequest;
import com.mealfit.domain.inventory.dto.TransactionResponse;
import com.mealfit.domain.inventory.dto.UpdateLotRequest;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final InventoryLotRepository lotRepository;
    private final InventoryTransactionRepository transactionRepository;

    public InventoryResponse getInventory(Long userId) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        Map<IngredientKey, List<InventoryLot>> groups = new LinkedHashMap<>();
        for (InventoryLot lot : lotRepository.findByUserIdOrderByExpiryDateAscIdAsc(userId)) {
            groups.computeIfAbsent(new IngredientKey(lot.getIngredientName(), lot.getUnit()),
                    key -> new ArrayList<>()).add(lot);
        }
        List<InventoryResponse.IngredientGroup> responses = groups.entrySet().stream()
                .map(entry -> toGroup(entry.getKey(), entry.getValue(), today)).toList();
        return new InventoryResponse(today, responses);
    }

    @Transactional
    public LotResponse stockIn(Long userId, StockInRequest request) {
        InventoryLot lot = lotRepository.save(InventoryLot.builder()
                .userId(userId).ingredientName(request.ingredientName().trim())
                .quantity(request.quantity()).unit(request.unit().trim()).expiryDate(request.expiryDate())
                .storageLocation(request.storageLocation()).minStockQty(request.minStockQty())
                .memo(request.memo()).build());
        saveTransaction(userId, lot, InventoryTransactionType.STOCK_IN, request.quantity(), request.memo());
        return LotResponse.from(lot, LocalDate.now(ZoneId.of("Asia/Seoul")));
    }

    @Transactional
    public LotResponse update(Long userId, Long id, UpdateLotRequest request) {
        validateRequest(request);
        InventoryLot lot = lotRepository.findForUpdate(id, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVENTORY_NOT_FOUND));
        BigDecimal before = lot.getQuantity();
        InventoryTransactionType type;
        if (request.action() == InventoryAction.DISPOSE) {
            lot.dispose(request.quantity());
            type = InventoryTransactionType.DISPOSE;
        } else {
            lot.adjust(request.quantity(), request.storageLocation(), request.expiryDate(),
                    Boolean.TRUE.equals(request.clearExpiryDate()), request.minStockQty(), request.memo());
            type = InventoryTransactionType.ADJUST;
        }
        BigDecimal change = lot.getQuantity().subtract(before);
        if (change.signum() != 0) {
            saveTransaction(userId, lot, type, change, request.memo());
        }
        lotRepository.flush();
        return LotResponse.from(lot, LocalDate.now(ZoneId.of("Asia/Seoul")));
    }

    public List<TransactionResponse> getTransactions(Long userId, Long lotId) {
        if (lotId != null) {
            lotRepository.findByIdAndUserId(lotId, userId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.INVENTORY_NOT_FOUND));
            return transactionRepository.findByUserIdAndLotIdOrderByCreatedAtDescIdDesc(userId, lotId)
                    .stream().map(TransactionResponse::from).toList();
        }
        return transactionRepository.findByUserIdOrderByCreatedAtDescIdDesc(userId)
                .stream().map(TransactionResponse::from).toList();
    }

    private void validateRequest(UpdateLotRequest request) {
        if (request.action() == null) {
            throw new BusinessException(ErrorCode.INVENTORY_INVALID_REQUEST);
        }
        if (request.action() == InventoryAction.ADJUST
                && request.quantity() == null && request.storageLocation() == null
                && request.expiryDate() == null && !Boolean.TRUE.equals(request.clearExpiryDate())
                && request.minStockQty() == null && request.memo() == null) {
            throw new BusinessException(ErrorCode.INVENTORY_INVALID_REQUEST,
                    "수정할 항목을 하나 이상 입력해 주세요.");
        }
        if (request.action() == InventoryAction.DISPOSE) {
            if (request.quantity() == null || request.quantity().signum() <= 0) {
                throw new BusinessException(ErrorCode.INVENTORY_INVALID_QUANTITY,
                        "폐기 수량은 0보다 커야 합니다.");
            }
            if (request.storageLocation() != null || request.expiryDate() != null
                    || request.clearExpiryDate() != null || request.minStockQty() != null) {
                throw new BusinessException(ErrorCode.INVENTORY_INVALID_REQUEST,
                        "폐기와 재고 정보 수정은 별도로 요청해 주세요.");
            }
        } else if (Boolean.TRUE.equals(request.clearExpiryDate()) && request.expiryDate() != null) {
            throw new BusinessException(ErrorCode.INVENTORY_INVALID_REQUEST,
                    "소비기한 지정과 미등록 변경을 동시에 요청할 수 없습니다.");
        }
    }

    private void saveTransaction(Long userId, InventoryLot lot, InventoryTransactionType type,
                                 BigDecimal qtyChange, String memo) {
        transactionRepository.save(InventoryTransaction.builder()
                .userId(userId).lot(lot).type(type).qtyChange(qtyChange).memo(memo).build());
    }

    private InventoryResponse.IngredientGroup toGroup(IngredientKey key, List<InventoryLot> lots,
                                                     LocalDate today) {
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal expired = BigDecimal.ZERO;
        for (InventoryLot lot : lots) {
            if (lot.getStatus() == LotStatus.ACTIVE) {
                total = total.add(lot.getQuantity());
                if (lot.expirationStatus(today) == ExpirationStatus.EXPIRED) {
                    expired = expired.add(lot.getQuantity());
                }
            }
        }
        return new InventoryResponse.IngredientGroup(key.ingredientName(), key.unit(), total,
                total.subtract(expired), expired, lots.stream().map(lot -> LotResponse.from(lot, today)).toList());
    }

    private record IngredientKey(String ingredientName, String unit) {
    }
}
