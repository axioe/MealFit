-- Refresh Token 원문은 저장하지 않고 SHA-256 해시만 저장합니다.
CREATE TABLE refresh_tokens (
                              id          BIGINT      NOT NULL AUTO_INCREMENT,
                              user_id     BIGINT      NOT NULL,
                              token_hash  VARCHAR(64)  NOT NULL,
                              expires_at  DATETIME(6) NOT NULL,
                              revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
                              created_at  DATETIME(6) NOT NULL,
                              updated_at  DATETIME(6) NOT NULL,

                              PRIMARY KEY (id),

  -- 같은 토큰 해시가 중복 저장되는 것을 방지합니다.
                              CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash),

  -- 토큰을 실제 회원과 연결합니다.
                              CONSTRAINT fk_refresh_tokens_user
                                FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 회원별 사용 가능한 토큰 조회·일괄 폐기에 사용합니다.
CREATE INDEX idx_refresh_tokens_user_revoked
  ON refresh_tokens (user_id, revoked);

-- 만료된 토큰을 정리할 때 사용합니다.
CREATE INDEX idx_refresh_tokens_expires_at
  ON refresh_tokens (expires_at);
