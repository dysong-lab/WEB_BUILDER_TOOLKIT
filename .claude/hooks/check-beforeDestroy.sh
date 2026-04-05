#!/bin/bash
# check-beforeDestroy.sh — beforeDestroy.js 단일 파��� 검사
# P1-4: null 정리 존재 확인
# 추가: destroy() 호출 확인
#
# 트리거: PostToolUse (Edit|Write)
# ���력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"

# beforeDestroy.js가 아니면 즉시 ���과
basename=$(basename "$FILE")
if [[ "$basename" != "beforeDestroy.js" ]]; then
    exit 0
fi

# DesignComponentSystem 경로 내만 대상
if [[ "$FILE" != *"DesignComponentSystem"* ]]; then
    exit 0
fi

ERRORS=""

# ──────────────���──────────────────────────��───
# P1-4: null 정리 존재 확인
# ─────────���───────────────────────────────────
if ! grep -q '= null' "$FILE" 2>/dev/null; then
    ERRORS+="[P1-4 위반] beforeDestroy.js에 참조 null 처리가 없습니다.
register.js에서 생성한 this.subscriptions, this.customEvents 등을 null로 정리해야 합니다.
"
fi

# ───��────────��────────────────────────────────
# Mixin destroy() 호출 확인
# ─────────────────────────────────────────────
# destroy() 또는 ?.destroy() 모두 허용
if ! grep -qE '\.destroy\(\)|\.destroy\?\.\(\)|\?\.\s*destroy\(\)' "$FILE" 2>/dev/null; then
    ERRORS+="[P1 위��] beforeDestroy.js에 Mixin destroy() 호출이 없습니다.
register.js에서 적용한 Mixin은 반드시 destroy()로 정리해야 합니다.
예: this.fieldRender.destroy() 또는 this.meshState?.destroy()
"
fi

# ─────���───────────────────────────────────────
# unsubscribe 존재 확인
# ─────────────────────────────────────────────
if ! grep -q 'unsubscribe' "$FILE" 2>/dev/null; then
    ERRORS+="[P1 위반] beforeDestroy.js에 구독 해제(unsubscribe)가 없습니다.
register.js에서 subscribe로 등록한 구독을 해제해야 합니다.
"
fi

# ───────��─────────────────────────────────────
# 결과 출력
# ─────────────────────────────────────────────
if [[ -n "$ERRORS" ]]; then
    echo "$ERRORS"
    exit 2
fi

exit 0
