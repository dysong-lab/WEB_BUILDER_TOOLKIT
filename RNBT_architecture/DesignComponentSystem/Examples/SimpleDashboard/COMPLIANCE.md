# SimpleDashboard — 설계 원칙 준수 검증

이 문서는 SimpleDashboard 예제가 [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md)의 원칙을 준수하는지 검증한 결과다.

---

## 검증 대상

| 분류 | 파일 | 수량 |
|------|------|------|
| Mixin | FieldRenderMixin.js, ListRenderMixin.js, EventListMixin.js | 3 |
| 컴포넌트 스크립트 | register.js, beforeDestroy.js × 4개 컴포넌트 | 8 |
| 페이지 스크립트 | before_load.js, loaded.js, before_unload.js | 3 |

---

## 선택자 인터페이스 검증

### 원칙

- KEY는 Mixin이 정의한다. VALUE는 HTML에서 온다.
- cssSelectors: KEY → CSS 선택자(VALUE)
- datasetSelectors: KEY → data-* 속성명(VALUE). Mixin이 내부적으로 `[data-속성명]` 선택자를 조립한다.

### 결과

| Mixin | datasetSelectors VALUE 형식 | 내부 조립 | dataset 반영 |
|-------|---------------------------|-----------|-------------|
| FieldRenderMixin | `'status'` ✅ | `querySelector('[data-' + attr + ']')` ✅ | `dataset[attr]` ✅ |
| ListRenderMixin | `'level'` ✅ | `querySelector('[data-' + attr + ']')` ✅ | `dataset[attr]` ✅ |
| EventListMixin | `'id'`, `'severity'`, `'ack'` ✅ | `querySelector('[data-' + attr + ']')` ✅ | `dataset[attr]` ✅ |

### itemKey 위치

EventListMixin의 `itemKey`는 datasetSelectors 안에 Mixin 정의 KEY로 위치한다.

```javascript
// EventBrowser register.js
datasetSelectors: {
    itemKey:  'id',        // Mixin 정의 KEY
    severity: 'severity',
    ack:      'ack'
}

// EventListMixin.js 내부
const itemKeyAttr = datasetSelectors.itemKey;  // → 'id'
```

---

## Mixin 옵션 검증

### 원칙

- Mixin에 주입되는 것은 cssSelectors와 datasetSelectors 두 객체뿐이다.
- 데이터 변환은 Mixin의 관심사가 아니다.

### 결과

| Mixin | cssSelectors | datasetSelectors | dataFormat |
|-------|-------------|-----------------|------------|
| FieldRenderMixin | ✅ | ✅ | 없음 ✅ |
| ListRenderMixin | ✅ | ✅ | 없음 ✅ |
| EventListMixin | ✅ | ✅ | 없음 ✅ |

---

## renderData 입력 형태 검증

### 원칙

- Mixin은 이미 selector KEY에 맞춰진 데이터만 받는다.
- FieldRenderMixin: 플랫 객체
- ListRenderMixin / EventListMixin: 배열

### 결과

| Mixin | 기대 형태 | 배열 검증 |
|-------|----------|----------|
| FieldRenderMixin | `{ key: value }` | N/A |
| ListRenderMixin | `[{ key: value }, ...]` | `Array.isArray(data)` ✅ |
| EventListMixin | `[{ key: value }, ...]` | `Array.isArray(data)` ✅ |

---

## 에러 처리 검증

### 원칙

- Mixin은 에러를 throw한다. 페이지가 catch한다.

### 결과

| Mixin | data null | container 없음 | template 없음 |
|-------|-----------|---------------|---------------|
| FieldRenderMixin | throw ✅ | N/A | N/A |
| ListRenderMixin | throw ✅ | throw ✅ | throw ✅ |
| EventListMixin | throw ✅ | throw ✅ | throw ✅ |

---

## 컴포넌트 register.js 검증

### 원칙

- 순서: Mixin 적용 → 구독 연결 → 이벤트 매핑
- 구독은 함수 참조 사용
- Mixin 재정의 금지

### 결과

| 컴포넌트 | Mixin | 순서 | 함수 참조 구독 | Mixin 재정의 |
|----------|-------|------|--------------|-------------|
| SystemInfo | FieldRenderMixin | ✅ | `this.fieldRender.renderData` ✅ | 없음 ✅ |
| StatusCards | FieldRenderMixin | ✅ | `this.fieldRender.renderData` ✅ | 없음 ✅ |
| EventLog | ListRenderMixin | ✅ | `this.listRender.renderData` ✅ | 없음 ✅ |
| EventBrowser | EventListMixin | ✅ | `this.eventList.renderData` ✅ | 없음 ✅ |

---

## 컴포넌트 beforeDestroy.js 검증

### 원칙

- 생성의 역순: 이벤트 제거 → 구독 해제 → Mixin destroy

### 결과

| 컴포넌트 | 역순 정리 |
|----------|----------|
| SystemInfo | ✅ |
| StatusCards | ✅ |
| EventLog | ✅ |
| EventBrowser | ✅ |

---

## 페이지 스크립트 검증

### 원칙

- 페이지 = 오케스트레이터 (데이터 정의, interval 관리, 이벤트 핸들러)
- 페이지가 Mixin이 기대하는 데이터 포맷을 구성하여 발행한다.
- Mixin 메서드에 네임스페이스로 직접 접근한다.

### 결과

| 파일 | 역할 | 원칙 준수 |
|------|------|----------|
| before_load.js | 이벤트 핸들러 등록 | ✅ 네임스페이스 직접 접근 |
| loaded.js | dataFormats 정의, topic 정의, interval 관리 | ✅ 페이지 레벨 |
| before_unload.js | 리소스 정리 (역순) | ✅ |

---

## 선택자 계약 검증

### 원칙

- register.js가 선언한 cssSelectors/datasetSelectors의 VALUE에 해당하는 요소가 모든 HTML 디자인 변형에 존재해야 한다.

### 결과

| 컴포넌트 | 디자인 변형 | 선택자 누락 |
|----------|-----------|------------|
| SystemInfo | 01_bar, 02_card, 03_minimal | 없음 ✅ |
| StatusCards | 01_grid, 02_list, 03_inline | 없음 ✅ |
| EventLog | 01_list, 02_table, 03_bubble | 없음 ✅ (template 존재) |
| EventBrowser | 01_standard | 없음 ✅ (template 존재) |

디자인이 달라져도 선택자 계약은 동일하다. SystemInfo의 bar/card/minimal은 완전히 다른 레이아웃이지만, register.js가 참조하는 선택자는 모두 존재한다.

이것이 설계 문서에서 말하는 **"껍데기가 달라져도 기능은 재사용된다"**의 실제 구현이다.

---

## 종합

| 검증 항목 | 파일 수 | 위반 |
|----------|--------|------|
| Mixin | 3 | 0 |
| register.js | 4 | 0 |
| beforeDestroy.js | 4 | 0 |
| 페이지 스크립트 | 3 | 0 |
| **합계** | **14** | **0** |

---

*검증일: 2026-03-20*
