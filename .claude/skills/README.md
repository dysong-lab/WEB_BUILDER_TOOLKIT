# Skills 워크플로우 가이드

RNBT 컴포넌트 개발을 위한 Skills 사용 가이드입니다.

---

## 전체 워크플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│  Figma_Conversion (정적 퍼블리싱)                                    │
│                                                                      │
│  [figma-to-html] ─────────────────────┐                             │
│       │                               │                             │
│       │ 일반 컴포넌트                  │ 심볼/아이콘                  │
│       ▼                               ▼                             │
│  Static HTML/CSS              [figma-to-inline-svg]                 │
│                                       │                             │
│                                       ▼                             │
│                               인라인 SVG HTML                        │
└──────────────────────────────────────────────────────────────────────┘
          │                                         │
          │  ┌──────────────────────────────────┐   │
          │  │  Figma 없이 직접 디자인            │   │
          │  │                                   │   │
          │  │  [create-html-css]                │   │
          │  │       │                           │   │
          │  │       ▼                           │   │
          │  │  Static HTML/CSS                  │   │
          │  │  (디자이너 성향 기반)              │   │
          │  └──────────────────────────────────┘   │
          │         │                               │
          ▼         ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  RNBT_architecture (동적 변환)                                       │
│                                                                      │
│  [create-standard-component] ◄────────┬──────► [create-symbol-state │
│       │                               │         -component]         │
│       │                               │               │             │
│       ▼                               │               ▼             │
│  표준 컴포넌트                         │        상태 기반 심볼        │
│       │                               │               │             │
│       └───────────────────────────────┴───────────────┘             │
│                               │                                      │
│                               ▼                                      │
│                      [create-project]                                │
│                               │                                      │
│                               ▼                                      │
│                      완전한 프로젝트 구조                             │
│                      (Master/Page/컴포넌트/Mock서버)                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Skill 목록

### Figma → Static (정적 퍼블리싱)

| Skill | 입력 | 출력 | 설명 |
|-------|------|------|------|
| **figma-to-html** | Figma node-id | HTML/CSS | 일반 컴포넌트용 정적 코드 |
| **figma-to-inline-svg** | Figma node-id | 인라인 SVG HTML | 심볼/아이콘용 (런타임 색상 제어) |

### Static → Dynamic (동적 변환)

| Skill | 입력 | 출력 | 설명 |
|-------|------|------|------|
| **create-standard-component** | Static HTML/CSS 또는 없음 | 표준 컴포넌트 | 페이지가 데이터 제어 (Figma 유무 분기) |
| **create-symbol-state-component** | 인라인 SVG HTML | 상태 기반 심볼 | CSS 변수로 색상 제어 |
| **add-design-variant** | 기존 컴포넌트 + 새 디자인 | 새 views/styles/preview 파일 | register.js 불변, 선택자 계약 유지 |

### 프로젝트 생성

| Skill | 입력 | 출력 | 설명 |
|-------|------|------|------|
| **create-project** | 컴포넌트들 | 완전한 프로젝트 | Master/Page/Mock서버 포함 |

### 점검

| Skill | 입력 | 출력 | 설명 |
|-------|------|------|------|
| **audit-project** | 없음 (프로젝트 전체 읽기) | 점검 보고서 | 구조/구현/문서/SKILL 종합 진단 |

### Mixin 개발

| Skill | 입력 | 출력 | 설명 |
|-------|------|------|------|
| **create-mixin-spec** | 모호한 요구사항 | 승인용 명세서 | 기능의 정의로 분해 → 중복 확인 → 명세 작성 |
| **implement-mixin** | 승인된 명세서 | .js + .md + 문서 갱신 | 구현 → 문서 → 관련 파일 동기화 |

### 디자인 (Figma 없이 직접 작성)

| Skill | 입력 | 출력 | 설명 |
|-------|------|------|------|
| **create-html-css** | 요구사항 (컴포넌트 종류, 테마) | HTML/CSS | 디자이너 성향 기반 직접 작성 (Figma 불필요) |

---

## 상황별 Skill 선택

### "Figma 디자인이 있다"

```
Figma 링크/node-id
    │
    ├─ 일반 컴포넌트 → figma-to-html → create-standard-component
    │
    └─ 심볼/아이콘 (색상 변경 필요) → figma-to-inline-svg → create-symbol-state-component
```

### "Figma 디자인이 없다" (처음부터 작성)

```
요구사항만 있음
    │
    └─ create-html-css (디자이너 성향 기반) → create-standard-component
```

### "기존 컴포넌트에 새 디자인을 입히고 싶다"

```
기존 컴포넌트 + 새 Figma 디자인 (또는 직접 작성)
    │
    └─ add-design-variant → 새 views/styles/preview 추가 (register.js 불변)
```

### "전체 프로젝트를 새로 만든다"

```
create-project → Master/Page/컴포넌트/Mock서버 전체 구조
```

---

## Skill 간 연결

```
figma-to-html
    └─→ create-standard-component
            └─→ create-project

figma-to-inline-svg
    └─→ create-symbol-state-component
            └─→ create-project

create-html-css (Figma 없이, 디자이너 성향 기반)
    └─→ create-standard-component
            └─→ create-project

add-design-variant (기존 컴포넌트 + 새 디자인) ─→ 새 views/styles/preview
```

---

## 참고 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| **SHARED_INSTRUCTIONS.md** | [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) | **모든 스킬 공통 규칙** (JS/CSS 패턴, beforeDestroy 순서, 이벤트 이중 구조) |
| CODING_STYLE.md | [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) | 함수형 코딩 지침, CSS 원칙 |
| RNBT README | [/RNBT_architecture/README.md](/RNBT_architecture/README.md) | 아키텍처 설계 문서 |

---

## 주의사항

1. **공통 규칙 확인**: 모든 스킬은 [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md)의 공통 규칙을 따름
2. **정적/동적 분리**: Figma 단계에서는 스크립트 없이 순수 퍼블리싱만
3. **Figma MCP 필요**: figma-to-* Skills는 Figma Desktop + MCP 서버 필요
4. **CODING_STYLE 참조**: 모든 코드 작성 시 [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) 참조
