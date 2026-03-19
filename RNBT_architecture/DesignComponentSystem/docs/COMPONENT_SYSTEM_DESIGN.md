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

### 문제

RENOBIT은 웹 콘텐츠 플랫폼이다. 어떤 프로젝트가 진행될지, 어떤 콘텐츠가 제작될지 사전에 알 수 없다.

이 상황에서 컴포넌트를 반복 생산하려면 **콘텐츠가 아닌 다른 기준**이 필요하다.

### 접근

기존 설계에서는 "데이터 유형"으로 컴포넌트를 분류했다. 이 설계에서는 한 단계 더 나아가 **기능(행위)을 Mixin으로 분리**한다.

- 컴포넌트는 시각적 구조(HTML/CSS)만 소유한다.
- 기능은 Mixin이 소유한다.
- 컴포넌트와 Mixin은 **선택자**를 계약 인터페이스로 연결된다.

### 왜 Mixin인가

기존 코드베이스를 분석하면, 34개 컴포넌트의 행위가 소수의 패턴으로 수렴한다.

| 행위 | 반복 횟수 |
|------|-----------|
| 필드 매핑 → DOM 렌더링 | 14개 |
| 배열 → 반복 렌더링 | 8개 |
| ECharts 초기화 + 옵션 적용 | 6개 |
| Tabulator 초기화 + 데이터 적용 | 5개 |
| 트리 펼침/접기 + 상태 관리 | 3개 |

이 반복되는 행위를 각 컴포넌트마다 작성하는 것은 비효율적이다. Mixin으로 추출하면 **행위를 한 번 작성하고, 여러 컴포넌트에 주입**할 수 있다.

---

## 핵심 구조

```
┌─────────────────────────────────────────────────────────────┐
│  컴포넌트 (껍데기)                                          │
│  ├── HTML/CSS (시각 구조)                                   │
│  └── register.js (조립 코드)                                │
│       │                                                     │
│       ├── applyMixinA(this, { selectors, transform })       │
│       │   → this.mixinA.* (네임스페이스로 주입)             │
│       │                                                     │
│       ├── applyMixinB(this, { selectors, transform })       │
│       │   → this.mixinB.* (네임스페이스로 주입)             │
│       │                                                     │
│       ├── subscribe(topic, this, this.mixinA.renderData)    │
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
4.  구독 = Mixin 바깥 (topic은 프로젝트 레벨)
5.  데이터 포맷 = transform 함수 (범위는 프로젝트 책임)
6.  customEvents = Mixin 바깥, computed property로 선택자 참조
7.  페이지 접근 = 네임스페이스 직접 (targetInstance.ns.method)
8.  Mixin 간 비의존 = Mixin은 다른 Mixin을 모른다
9.  에러 = Mixin은 throw, 호출자가 catch
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
├── views/component.html       # HTML 구조
├── styles/component.css       # CSS 스타일
├── scripts/
│   ├── register.js            # 조립 코드
│   └── beforeDestroy.js       # 정리 코드
└── preview.html               # 독립 테스트
```

### register.js — 조립 코드

```javascript
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    selectors: {
        container: '.log-list',
        item: '.log-entry'
    },
    transform: (data) => ({
        items: data.logs.map(log => ({
            primary: log.message,
            secondary: log.timestamp
        }))
    })
});

// ======================
// 2. 구독 연결
// ======================

subscribe('logData', this, this.listRender.renderData);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.listRender.selectors.item]: '@logEntryClicked'
    }
};
bindEvents(this, this.customEvents);
```

### beforeDestroy.js — 정리 코드

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;

// 생성의 역순으로 정리
// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제
unsubscribe('logData', this);

// 1. Mixin 정리
this.listRender.destroy();
```

### 조립 코드에서 허용되는 것 / 허용되지 않는 것

| 허용 | 불허 |
|------|------|
| Mixin 적용 (applyXxxMixin) | 렌더링 로직 (innerHTML, DOM 조작) |
| 구독 연결 (subscribe) | 데이터 가공 로직 |
| 이벤트 매핑 (customEvents) | 상태 관리 (_state 등) |
| transform 함수 정의 | fetch 호출 |

---

## Mixin

### 정의

Mixin은 **속성과 메서드를 네임스페이스로 컴포넌트 인스턴스에 주입**하는 함수다.

### 구조

```javascript
function applyListRenderMixin(instance, options) {
    const { selectors, transform } = options;

    // 네임스페이스 생성
    const ns = {};
    instance.listRender = ns;

    // 선택자 보존 (외부에서 computed property로 참조 가능)
    ns.selectors = { ...selectors };

    // 내부 상태
    ns._items = [];

    // 메서드 주입
    ns.renderData = function({ response }) {
        const { data } = response;
        if (!data) return;

        const transformed = transform(data);
        const container = instance.appendElement.querySelector(selectors.container);
        // ... 렌더링 로직
    };

    ns.clear = function() {
        const container = instance.appendElement.querySelector(selectors.container);
        container.innerHTML = '';
        ns._items = [];
    };

    // 정리
    ns.destroy = function() {
        ns._items = null;
        ns.renderData = null;
        ns.clear = null;
        ns.selectors = null;
        instance.listRender = null;
    };
}
```

### 네임스페이스 규칙

| Mixin | 네임스페이스 |
|-------|-------------|
| applyListRenderMixin | `this.listRender` |
| applyFieldRenderMixin | `this.fieldRender` |
| applyEChartsMixin | `this.echarts` |
| applyTabulatorMixin | `this.tabulator` |
| applyTreeStateMixin | `this.treeState` |
| applyPopupMixin | `this.popup` |
| applyHeatmapMixin | `this.heatmap` |

### Mixin이 소유하는 것

```
1. 속성 (내부 상태)
   ns._items, ns._chartInstance, ns._expandedNodes ...

