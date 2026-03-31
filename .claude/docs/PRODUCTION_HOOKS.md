# DesignComponent 생산 품질 보장 — Hook 설계

## 1. 목적

DesignComponent(Mixin + 컴포넌트)를 **일관된 품질로 대량 생산**하는 것이 이 프로젝트의 목표다.

생산 파이프라인:

```
Figma 디자인 → [1-figma] → 정적 HTML/CSS → [2-component] → 동적 컴포넌트
                                              ↑
                                         이 단계에서 register.js, beforeDestroy.js,
                                         preview.html이 반복 생성된다
```

Hook은 이 생산 과정에서 **반복적으로 발생하는 오류를 기계적으로 차단**하여, 사람의 감사에 의존하지 않고 품질을 보장한다.

---

## 2. 왜 텍스트 규칙만으로 부족한가

2026-03-31 전수 검토에서 실증되었다.

```
대상: 35개 컴포넌트 (Components/ 8개 + Examples/ 4 프로젝트)
발견: 17건의 규칙 위반
원인: 모든 규칙이 텍스트 문서에 존재했지만, 구현이 따르지 않음
```

텍스트 규칙의 구조적 한계:

- Claude가 참조 문서를 읽었더라도 **컨텍스트 압축 후 유실**될 수 있다
- 규칙을 "알고" 있어도 **실수로 위반**할 수 있다 (차트 4종의 Step 3 누락)
- 03-28 검토에서도 같은 파일을 읽고 **같은 위반을 놓쳤다** — 사람의 감사도 완벽하지 않다

결론: **규칙을 아는 것과 규칙을 지키는 것은 다르다.** 기계적 강제가 필요하다.

---

## 3. Hook의 역할

### Hook이 하는 것

**생산 과정에서 반복될 오류만 잡는 안전망.**

컴포넌트를 하나 만들 때마다 `register.js`, `beforeDestroy.js`, `preview.html`이 생성된다. 이 파일들에서 동일한 실수가 반복될 수 있다. Hook은 파일이 쓰이는 시점에 자동으로 검사하여, 위반이 있으면 즉시 피드백한다.

```
Claude가 register.js 작성
    ↓
[PostToolUse Hook] 자동 트리거 (LLM 토큰 소모 없음)
    ↓
셸 스크립트가 파일 내용 검사
    ↓
├── 통과 → exit 0 (아무 일도 안 일어남)
└── 위반 → exit 2 + stderr 피드백 → Claude가 다음 턴에서 수정
```

### Hook이 하지 않는 것

- 아키텍처 설계의 올바름 판단 → **audit-project 스킬**이 담당
- Mixin destroy 완전성 검증 → **audit-project 스킬**이 담당
- 문서 동기화 확인 → **implement-mixin 스킬의 체크리스트**가 담당
- 코딩 스타일, fx.js 파이프라인 관례 → **CODING_STYLE.md 참조**가 담당

Hook은 정규식으로 잡을 수 있는 **단순하고 반복적인 패턴**에만 적용한다. 복잡한 검증은 적절한 도구(스킬, 체크리스트)에 위임한다.

---

## 4. Hook 목록

### 선별 기준

"과거에 발견된 모든 오류"가 아니라, **"앞으로 컴포넌트를 생산할 때 반복될 오류"**만 선별했다.

| # | 패턴 | 대상 파일 | 발생 조건 | 실증 |
|---|------|----------|----------|------|
| 1 | register.js에 `bindEvents` 호출 없음 | `**/register.js` | 이벤트가 없는 컴포넌트에서 Step 3 자체를 생략 | 차트 4종에서 발생 |
| 2 | beforeDestroy.js에 `removeCustomEvents` 호출 없음 | `**/beforeDestroy.js` | #1과 쌍으로 발생 | 차트 4종에서 발생 |
| 3 | preview.html에 로컬 CSS `<link>` 사용 | `**/preview*.html` | 인라인 규칙을 모르거나 잊을 때 | 과거 10건 발생 |
| 4 | `var` 사용 | `**/*.js` | AI가 습관적으로 생성 | 프로젝트 규칙 위반 |

---

## 5. Hook이 잡지 못하는 것

| 오류 유형 | 담당 도구 | 이유 |
|----------|----------|------|
| Mixin destroy에서 메서드 null 누락 | audit-project | ns 할당 수 vs null 수 대조 필요 — 정규식 한계 |
| 문서 동기화 누락 (5개 문서) | implement-mixin 체크리스트 | 파일 간 교차 대조 필요 |
| customEvents 선택자 하드코딩 | audit-project | computed property 사용 여부 판별 어려움 |
| CSS 컨테이너 ID 네이밍 | audit-project | 컴포넌트명과 ID를 대조해야 함 |

이 오류들은 **정기적 감사(audit-project)와 스킬 체크리스트**로 보완한다.

---

## 6. 구현

### 파일 구조

```
.claude/
├── settings.json              ← Hook 이벤트 등록 (git 추적)
└── hooks/
    ├── validate-register-step3.sh
    ├── validate-beforedestroy-step3.sh
    ├── validate-preview-css.sh
    └── validate-no-var.sh
```

### settings.json Hook 설정

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-register-step3.sh"
          },
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-beforedestroy-step3.sh"
          },
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-preview-css.sh"
          },
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-no-var.sh"
          }
        ]
      }
    ]
  }
}
```

### 스크립트 동작 원리

모든 스크립트는 동일한 구조를 따른다:

```bash
#!/bin/bash
INPUT=$(cat)                                              # stdin에서 JSON 수신
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')  # 파일 경로 추출

# 대상 파일이 아니면 즉시 통과
if [[ "$FILE_PATH" != *"대상패턴"* ]]; then
  exit 0
fi

# 파일 내용 검사
if 위반_조건; then
  echo "피드백 메시지" >&2    # Claude에게 전달
  exit 2                      # 차단
fi

exit 0                        # 통과
```

- `exit 0` → 통과 (토큰 비용 0)
- `exit 2` → 차단 + stderr 피드백 → Claude가 다음 턴에서 수정

---

*작성일: 2026-03-31*
*근거: 03-31 전수 검토 — 35개 컴포넌트에서 17건 위반 발견, 텍스트 규칙의 한계 실증*
