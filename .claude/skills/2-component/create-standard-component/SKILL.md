---
name: create-standard-component
description: Mixin 기반 표준 컴포넌트를 생성합니다. 컴포넌트는 HTML/CSS 껍데기 + 조립 코드만 가지며, 기능은 Mixin이 담당합니다.
---

# 표준 컴포넌트 생성 (Mixin 기반)

컴포넌트는 HTML/CSS 껍데기만 소유하고, 기능은 Mixin으로 주입한다.
register.js는 Mixin 적용 + 구독 연결 + 이벤트 매핑만 하는 **조립 코드**다.

> 설계 문서: [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md) 참조
> 공통 규칙: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 - 캐싱하거나 생략하지 마세요.**

1. [/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md) - 시스템 설계
2. [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) - 공통 규칙
3. [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) - 코딩 스타일
4. **Mixin 문서 확인** - 사용할 Mixin의 .md 파일을 먼저 읽을 것
5. **기존 예제 확인** - SimpleDashboard의 컴포넌트 패턴을 먼저 확인

---

## 핵심 원칙

### 컴포넌트 = 껍데기 + 조립 코드

```
컴포넌트가 소유하는 것: HTML, CSS, 조립 코드 (register.js)
컴포넌트가 소유하지 않는 것: 렌더링 로직, 상태 관리, DOM 조작
```

"기능이 없다"가 아니라 **"도메인 로직이 없다"**가 정확한 표현이다.

### 선택자 = 계약 인터페이스

```
cssSelectors     — textContent 반영 (시각용 — 사람이 읽는 값)
datasetSelectors — dataset 반영 (시스템용 — CSS 셀렉터, JS 접근 등)
```

약속된 선택자를 HTML에서 유지하면 디자인은 자유롭게 변경 가능.

### Mixin 선택 기준

| 데이터 형태 | Mixin | 네임스페이스 |
|-------------|-------|-------------|
| 객체 1개 → 여러 DOM 요소에 값 채움 | FieldRenderMixin | `this.fieldRender` |
| 배열 N개 → 항목 반복 생성 | ListRenderMixin | `this.listRender` |

---

## 출력 구조

```
[ComponentName]/
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
        statusLabel: '.system-info__status',
        version:     '.system-info__version'
    },
    datasetSelectors: {
        status:      '[data-status]'
    },
    dataFormat: (data) => ({
        name:        data.hostname,
        status:      data.status,           // → datasetSelectors → dataset
        statusLabel: data.statusLabel,      // → cssSelectors → textContent
        version:     data.version
    })
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
    container: '.event-log__list',
    item:      '.event-log__item',
    template:  '#event-log-item-template',
    cssSelectors: {
        level:   '.event-log__level',
        time:    '.event-log__time',
        message: '.event-log__message'
    },
    datasetSelectors: {
        level:   '[data-level]'
    },
    dataFormat: (data) => ({
        items: data.events.map(event => ({
            level:   event.level,
            time:    event.formattedTime,
            message: event.message
        }))
    })
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
        [this.listRender.item]: '@eventClicked'
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

## dataFormat 원칙

- API 키 → cssSelectors/datasetSelectors 키 매핑만 수행
- 값 가공은 하지 않는다 (서버가 제공한 값 그대로)
- 라벨이 필요하면 서버가 label 키로 제공한다

```javascript
// ✅ 매핑만
dataFormat: (data) => ({
    name:        data.hostname,
    status:      data.status,
    statusLabel: data.statusLabel
})

// ❌ 값 가공 (프론트에서 변환하지 않는다)
dataFormat: (data) => ({
    status: data.status === 'RUNNING' ? '정상' : data.status
})
```

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

| 허용 | 불허 |
|------|------|
| Mixin 적용 (applyXxxMixin) | 렌더링 로직 (innerHTML, DOM 조작) |
| 구독 연결 (subscriptions) | 데이터 가공 로직 |
| 이벤트 매핑 (customEvents) | 상태 관리 (_state 등) |
| dataFormat 함수 정의 | fetch 호출 |
| | Mixin 메서드 재정의 (래핑, 덮어쓰기) |

---

## 금지 사항

> 공통 금지 사항: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md#금지-사항-전체-공통) 참조

- ❌ 컴포넌트가 직접 fetch
- ❌ Mixin 메서드 재정의
- ❌ customEvents에서 선택자 하드코딩 (Mixin의 computed property 사용)
- ❌ register.js에 렌더링 로직 작성
- ❌ HTML 문자열을 JS에 작성 (template 태그 사용)

---

## 관련 자료

| 문서 | 위치 |
|------|------|
| 시스템 설계 문서 | [/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md) |
| 예제 (SystemInfo) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/SystemInfo/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/SystemInfo/) |
| 예제 (StatusCards) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/StatusCards/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/StatusCards/) |
| 예제 (EventLog) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/EventLog/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/EventLog/) |
| FieldRenderMixin | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/Mixins/FieldRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/Mixins/FieldRenderMixin.md) |
| ListRenderMixin | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/Mixins/ListRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/Mixins/ListRenderMixin.md) |
