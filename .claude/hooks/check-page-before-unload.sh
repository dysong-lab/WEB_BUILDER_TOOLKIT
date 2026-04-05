#!/bin/bash
# check-page-before-unload.sh — page before_unload.js 단일 파일 검사
# 필수: 핵심 정리 호출 존재 확인 (생성-정리 매칭)
#
# 트리거: PostToolUse (Edit|Write)
# 입력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"

# before_unload.js가 아���면 즉시 통과
basename=$(basename "$FILE")
if [[ "$basename" != "before_unload.js" ]]; then
    exit 0
fi

# 페이지 스크립트 경로만 대상
if [[ "$FILE" != *"page_scripts"* ]] && [[ "$FILE" != *"/page/"* ]]; then
    exit 0
fi

# DesignComponentSystem 경로 내만 대상
if [[ "$FILE" != *"DesignComponentSystem"* ]]; then
    exit 0
fi

ERRORS=""

# ───────────���─────────────────────────────────
# 필수 정리 호출 확인
# ───────────────��─────────────────────────────

# 1. 이벤트 핸들러 해제
if ! grep -q 'offEventBusHandlers' "$FILE" 2>/dev/null; then
    ERRORS+="[P1 위���] before_unload.js에 이벤트 핸들러 해제(offEventBusHandlers)가 없습니다.
before_load.js에서 onEventBusHandlers로 등록한 핸들러를 해제해야 합니다.
"
fi

# 2. 데이터 매핑 해제
if ! grep -q 'unregisterMapping' "$FILE" 2>/dev/null; then
    ERRORS+="[P1 위반] before_unload.js에 데이터 매핑 해제(unregisterMapping)가 없습니다.
loaded.js에서 registerMapping으로 등록한 매핑을 해제해�� 합니다.
"
fi

# 3. null 정리
if ! grep -q '= null' "$FILE" 2>/dev/null; then
    ERRORS+="[P1-4 위반] before_unload.js에 참조 null 처리가 없습니다.
pageDataMappings, pageParams, pageEventBusHandlers, pageIntervals 등을 null로 정��해야 합니다.
"
fi

# ───────���──────────────────────���──────────────
# 결과 출력
# ─────��─────────────────────────────────��─────
if [[ -n "$ERRORS" ]]; then
    echo "$ERRORS"
    exit 2
fi

exit 0
