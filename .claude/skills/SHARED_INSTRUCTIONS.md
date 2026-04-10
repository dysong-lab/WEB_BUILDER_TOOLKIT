# 모든 스킬 공통 지침

이 파일은 호환성을 위한 얇은 진입점이다.

## 읽기 정책

- 새 세션 시작 시 1회 읽는다.
- 같은 세션에서는 관련 파일이나 작업 유형이 바뀐 경우에만 다시 읽는다.
- 실제 코드 작성이 필요하면 `SHARED_PATTERNS.md`를 추가로 읽는다.

## 문서 구성

- 공통 인덱스: [SHARED_INDEX.md](/.claude/skills/SHARED_INDEX.md)
- 공통 코드 패턴: [SHARED_PATTERNS.md](/.claude/skills/SHARED_PATTERNS.md)

## 사용 규칙

- 문서/스킬/파일 경로를 찾을 때는 `SHARED_INDEX.md`를 우선 참조한다.
- `register.js`, `beforeDestroy.js`, 데이터 변환, subscriptions, customEvents 패턴이 필요하면 `SHARED_PATTERNS.md`를 읽는다.
- 기존 SKILL에서 이 파일을 참조하고 있어도, 실제 상세 규칙은 위 두 파일에서 확인한다.
