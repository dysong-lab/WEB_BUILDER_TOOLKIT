# Components — 구현 워크플로우

## 구현 절차

### Step 1. HTML/CSS 작성

| 조건 | 워크플로우 |
|------|----------|
| Figma 디자인 있음 | `figma-to-html` → 정적 HTML/CSS 추출 |
| Figma 없이 직접 작성 | [/.impeccable.md](/.impeccable.md) 디자인 원칙 참조 → `frontend-design` 스킬 활용 |

Figma가 존재하는 경우는 사용자가 별도 요청한다.

---

### Step 2. Mixin + 커스텀 체킹

컴포넌트 역할(각 폴더의 CLAUDE.md)을 확인한 후, **DOM 패턴**으로 Mixin을 선택한다.

| DOM 패턴 | Mixin | 예시 |
|----------|-------|------|
| 고정 DOM에 외부 데이터/상태 매핑 | FieldRenderMixin | Cards, Badges, AppBars 제목 |
| 배열 → template 반복 생성 | ListRenderMixin | Lists, Chips, Tabs 항목 |
| 재귀 배열 → 트리 | TreeRenderMixin | Trees |
| 팝업/오버레이 | ShadowPopupMixin | Dialogs, Menus, Tooltips |
| 차트 | EChartsMixin | Charts |
| 테이블 | TabulatorMixin | Tables |
| **Mixin 불필요** | 순수 CSS + 자체 메서드 | Buttons, Switch, Divider |

**체킹 순서:**

1. 컴포넌트가 외부에서 데이터를 받아 DOM에 반영하는가? → Mixin 선택
2. 기존 Mixin으로 부족한 인터랙션이 있는가? → 자체 메서드 정의
3. 여러 컴포넌트에서 동일 패턴이 반복되는가? → 새 Mixin 검토 (`create-mixin-spec`)

---

### Step 3. 개별 컴포넌트 CLAUDE.md 작성

카테고리 하위에 개별 컴포넌트 폴더를 만들고, CLAUDE.md에 Step 2 결과를 기록한다.

```
카테고리/
├── CLAUDE.md                ← 범주 역할 + 세부 컴포넌트 목록 (기존)
├── ComponentA/
│   └── CLAUDE.md            ← 구현 명세 (Step 2 결과)
└── ComponentB/
    └── CLAUDE.md
```

개별 컴포넌트 CLAUDE.md에 포함할 내용:

- 사용 Mixin (또는 "Mixin 불필요")
- cssSelectors 계약 (KEY 목록)
- 자체 메서드 (필요 시)
- 이벤트 (customEvents, 구독 토픽)

---

### Step 4. 컴포넌트 구현

`create-standard-component` SKILL 워크플로우에 따라 구현한다.

---

## 참조

| 문서 | 위치 |
|------|------|
| SKILL 공통 규칙 | [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) |
| 표준 컴포넌트 SKILL | [/.claude/skills/2-component/create-standard-component/SKILL.md](/.claude/skills/2-component/create-standard-component/SKILL.md) |
| Mixin 전체 목록 | [/RNBT_architecture/DesignComponentSystem/Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) |
| 디자인 컨텍스트 | [/.impeccable.md](/.impeccable.md) |
| 시스템 설계 문서 | [/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) |
