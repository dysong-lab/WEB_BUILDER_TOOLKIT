# 기능 중심 컴포넌트 시스템 설계

## 목차

- [배경](#배경)
- [핵심 구조](#핵심-구조)
- [10가지 원칙](#10가지-원칙)
- [컴포넌트](#컴포넌트)
- [Mixin](#mixin)
- [선택자 계약](#선택자-계약)
- [데이터 흐름](#데이터-흐름)
- [이벤트 흐름](#이벤트-흐름)
- [라이프사이클](#라이프사이클)
- [페이지와의 관계](#페이지와의-관계)
- [책임 경계](#책임-경계)
- [컴포넌트 목록과 Mixin 목록](#컴포넌트-목록과-mixin-목록)
- [확장 경로](#확장-경로)

---

## 배경

### 상황

RENOBIT은 웹 콘텐츠 플랫폼이다. 어떤 프로젝트가 진행될지, 어떤 콘텐츠가 제작될지 사전에 알 수 없다.

### 과제

이 상황에서 "기능이 있는 디자인 컴포넌트를 만들자"라는 요구가 온다. 콘텐츠는 프로젝트마다 달라지므로 기준이 될 수 없다. 그러면 **'기능'이란 무엇인가?** — 이 정의가 없으면 작업을 반복할 수 없다.

컴포넌트를 분해하면 두 가지가 있다: **보여주는 형태**(시각 구조)와 **하는 일**(행위). 형태는 콘텐츠에 따라 달라진다. 행위도 마찬가지로 콘텐츠에 따라 달라지는 부분이 있다. 그러나 행위에는 **일반적인 부분과 특수한 부분**을 구분할 수 있다.

| 영역 | 일반적 행위 (콘텐츠에 무관) | 특수한 행위 (콘텐츠에 의존) |
|------|---------------------------|---------------------------|
| 필드 표시 | 데이터의 필드를 DOM 요소에 매핑하여 표시 | 상태값에 따라 특정 아이콘을 교체 |
| 목록 표시 | 배열을 받아 template을 복제하여 반복 렌더링 | 항목 드래그 앤 드롭으로 순서 변경 |
| 차트 | 인스턴스 초기화, 옵션 적용, 리사이즈, 정리 | 파이 차트 클릭 시 드릴다운 |
| 테이블 | 인스턴스 초기화, 데이터 적용, 정렬 | 셀 인라인 편집 시 도메인 검증 |

왼쪽은 어떤 프로젝트에서든 동일하게 반복된다. 오른쪽은 프로젝트의 요구에 따라 달라진다.

이 일반적인 행위가 반복 생산의 기준이 된다. '기능'의 단위는 **일반적 행위 패턴**으로 정의할 수 있다.

### 설계 결정

- 행위를 Mixin으로 분리한다.
- 컴포넌트는 시각적 구조(HTML/CSS)만 소유한다.
- 컴포넌트와 Mixin은 **선택자**를 계약 인터페이스로 연결된다.

---

## 핵심 구조

```
┌─────────────────────────────────────────────────────────────┐
│  컴포넌트 (껍데기)                                          │
│  ├── HTML/CSS (시각 구조)                                   │
│  └── register.js (조립 코드)                                │
│       │                                                     │
│       ├── applyMixinA(this, { cssSelectors, dataFormat })   │
│       │   → this.mixinA.* (네임스페이스로 주입)             │
│       │                                                     │
│       ├── this.subscriptions = { topic: [함수참조] }        │
│       │   (구독 연결: topic → Mixin 메서드)                 │
│       │                                                     │
│       └── customEvents + bindEvents                         │
│           (Mixin의 약속된 선택자를 computed property로)      │
└─────────────────────────────────────────────────────────────┘
```

### 역할 분리

| 요소 | 소유하는 것 | 소유하지 않는 것 |
|------|-------------|------------------|
| 컴포넌트 | HTML, CSS, 조립 코드 | 도메인 로직, 렌더링 로직 |
| Mixin | 속성, 메서드, 내부 상태, destroy | topic 이름, HTML 구조 |
| 페이지 | topic 정의, interval, 이벤트 핸들러 | 렌더링, 컴포넌트 내부 상태 |
| Weventbus | 이벤트 전달 | 이벤트 처리 로직 |
| GlobalDataPublisher | 데이터 발행/구독 관리 | 데이터 렌더링 |

---

## 10가지 원칙

```
1.  컴포넌트 = HTML/CSS + 조립 코드(register.js)
2.  Mixin = 네임스페이스로 1단계 주입, 속성+메서드 소유
3.  선택자 = 컴포넌트↔Mixin 계약 인터페이스
    - cssSelectors: CSS 선택자로 HTML 요소를 찾아 참조
    - datasetSelectors: [data-*] 선택자로 HTML 요소를 찾아 참조
4.  구독 = Mixin 바깥 (topic은 프로젝트 레벨)
    - subscriptions 객체로 관리, 함수 참조 사용
5.  데이터 포맷 = dataFormat 함수 (데이터 형태 매핑)
6.  customEvents = Mixin 바깥, computed property로 선택자 참조
7.  페이지 접근 = 네임스페이스 직접 (targetInstance.ns.method)
8.  Mixin 간 비의존 = Mixin은 다른 Mixin을 모른다
9.  에러 = Mixin은 throw, 페이지가 catch
10. 상태/정리 = Mixin이 자기 것만 관리
```

---

## 컴포넌트

### 정의

컴포넌트는 **시각 구조(HTML/CSS)와 조립 코드**로 구성된다. 도메인 로직은 없다.

"기능이 없다"가 아니라 **"도메인 로직이 없다"**가 정확한 표현이다. register.js에는 Mixin 적용, 구독 연결, 이벤트 매핑이라는 **조립 코드**가 존재한다.

### 파일 구조

```
ComponentName/
├── views/
│   ├── 01_standard.html       # 디자인 변형 01
│   └── 02_compact.html        # 디자인 변형 02
├── styles/
│   ├── 01_standard.css
│   └── 02_compact.css
├── scripts/
│   ├── register.js            # 조립 코드 (디자인 불변)
│   └── beforeDestroy.js       # 정리 코드 (디자인 불변)
└── preview/
    ├── 01_standard.html       # 디자인별 독립 테스트
    └── 02_compact.html
```

### register.js — 조립 코드 (FieldRenderMixin 예시)

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
// 2. 구독 연결 — Mixin 메서드 참조
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
// 3. 이벤트 매핑 — Mixin 선택자 참조
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
```

### register.js — 조립 코드 (ListRenderMixin 예시)

```javascript
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

// ... subscribe 패턴 동일

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

### beforeDestroy.js — 정리 코드

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 생성의 역순으로 정리

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
this.fieldRender.destroy();
```

### 조립 코드에서 허용되는 것 / 허용되지 않는 것

| 허용 | 불허 |
|------|------|
| Mixin 적용 (applyXxxMixin) | 렌더링 로직 (innerHTML, DOM 조작) |
| 구독 연결 (subscriptions) | 데이터 가공 로직 |
| 이벤트 매핑 (customEvents) | 상태 관리 (_state 등) |
| dataFormat 함수 정의 | fetch 호출 |
| | Mixin 메서드 재정의 |

---

## Mixin

### 정의

Mixin은 **속성과 메서드를 네임스페이스로 컴포넌트 인스턴스에 주입**하는 함수다.

### 공통 사용법

모든 Mixin의 기본 사용법은 동일하다.

1. **cssSelectors / datasetSelectors** — HTML 요소의 선택자 정보를 받는다.
2. **dataFormat** — dataFormat의 키는 위 selectors의 키를 활용해서, 기대한 선택자에 데이터를 매핑한다.
3. **Mixin의 기본 역할은 여기까지다.** 추가 기능(updateItemState 등)은 Mixin별 문서를 참고한다.

### 선택자 구분

Mixin은 두 종류의 선택자를 받는다.

| 선택자 | 역할 |
|--------|------|
| cssSelectors | CSS 선택자로 HTML 요소를 찾아 참조한다 |
| datasetSelectors | [data-*] 선택자로 HTML 요소를 찾아 참조한다 |

cssSelectors에는 데이터 바인딩용 선택자와 이벤트 바인딩용 선택자가 모두 포함될 수 있다. dataFormat에 해당 키가 없으면 데이터 바인딩은 건너뛴다.

마크업 시점에 `data-*` 속성이 선언되면, 그 요소는 datasetSelectors의 대상이 된다.

반영 방식의 상세는 각 Mixin 문서를 참고한다.

### FieldRenderMixin 구조

```javascript
function applyFieldRenderMixin(instance, options) {
    const { cssSelectors = {}, datasetSelectors = {}, dataFormat } = options;

    const ns = {};
    instance.fieldRender = ns;

    ns.cssSelectors = { ...cssSelectors };
    ns.datasetSelectors = { ...datasetSelectors };

    ns.renderData = function({ response }) {
        const { data } = response;
        if (!data) throw new Error('[FieldRenderMixin] data is null');

        const fields = dataFormat ? dataFormat(data) : data;

        Object.entries(fields).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            // datasetSelectors에 키가 있으면 → dataset 반영
            if (datasetSelectors[key]) {
                const dataEl = instance.appendElement.querySelector(datasetSelectors[key]);
                if (dataEl) dataEl.dataset[key] = value;
            }

            // cssSelectors에 키가 있으면 → textContent 반영
            if (cssSelectors[key]) {
                const el = instance.appendElement.querySelector(cssSelectors[key]);
                if (el) el.textContent = value;
            }
        });
    };

    ns.destroy = function() {
        ns.renderData = null;
        ns.cssSelectors = null;
        ns.datasetSelectors = null;
        instance.fieldRender = null;
    };
}
```

### ListRenderMixin 구조

HTML의 `<template>` 태그를 cloneNode하여 항목을 생성한다. HTML 구조가 JS에서 완전히 분리된다.

```javascript
function applyListRenderMixin(instance, options) {
    const { cssSelectors = {}, datasetSelectors = {}, dataFormat } = options;

    // 구조 선택자 추출
    const container = cssSelectors.container;
    const item = cssSelectors.item;
    const template = cssSelectors.template;

    const ns = {};
    instance.listRender = ns;

    ns.cssSelectors = { ...cssSelectors };
    ns.datasetSelectors = { ...datasetSelectors };

    ns.renderData = function({ response }) {
        const { data } = response;
        if (!data) throw new Error('[ListRenderMixin] data is null');

        const formatted = dataFormat ? dataFormat(data) : { items: data };

        const containerEl = instance.appendElement.querySelector(container);
        const templateEl = instance.appendElement.querySelector(template);
        if (!containerEl || !templateEl) return;

        containerEl.innerHTML = '';
        formatted.items.forEach(item => {
            const clone = templateEl.content.cloneNode(true);

            Object.entries(datasetSelectors).forEach(([key, selector]) => {
                const el = clone.querySelector(selector);
                if (el && item[key] != null) el.dataset[key] = item[key];
            });

            Object.entries(cssSelectors).forEach(([key, selector]) => {
                const el = clone.querySelector(selector);
                if (el && item[key] != null) el.textContent = item[key];
            });

            containerEl.appendChild(clone);
        });
    };

    ns.clear = function() { /* ... */ };

    ns.destroy = function() {
        ns.renderData = null;
        ns.clear = null;
        ns.cssSelectors = null;
        ns.datasetSelectors = null;
        instance.listRender = null;
    };
}
```

### FieldRenderMixin과 ListRenderMixin의 통일성

| | FieldRenderMixin | ListRenderMixin |
|---|---|---|
| cssSelectors | 요소별 참조 | 항목 내 참조 + 구조 선택자(container, item, template) |
| datasetSelectors | 요소별 참조 | 항목 내 참조 |
| dataFormat | 데이터 매핑 | 데이터 매핑 (items 배열) |

### 네임스페이스 규칙

| Mixin | 네임스페이스 |
|-------|-------------|
| applyFieldRenderMixin | `this.fieldRender` |
| applyListRenderMixin | `this.listRender` |
| applyEventListMixin | `this.eventList` |

### Mixin이 소유하는 것

```
1. 속성 (내부 상태)
   ns._items, ns._chartInstance, ns._expandedNodes ...

2. 메서드 (행위)
   ns.renderData, ns.clear, ns.setOption, ns.expand, ns.collapse ...

3. 선택자 참조 (외부 접근용)
   ns.cssSelectors, ns.datasetSelectors — 주입받은 선택자를 보존

4. destroy (자기 정리)
   ns.destroy — 자기가 만든 것만 정리
```

### Mixin이 소유하지 않는 것

```
- topic 이름 (프로젝트 레벨)
- customEvents 매핑 (Weventbus 영역)
- HTML/CSS 구조 (컴포넌트 영역)
- 다른 Mixin에 대한 참조 (비의존 원칙)
```

### 1단계 주입 원칙

Mixin은 컴포넌트 인스턴스에 **직접(1단계)** 주입한다. Mixin이 다른 Mixin을 주입하거나 의존하지 않는다.

```
✅ this.listRender.renderData()    — 1단계
✅ this.echarts.setOption()        — 1단계
❌ this.popup.echarts.setOption()  — 2단계 (금지)
```

Mixin 간 협력이 필요하면 **컴포넌트의 조립 코드**가 중재한다.

### 에러 처리

Mixin은 에러를 **throw**한다. 처리는 **페이지의 책임**이다.

```
에러 전파 경로:

Mixin 메서드 (throw)
    ↓
GlobalDataPublisher.fetchAndPublish() 내부의 handler.call()
    ↓
catch → throw error (전파)
    ↓
페이지 loaded.js의 fetchAndPublish().catch() (처리)
```

```javascript
// Mixin 내부 — throw만 한다
ns.renderData = function({ response }) {
    const { data } = response;
    if (!data) throw new Error('[ListRenderMixin] data is null');
    // ...
};

// 컴포넌트 register.js — 연결만 한다 (에러 처리 없음)
this.subscriptions = {
    logData: [this.listRender.renderData]
};

// 페이지 loaded.js — 에러를 처리한다
fetchAndPublish('logData', this)
    .catch(err => console.error('[Page]', err));
```

fetch 에러든 Mixin 내부 에러든 동일한 경로로 페이지까지 전파된다. 컴포넌트의 조립 코드에는 에러 처리 코드가 없다.

### 상태 초기화

Mixin은 자기 상태만 관리한다. 리셋이 필요하면 Mixin이 reset 메서드를 제공한다.

---

## 선택자 계약

### 개념

선택자는 컴포넌트(HTML 구조)와 Mixin(기능) 사이의 **계약 인터페이스**다.

- 컴포넌트가 "나는 이 선택자들을 가지고 있다"고 알려준다.
- Mixin이 "그 선택자에 이 행위를 붙인다"고 결정한다.

### 두 종류의 선택자

```
cssSelectors     — CSS 선택자로 HTML 요소를 찾아 참조한다
                   데이터 바인딩용과 이벤트 바인딩용 모두 포함 가능

datasetSelectors — [data-*] 선택자로 HTML 요소를 찾아 참조한다
                   마크업 시점에 data-* 속성이 선언된 요소가 대상
```

datasetSelectors의 대상은 마크업 시점에 `data-*` 속성으로 이미 선언되어 있다.

### 흐름

```
HTML 마크업:
  <span class="system-status" data-status="unknown">-</span>

register.js (조립 코드):
  applyFieldRenderMixin(this, {
      cssSelectors: {
          statusLabel: '.system-status'       ← textContent용
      },
      datasetSelectors: {
          status: '[data-status]'             ← dataset용
      },
      dataFormat: (data) => ({
          status:      data.status,           // → dataset.status = 'RUNNING'
          statusLabel: data.statusLabel       // → textContent = '정상'
      })
  });

결과:
  <span class="system-status" data-status="RUNNING">정상</span>
```

### customEvents에서의 선택자 참조

customEvents는 Mixin **바깥에서** 정의한다. Mixin이 보존한 선택자를 **computed property**로 참조한다.

```javascript
// FieldRenderMixin — cssSelectors/datasetSelectors 참조
this.customEvents = {};

// ListRenderMixin — item 선택자 참조
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@eventClicked'
    }
};
bindEvents(this, this.customEvents);
```

### 선택자 충돌

같은 선택자를 두 Mixin에 주입하는 것은 **프로젝트 레벨의 오용**이다. 시스템이 방지할 문제가 아니라 프로젝트가 관리할 문제다.

---

## 데이터 흐름

### 구독과 Mixin의 분리

구독(topic)은 **프로젝트 레벨**의 관심사다. Mixin은 topic을 모른다.

```
페이지(loaded.js):
  registerMapping({ topic: 'systemInfo', datasetInfo: {...} })
  fetchAndPublish('systemInfo', this)

컴포넌트(register.js):
  this.subscriptions = {
      systemInfo: [this.fieldRender.renderData]
  };
  ↑ topic 이름은 컴포넌트(조립 코드)가 결정
  ↑ 핸들러는 Mixin의 메서드 (함수 참조)

Mixin 내부:
  ns.renderData = function({ response }) { ... }
  ↑ Mixin은 topic을 모르고, { response } 형태만 알면 됨
```

### subscriptions 패턴

subscriptions는 **함수 참조** 배열을 사용한다. Mixin 적용 이후에 선언해야 한다.

```javascript
// Mixin 적용 후
this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
```

### dataFormat 함수

Mixin이 기대하는 데이터 형태와 데이터 응답 사이의 간극은 **dataFormat 함수**가 해결한다. 데이터 출처(API, WebSocket 등)에 무관하게 Mixin이 기대하는 포맷으로 매핑한다.

```javascript
dataFormat: (data) => ({
    name:        data.hostname,         // API 키 → Mixin 키
    status:      data.status,           // 값 그대로
    statusLabel: data.statusLabel,      // 라벨은 서버가 제공
    version:     data.version
})
```

#### dataFormat의 원칙

- API 키 → cssSelectors/datasetSelectors 키 매핑을 수행한다
- 값 가공(포맷팅 등)은 프로젝트 레벨의 판단이다

---

## 이벤트 흐름

### customEvents — Mixin 바깥

customEvents는 Weventbus의 영역이며, Mixin 바깥에서 정의한다.

```javascript
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@eventClicked'
    }
};
bindEvents(this, this.customEvents);
```

### 이벤트 처리 흐름

```
사용자가 .event-log__item 클릭
    ↓
Wkit.bindEvents (delegate)
    ↓
Weventbus.emit('@eventClicked', { event, targetInstance })
    ↓
페이지 before_load.js의 핸들러가 수신
    ↓
페이지가 처리 (fetch, 상태 변경 등)
```

### Mixin 메서드와의 관계

Mixin의 메서드는 이벤트를 **발행하지 않는다**. 이벤트 발행은 customEvents(Weventbus)의 역할이다.

Mixin은 **렌더링과 상태 관리**만 수행한다. "무슨 일이 일어났는지 알리는 것"은 이벤트 시스템의 일이다.

```
customEvents (Weventbus)  → "무슨 일이 일어났는지 알린다" (이벤트 발행)
Mixin 메서드              → "무슨 일을 한다" (DOM 조작, 렌더링)
선택자                    → 둘 다 같은 선택자를 공유하는 계약
```

---

## 라이프사이클

### 생성 순서

```
register.js 실행
    ↓
1. Mixin 적용 (applyXxxMixin) — 반드시 먼저
    ↓
2. 구독 연결 (subscriptions + subscribe) — Mixin 메서드 참조
    ↓
3. 이벤트 매핑 (customEvents + bindEvents) — Mixin 선택자 참조
```

### 정리 순서 (생성의 역순)

```
beforeDestroy.js 실행
    ↓
3. 이벤트 제거 (removeCustomEvents)
    ↓
2. 구독 해제 (subscriptions 순회 + unsubscribe)
    ↓
1. Mixin 정리 (ns.destroy)
```

### Mixin의 destroy

각 Mixin의 destroy는 **자기가 만든 것만** 정리한다.

---

## 페이지와의 관계

### 기존 원칙 유지

- 페이지 = 오케스트레이터 (데이터 정의, interval 관리, 이벤트 핸들러)
- 컴포넌트 = 독립적 구독자 (topic 구독, 렌더링)

이 관계는 변하지 않는다. Mixin 시스템은 **컴포넌트 내부 구조**만 변경한다.

### 페이지에서 Mixin 메서드 접근

페이지는 **네임스페이스를 직접** 접근한다.

```javascript
// 페이지 before_load.js
this.pageEventBusHandlers = {
    '@clearClicked': ({ targetInstance }) => {
        targetInstance.listRender.clear();
    }
};
```

컴포넌트가 래핑 메서드를 제공하지 않는다. 래핑은 컴포넌트를 "진짜 껍데기"로 유지하기 위해 불필요하다.

---

## 책임 경계

### Mixin 시스템이 해결하는 것

| 문제 | 해결 |
|------|------|
| 렌더링 로직 반복 | Mixin으로 추출 → 재사용 |
| register.js 비대화 (250줄+) | 조립 코드만 남김 (30~50줄) |
| 정리 누락 | Mixin 자체 destroy |
| 컴포넌트 간 기능 공유 | 같은 Mixin을 다른 껍데기에 적용 |

### 프로젝트가 해결하는 것 (Mixin 시스템의 범위 밖)

| 문제 | 이유 |
|------|------|
| dataFormat 복잡성 관리 | 프로젝트의 API 구조에 의존 |
| 선택자 충돌 방지 | 프로젝트의 HTML 설계에 의존 |
| Mixin 조합의 유효성 | 프로젝트의 컴포넌트 설계에 의존 |
| 정리 순서의 프로젝트별 특수 케이스 | 프로젝트의 리소스 의존 관계에 의존 |

---

## 컴포넌트 목록과 Mixin 목록

### 컴포넌트 카탈로그 (Bootstrap식 — 시각 구조 중심)

컴포넌트는 HTML/CSS 구조만 정의한다. 분류 기준은 시각적 형태다.

디자인이 달라지면 컴포넌트가 추가된다. Mixin이 달라지지 않는다.

> 구체적인 컴포넌트 목록은 별도 문서 참조: [RENOBIT_2D_Component_Design.md]

### Mixin 카탈로그 (기능 중심)

Mixin은 행위를 정의한다. 분류 기준은 "다루는 행위가 본질적으로 다른가"이다.

| Mixin | 역할 | 주입 네임스페이스 |
|-------|------|-------------------|
| FieldRenderMixin | 데이터 객체의 필드를 DOM 요소에 매핑하여 렌더링 | `this.fieldRender` |
| ListRenderMixin | template 기반 배열 데이터 반복 렌더링 | `this.listRender` |
| EventListMixin | ListRenderMixin + 개별 항목 상태 변경 (Ack 등) | `this.eventList` |

### 관계

```
N개 컴포넌트 (시각 구조) + M개 Mixin (기능) = N + M 관리량

같은 FieldRenderMixin이:
  SystemInfo 껍데기에 적용되면 → 시스템 정보 표시
  StatusCards 껍데기에 적용되면 → 메트릭 카드 표시

껍데기가 달라져도 기능은 재사용된다.
기능이 달라져도 껍데기는 재사용된다.
```

---

## 확장 경로

### 컴포넌트 확장

디자인이 확정되면 HTML/CSS 변형이 추가된다. 컴포넌트 수가 늘어난다. Mixin 수는 늘어나지 않는다.

### Mixin 확장

새로운 행위가 필요하면 Mixin이 추가된다. 기존 컴포넌트와 Mixin에는 영향이 없다.

추가 후보 (사용처가 늘어나면 추출):

| 후보 | 행위 |
|------|------|
| EChartsMixin | ECharts 인스턴스 관리 (초기화, 옵션, 리사이즈, 정리) |
| TabulatorMixin | Tabulator 인스턴스 관리 (초기화, 데이터, 이벤트, 정리) |
| TreeStateMixin | 재귀적 트리 구조의 펼침/접기/선택 상태 관리 |
| PopupMixin | Shadow DOM 팝업 관리 |
| HeatmapMixin | GPU Shader 기반 히트맵 서피스 관리 |
| MeshStateMixin | 3D 메시 색상/상태 매핑 |
| CameraFocusMixin | 카메라 포커스 애니메이션 |
| FormStateMixin | 폼 입력 값 수집/검증 |
| ModalMixin | 모달 다이얼로그 라이프사이클 |

### 도메인 Mixin

프로젝트 특화 행위가 반복되면 도메인 Mixin으로 추출할 수 있다. 같은 원칙(네임스페이스 주입, 선택자 계약, 자체 destroy)을 따른다.

---

*최종 업데이트: 2026-03-19*
