package com.mealfit.domain.ai;

import com.mealfit.global.exception.ErrorResponse;
import com.mealfit.global.web.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/quick-recipes")
@Tag(name = "Quick recipes", description = "냉장고 맞춤 AI 요리 추천")
public class QuickRecipeController {
    private final QuickRecipeService service;

    @PostMapping("/recommend")
    @Operation(summary = "본인의 냉장고 재료로 15분 요리 추천")
    public QuickRecipeModels.Response recommend(@CurrentUserId Long userId, @Valid @RequestBody QuickRecipeModels.Request request) {
        return service.recommend(userId, request);
    }

    @ExceptionHandler(QuickRecipeException.class)
    public ResponseEntity<ErrorResponse> handle(QuickRecipeException error) {
        return ResponseEntity.status(error.getStatus()).body(new ErrorResponse(error.getStatus(), error.getCode(),
                error.getMessage(), List.of(), LocalDateTime.now()));
    }
}
