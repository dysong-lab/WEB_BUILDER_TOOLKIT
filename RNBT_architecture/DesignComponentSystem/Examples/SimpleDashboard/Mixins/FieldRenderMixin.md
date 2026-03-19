# FieldRenderMixin

## 설계 의도

데이터 객체의 필드를 DOM 요소에 매핑하여 렌더링한다.

하나의 데이터 객체가 여러 DOM 요소에 각각 반영되는 **1:N 매핑** 패턴이다. HTML에 이미 존재하는 요소에 값을 채우는 것이 핵심이며, DOM을 생성하지 않는다.

### 값 반영 규칙

| 선택자 | 반영 대상 | 용도 |
|--------|-----------|------|
| cssSelectors | el.textContent | 시각용 — 사람이 읽는 값 |
| datasetSelectors | el.dataset[key] | 시스템용 — CSS 셀렉터, JS 접근 등 |

하나의 dataFormat 키가 cssSelectors와 datasetSelectors 양쪽에 있으면 둘 다 반영된다.

---

## 네임스페이스

`this.fieldRender`

---

## 옵션

```javascript
applyFieldRenderMixin(instance, {
    cssSelectors,       // Object — { dataFormatKey: 'CSS 선택자' }
    datasetSelectors,   // Object — { dataFormatKey: '[data-*] 선택자' } (선택적)
    dataFormat          // Function — (data) => ({ key: value }) (선택적)
});
```

| 옵션 | 필수 | 설명 |
|------|------|------|
| cssSelectors | O | textContent 반영 대상. 키는 dataFormat 반환 객체의 키와 매칭 |
| datasetSelectors | X | dataset 반영 대상. 마크업의 data-* 속성이 있는 요소 |
| dataFormat | X | 데이터 형태 매핑. 없으면 data를 그대로 사용 |

---

## 주입되는 속성/메서드

| 속성/메서드 | 설명 |
|-------------|------|
| `this.fieldRender.cssSelectors` | 주입된 cssSelectors (외부 참조용) |
| `this.fieldRender.datasetSelectors` | 주입된 datasetSelectors (외부 참조용) |
| `this.fieldRender.renderData({ response })` | 데이터 수신 → DOM 반영 |
| `this.fieldRender.destroy()` | 자기 정리 |

---

## 사용 예시

### HTML (마크업 — 컴포넌트가 소유)

```html
<div class="system-info">
    <div class="system-info__name">-</div>
    <span class="system-info__status" data-status="unknown">-</span>
    <span class="system-info__version">-</span>
</div>
```

### register.js (조립 코드)

```javascript
// 1. Mixin 적용
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
        status:      data.status,           // → dataset.status
        statusLabel: data.statusLabel,      // → textContent
        version:     data.version
    })
});

// 2. 구독 연결
this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
};

// 3. 이벤트 매핑
this.customEvents = {};
bindEvents(this, this.customEvents);
```

### beforeDestroy.js (정리 코드)

```javascript
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.fieldRender.destroy();
```

### 결과

```
API 응답: { hostname: 'RNBT-01', status: 'RUNNING', statusLabel: '정상', version: 'v2.4.1' }

DOM:
  .system-info__name       → textContent = 'RNBT-01'
  .system-info__status     → textContent = '정상'
  [data-status]            → dataset.status = 'RUNNING'
  .system-info__version    → textContent = 'v2.4.1'
```

---

## dataFormat 원칙

- API 키 → cssSelectors/datasetSelectors 키 매핑만 수행
- 값 가공은 하지 않는다 (서버가 제공한 값 그대로)
- 라벨이 필요하면 서버가 label 키로 제공한다

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
