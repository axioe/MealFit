-- 기존 회원은 NULL(정상 상태)을 유지하고, 탈퇴 시각만 추가로 기록합니다.
ALTER TABLE users ADD COLUMN deleted_at DATETIME(6) NULL;
