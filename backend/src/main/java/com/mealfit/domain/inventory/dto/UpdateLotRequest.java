package com.mealfit.domain.inventory.dto;

import com.mealfit.domain.inventory.InventoryAction;
import com.mealfit.domain.inventory.StorageLocation;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateLotRequest(
        @NotNull(message = "변경 작업을 선택해 주세요.") InventoryAction action,
        @Schema(description = "ADJUST는 변경 후 수량, DISPOSE는 폐기 수량입니다. ADJUST에서 생략하면 기존 수량을 유지합니다.")
        @DecimalMin(value = "0", message = "수량은 음수일 수 없습니다.")
        @Digits(integer = 9, fraction = 3, message = "수량은 정수 9자리, 소수 3자리까지 입력해 주세요.") BigDecimal quantity,
        StorageLocation storageLocation,
        LocalDate expiryDate,
        @Schema(description = "ADJUST에서 true이면 소비기한을 미등록으로 변경합니다. expiryDate와 동시에 지정할 수 없습니다.")
        Boolean clearExpiryDate,
        @DecimalMin(value = "0", message = "최소 유지량은 음수일 수 없습니다.")
        @Digits(integer = 9, fraction = 3, message = "최소 유지량은 정수 9자리, 소수 3자리까지 입력해 주세요.") BigDecimal minStockQty,
        @Schema(description = "ADJUST는 로트 메모를 수정하고, DISPOSE는 폐기 이력에 사유를 기록합니다. 빈 문자열로 메모를 지울 수 있습니다.")
        @Size(max = 255, message = "메모는 255자 이내로 입력해 주세요.") String memo
) {
}
