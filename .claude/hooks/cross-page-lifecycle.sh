#!/bin/bash
# cross-page-lifecycle.sh — page loaded.js ↔ before_unload.js 교차 검증
# P1-2: 페이지 생성-정리 대응
#
# 트리거: PostToolUse (Edit|Write) — before_unload.js 또는 loaded.js 편집 시
# 입력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"
basename=$(basename "$FILE")

# before_unload.js 또는 loaded.js가 아니면 즉시 통과
if [[ "$basename" != "before_unload.js" ]] && [[ "$basename" != "loaded.js" ]]; then
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

# ─────────────────────────────────────────────
# 상대 파일 경로 추론
# ─────────────────────────────────────────────
DIR=$(dirname "$FILE")
LOADED="$DIR/loaded.js"
BEFORE_LOAD="$DIR/before_load.js"
BEFORE_UNLOAD="$DIR/before_unload.js"

# loaded.js와 before_unload.js 둘 다 있어야 검증
if [[ ! -f "$LOADED" ]] || [[ ! -f "$BEFORE_UNLOAD" ]]; then
    exit 0
fi

ERRORS=""

# ─────────────────────────────────────────────
# loaded.js에서 생성한 것 → before_unload.js에서 정리 확인
# ─────────────────────────────────────────────

# 1. pageDataMappings → unregisterMapping
if grep -q 'pageDataMappings' "$LOADED" 2>/dev/null; then
    if ! grep -q 'unregisterMapping' "$BEFORE_UNLOAD" 2>/dev/null; then
        ERRORS+="[P1-2 위반] loaded.js에 pageDataMappings가 있지만, before_unload.js에 unregisterMapping이 없습니다.
"
    fi
    if ! grep -q 'pageDataMappings\s*=\s*null' "$BEFORE_UNLOAD" 2>/dev/null; then
        ERRORS+="[P1-4 위반] loaded.js에 pageDataMappings가 있지만, before_unload.js에 pageDataMappings = null이 없습니다.
"
    fi
fi

# 2. startAllIntervals → stopAllIntervals
if grep -q 'startAllIntervals' "$LOADED" 2>/dev/null; then
    if ! grep -q 'stopAllIntervals' "$BEFORE_UNLOAD" 2>/dev/null; then
        ERRORS+="[P1-2 위반] loaded.js에 startAllIntervals가 있지만, before_unload.js에 stopAllIntervals가 없습니다.
"
    fi
fi

# 3. pageParams → pageParams = null
if grep -q 'pageParams' "$LOADED" 2>/dev/null; then
    if ! grep -q 'pageParams\s*=\s*null' "$BEFORE_UNLOAD" 2>/dev/null; then
        ERRORS+="[P1-4 위반] loaded.js에 pageParams가 있지만, before_unload.js에 pageParams = null이 없습니다.
"
    fi
fi

# ─────────────────────────────────────────────
# before_load.js에서 생성한 것 → before_unload.js에서 정리 확인
# ─────────────────────────────────────────────
if [[ -f "$BEFORE_LOAD" ]]; then
    # 4. pageEventBusHandlers → offEventBusHandlers
    if grep -q 'pageEventBusHandlers' "$BEFORE_LOAD" 2>/dev/null; then
        if ! grep -q 'offEventBusHandlers' "$BEFORE_UNLOAD" 2>/dev/null; then
            ERRORS+="[P1-2 위반] before_load.js에 pageEventBusHandlers가 있지만, before_unload.js에 offEventBusHandlers가 없습니다.
"
        fi
        if ! grep -q 'pageEventBusHandlers\s*=\s*null' "$BEFORE_UNLOAD" 2>/dev/null; then
            ERRORS+="[P1-4 위반] before_load.js에 pageEventBusHandlers가 있지만, before_unload.js에 pageEventBusHandlers = null이 없습니다.
"
        fi
    fi

    # 5. raycastingEvents → removeEventListener (3D 페이지)
    if grep -q 'raycastingEvents' "$BEFORE_LOAD" 2>/dev/null; then
        if ! grep -q 'removeEventListener' "$BEFORE_UNLOAD" 2>/dev/null; then
            ERRORS+="[P1-2 위반] before_load.js에 raycastingEvents(3D)가 있지만, before_unload.js에 removeEventListener가 없습니다.
"
        fi
        if ! grep -q 'raycastingEvents\s*=\s*null' "$BEFORE_UNLOAD" 2>/dev/null; then
            ERRORS+="[P1-4 위반] before_load.js에 raycastingEvents가 있지만, before_unload.js에 raycastingEvents = null이 없습니다.
"
        fi
    fi

    # 6. disposeAllThreeResources (3D 페이지 — raycasting이 있으면 3D)
    if grep -q 'raycastingEvents\|initThreeRaycasting' "$BEFORE_LOAD" 2>/dev/null; then
        if ! grep -q 'disposeAllThreeResources' "$BEFORE_UNLOAD" 2>/dev/null; then
            ERRORS+="[P1-2 위반] 3D 페이지(raycasting 설정 있음)이지만, before_unload.js에 disposeAllThreeResources가 없습니다.
"
        fi
    fi
fi

# ─────────────────────────────────────────────
# 결과 출력
# ─────────────────────────────────────────────
if [[ -n "$ERRORS" ]]; then
    echo "$ERRORS"
    exit 2
fi

exit 0
