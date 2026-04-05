#!/bin/bash
# check-p3.sh — P3 구문 규칙 통합 검사
# P3-1: CSS rem/em 금지
# P3-2: JS var 금지
# P3-3: preview.html 로컬 CSS link 금지
#
# 트리거: PostToolUse (Edit|Write)
# 입력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"

# ─────────────────────────────────────────────
# P3-1: CSS rem/em 금지
# ─────────────────────────────────────────────
if [[ "$FILE" == *.css ]]; then
    VIOLATIONS=$(grep -En '[0-9]+rem\b|[0-9]+em\b' "$FILE" 2>/dev/null | grep -v '^\s*/[/*]')
    if [[ -n "$VIOLATIONS" ]]; then
        echo "[P3-1 위반] CSS에 rem/em 단위가 감지되었습니다. RNBT 런타임은 px 단위만 지원합니다."
        echo "$VIOLATIONS"
        exit 2
    fi
fi

# ─────────────────────────────────────────────
# P3-2: JS var 금지
# ─────────────────────────────────────────────
if [[ "$FILE" == *.js ]] && [[ "$FILE" != *.min.js ]]; then
    VIOLATIONS=$(grep -En '\bvar\b' "$FILE" 2>/dev/null | grep -v '^\s*/[/*]' | grep -v '// *var')
    if [[ -n "$VIOLATIONS" ]]; then
        echo "[P3-2 위반] JS에 var 키워드가 감지되었습니다. const 또는 let을 사용하세요."
        echo "$VIOLATIONS"
        exit 2
    fi
fi

# ─────────────────────────────────────────────
# P3-3: preview.html 로컬 CSS link 금지
# ─────────────────────────────────────────────
if [[ "$FILE" == */preview/*.html ]] || [[ "$FILE" == */preview.html ]]; then
    VIOLATIONS=$(grep -Ein '<link.*href=' "$FILE" 2>/dev/null)
    if [[ -n "$VIOLATIONS" ]]; then
        echo "[P3-3 위반] preview.html에 로컬 CSS link가 감지되었습니다. 독립 실행을 위해 인라인 스타일을 사용하세요."
        echo "$VIOLATIONS"
        exit 2
    fi
fi

exit 0
