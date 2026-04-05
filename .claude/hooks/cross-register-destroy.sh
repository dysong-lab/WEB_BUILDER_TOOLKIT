#!/bin/bash
# cross-register-destroy.sh — register.js ↔ beforeDestroy.js 교차 검증
# P1-2: 생성-정리 대응 + 역순 검증
# P1-3: 생성 항목 수 = 정리 항목 수
#
# 트리거: PostToolUse (Edit|Write) — register.js 또는 beforeDestroy.js 편집 시
# 입력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"
basename=$(basename "$FILE")

# register.js 또는 beforeDestroy.js가 아니면 즉시 통과
if [[ "$basename" != "register.js" ]] && [[ "$basename" != "beforeDestroy.js" ]]; then
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

if [[ "$basename" == "register.js" ]]; then
    REGISTER="$FILE"
    DESTROY="$DIR/beforeDestroy.js"
else
    DESTROY="$FILE"
    REGISTER="$DIR/register.js"
fi

# 상대 파일이 없으면 통과 (아직 작성 전일 수 있음)
if [[ ! -f "$REGISTER" ]] || [[ ! -f "$DESTROY" ]]; then
    exit 0
fi

ERRORS=""

# ─────────────────────────────────────────────
# 1. apply*Mixin 수 vs .destroy() 수
# ─────────────────────────────────────────────
MIXIN_COUNT=$(grep -cE 'apply\w+Mixin\(' "$REGISTER" 2>/dev/null)
# destroy() 또는 ?.destroy() 모두 카운트
DESTROY_COUNT=$(grep -cE '\.destroy\(\)|(\?\.)destroy\(\)' "$DESTROY" 2>/dev/null)

if [[ "$MIXIN_COUNT" -gt 0 ]] && [[ "$DESTROY_COUNT" -eq 0 ]]; then
    ERRORS+="[P1-3 위반] register.js에 Mixin ${MIXIN_COUNT}개 적용, beforeDestroy.js에 destroy() 0개.
Mixin마다 destroy()를 호출해야 합니다.
"
elif [[ "$MIXIN_COUNT" -ne "$DESTROY_COUNT" ]]; then
    ERRORS+="[P1-3 경고] register.js에 Mixin ${MIXIN_COUNT}개 적용, beforeDestroy.js에 destroy() ${DESTROY_COUNT}개.
수가 일치하지 않습니다. 확인하세요.
"
fi

# ─────────────────────────────────────────────
# 2. bindEvents/bind3DEvents 존재 시 removeCustomEvents 필수
# ─────────────────────────────────────────────
HAS_BIND=$(grep -cE 'bindEvents\(|bind3DEvents\(|bindCustomEvents\(' "$REGISTER" 2>/dev/null)
HAS_REMOVE=$(grep -c 'removeCustomEvents' "$DESTROY" 2>/dev/null)

if [[ "$HAS_BIND" -gt 0 ]] && [[ "$HAS_REMOVE" -eq 0 ]]; then
    ERRORS+="[P1-3 위반] register.js에 이벤트 바인딩이 있지만, beforeDestroy.js에 removeCustomEvents가 없습니다.
"
fi

# ─────────────────────────────────────────────
# 3. this.customEvents 정의 시 = null 필수
# ─────────────────────────────────────────────
HAS_CUSTOM_EVENTS=$(grep -c 'this\.customEvents' "$REGISTER" 2>/dev/null)
HAS_CUSTOM_EVENTS_NULL=$(grep -c 'this\.customEvents\s*=\s*null' "$DESTROY" 2>/dev/null)

if [[ "$HAS_CUSTOM_EVENTS" -gt 0 ]] && [[ "$HAS_BIND" -gt 0 ]] && [[ "$HAS_CUSTOM_EVENTS_NULL" -eq 0 ]]; then
    ERRORS+="[P1-4 위반] register.js에 this.customEvents가 있지만, beforeDestroy.js에 this.customEvents = null이 없습니다.
"
fi

# ─────────────────────────────────────────────
# 4. this.subscriptions 정의 시 = null 필수
# ─────────────────────────────────────────────
HAS_SUBS=$(grep -c 'this\.subscriptions' "$REGISTER" 2>/dev/null)
HAS_SUBS_NULL=$(grep -c 'this\.subscriptions\s*=\s*null' "$DESTROY" 2>/dev/null)

