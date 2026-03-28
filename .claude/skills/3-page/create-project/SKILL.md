---
name: create-project
description: 기능 중심 컴포넌트 시스템(Mixin 기반)에 맞는 대시보드 프로젝트를 생성합니다.
---

# 프로젝트 생성

Mixin 기반 컴포넌트, 페이지 스크립트, Mock 서버, datasetList.json을 포함한 완전한 프로젝트를 생성합니다.

> 설계 문서: [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조
> 공통 규칙: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 - 캐싱하거나 생략하지 마세요.**

1. [/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) - 시스템 설계
2. [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) - 공통 규칙
3. **기존 예제 확인** - SimpleDashboard의 구조와 패턴을 먼저 읽을 것

---

## 핵심 원칙

### 컴포넌트 = 껍데기 + 조립 코드

```
컴포넌트는 HTML/CSS(껍데기)만 소유한다.
기능은 Mixin이 소유한다.
register.js는 Mixin 적용 + 구독 연결 + 이벤트 매핑만 한다.
도메인 로직은 없다.
```

### 선택자 계약

```
cssSelectors     — KEY: Mixin 규약 KEY + 사용자 정의 KEY, VALUE: CSS 선택자
datasetAttrs — KEY: Mixin 규약 KEY + 사용자 정의 KEY, VALUE: data-* 속성명
약속된 선택자를 HTML에서 유지하면 디자인은 자유
```

### 페이지 = 오케스트레이터

```
페이지가 데이터 정의(pageDataMappings), interval 관리, 이벤트 핸들러를 담당.
컴포넌트는 구독만 하고, Mixin 메서드에 네임스페이스로 직접 접근.
```

---

## 출력 구조

```
DesignComponentSystem/Examples/[project_name]/
├── Mixins/                            # 재사용 Mixin
│   ├── FieldRenderMixin.js
│   ├── FieldRenderMixin.md
│   ├── ListRenderMixin.js
│   └── ListRenderMixin.md
│
├── mock_server/                       # Express API 서버
│   ├── server.js
│   └── package.json
│
├── page/                              # 페이지 레이어
│   ├── page_scripts/
│   │   ├── before_load.js             # 이벤트 핸들러 등록
│   │   ├── loaded.js                  # 데이터 매핑 + interval
│   │   └── before_unload.js           # 정리
│   └── components/
│       └── [ComponentName]/
│           ├── views/
│           │   ├── 01_[name].html     # 디자인 변형 A
│           │   └── 02_[name].html     # 디자인 변형 B
│           ├── styles/
│           │   ├── 01_[name].css
│           │   └── 02_[name].css
│           ├── scripts/
│           │   ├── register.js        # 조립 코드 (불변)
│           │   └── beforeDestroy.js   # 정리 코드 (불변)
│           └── preview/               # 컴포넌트 단독 테스트
│               ├── 01_[name].html
│               └── 02_[name].html
│
├── datasetList.json                   # 실제 포맷 (version, data, rest_api)
└── preview.html                       # 통합 preview (디자인 전환 가능)
```

---

## 컴포넌트 register.js 패턴

register.js는 **조립 코드만** 포함한다. 순서가 중요하다.

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
        statusLabel: '.system-info__status'
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
// 3. 이벤트 매핑 — Mixin 선택자를 computed property로 참조
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
```

### ListRenderMixin 사용 시

```javascript
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

// customEvents에서 Mixin의 item 선택자를 computed property로 참조
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@eventClicked'
    }
};
```

---

## beforeDestroy.js 패턴

생성의 역순으로 정리.

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
this.fieldRender.destroy();
```

---

## 페이지 스크립트 패턴

### before_load.js — 이벤트 핸들러

Mixin 메서드에 **네임스페이스로 직접 접근**.

```javascript
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@cardClicked': ({ event }) => {
        const card = event.target.closest('.status-card');
        console.log('[Page] Card clicked:', card?.dataset.metric);
    },
    '@clearClicked': ({ targetInstance }) => {
        targetInstance.listRender.clear();
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
```

