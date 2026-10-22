package com.mealfit.domain.cooking;

import com.mealfit.domain.cooking.dto.CookingEventRequest;
import com.mealfit.domain.cooking.dto.CookingEventResponse;
import com.mealfit.domain.cooking.dto.CookingPreviewResponse;
import com.mealfit.domain.cooking.dto.IngredientCookingRequest;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.InventoryTransaction;
import com.mealfit.domain.inventory.InventoryTransactionRepository;
import com.mealfit.domain.inventory.InventoryTransactionType;
import com.mealfit.domain.inventory.LotStatus;
import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.mealplan.MealPlanRepository;
import com.mealfit.domain.mealplan.IngredientRestriction;
import com.mealfit.domain.mealplan.MealPlanStatus;
import com.mealfit.domain.mealplan.UserDietProfile;
import com.mealfit.domain.mealplan.UserDietProfileProvider;
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
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final ObjectProvider<UserDietProfileProvider> profileProvider;

    /**
     * 차감 미리보기 (FR-COOK-01). 재고와 이력은 바꾸지 않는다.
     *
     * @param usages 조리 전에 고친 재료 사용량. null이면 레시피 기준
     */
    public CookingPreviewResponse preview(Long userId, Long mealPlanId, List<CookingPlan.Usage> usages) {
        LocalDate today = LocalDate.now(ZONE);
        MealPlan plan = mealPlanRepository.findByIdAndUserId(mealPlanId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEAL_PLAN_NOT_FOUND));
        boolean cooked = cookingEventRepository.existsByMealPlanIdAndStatus(plan.getId(), CookingStatus.COOKED);
        CookingPlan cookingPlan = CookingPlan.of(plan, usages,
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
     * 재료 사용량을 보내면 레시피 대신 그 수량으로 차감한다 (레시피 재료의 수량 변경·빼기만 허용).
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

        CookingPlan cookingPlan = CookingPlan.of(plan, request.usages(), lockLotsFor(userId, plan), today);
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

    /**
     * 식단 없이 재료 목록만으로 차감 미리보기 (15분 요리 등). 재고와 이력은 바꾸지 않는다.
     * 알레르기·제외 재료나 재고 부족은 거부하지 않고 blockedReason으로 알려 준다.
     */
    public CookingPreviewResponse previewIngredients(Long userId, IngredientCookingRequest request) {
        LocalDate today = LocalDate.now(ZONE);
        List<CookingPlan.Usage> usages = request.usages();
        CookingPlan cookingPlan = CookingPlan.ofUsages(usages,
                inventoryLotRepository.findByUserIdAndStatusOrderByExpiryDateAsc(userId, LotStatus.ACTIVE), today);

        List<String> violations = restrictionViolations(userId, usages);
        String blockedReason = null;
        if (!violations.isEmpty()) {
            blockedReason = restrictedMessage(violations);
        } else if (cookingPlan.hasShortage()) {
            blockedReason = "재고가 부족합니다. 부족한 재료: " + cookingPlan.shortageSummary();
        }
        return CookingPreviewResponse.withoutPlan(request.strippedRecipeName(), request.servingsOrDefault(),
                cookingPlan, blockedReason, today);
    }

    /**
     * 식단 없이 재료 목록만으로 조리 완료 (15분 요리 등). 보낸 수량을 그대로 차감한다.
     * 알레르기·제외 재료가 있거나 재고가 하나라도 부족하면 아무것도 차감하지 않고 거부한다.
     * 같은 clientRequestId로 다시 보내면 다시 차감하지 않고 처음 조리 결과를 돌려준다.
     */
    @Transactional
    public CookingEventResponse cookIngredients(Long userId, IngredientCookingRequest request) {
        if (request.clientRequestId() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "조리 요청 ID(clientRequestId)를 보내 주세요.");
        }
        String requestId = request.clientRequestId().toLowerCase();
        Optional<CookingEvent> previous = cookingEventRepository.findByUserIdAndClientRequestId(userId, requestId);
        if (previous.isPresent()) {
            return replay(previous.get());
        }

        LocalDate today = LocalDate.now(ZONE);
        List<CookingPlan.Usage> usages = request.usages();
        List<String> violations = restrictionViolations(userId, usages);
        if (!violations.isEmpty()) {
            throw new BusinessException(ErrorCode.COOKING_RESTRICTED_INGREDIENT, restrictedMessage(violations));
        }
        CookingPlan cookingPlan = CookingPlan.ofUsages(usages,
                lockLots(userId, CookingPlan.ingredientNames(usages)), today);
        if (cookingPlan.hasShortage()) {
            throw new BusinessException(ErrorCode.COOKING_INSUFFICIENT_STOCK,
                    ErrorCode.COOKING_INSUFFICIENT_STOCK.getMessage() + " (" + cookingPlan.shortageSummary() + ")");
        }

        CookingEvent event;
        try {
            // 같은 요청이 동시에 들어오면 유일 키에서 막힌다. 차감 전에 저장해 두 번 차감하지 않게 한다.
            event = cookingEventRepository.saveAndFlush(CookingEvent.cookedWithoutPlan(userId,
                    request.strippedRecipeName(), request.servingsOrDefault(), requestId));
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException(ErrorCode.COOKING_DUPLICATE_REQUEST);
        }
        String memo = memo("조리: " + event.getRecipeName());
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

    /** 이미 처리한 조리 요청. 그때 차감한 내역을 그대로 돌려준다. */
    private CookingEventResponse replay(CookingEvent event) {
        List<InventoryTransaction> deductions = transactionRepository.findByCookingEventId(event.getId()).stream()
                .filter(transaction -> transaction.getType() == InventoryTransactionType.COOK_DEDUCT)
                .sorted(Comparator.comparing(InventoryTransaction::getId))
                .toList();
        return CookingEventResponse.of(event, deductions);
    }

    private List<String> restrictionViolations(Long userId, List<CookingPlan.Usage> usages) {
        UserDietProfile profile = Optional.ofNullable(profileProvider.getIfAvailable())
                .map(provider -> provider.getProfile(userId))
                .orElseGet(UserDietProfile::empty);
        return IngredientRestriction.violations(CookingPlan.ingredientNames(usages), profile.restrictedIngredients());
    }

    private static String restrictedMessage(List<String> violations) {
        return ErrorCode.COOKING_RESTRICTED_INGREDIENT.getMessage() + " (" + String.join(", ", violations) + ")";
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
        String memo = memo("조리 취소: " + event.getRecipeName());
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
        return lockLots(userId, plan.getRecipe().getIngredients().stream()
                .map(RecipeIngredient::getIngredientName)
                .map(String::strip)
                .collect(Collectors.toSet()));
    }

    private List<InventoryLot> lockLots(Long userId, Set<String> names) {
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