if [[ "$HAS_SUBS" -gt 0 ]] && [[ "$HAS_SUBS_NULL" -eq 0 ]]; then
    ERRORS+="[P1-4 위반] register.js에 this.subscriptions가 있지만, beforeDestroy.js에 this.subscriptions = null이 없습니다.
"
fi

# ─────────────────────────────────────────────
# 5. this.xxx = function/arrow 정의 시 this.xxx = null 필수
# ─────────────────────────────────────────────
# register.js에서 this.xxx = function 또는 this.xxx = (args) => 패턴 추출
CUSTOM_FUNCS=$(grep -oP 'this\.(\w+)\s*=\s*(function|\()' "$REGISTER" 2>/dev/null | grep -oP 'this\.(\w+)' | sort -u)

for FUNC in $CUSTOM_FUNCS; do
    # subscriptions, customEvents는 이미 위에서 검사
    FUNC_NAME=$(echo "$FUNC" | sed 's/this\.//')
    if [[ "$FUNC_NAME" == "subscriptions" ]] || [[ "$FUNC_NAME" == "customEvents" ]]; then
        continue
    fi
    # startAllIntervals, stopAllIntervals 등 페이지 함수는 제외
    if [[ "$FUNC_NAME" == "startAllIntervals" ]] || [[ "$FUNC_NAME" == "stopAllIntervals" ]]; then
        continue
    fi

    if ! grep -q "this\.${FUNC_NAME}\s*=\s*null" "$DESTROY" 2>/dev/null; then
        ERRORS+="[P1-4 위반] register.js에 this.${FUNC_NAME}이 정의되었지만, beforeDestroy.js에 this.${FUNC_NAME} = null이 없습니다.
"
    fi
done

# ─────────────────────────────────────────────
# 6. 역순 검증 (행 번호 기반)
# ─────────────────────────────────────────────
# beforeDestroy.js에서 실제 호출의 행 번호 추출 (import/const 선언 제외)
REMOVE_LINE=$(grep -n 'removeCustomEvents(' "$DESTROY" 2>/dev/null | grep -v 'const ' | head -1 | cut -d: -f1)
UNSUB_LINE=$(grep -n 'unsubscribe(' "$DESTROY" 2>/dev/null | grep -v 'const ' | head -1 | cut -d: -f1)
DESTROY_LINE=$(grep -nE '\.destroy\(\)|\?\.\s*destroy\(\)' "$DESTROY" 2>/dev/null | head -1 | cut -d: -f1)

# 3단계가 모두 존재할 때만 역순 검증
if [[ -n "$REMOVE_LINE" ]] && [[ -n "$UNSUB_LINE" ]] && [[ -n "$DESTROY_LINE" ]]; then
    # 역순: removeCustomEvents(3) → unsubscribe(2) → destroy(1)
    if [[ "$REMOVE_LINE" -gt "$UNSUB_LINE" ]]; then
        ERRORS+="[P1-2 위반] beforeDestroy.js 역순 오류: removeCustomEvents(행 ${REMOVE_LINE})가 unsubscribe(행 ${UNSUB_LINE})보다 뒤에 있습니다.
정리 순서: 이벤트 제거 → 구독 해제 → Mixin destroy (생성의 역순)
"
    fi
    if [[ "$UNSUB_LINE" -gt "$DESTROY_LINE" ]]; then
        ERRORS+="[P1-2 위반] beforeDestroy.js 역순 오류: unsubscribe(행 ${UNSUB_LINE})가 destroy(행 ${DESTROY_LINE})보다 뒤에 있습니다.
정리 순서: 이벤트 제거 → 구독 해제 → Mixin destroy (생성의 역순)
"
    fi
fi

# 2단계만 존재할 때 (이벤트 없는 경우: 01_status 등)
if [[ -z "$REMOVE_LINE" ]] && [[ -n "$UNSUB_LINE" ]] && [[ -n "$DESTROY_LINE" ]]; then
    if [[ "$UNSUB_LINE" -gt "$DESTROY_LINE" ]]; then
        ERRORS+="[P1-2 위반] beforeDestroy.js 역순 오류: unsubscribe(행 ${UNSUB_LINE})가 destroy(행 ${DESTROY_LINE})보다 뒤에 있습니다.
정리 순서: 구독 해제 → Mixin destroy (생성의 역순)
"
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
