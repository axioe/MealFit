package com.mealfit.domain.inventory;

import static org.assertj.core.api.Assertions.*;
import com.mealfit.global.exception.BusinessException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class InventoryRestorationBoundaryTest {
    private InventoryLot lot(String quantity) {
        return InventoryLot.builder().userId(1L).ingredientName("복원 경계 검증")
                .quantity(new BigDecimal(quantity)).unit("g").storageLocation(StorageLocation.FRIDGE).build();
    }

    @Test void restoreRejectsResultBeyondDatabaseRangeWithoutChangingLot() {
        InventoryLot lot = lot("999999999.999");
        assertThatThrownBy(() -> lot.restore(new BigDecimal("0.001"))).isInstanceOf(BusinessException.class);
        assertThat(lot.getQuantity()).isEqualByComparingTo("999999999.999");
        assertThat(lot.getStatus()).isEqualTo(LotStatus.ACTIVE);
    }

    @Test void restoreAllowsExactUpperBoundary() {
        InventoryLot lot = lot("999999999.998");
        lot.restore(new BigDecimal("0.001"));
        assertThat(lot.getQuantity()).isEqualByComparingTo("999999999.999");
    }

    @Test void restoreReactivatesDepletedLotAndPreservesMetadata() {
        InventoryLot lot = lot("1");
        lot.deduct(BigDecimal.ONE);
        lot.restore(BigDecimal.ONE);
        assertThat(lot.getStatus()).isEqualTo(LotStatus.ACTIVE);
        assertThat(lot.getQuantity()).isEqualByComparingTo("1");
        assertThat(lot.getStorageLocation()).isEqualTo(StorageLocation.FRIDGE);
    }
}
