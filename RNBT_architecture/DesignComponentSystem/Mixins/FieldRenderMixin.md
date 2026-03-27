# FieldRenderMixin

## 설계 의도

데이터 객체의 필드를 DOM 요소에 매핑하여 렌더링한다.

하나의 데이터 객체가 여러 DOM 요소에 각각 반영되는 **1:N 매핑** 패턴이다. HTML에 이미 존재하는 요소에 값을 채우는 것이 핵심이며, DOM을 생성하지 않는다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조
> **구독/이벤트/정리 패턴**: 설계 문서의 "라이프사이클" 참조

---

## 인터페이스

### cssSelectors

CSS 선택자로 HTML 요소를 참조한다.

```javascript
cssSelectors: {
    name:        '.system-info__name',       // 시스템 이름을 표시할 요소
    statusLabel: '.system-info__status',     // 상태 라벨을 표시할 요소
    version:     '.system-info__version',    // 버전을 표시할 요소
    card:        '.status-card'              // 이벤트 매핑 전용 (데이터 없이 사용 가능)
}
```

데이터의 KEY와 일치하면 해당 요소의 textContent에 값을 반영한다. 일치하지 않으면 건너뛴다.

> **KEY의 성격:** 모든 KEY는 사용자가 정의한다. Mixin이 정의하는 구조적 KEY는 없다. KEY는 "이 데이터를 이 위치에 표시하라"는 지정이다. 데이터와 무관한 KEY(예: `card`)는 customEvents나 페이지 핸들러에서 요소 접근용으로 사용된다.

### datasetAttrs

cssSelectors와 key를 공유하여, 해당 위치의 요소에 data 속성을 설정한다.
([SELECTORS_AS_CONTRACT.md](../docs/architecture/SELECTORS_AS_CONTRACT.md) 참조)

```javascript
datasetAttrs: {
    status: 'status'        // cssSelectors['status']가 가리키는 요소에 data-status 설정
}
```

> **KEY의 성격:** 모든 KEY는 사용자가 정의한다. cssSelectors의 같은 KEY로 위치를 결정하고, datasetAttrs의 VALUE가 data 속성명이 된다.

### renderData가 기대하는 데이터

플랫 객체. KEY가 cssSelectors/datasetAttrs의 KEY와 일치해야 한다.

```javascript
// 이 데이터가 renderData에 전달되면:
{
    name:        'RNBT-01',     // → cssSelectors['name'] → textContent
    status:      'RUNNING',     // → datasetAttrs['status'] → dataset
    statusLabel: '정상',        // → cssSelectors['statusLabel'] → textContent
    version:     'v2.4.1'      // → cssSelectors['version'] → textContent
}
```

---

## 사용 예시

### HTML

```html
<div class="system-info">
    <div class="system-info__name">-</div>
    <span class="system-info__status" data-status="unknown">-</span>
    <span class="system-info__version">-</span>
</div>
```

### register.js

```javascript
applyFieldRenderMixin(this, {
    cssSelectors: {
        name:        '.system-info__name',
        statusLabel: '.system-info__status',
        version:     '.system-info__version'
    },
    datasetAttrs: {
        status:      'status'
    }
});

this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
};
```

### 결과

```
DOM:
  .system-info__name       → textContent = 'RNBT-01'
  .system-info__status     → textContent = '정상'
  [data-status]            → dataset.status = 'RUNNING'
  .system-info__version    → textContent = 'v2.4.1'
```

---

## 주입되는 네임스페이스

`this.fieldRender`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors (customEvents에서 computed property로 참조) |
| `datasetAttrs` | 주입된 datasetAttrs |
| `renderData({ response })` | selector KEY에 맞춰진 데이터를 받아 DOM에 반영 |
| `destroy()` | Mixin이 주입한 모든 속성과 메서드를 정리 |

---

## 디자인 변형

같은 register.js로 HTML/CSS만 교체할 수 있다. 조건은 **cssSelectors와 datasetAttrs의 VALUE에 해당하는 요소가 HTML에 존재**하는 것이다.

```
01_bar.html      — 가로 바 (다크 배경)
02_card.html     — 세로 카드 (라이트 배경)
03_minimal.html  — 텍스트만

→ 세 HTML 모두 .system-info__name, .system-info__status, [data-status] 등을 포함
→ register.js는 동일
```