### loaded.js — 데이터 매핑 + interval

```javascript
const { registerMapping, fetchAndPublish } = GlobalDataPublisher;
const { each, go } = fx;

this.pageDataMappings = [
    {
        topic: 'systemInfo',
        datasetInfo: {
            datasetName: 'dashboard_systemInfo',
            param: { baseUrl: 'localhost:4010' }
        }
    },
    {
        topic: 'stats',
        datasetInfo: {
            datasetName: 'dashboard_stats',
            param: { baseUrl: 'localhost:4010' }
        },
        refreshInterval: 5000
    }
];

this.pageParams = {};

go(
    this.pageDataMappings,
    each(registerMapping),
    each(({ topic }) => this.pageParams[topic] = {}),
    each(({ topic }) =>
        fetchAndPublish(topic, this)
            .catch(err => console.error(`[Page] ${topic}:`, err))
    )
);

// interval 관리
this.startAllIntervals = () => { /* ... */ };
this.stopAllIntervals = () => { /* ... */ };
this.startAllIntervals();
```

### before_unload.js — 정리

```javascript
const { unregisterMapping } = GlobalDataPublisher;
const { offEventBusHandlers } = Wkit;
const { each, go } = fx;

if (this.stopAllIntervals) this.stopAllIntervals();
this.pageIntervals = null;

offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;

go(
    this.pageDataMappings,
    each(({ topic }) => unregisterMapping(topic))
);
this.pageDataMappings = null;
this.pageParams = null;
```

---

## datasetList.json

실제 런타임 포맷을 따른다. API 주소는 `rest_api` 필드에 정의, `param`은 런타임 변수만.

```json
{
  "version": "3.2.0",
  "data": [
    {
      "datasource": "",
      "mode": "0",
      "delivery_type": "0",
      "param_info": [
        {
          "param_name": "baseUrl",
          "param_type": "string",
          "default_value": "localhost:4010"
        }
      ],
      "data_type": "1",
      "interval": "5000",
      "page_id": "PAGE",
      "query": "",
      "query_type": "",
      "description": "시스템 메트릭 조회",
      "dataset_id": "dcs-stats-001",
      "name": "dashboard_stats",
      "rest_api": "{\"url\":\"http://#{baseUrl}/api/stats\",\"method\":\"GET\",\"headers\":{},\"body\":\"\"}"
    }
  ],
  "datasource": []
}
```

---

## 디자인 변형

같은 register.js(Mixin 조립)로 여러 디자인이 동작하는 것을 시연.

```
views/
├── 01_bar.html      ← 디자인 A
├── 02_card.html     ← 디자인 B (극단적으로 다른 구조)
└── 03_minimal.html  ← 디자인 C

scripts/
├── register.js      ← 동일 (불변)
└── beforeDestroy.js ← 동일 (불변)

조건: 약속된 선택자(cssSelectors, datasetAttrs의 값)를 HTML에서 유지
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

- ❌ datasetList.json 형식 임의 변경
- ❌ 라이프사이클 순서 위반
- ❌ 컴포넌트에서 직접 fetch
- ❌ Mixin 메서드 재정의 (래핑, 덮어쓰기)
- ❌ customEvents에서 선택자 하드코딩 (Mixin의 computed property 사용)

---

## 관련 자료

| 참조 | 위치 |
|------|------|
| 시스템 설계 문서 | [/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) |
| 예제 | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/) |
| 예제 (DeviceList — 팝업+목록 조합) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/DeviceList/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/DeviceList/) |
| FieldRenderMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md) |
| ListRenderMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/ListRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ListRenderMixin.md) |
| ShadowPopupMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/ShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ShadowPopupMixin.md) |
| 전체 Mixin 목록 | [/RNBT_architecture/DesignComponentSystem/Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) |
