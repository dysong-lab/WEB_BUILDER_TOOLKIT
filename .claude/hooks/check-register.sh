#!/bin/bash
# check-register.sh — register.js 단일 파일 검사
# P0-2: fetch 로직 혼입 차단
# P1-1: 구독 연결 존재 확인
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
# P0-2: fetch 로직 혼입 차단
# ─────────────────────────────────────────────
# 주석 행을 제외하고 검사
FETCH_VIOLATIONS=$(grep -En 'fetch\(|XMLHttpRequest|axios|fetchData|fetchAndPublish' "$FILE" 2>/dev/null | grep -v '^\s*/[/*]' | grep -v '// ')
if [[ -n "$FETCH_VIOLATIONS" ]]; then
    ERRORS+="[P0-2 위반] register.js에 데이터 호출 로직이 감지되었습니다.
컴포넌트는 직접 fetch하지 않습니다. 페이지가 데이터를 발행하고, 컴포넌트는 구독만 합니다.
감지 위치:
$FETCH_VIOLATIONS
"
fi

# ─────────────────────────────────────────────
# P1-1: 필수 구조 존재 확인
# ─────────────────────────────────────────────
# 구독 연결 (컴포넌트는 구독으로 데이터를 받는다)
if ! grep -qE 'subscribe\(' "$FILE" 2>/dev/null; then
    ERRORS+="[P1-1 위반] register.js에 구독 연결이 없습니다.
subscribe(topic, this, handler) 호출이 필요합니다.
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
