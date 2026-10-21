package com.mealfit.domain.recipe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class QuantityTest {

    private static Quantity q(String amount, String unit) {
        return Quantity.of(new BigDecimal(amount), unit);
    }

    @Test
    void 인분_환산() {
        // 2인분 기준 300g → 3인분이면 450g
        assertThat(q("300", "g").scaleServings(2, 3)).isEqualTo(q("450", "g"));
        // 나누어떨어지지 않으면 소수 셋째 자리에서 반올림
        assertThat(q("100", "g").scaleServings(3, 1).amount()).isEqualByComparingTo("33.333");
        assertThat(q("2", "큰술").scaleServings(2, 3).amount()).isEqualByComparingTo("3");
        assertThat(q("1", "큰술").scaleServings(2, 3).amount()).isEqualByComparingTo("1.5");
    }

    @Test
    void 개_팩_마리는_정수로_올림() {
        // 2인분 기준 달걀 1개 → 3인분이면 1.5개 → 2개
        assertThat(q("1", "개").scaleServings(2, 3).amount()).isEqualByComparingTo("2");
        assertThat(q("1", "개").scaleServings(3, 1).amount()).isEqualByComparingTo("1");
        assertThat(q("1", "팩").scaleServings(4, 1).amount()).isEqualByComparingTo("1");
        assertThat(q("1", "마리").scaleServings(2, 5).amount()).isEqualByComparingTo("3");
        // 나누어떨어지면 그대로
        assertThat(q("2", "개").scaleServings(2, 3).amount()).isEqualByComparingTo("3");
    }

    @Test
    void 인분은_1_이상() {
        assertThatThrownBy(() -> q("100", "g").scaleServings(0, 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> q("100", "g").scaleServings(2, 0)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void kg_g_L_ml만_기본_단위로_환산() {
        assertThat(q("1.5", "kg").toBaseUnit()).isEqualTo(q("1500", "g"));
        assertThat(q("0.5", "L").toBaseUnit()).isEqualTo(q("500", "ml"));
        assertThat(q("2", "개").toBaseUnit()).isEqualTo(q("2", "개"));
    }

    @Test
    void 같은_계열_단위로_바꾼다() {
        assertThat(q("300", "g").convertTo("kg")).isEqualTo(q("0.3", "kg"));
        assertThat(q("1.5", "L").convertTo("ml")).isEqualTo(q("1500", "ml"));
        assertThat(q("2", "개").convertTo("개")).isEqualTo(q("2", "개"));
        assertThatThrownBy(() -> q("2", "개").convertTo("g")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 같은_계열_단위는_더한다() {
        assertThat(q("1", "kg").plus(q("200", "g"))).isEqualTo(q("1200", "g"));
        assertThat(q("1", "L").plus(q("250", "ml"))).isEqualTo(q("1250", "ml"));
        assertThat(q("2", "개").plus(q("1", "개"))).isEqualTo(q("3", "개"));
    }

    @Test
    void 개_팩_마리는_서로_더하지_않는다() {
        assertThat(q("2", "개").isSummableWith(q("1", "팩"))).isFalse();
        assertThat(q("1", "마리").isSummableWith(q("1", "개"))).isFalse();
        assertThat(q("100", "g").isSummableWith(q("100", "ml"))).isFalse();
        assertThatThrownBy(() -> q("2", "개").plus(q("1", "팩"))).isInstanceOf(IllegalArgumentException.class);
    }
}
