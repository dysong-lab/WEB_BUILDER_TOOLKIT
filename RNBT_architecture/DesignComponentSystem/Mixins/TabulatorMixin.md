# TabulatorMixin

## 설계 의도

테이블 인스턴스를 생성하고, 데이터를 적용하여 표시한다.

Tabulator 인스턴스의 라이프사이클(생성, 데이터 적용, 정리)을 관리한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### cssSelectors

| KEY | 필수 | 의미 |
|-----|------|------|
| `container` | O | 테이블이 렌더링될 요소 |

### 기타 옵션

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `columns` | `Array<Tabulator.ColumnDefinition>` | X | `[]` | Tabulator 컬럼 정의. 빈 배열이면 컬럼 없는 테이블 생성 |
| `tabulatorOptions` | `object` | X | `{}` | Tabulator 네이티브 옵션. 기본값(`columns`, `data`, `layout: 'fitDataFill'`)에 `Object.assign`으로 병합 — 즉 **키 충돌 시 사용자 값이 우선** |

**Mixin 내부 기본값** (`Object.assign` 전)

| 내부 기본값 | 설명 |
|--------|------|
| `layout: 'fitDataFill'` | 데이터 기반 너비 + 남은 공간 채움 |
| `data: []` | 초기 빈 배열 |
| `columns` | 위 옵션에서 전달된 값 |

```javascript
applyTabulatorMixin(this, {
    cssSelectors: { container: '.tabular__container' },
    columns: [...],
    tabulatorOptions: {
        layout: 'fitColumns',    // layout 변경
        height: 400,             // 테이블 높이 고정
        autoResize: false        // 컨테이너 resize 감지 비활성화
    }
});
```

### columns

Tabulator 컬럼 정의 배열. Mixin 적용 시 전달한다.

```javascript
columns: [
    { title: 'Name', field: 'name' },
    { title: 'Status', field: 'status' },
    { title: 'Value', field: 'value', hozAlign: 'right' }
]
```

### renderData가 기대하는 데이터

행 데이터 배열. columns의 field와 일치하는 키를 가진 객체 배열.

```javascript
[
    { name: 'CPU', status: 'normal', value: '72%' },
    { name: 'Memory', status: 'warning', value: '89%' }
]
```

---

## 사용 예시

### HTML

```html
<div class="data-table">
    <div class="data-table__container"></div>
</div>
```

### register.js

```javascript
applyTabulatorMixin(this, {
    cssSelectors: {
        container: '.data-table__container'
    },
    columns: [
        { title: 'Name', field: 'name' },
        { title: 'Status', field: 'status' },
        { title: 'Value', field: 'value' }
    ]
});

this.subscriptions = {
    tableData: [this.tabulator.renderData]
};
```

---

## 주입되는 네임스페이스

`this.tabulator`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors |
| `init()` | 테이블 인스턴스를 명시적으로 생성. `tableBuilt` 이벤트를 걸기 위해 먼저 호출한다. 반환값: Tabulator 인스턴스 |
| `renderData({ response })` | 행 데이터 배열을 받아 테이블에 적용 |
| `setData(data)` | 데이터 직접 적용 |
| `clearData()` | 테이블 데이터 비우기 |
| `getInstance()` | Tabulator 인스턴스 반환 (고급 사용) |
| `destroy()` | 인스턴스 destroy + 모든 속성/메서드 정리 |

---

## 메서드 입력 포맷

### `renderData(payload)`

**`payload` 형태**

```javascript
{
    response: Array<{
        [columnField: string]: any     // columns의 field와 일치하는 키
    }>
}
```

| 필드 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `response` | `Array<object>` | ✓ | — | 행 데이터 배열. 다음 경우 **Error throw**: `null` (`data is null`), 배열 아님 (`data is not an array`), `container` 미발견 (`container not found`) |

**반환**: `void` (Tabulator의 `setData(data)` 호출)

### `setData(data)`

| 파라미터 | 타입 | 필수 | 기본값 | 의미 |
|---------|------|------|--------|------|
| `data` | `Array<object>` | ✓ | — | `renderData`와 달리 `{ response }` 래핑 없이 배열 직접 전달. 페이지에서 구독 외 경로로 데이터를 넣을 때 사용 |

**반환**: `void`

### 파라미터 없는 메서드

| 메서드 | 의미 | 반환 |
|--------|------|------|
| `init` | `ensureInstance()` 호출 — 테이블 인스턴스 명시적 생성. 생성된 인스턴스의 `tableBuilt` 등 이벤트를 걸어야 할 때 `renderData` 전에 먼저 호출 | `Tabulator` 인스턴스 |
| `clearData` | 인스턴스의 `clearData()` 호출. 인스턴스 미생성 시 no-op | `void` |
| `getInstance` | 현재 Tabulator 인스턴스 또는 `null` | `Tabulator \| null` |
| `destroy` | 인스턴스의 `destroy()` + 네임스페이스 null | `void` |
