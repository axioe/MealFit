package com.mealfit.domain.cooking;

import com.mealfit.domain.cooking.dto.CookingEventRequest;
import com.mealfit.domain.cooking.dto.CookingEventResponse;
import com.mealfit.domain.cooking.dto.CookingPreviewResponse;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.InventoryTransaction;
import com.mealfit.domain.inventory.InventoryTransactionRepository;
import com.mealfit.domain.inventory.InventoryTransactionType;
import com.mealfit.domain.inventory.LotStatus;
import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.mealplan.MealPlanRepository;
import com.mealfit.domain.mealplan.MealPlanStatus;
import com.mealfit.domain.recipe.RecipeIngredient;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 조리 미리보기·완료(재고 차감)·취소(원본 복원).
 * 재고 수량 변경과 COOK_DEDUCT/COOK_RESTORE 이력은 한 트랜잭션에서 저장한다 (BR-07).
 * 취소는 레시피가 아니라 조리 당시 남긴 이력을 거꾸로 적용해 원래 묶음에 복원한다 (BR-08).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CookingService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final int MAX_MEMO_LENGTH = 255;

    private final MealPlanRepository mealPlanRepository;
    private final CookingEventRepository cookingEventRepository;
    private final InventoryLotRepository inventoryLotRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final EntityManager entityManager;

    /** 차감 미리보기 (FR-COOK-01). 재고와 이력은 바꾸지 않는다. */
    public CookingPreviewResponse preview(Long userId, Long mealPlanId) {
        LocalDate today = LocalDate.now(ZONE);
        MealPlan plan = mealPlanRepository.findByIdAndUserId(mealPlanId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEAL_PLAN_NOT_FOUND));
        boolean cooked = cookingEventRepository.existsByMealPlanIdAndStatus(plan.getId(), CookingStatus.COOKED);
        CookingPlan cookingPlan = CookingPlan.of(plan,
                inventoryLotRepository.findByUserIdAndStatusOrderByExpiryDateAsc(userId, LotStatus.ACTIVE), today);

        String blockedReason = null;
        if (cooked) {
            blockedReason = ErrorCode.COOKING_ALREADY_COOKED.getMessage();
        } else if (plan.getStatus() != MealPlanStatus.CONFIRMED) {
            blockedReason = ErrorCode.COOKING_NOT_CONFIRMED.getMessage();
        } else if (cookingPlan.hasShortage()) {
            blockedReason = "재고가 부족합니다. 부족한 재료: " + cookingPlan.shortageSummary();
        }
        return CookingPreviewResponse.of(plan, cookingPlan, cooked, blockedReason, today);
    }

    /**
     * 조리 완료 (FR-COOK-02). 확정 식단만, 한 번만 조리할 수 있다.
     * 재고가 하나라도 부족하면 아무것도 차감하지 않고 거부한다 (D11).
     */
    @Transactional
    public CookingEventResponse cook(Long userId, CookingEventRequest request) {
        LocalDate today = LocalDate.now(ZONE);
        MealPlan plan = mealPlanRepository.findForUpdate(request.mealPlanId(), userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEAL_PLAN_NOT_FOUND));
        if (plan.getStatus() != MealPlanStatus.CONFIRMED) {
            throw new BusinessException(ErrorCode.COOKING_NOT_CONFIRMED);
        }
        if (cookingEventRepository.existsByMealPlanIdAndStatus(plan.getId(), CookingStatus.COOKED)) {
            throw new BusinessException(ErrorCode.COOKING_ALREADY_COOKED);
        }

        CookingPlan cookingPlan = CookingPlan.of(plan, lockLotsFor(userId, plan), today);
        if (cookingPlan.hasShortage()) {
            throw new BusinessException(ErrorCode.COOKING_INSUFFICIENT_STOCK,
                    ErrorCode.COOKING_INSUFFICIENT_STOCK.getMessage() + " (" + cookingPlan.shortageSummary() + ")");
        }

        CookingEvent event = cookingEventRepository.save(CookingEvent.cooked(userId, plan, plan.getServings()));
        String memo = memo("조리: " + plan.getRecipe().getName());
        List<InventoryTransaction> changes = new ArrayList<>();
        for (CookingPlan.IngredientPlan ingredient : cookingPlan.ingredients()) {
            for (CookingPlan.Deduction deduction : ingredient.deductions()) {
                deduction.lot().deduct(deduction.quantity());
                changes.add(saveTransaction(userId, deduction.lot(), event, InventoryTransactionType.COOK_DEDUCT,
                        deduction.quantity().negate(), memo));
            }
        }
        return CookingEventResponse.of(event, changes);
    }

    /** 조리 취소와 원본 복원 (FR-COOK-03). 두 번째 취소는 추가 복원 없이 거부한다 (BR-10). */
    @Transactional
    public CookingEventResponse cancel(Long userId, Long cookingEventId) {
        CookingEvent event = cookingEventRepository.findForUpdate(cookingEventId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COOKING_EVENT_NOT_FOUND));
        if (event.getStatus() == CookingStatus.RESTORED) {
            throw new BusinessException(ErrorCode.COOKING_ALREADY_RESTORED);
        }

        List<InventoryTransaction> deductions = transactionRepository.findByCookingEventId(event.getId()).stream()
                .filter(transaction -> transaction.getType() == InventoryTransactionType.COOK_DEDUCT)
                .sorted(Comparator.comparing(transaction -> transaction.getLot().getId()))
                .toList();
        entityManager.flush();
        String memo = memo("조리 취소: " + event.getRecipe().getName());
        List<InventoryTransaction> changes = new ArrayList<>();
        for (InventoryTransaction deduction : deductions) {
            InventoryLot lot = deduction.getLot();
            entityManager.refresh(lot, LockModeType.PESSIMISTIC_WRITE);
            BigDecimal quantity = deduction.getQtyChange().negate();
            lot.restore(quantity);
            changes.add(saveTransaction(userId, lot, event, InventoryTransactionType.COOK_RESTORE, quantity, memo));
        }
        event.restore();
        return CookingEventResponse.of(event, changes);
    }

    /**
     * 이 식단에 필요한 재료의 ACTIVE 묶음을 잠그고 최신 수량으로 다시 읽는다.
     * 동시에 다른 조리·조정이 같은 묶음을 바꾸지 못하게 해 음수 재고와 중복 차감을 막는다 (BR-13).
     */
    private List<InventoryLot> lockLotsFor(Long userId, MealPlan plan) {
        Set<String> names = plan.getRecipe().getIngredients().stream()
                .map(RecipeIngredient::getIngredientName)
                .map(String::strip)
                .collect(Collectors.toSet());
        List<InventoryLot> lots = inventoryLotRepository
                .findByUserIdAndStatusOrderByExpiryDateAsc(userId, LotStatus.ACTIVE).stream()
                .filter(lot -> names.contains(lot.getIngredientName().strip()))
                .sorted(Comparator.comparing(InventoryLot::getId))
                .toList();
        entityManager.flush();
        lots.forEach(lot -> entityManager.refresh(lot, LockModeType.PESSIMISTIC_WRITE));
        return lots.stream().filter(lot -> lot.getStatus() == LotStatus.ACTIVE).toList();
    }

    private InventoryTransaction saveTransaction(Long userId, InventoryLot lot, CookingEvent event,
                                                 InventoryTransactionType type, BigDecimal qtyChange, String memo) {
        return transactionRepository.save(InventoryTransaction.builder()
                .userId(userId)
                .lot(lot)
                .cookingEvent(event)
                .type(type)
                .qtyChange(qtyChange)
                .memo(memo)
                .build());
    }

    private static String memo(String text) {
        return text.length() <= MAX_MEMO_LENGTH ? text : text.substring(0, MAX_MEMO_LENGTH);
    }
}
