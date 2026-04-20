-- DJ별 게스트 코드 시스템 도입
-- invited_by 컬럼 제거, artist_id 컬럼 추가
ALTER TABLE access_requests DROP COLUMN invited_by;
ALTER TABLE access_requests ADD COLUMN artist_id TEXT REFERENCES artists(id);
