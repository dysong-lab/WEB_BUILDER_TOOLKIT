---
name: create-2d-component
description: Mixin 기반 2D 컴포넌트를 생성합니다. 컴포넌트는 HTML/CSS + register.js(Mixin 적용, 자체 메서드 정의, 구독/이벤트 연결)로 구성됩니다.
---

# 2D 컴포넌트 생성 (Mixin 기반)

컴포넌트는 HTML/CSS + register.js로 구성된다.
register.js는 Mixin 적용, 자체 메서드 정의, 구독 연결, 이벤트 매핑을 수행한다.
Mixin도 자체 메서드도 동일한 규칙을 따른다: **cssSelectors 계약으로 DOM 접근, beforeDestroy.js에서 정리.**

> 설계 문서: [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조
> 공통 규칙: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

---

## 전제 조건

이 스킬은 `produce-component` 스킬에서 다음이 완료된 후 호출된다:

- **컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세 (Mixin, cssSelectors, 커스텀 메서드, 이벤트) 작성 완료
- **사용자 승인** — CLAUDE.md 내용이 승인됨

이 스킬은 CLAUDE.md 명세를 코드로 변환하는 역할만 한다. 기능 정의나 Mixin 선택을 다시 하지 않는다.

> Mixin이 존재하지 않는 경우에도, 구현 명세에 커스텀 속성/메서드가 정의되어 있으면 그대로 구현한다. 신규 Mixin이 필요한 경우는 `produce-component` → `create-mixin-spec` → `implement-mixin`에서 이미 처리되어 있다.

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 - 캐싱하거나 생략하지 마세요.**

1. **대상 컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세
2. [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) - 공통 규칙
3. [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) - 코딩 스타일
4. **Mixin 문서 확인** - 구현 명세에 명시된 Mixin의 .md 파일
5. **기존 예제 확인** - SimpleDashboard의 컴포넌트 패턴을 먼저 확인

---

## 핵심 원칙

### 컴포넌트 = HTML/CSS + register.js

```
컴포넌트가 소유하는 것: HTML, CSS, register.js (Mixin + 자체 속성/메서드)
컴포넌트가 소유하지 않는 것: 데이터 fetch, Mixin 메서드 재정의
공통 규칙: cssSelectors 계약으로 DOM 접근, beforeDestroy.js에서 정리
```

### 선택자 = 계약 인터페이스

```
cssSelectors     — KEY: Mixin 규약 KEY + 사용자 정의 KEY, VALUE: CSS 선택자
datasetAttrs — KEY: Mixin 규약 KEY + 사용자 정의 KEY, VALUE: data-* 속성명
```

VALUE는 HTML에서 온다. 약속된 선택자를 HTML에서 유지하면 디자인은 자유롭게 변경 가능.

### Mixin 참조 (네임스페이스)

구현 명세에서 지정된 Mixin의 네임스페이스를 참조한다.

| Mixin | 네임스페이스 |
|-------|-------------|
| FieldRenderMixin | `this.fieldRender` |
| ListRenderMixin | `this.listRender` |
| ShadowPopupMixin | `this.shadowPopup` |
| TreeRenderMixin | `this.treeRender` |
| EChartsMixin | `this.echart` |
| TabulatorMixin | `this.tabulator` |

> 전체 목록: [Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md)

---

## 폴더 Depth 규칙

컴포넌트 카테고리에 따라 폴더 depth가 다르다. **컴포넌트 생성 전 반드시 대상 카테고리의 depth를 확인하라.**

### 일반 카테고리 (depth 1)

Cards, Badges, Chips, Divider, Charts, Tables 등 — 카테고리 바로 아래에 컴포넌트를 생성한다.

```
Components/Cards/Standard/views, styles, scripts, preview
```

### 하위 범주 카테고리 (depth 2) — Buttons, Chips, Loading, Navigation, Sheets, Sliders

이 6개 카테고리는 카테고리 아래에 **하위 범주 폴더**가 존재한다. 컴포넌트는 하위 범주 아래에 생성한다.

```
Components/Buttons/IconButtons/Standard/views, styles, scripts, preview
Components/Chips/Filter/Standard/views, styles, scripts, preview
Components/Navigation/NavigationDrawer/Standard/views, styles, scripts, preview
Components/Sheets/BottomSheets/Standard/views, styles, scripts, preview
```

컴포넌트 변형은 `Standard`(필수)와 `Advanced`(선택)로 구분된다. `Advanced`는 여러 구현을 담는 컨테이너 폴더이며, 그 안에 구현별 하위 폴더(`searchEmbedded/`, `tabbed/` 등)를 둔다. **각 Advanced 구현은 구조적으로 또 하나의 Standard와 같다** — 자기 CLAUDE.md, views, styles, scripts, **그리고 자기 preview까지** 모두 자기 폴더 안에 둔다.

**실제 예시:**
```
Components/Navigation/NavigationDrawer/
├── Standard/
│   ├── CLAUDE.md          ← Standard 명세
│   ├── views/
│   ├── styles/
│   ├── scripts/
│   └── preview/
└── Advanced/              ← 선택 (다중 구현 컨테이너)
    ├── {구현명1}/
    │   ├── CLAUDE.md      ← 이 구현의 상세 명세
    │   ├── views/
    │   ├── styles/
    │   ├── scripts/
    │   └── preview/       ← 자기 폴더 안에 자기 preview
    └── {구현명2}/
        └── ... (동일 구조)
```

> ⚠️ 잘못된 예
> - `Components/Navigation/Standard/` — 서브 범주(NavigationDrawer)를 건너뛰면 안 된다.
> - `Components/Navigation/NavigationDrawer/Advanced_01/` — `Advanced_01`, `Advanced_02` 같은 형제 폴더는 사용하지 않는다. 반드시 `Advanced/{구현명}/` 중첩 구조를 사용한다.
> - `Advanced/preview/{구현명}.html` — preview를 Advanced 레벨로 빼지 않는다. 각 구현 폴더 안에 자기 preview를 둔다.

### 확인 방법

컴포넌트 CLAUDE.md에 명시된 경로를 따르되, 경로가 불분명할 경우:
```bash
ls Components/[카테고리]/    # 서브 범주 폴더가 있는지 확인
```

---

## 출력 구조

### Standard (필수)

```
Standard/
├── CLAUDE.md                  # Standard 명세
├── views/
│   ├── 01_[name].html         # 디자인 변형 A
│   └── 02_[name].html         # 디자인 변형 B
├── styles/
│   ├── 01_[name].css
│   └── 02_[name].css
├── scripts/
│   ├── register.js            # 조립 코드 (불변)
│   └── beforeDestroy.js       # 정리 코드 (불변)
└── preview/
    ├── 01_[name].html
    └── 02_[name].html
```

### Advanced (선택, 다중 구현 컨테이너)

각 구현 폴더는 Standard와 동일한 5요소(CLAUDE.md + views + styles + scripts + preview)를 모두 자기 안에 갖는다.

```
Advanced/
├── {구현명1}/                 # 예: searchEmbedded, tabbed …
│   ├── CLAUDE.md              # 이 구현의 상세 명세
│   ├── views/
│   │   └── 01_[name].html
│   ├── styles/
│   │   └── 01_[name].css
│   ├── scripts/
│   │   ├── register.js
│   │   └── beforeDestroy.js
│   └── preview/
│       └── 01_[name].html     # 파일명은 디자인 변형명만 (구현명은 경로에 이미 있음)
└── {구현명2}/
    └── ... (동일 구조)
```

scripts/는 디자인이 달라져도 변하지 않는다. 약속된 선택자만 HTML에 유지하면 된다.

---

## register.js — FieldRenderMixin 패턴

객체 데이터를 여러 DOM 요소에 매핑할 때 사용.

```javascript
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        name:        '.system-info__name',
        status:      '.system-info__status',
        statusLabel: '.system-info__status',
        version:     '.system-info__version'
    },
    datasetAttrs: {
        status:      'status'
    }
});

// ======================
// 2. 구독 연결 — Mixin 메서드 참조 (함수 참조)
// ======================

this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
```

---

## register.js — ListRenderMixin 패턴

배열 데이터를 template 기반으로 반복 렌더링할 때 사용.

### HTML에 template 태그 필수

```html
<div class="event-log__list"></div>

<template id="event-log-item-template">
    <div class="event-log__item">
        <span class="event-log__level" data-level=""></span>
        <span class="event-log__time"></span>
        <span class="event-log__message"></span>
    </div>
</template>
```

### register.js

```javascript
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.event-log__list',
        item:      '.event-log__item',
        template:  '#event-log-item-template',
        level:     '.event-log__level',
        time:      '.event-log__time',
        message:   '.event-log__message'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    events: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 — Mixin의 item 선택자를 computed property로 참조
// ======================

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@eventClicked'
    }
};
bindEvents(this, this.customEvents);
```

---

## beforeDestroy.js 패턴

생성의 역순으로 정리. 모든 컴포넌트에서 동일한 구조.

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리
this.fieldRender.destroy();   // FieldRenderMixin 사용 시
// this.listRender.destroy(); // ListRenderMixin 사용 시
```

---

## 데이터 변환 원칙

- Mixin은 데이터 출처를 모른다. 이미 selector KEY에 맞춰진 데이터만 받는다.
- 변환이 필요하면 인스턴스 메서드에서 변환 후 Mixin 메서드를 호출한다.
- 상세: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) "데이터 변환 원칙" 참조

---

## 디자인 변형

같은 register.js(Mixin 조립)로 여러 디자인이 동작한다.

```
views/01_bar.html      — 가로 바
views/02_card.html     — 세로 카드 (극단적으로 다른 구조)
views/03_minimal.html  — 텍스트만

scripts/register.js    — 동일 (불변)

조건: 약속된 선택자를 HTML에서 유지
```

---

## 조립 코드에서 허용/불허

| 허용 | 불허 (Mixin 재정의 금지) |
|------|------|
| Mixin 적용 (applyXxxMixin) | 렌더링 로직 (innerHTML, DOM 조작) |
| 데이터 변환 메서드 정의 (Mixin이 기대하는 형태로) | Mixin 내부 상태 직접 조작 |
| 구독 연결 (subscriptions) | Mixin 메서드 재정의 |
| 이벤트 매핑 (customEvents) | fetch 호출 |

---

## 금지 사항

> 공통 금지 사항: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md#금지-사항-전체-공통) 참조

- ❌ 컴포넌트가 직접 fetch
- ❌ Mixin 메서드 재정의
- ❌ customEvents에서 선택자 하드코딩 (Mixin의 computed property 사용)
- ❌ register.js에 렌더링 로직 작성
- ❌ HTML 문자열을 JS에 작성 (template 태그 사용)

---

## 마무리: manifest.json 등록

구현 완료 후 반드시 `Components/CLAUDE.md` Step 5에 따라 `DesignComponentSystem/manifest.json`에 신규 컴포넌트/set/item/preview를 등록한다. 누락 시 `index.html` 카탈로그에 노출되지 않는다.

> 등록 위치/규칙은 [Components/CLAUDE.md Step 5](/RNBT_architecture/DesignComponentSystem/Components/CLAUDE.md) 참조

---

## 관련 자료

| 문서 | 위치 |
|------|------|
| 시스템 설계 문서 | [/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) |
| 예제 (SystemInfo) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/SystemInfo/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/SystemInfo/) |
| 예제 (StatusCards) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/StatusCards/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/StatusCards/) |
| 예제 (EventLog) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/EventLog/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/EventLog/) |
| 예제 (DeviceList — 팝업+목록 조합) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/DeviceList/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/DeviceList/) |
| FieldRenderMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md) |
| ListRenderMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/ListRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ListRenderMixin.md) |
| ShadowPopupMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/ShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ShadowPopupMixin.md) |
| 전체 Mixin 목록 | [/RNBT_architecture/DesignComponentSystem/Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) |
