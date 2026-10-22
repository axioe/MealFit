package com.mealfit.support;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 기존 기능 테스트의 고정 사용자 ID에 회원·빈 프로필을 준비합니다.
 * 테스트 소스에서만 사용하며 실제 인증·프로필 검사는 우회하지 않습니다.
 */
public final class TestUserFixture implements AutoCloseable {

    private static final String PASSWORD_HASH =
        new BCryptPasswordEncoder().encode("TestFixture123!");

    private final JdbcTemplate jdbc;
    private final long userId;
    private final boolean createdUser;
    private final boolean createdProfile;

    private TestUserFixture(
            JdbcTemplate jdbc, long userId,
            boolean createdUser, boolean createdProfile
    ) {
        this.jdbc = jdbc;
        this.userId = userId;
        this.createdUser = createdUser;
        this.createdProfile = createdProfile;
    }

    /**
     * 기존 테스트가 사용하는 ID를 그대로 유지합니다.
     * @Transactional 테스트에서는 생성 데이터가 함께 롤백됩니다.
     */
    public static TestUserFixture create(JdbcTemplate jdbc, long userId) {
        boolean createdUser = jdbc.queryForObject(
            "select count(*) from users where id = ?", Long.class, userId) == 0;

        if (createdUser) {
            jdbc.update("""
                insert into users (id, email, password_hash, created_at, updated_at)
                values (?, ?, ?, current_timestamp, current_timestamp)
                """, userId, "fixture-" + userId + "@example.com", PASSWORD_HASH);
        }

        boolean createdProfile = jdbc.queryForObject(
            "select count(*) from profiles where user_id = ?", Long.class, userId) == 0;

        if (createdProfile) {
            // 목표·조리 시간·예산은 미설정, 제한 재료 목록은 빈 상태입니다.
            jdbc.update("""
                insert into profiles (user_id, nickname, created_at, updated_at)
                values (?, ?, current_timestamp, current_timestamp)
                """, userId, "테스트회원" + userId);
        }

        return new TestUserFixture(jdbc, userId, createdUser, createdProfile);
    }

    /**
     * 실제 커밋을 사용하는 동시성 테스트의 종료 시 호출합니다.
     * 테스트 도메인의 재고·식단 등을 먼저 정리한 후 실행해야 합니다.
     * 이 도우미가 새로 생성한 회원·프로필만 삭제합니다.
     */
    @Override
    public void close() {
        if (createdProfile) {
            jdbc.update("""
                delete from profile_allergies
                where profile_id in (select id from profiles where user_id = ?)
                """, userId);
            jdbc.update("""
                delete from profile_excluded_ingredients
                where profile_id in (select id from profiles where user_id = ?)
                """, userId);
            jdbc.update("delete from profiles where user_id = ?", userId);
        }

        if (createdUser) {
            jdbc.update("delete from users where id = ?", userId);
        }
    }
}