2. 메서드 (행위)
   ns.renderData, ns.clear, ns.setOption, ns.expand, ns.collapse ...

3. 선택자 참조 (외부 접근용)
   ns.selectors — 주입받은 선택자를 보존

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

```javascript
// 조립 코드에서 Mixin 간 협력 중재
const chartData = this.listRender.getSelectedData();
this.echarts.setOption(buildOption(chartData));
```

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
subscribe('logData', this, this.listRender.renderData);

// 페이지 loaded.js — 에러를 처리한다
fetchAndPublish('logData', this)
    .catch(err => console.error('[Page]', err));
```

fetch 에러든 Mixin 내부 에러든 동일한 경로로 페이지까지 전파된다. 컴포넌트의 조립 코드에는 에러 처리 코드가 없다.

### 상태 초기화

Mixin은 자기 상태만 관리한다. 리셋이 필요하면 Mixin이 reset 메서드를 제공한다.

```javascript
ns.reset = function() {
    ns._items = [];
    const container = instance.appendElement.querySelector(selectors.container);
    container.innerHTML = '';
};
```

---

## 선택자 계약

### 개념

선택자는 컴포넌트(HTML 구조)와 Mixin(기능) 사이의 **계약 인터페이스**다.

- 컴포넌트가 "나는 이 선택자들을 가지고 있다"고 알려준다.
- Mixin이 "그 선택자에 이 행위를 붙인다"고 결정한다.

### 흐름

```
컴포넌트 HTML:
  <div class="log-list">...</div>
  <div class="log-entry">...</div>

컴포넌트 register.js (조립 코드):
  applyListRenderMixin(this, {
      selectors: {
          container: '.log-list',   ← HTML의 선택자를 Mixin에 전달
          item: '.log-entry'
      }
  });

Mixin 내부:
  instance.appendElement.querySelector(selectors.container)
  → '.log-list' 요소에 접근하여 렌더링
```

### customEvents에서의 선택자 참조

customEvents는 Mixin **바깥에서** 정의한다. Mixin이 약속한 선택자를 **computed property**로 참조한다.

```javascript
this.customEvents = {
    click: {
        [this.listRender.selectors.item]: '@logEntryClicked'
    }
};
bindEvents(this, this.customEvents);
```

이것이 가능한 이유:
- `bindEvents`는 선택자 **문자열**만 받으면 된다.
- 그 문자열이 리터럴이든 computed property든 상관없다.
- Mixin이 `ns.selectors`에 주입받은 선택자를 보존하므로 외부에서 참조 가능하다.

### 선택자 충돌

같은 선택자를 두 Mixin에 주입하는 것은 **프로젝트 레벨의 오용**이다. 시스템이 방지할 문제가 아니라 프로젝트가 관리할 문제다.

```
❌ 프로젝트 레벨 오용:
  applyListRenderMixin(this, { selectors: { container: '.main' } });
  applyEChartsMixin(this, { selectors: { chart: '.main' } });
  → 같은 .main에 두 Mixin이 접근 — 프로젝트의 실수

✅ 올바른 사용:
  applyListRenderMixin(this, { selectors: { container: '.list-area' } });
  applyEChartsMixin(this, { selectors: { chart: '.chart-area' } });
  → 각 Mixin이 독립된 영역을 담당
```

---

## 데이터 흐름

### 구독과 Mixin의 분리

구독(topic)은 **프로젝트 레벨**의 관심사다. Mixin은 topic을 모른다.

```
페이지(loaded.js):
  registerMapping({ topic: 'logData', datasetInfo: {...} })
  fetchAndPublish('logData', this)

컴포넌트(register.js):
  subscribe('logData', this, this.listRender.renderData)
  ↑ topic 이름은 컴포넌트(조립 코드)가 결정
  ↑ 핸들러는 Mixin의 메서드

