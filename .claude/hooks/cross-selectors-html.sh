#!/bin/bash
# cross-selectors-html.sh — cssSelectors ↔ HTML 교차 검증
# P2-1: cssSelectors에 선언된 선택자가 HTML에 존재하는지
# P2-2: ListRenderMixin 사용 시 <template> 태그 존재하는지
#
# 트리거: PostToolUse (Edit|Write) — register.js 편집 시
# 입력: $CLAUDE_FILE_PATH

FILE="$CLAUDE_FILE_PATH"
basename=$(basename "$FILE")

# register.js가 아니면 즉시 통과
if [[ "$basename" != "register.js" ]]; then
    exit 0
fi

# DesignComponentSystem 경로 내만 대상
if [[ "$FILE" != *"DesignComponentSystem"* ]]; then
    exit 0
fi

# 3D 컴포넌트는 HTML 뷰가 없으므로 제외
if [[ "$FILE" == *"3D_Components"* ]]; then
    exit 0
fi

# ─────────────────────────────────────────────
# views/*.html 파일 찾기
# ─────────────────────────────────────────────
# register.js 위치에서 컴포넌트 루트로 이동
SCRIPT_DIR=$(dirname "$FILE")
COMPONENT_DIR=$(dirname "$SCRIPT_DIR")

# views/ 디렉토리 탐색
HTML_DIR="$COMPONENT_DIR/views"
if [[ ! -d "$HTML_DIR" ]]; then
    # scripts/ 한 단계 더 위로
    COMPONENT_DIR=$(dirname "$COMPONENT_DIR")
    HTML_DIR="$COMPONENT_DIR/views"
fi

if [[ ! -d "$HTML_DIR" ]]; then
    # views가 없으면 통과 (아직 생성 전일 수 있음)
    exit 0
fi

HTML_FILES=$(find "$HTML_DIR" -name "*.html" 2>/dev/null)
if [[ -z "$HTML_FILES" ]]; then
    exit 0
fi

# 모든 HTML을 하나로 합침 (여러 파일일 수 있음)
ALL_HTML=$(cat $HTML_FILES 2>/dev/null)

ERRORS=""

# ─────────────────────────────────────────────
# P2-1: cssSelectors 값 추출 → HTML에서 확인
# ─────────────────────────────────────────────
# cssSelectors 블록에서 선택자 값 추출
# 패턴: 'key': '.class-name' 또는 key: '.class-name' 또는 '#id-name'
SELECTORS=$(grep -oP "(?:cssSelectors|cssSelectors:)\s*\{[^}]*\}" "$FILE" 2>/dev/null | grep -oP "'[^']*'|\"[^\"]*\"" | tr -d "'" | tr -d '"' | grep -E '^\.' | sort -u)

# ID 선택자도 추출
ID_SELECTORS=$(grep -oP "(?:cssSelectors|cssSelectors:)\s*\{[^}]*\}" "$FILE" 2>/dev/null | grep -oP "'[^']*'|\"[^\"]*\"" | tr -d "'" | tr -d '"' | grep -E '^#' | sort -u)

# 클래스 선택자 검증
for SEL in $SELECTORS; do
    # .class-name → class="class-name" 또는 class="... class-name ..."
    CLASS_NAME="${SEL#.}"
    if ! echo "$ALL_HTML" | grep -qE "class=['\"][^'\"]*${CLASS_NAME}[^'\"]*['\"]|class=['\"]${CLASS_NAME}['\"]"; then
        ERRORS+="[P2-1 위반] 선택자 '${SEL}'가 HTML에 없습니다.
register.js cssSelectors에 선언된 선택자가 views/*.html에 존재해야 합니다.
"
    fi
done

# ID 선택자 검증
for SEL in $ID_SELECTORS; do
    ID_NAME="${SEL#\#}"
    if ! echo "$ALL_HTML" | grep -qE "id=['\"]${ID_NAME}['\"]"; then
        ERRORS+="[P2-1 위반] 선택자 '${SEL}'가 HTML에 없습니다.
register.js cssSelectors에 선언된 ID가 views/*.html에 존재해야 합니다.
"
    fi
done

# ─────────────────────────────────────────────
# P2-2: ListRenderMixin → <template> 태그 필수
# ─────────────────────────────────────────────
if grep -q 'applyListRenderMixin' "$FILE" 2>/dev/null; then
    if ! echo "$ALL_HTML" | grep -qi '<template'; then
        ERRORS+="[P2-2 위반] ListRenderMixin을 사용하지만 HTML에 <template> 태그가 없습니다.
ListRenderMixin은 <template> 태그를 사용하여 목록 아이템을 렌더링합니다.
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
