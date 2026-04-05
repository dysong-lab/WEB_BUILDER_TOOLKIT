#!/bin/bash
# check-register.sh — register.js 단일 파일 검사
# P0-2: 렌더링/fetch 로직 혼입 차단
# P1-1: Mixin 적용 + 구독 연결 존재 확인
#
# 트리거: PostToolUse (Edit|Write)
# 입력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"

# register.js가 아니면 즉시 통과
basename=$(basename "$FILE")
if [[ "$basename" != "register.js" ]]; then
    exit 0
fi

# DesignComponentSystem 경로 내의 register.js만 대상
if [[ "$FILE" != *"DesignComponentSystem"* ]]; then
    exit 0
fi

ERRORS=""

# ─────────────────────────────────────────────
# P0-2: 렌더링/fetch 로직 혼입 차단
# ─────���───────────────────────────────────────
# 주석 행을 제외하고 검사
RENDER_VIOLATIONS=$(grep -En 'innerHTML|appendChild|createElement|insertAdjacentHTML' "$FILE" 2>/dev/null | grep -v '^\s*/[/*]' | grep -v '// ')
if [[ -n "$RENDER_VIOLATIONS" ]]; then
    ERRORS+="[P0-2 위반] register.js에 렌더링 로직이 감지되었습니다.
register.js는 조립(Mixin 적용, 구독 연결, 이벤트 매핑)만 합니다.
렌더링 로직(innerHTML, appendChild, createElement)을 제거하세요.
감지 위치:
$RENDER_VIOLATIONS
"
fi

FETCH_VIOLATIONS=$(grep -En 'fetch\(|XMLHttpRequest|axios' "$FILE" 2>/dev/null | grep -v '^\s*/[/*]' | grep -v '// ')
if [[ -n "$FETCH_VIOLATIONS" ]]; then
    ERRORS+="[P0-2 위반] register.js에 데이터 호출 로직이 감지되었습니다.
컴포넌트는 직접 fetch하지 않습니다. 페이지가 데이터를 발행하고, 컴포넌트는 구독만 합니다.
감지 위치:
$FETCH_VIOLATIONS
"
fi

# ───────��─────────────────────────────────────
# P1-1: 필수 구조 존재 확인
# ──────��──────────────────────────────────────
# Step 1: Mixin 적용
if ! grep -qE 'apply\w+Mixin|loadMixin' "$FILE" 2>/dev/null; then
    ERRORS+="[P1-1 위반] register.js에 Mixin 적용이 없습니다.
Step 1 (Mixin 적용): applyXxxMixin() 또는 Wkit.loadMixin() 호출이 필요합니다.
"
fi

# Step 2: 구독 연결
if ! grep -qE 'subscribe\(' "$FILE" 2>/dev/null; then
    ERRORS+="[P1-1 위반] register.js에 구독 연결이 없습니다.
Step 2 (구독 연결): subscribe(topic, this, handler) 호출이 필요합니다.
"
fi

# ─────────────────────────────────────────────
# 결과 출력
# ──────��──────────────────────────────────────
if [[ -n "$ERRORS" ]]; then
    echo "$ERRORS"
    exit 2
fi

exit 0
