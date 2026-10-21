package com.mealfit.domain.cooking;

import com.mealfit.domain.cooking.dto.CookingEventRequest;
import com.mealfit.domain.cooking.dto.CookingEventResponse;
import com.mealfit.domain.cooking.dto.CookingPreviewResponse;
import com.mealfit.global.web.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Cooking", description = "조리·재고 차감")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CookingController {

    private final CookingService cookingService;

    @Operation(summary = "조리 차감 미리보기 (재고·이력은 바꾸지 않음)")
    @GetMapping("/cooking/preview")
    public CookingPreviewResponse preview(@CurrentUserId Long userId, @RequestParam Long mealPlanId) {
        return cookingService.preview(userId, mealPlanId);
    }

    @Operation(summary = "조리 완료 (확정 식단만, 재고 차감과 COOK_DEDUCT 이력 저장)")
    @PostMapping("/cooking-events")
    @ResponseStatus(HttpStatus.CREATED)
    public CookingEventResponse cook(@CurrentUserId Long userId, @Valid @RequestBody CookingEventRequest request) {
        return cookingService.cook(userId, request);
    }

    @Operation(summary = "조리 취소 (조리 당시 차감한 묶음에 원래 수량대로 복원)")
    @PostMapping("/cooking-events/{id}/cancel")
    public CookingEventResponse cancel(@CurrentUserId Long userId, @PathVariable Long id) {
        return cookingService.cancel(userId, id);
    }
}
