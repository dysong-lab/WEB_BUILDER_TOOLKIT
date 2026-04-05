#!/bin/bash
# check-page-loaded.sh — page loaded.js 단일 파일 검사
# P0-4: 페이지에서 직접 렌더링 차단
# 필수: 데이터 매핑 존재 확인
#
# 트리거: PostToolUse (Edit|Write)
# 입력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"

# loaded.js가 아니면 즉시 통과
basename=$(basename "$FILE")
if [[ "$basename" != "loaded.js" ]]; then
    exit 0
fi

# 페이지 스크립트 경로만 대상 (page_scripts/ 또는 page/ 하위)
if [[ "$FILE" != *"page_scripts"* ]] && [[ "$FILE" != *"/page/"* ]]; then
    exit 0
fi

# DesignComponentSystem 경로 내만 대상
if [[ "$FILE" != *"DesignComponentSystem"* ]]; then
    exit 0
fi

ERRORS=""

# ─────────��───────────────────────────────────
# P0-4: 직접 렌더링 차단
# ─────────────────────────────────────────────
RENDER_VIOLATIONS=$(grep -En 'innerHTML|appendChild|createElement|insertAdjacentHTML|querySelector' "$FILE" 2>/dev/null | grep -v '^\s*/[/*]' | grep -v '// ')
if [[ -n "$RENDER_VIOLATIONS" ]]; then
    ERRORS+="[P0-4 위반] loaded.js에 DOM 조작이 감지되었습니다.
페이지는 오케스트레이션(데이터 매핑, interval 관리, param 관리)만 합니다.
직접 DOM 조작(innerHTML, querySelector 등)을 제거하세요.
감지 위치:
$RENDER_VIOLATIONS
"
fi

# ─────────────────────────��───────────────────
# 필수 패턴: 데이터 매핑 존재
# ─────────────────────────────────────────────
if ! grep -qE 'pageDataMappings|registerMapping' "$FILE" 2>/dev/null; then
    ERRORS+="[P1 위반] loaded.js에 데이터 매핑 정의가 없습니다.
페이지의 loaded.js는 pageDataMappings를 정의하고 registerMapping으로 등록해야 합니다.
"
fi

# ───────���─────────────────────────────────────
# 결과 출력
# ────────���────────────────────────────────────
if [[ -n "$ERRORS" ]]; then
    echo "$ERRORS"
    exit 2
fi

exit 0
