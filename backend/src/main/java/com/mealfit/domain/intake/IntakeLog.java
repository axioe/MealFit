package com.mealfit.domain.intake;

import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "intake_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class IntakeLog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meal_plan_id")
    private MealPlan mealPlan;

    @Enumerated(EnumType.STRING)
    @Column(name = "intake_status", nullable = false, length = 20)
    private IntakeStatus intakeStatus;

    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;

    public static IntakeLog planned(Long userId, MealPlan mealPlan) {
        IntakeLog log = new IntakeLog();
        log.userId = userId;
        log.mealPlan = mealPlan;
        log.intakeStatus = IntakeStatus.PLANNED;
        log.loggedAt = LocalDateTime.now();
        return log;
    }

    public void record(IntakeStatus next) {
        intakeStatus.validateTransition(next);
        this.intakeStatus = next;
        this.loggedAt = LocalDateTime.now();
    }
}