Mixin 내부:
  ns.renderData = function({ response }) { ... }
  ↑ Mixin은 topic을 모르고, { response } 형태만 알면 됨
```

### transform 함수

Mixin이 기대하는 데이터 형태와 API 응답 사이의 간극은 **transform 함수**가 해결한다.

```javascript
applyListRenderMixin(this, {
    selectors: { container: '.log-list', item: '.log-entry' },
    transform: (data) => ({
        items: data.eventLogs.map(log => ({
            primary: log.message,
            secondary: new Date(log.ts).toLocaleString()
        }))
    })
});
```

#### transform의 책임 범위

| Mixin의 관심사 | 프로젝트의 관심사 |
|----------------|-------------------|
| `items` 배열을 받아서 렌더링 | `data.eventLogs`에서 `items`를 만드는 방법 |
| 각 item에 `primary`, `secondary` 필드 기대 | API 키를 `primary`에 매핑하는 방법 |
| 데이터가 없으면 throw | 어떤 API에서 데이터가 오는지 |

Mixin은 **자기가 받을 데이터의 형태(primary가 무엇인지)**만 정의한다. 그 데이터를 어떻게 만드는지는 프로젝트가 transform으로 해결한다.

transform이 복잡해지면 별도 유틸리티로 분리하는 것은 프로젝트의 판단이다.

---

## 이벤트 흐름

### customEvents — Mixin 바깥

customEvents는 Weventbus의 영역이며, Mixin 바깥에서 정의한다.

```javascript
// 컴포넌트 register.js
this.customEvents = {
    click: {
        [this.listRender.selectors.item]: '@logEntryClicked'
    }
};
bindEvents(this, this.customEvents);
```

### 이벤트 처리 흐름

```
사용자가 .log-entry 클릭
    ↓
Wkit.bindEvents (delegate)
    ↓
Weventbus.emit('@logEntryClicked', { event, targetInstance })
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
1. Mixin 적용 (applyXxxMixin)
    ↓
2. 구독 연결 (subscribe)
    ↓
3. 이벤트 매핑 (customEvents + bindEvents)
```

### 정리 순서 (생성의 역순)

```
beforeDestroy.js 실행
    ↓
3. 이벤트 제거 (removeCustomEvents)
    ↓
2. 구독 해제 (unsubscribe)
    ↓
1. Mixin 정리 (ns.destroy)
```

### Mixin의 destroy

각 Mixin의 destroy는 **자기가 만든 것만** 정리한다.

```javascript
ns.destroy = function() {
    // 내부 상태 정리
    ns._items = null;

    // 메서드 참조 해제
    ns.renderData = null;
    ns.clear = null;
    ns.reset = null;

    // 선택자 참조 해제
    ns.selectors = null;

    // 네임스페이스 해제
    instance.listRender = null;
};
```

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
    '@assetClicked': ({ targetInstance }) => {
        targetInstance.popup.showDetail();
    },

    '@filterChanged': ({ event, targetInstance }) => {
        targetInstance.listRender.reset();
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
| transform 복잡성 관리 | 프로젝트의 API 구조에 의존 |
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
| ListRenderMixin | 배열 데이터를 반복 렌더링 | `this.listRender` |
| EChartsMixin | ECharts 인스턴스 관리 (초기화, 옵션, 리사이즈, 정리) | `this.echarts` |
| TabulatorMixin | Tabulator 인스턴스 관리 (초기화, 데이터, 이벤트, 정리) | `this.tabulator` |
| TreeStateMixin | 재귀적 트리 구조의 펼침/접기/선택 상태 관리 | `this.treeState` |
| PopupMixin | Shadow DOM 팝업 관리 | `this.popup` |
| HeatmapMixin | GPU Shader 기반 히트맵 서피스 관리 | `this.heatmap` |

### 관계

```
N개 컴포넌트 (시각 구조) + M개 Mixin (기능) = N + M 관리량

같은 ListRenderMixin이:
  LogViewer 껍데기에 적용되면 → 로그 뷰어
  EventStatus 껍데기에 적용되면 → 이벤트 테이블
  CardList 껍데기에 적용되면 → 카드 목록

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

| 후보 | 행위 | 현재 상태 |
|------|------|-----------|
| MeshStateMixin | 3D 메시 색상/상태 매핑 | 사용처 1개 |
| CameraFocusMixin | 카메라 포커스 애니메이션 | 사용처 1개 |
| FormStateMixin | 폼 입력 값 수집/검증 | 사용처 2개 |
| ModalMixin | 모달 다이얼로그 라이프사이클 | 사용처 1개 |

### 도메인 Mixin

프로젝트 특화 행위가 반복되면 도메인 Mixin으로 추출할 수 있다. 같은 원칙(네임스페이스 주입, 선택자 계약, 자체 destroy)을 따른다.

---

*최종 업데이트: 2026-03-19*
