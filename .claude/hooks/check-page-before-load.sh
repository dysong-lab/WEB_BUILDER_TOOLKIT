#!/bin/bash
# check-page-before-load.sh — page before_load.js 단일 파일 ��사
# P0-4: 페이지에서 직접 렌더링 차단
# 필수: 이벤트 핸들러 등록 존재 확인
#
# 트리거: PostToolUse (Edit|Write)
# 입력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"

# before_load.js가 아니면 즉시 통과
basename=$(basename "$FILE")
if [[ "$basename" != "before_load.js" ]]; then
    exit 0
fi

# 페이지 스크립트 경로만 대상
if [[ "$FILE" != *"page_scripts"* ]] && [[ "$FILE" != *"/page/"* ]]; then
    exit 0
fi

# DesignComponentSystem 경로 ���만 대상
if [[ "$FILE" != *"DesignComponentSystem"* ]]; then
    exit 0
fi

ERRORS=""

# ─────────────────────────────────────���───────
# P0-4: 직접 렌더링 차단
# ────���────────────────────��───────────────────
RENDER_VIOLATIONS=$(grep -En 'innerHTML|appendChild|createElement|insertAdjacentHTML' "$FILE" 2>/dev/null | grep -v '^\s*/[/*]' | grep -v '// ')
if [[ -n "$RENDER_VIOLATIONS" ]]; then
    ERRORS+="[P0-4 위반] before_load.js에 DOM 조작이 감지되었습니다.
before_load.js는 이벤트 핸들러 등록만 합니다.
직접 DOM 조작(innerHTML, appendChild 등)을 제거하세요.
감지 위치:
$RENDER_VIOLATIONS
"
fi

# ───────��─────────────────────────────────────
# 필수 패턴: 이벤트 핸들러 등록
# ─────────────────────────────────────────────
if ! grep -qE 'pageEventBusHandlers|onEventBusHandlers' "$FILE" 2>/dev/null; then
    ERRORS+="[P1 위반] before_load.js에 이벤트 핸들러 등록이 없습��다.
페이지의 before_load.js는 pageEventBusHandlers를 정의하고 onEventBusHandlers로 등록해야 합니다.
"
fi

# ────────────────��────────────────────────────
# 결과 출력
# ─────────────────────────��───────────────────
if [[ -n "$ERRORS" ]]; then
    echo "$ERRORS"
    exit 2
fi

exit 0
