# FieldRenderMixin

## 설계 의도

데이터 객체의 필드를 DOM 요소에 매핑하여 렌더링한다.

하나의 데이터 객체가 여러 DOM 요소에 각각 반영되는 **1:N 매핑** 패턴이다. HTML에 이미 존재하는 요소에 값을 채우는 것이 핵심이며, DOM을 생성하지 않는다.

> **Mixin 공통 사용법**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md)의 "Mixin > 공통 사용법" 참조

---

## 사용법

### 1단계: HTML을 본다

```html
<div class="system-info">
    <div class="system-info__name">-</div>
    <span class="system-info__status" data-status="unknown">-</span>
    <span class="system-info__version">-</span>
</div>
```

HTML에서 확인하는 것:
- 텍스트를 넣을 요소 → `.system-info__name`, `.system-info__status`, `.system-info__version`
- data 속성이 있는 요소 → `data-status` → 이 요소는 dataset 바인딩 대상

### 2단계: Mixin을 적용한다 (register.js)

```javascript
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
        name:        data.hostname,       // → cssSelectors.name 요소의 textContent
        status:      data.status,         // → datasetSelectors.status 요소의 dataset
        statusLabel: data.statusLabel,    // → cssSelectors.statusLabel 요소의 textContent
        version:     data.version         // → cssSelectors.version 요소의 textContent
    })
});
```

**키 매칭 규칙:**
- dataFormat이 반환하는 키가 cssSelectors에 있으면 → 해당 요소의 textContent에 반영
- dataFormat이 반환하는 키가 datasetSelectors에 있으면 → 해당 요소의 dataset에 반영
- 양쪽 다 있으면 → 양쪽 다 반영
- cssSelectors에 키가 있지만 dataFormat에 없으면 → 건너뜀 (이벤트 전용 선택자에 안전)

### 3단계: 구독을 연결한다

```javascript
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

### 4단계: 이벤트를 매핑한다 (필요한 경우)

```javascript
// cssSelectors에 이벤트용 선택자가 있다면 computed property로 참조
this.customEvents = {
    click: {
        [this.fieldRender.cssSelectors.card]: '@cardClicked'
    }
};
bindEvents(this, this.customEvents);
```

### 5단계: 정리한다 (beforeDestroy.js)

```javascript
// 생성의 역순으로 정리
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.fieldRender.destroy();
```

---

## 결과

```
API 응답: { hostname: 'RNBT-01', status: 'RUNNING', statusLabel: '정상', version: 'v2.4.1' }

DOM:
  .system-info__name       → textContent = 'RNBT-01'
  .system-info__status     → textContent = '정상'
  [data-status]            → dataset.status = 'RUNNING'
  .system-info__version    → textContent = 'v2.4.1'
```

---

## 옵션

```javascript
applyFieldRenderMixin(instance, {
    cssSelectors,       // Object — { key: 'CSS 선택자' }
    datasetSelectors,   // Object — { key: '[data-*] 선택자' } (선택적)
    dataFormat          // Function — (data) => ({ key: value }) (선택적)
});
```

| 옵션 | 필수 | 설명 |
|------|------|------|
| cssSelectors | O | HTML 요소를 CSS 선택자로 찾아 참조. dataFormat에 키가 있으면 textContent 반영 |
| datasetSelectors | X | HTML 요소를 data 속성 선택자로 찾아 참조. dataFormat에 키가 있으면 dataset 반영 |
| dataFormat | X | 데이터 형태 매핑. 없으면 data를 그대로 사용 |

---

## 주입되는 인터페이스

네임스페이스: `this.fieldRender`

### 속성

| 속성 | 역할 |
|------|------|
| `cssSelectors` | 주입된 cssSelectors (customEvents에서 computed property로 참조) |
| `datasetSelectors` | 주입된 datasetSelectors |

### 메서드

#### `renderData({ response })`

데이터를 수신하여 DOM에 반영한다. 구독(subscribe)을 통해 자동 호출된다.

```javascript
// 구독을 통한 자동 호출
subscribe('systemInfo', this, this.fieldRender.renderData);

// 또는 페이지에서 직접 호출
targetInstance.fieldRender.renderData({ response: { data: {...} } });
```

- `response.data`를 `dataFormat`으로 변환한 후 각 키에 대해 DOM 반영
- dataFormat에 없는 cssSelectors 키는 건너뜀

#### `destroy()`

Mixin이 주입한 모든 속성과 메서드를 정리한다.

```javascript
// beforeDestroy.js
this.fieldRender.destroy();
```

---

## 디자인 변형

같은 Mixin을 적용하면서 HTML/CSS만 교체할 수 있다. 조건은 **약속된 선택자(cssSelectors, datasetSelectors의 값)를 HTML에서 유지**하는 것이다.

```
01_bar.html      — 가로 바 (다크 배경)
02_card.html     — 세로 카드 (라이트 배경)
03_minimal.html  — 텍스트만

→ 세 HTML 모두 .system-info__name, .system-info__status, [data-status] 등을 포함
→ register.js는 동일
```
