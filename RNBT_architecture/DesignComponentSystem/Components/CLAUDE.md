# Components — 구현 워크플로우

## 전제 조건

이 디렉토리의 컴포넌트를 개발하기 전에, `produce-component` 스킬(또는 PRODUCTION_PROCESS.md Step 3~5)을 통해 다음이 완료되어 있어야 한다:

- **범주 CLAUDE.md** — 범주의 역할과 특성이 정의됨
- **기능 정의** — 이 컴포넌트가 무엇을 하는지 확정됨
- **구현 명세** — Mixin 매핑, cssSelectors, 커스텀 메서드, 이벤트가 결정됨
- **컴포넌트 CLAUDE.md** — 위 내용이 기록되어 사용자 승인을 받음

---

## 구현 절차

### Step 1. HTML/CSS 작성

| 조건 | 워크플로우 |
|------|----------|
| Figma 디자인 있음 | `figma-to-html` → 정적 HTML/CSS 추출 |
| Figma 없이 직접 작성 | TBD (디자인 시스템 문서 기반 워크플로우 구축 예정) |

Figma가 존재하는 경우는 사용자가 별도 요청한다.

기능 정의에서 명시한 기능에 대응하는 요소가 HTML에 존재해야 한다.

---

### Step 2. Mixin + 커스텀 체킹

컴포넌트 CLAUDE.md의 구현 명세에 따라 Mixin을 적용한다. 구현 명세는 `produce-component`에서 이미 결정되어 있다.

| DOM 패턴 | Mixin | 예시 |
|----------|-------|------|
| 고정 DOM에 외부 데이터/상태 매핑 | FieldRenderMixin | Cards, Badges, AppBars 제목 |
| 배열 → template 반복 생성 | ListRenderMixin | Lists, Chips, Tabs 항목 |
| 재귀 배열 → 트리 | TreeRenderMixin | Trees |
| 팝업/오버레이 | ShadowPopupMixin | Dialogs, Menus, Tooltips |
| 차트 | EChartsMixin | Charts |
| 테이블 | TabulatorMixin | Tables |
| **Mixin 불필요** | 순수 CSS + 자체 메서드 | Buttons, Switch, Divider |

위 테이블은 참조용이다. Mixin 선택과 커스텀 메서드 정의는 `produce-component` Step 3에서 이미 완료되어 있다.

---

### Step 3. 컴포넌트 구현 확인

컴포넌트 CLAUDE.md는 `produce-component`에서 이미 작성되어 있다. 구현이 CLAUDE.md 명세와 일치하는지 확인한다.

```
카테고리/
├── CLAUDE.md                ← 범주 역할 + 하위 범주 목록 (기존)
├── ComponentA/
│   ├── CLAUDE.md            ← 구현 명세 (Step 2 결과)
│   ├── scripts/
│   │   ├── register.js      ← 불변 (모든 디자인 변형이 공유)
│   │   └── beforeDestroy.js
│   ├── views/
│   │   ├── 01_variant.html  ← 디자인 변형 A
│   │   └── 02_variant.html  ← 디자인 변형 B
│   ├── styles/
│   │   ├── 01_variant.css
│   │   └── 02_variant.css
│   └── preview/
│       ├── 01_variant.html
│       └── 02_variant.html
└── ComponentB/
    └── CLAUDE.md
```

**하나의 컴포넌트 = 하나의 스크립트 + 여러 디자인 변형.** scripts/는 디자인이 달라져도 변하지 않는다. HTML/CSS만 다르고 약속된 cssSelectors를 유지하면 동일한 register.js로 동작한다.

**컴포넌트 분리 기준:** scripts가 달라져야 하면 별도 컴포넌트다. Mixin 조합, 자체 메서드, 구독 토픽, 이벤트 매핑 중 하나라도 다르면 같은 폴더에 둘 수 없다.

개별 컴포넌트 CLAUDE.md에 포함할 내용:

- **기능 정의** (Step 2 결과)
- 사용 Mixin (또는 "Mixin 불필요")
- cssSelectors 계약 (KEY 목록)
- 자체 메서드 (필요 시)
- 이벤트 (customEvents, 구독 토픽)

---

### Step 4. 컴포넌트 구현

컴포넌트 유형에 따라 개발 스킬을 사용한다.

| 유형 | SKILL |
|------|-------|
| 2D | `create-2d-component` |
| 3D 개별 단위 | `create-3d-component` |
| 3D 컨테이너 | `create-3d-container-component` |

---

## 참조

| 문서 | 위치 |
|------|------|
| 생산 프로세스 진입점 | [/.claude/skills/0-produce/produce-component/SKILL.md](/.claude/skills/0-produce/produce-component/SKILL.md) |
| SKILL 공통 규칙 | [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) |
| 2D 컴포넌트 SKILL | [/.claude/skills/2-component/create-2d-component/SKILL.md](/.claude/skills/2-component/create-2d-component/SKILL.md) |
| Mixin 전체 목록 | [/RNBT_architecture/DesignComponentSystem/Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) |
| 시스템 설계 문서 | [/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) |
