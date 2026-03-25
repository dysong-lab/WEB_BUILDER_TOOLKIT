# Mixin 명세서: TabulatorMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여준다 |
| **기능** | Tabulator 테이블을 생성하고 배열 데이터를 표시한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | EChartsMixin (데이터를 보여준다), HeatmapJsMixin (데이터를 보여준다) |
| **기능의 차이** | EChartsMixin은 차트로, HeatmapJsMixin은 히트맵으로 시각화한다. TabulatorMixin은 Tabulator 라이브러리에 위임하여 테이블로 시각화한다. 세 Mixin 모두 외부 라이브러리 인스턴스의 라이프사이클을 관리하는 동일한 패턴(lazy init, 데이터 적용, destroy)을 따른다. |

---

## 2. 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| `container` | 규약 | 테이블이 렌더링될 요소. `new Tabulator(containerEl, ...)`의 대상 |

> **규약 KEY**: Mixin 내부에서 `cssSelectors.container`를 직접 참조하여 Tabulator 인스턴스를 생성한다. 없으면 ensureInstance에서 throw.

### datasetAttrs

해당 없음.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `columns` | O | Tabulator 컬럼 정의 배열. `{ title, field }` 형태의 객체 배열 |
| `tabulatorOptions` | X | Tabulator 생성자에 전달할 추가 옵션. columns, data와 merge된다 |

```javascript
columns: [
    { title: 'Name', field: 'name' },
    { title: 'Status', field: 'status' },
    { title: 'Value', field: 'value', hozAlign: 'right' }
]
```

---

## 3. renderData 기대 데이터

### 데이터 형태

```
배열. 각 항목은 columns의 field와 일치하는 키를 가진 객체.
Mixin이 해석하지 않고 그대로 Tabulator.setData에 전달한다 (라이브러리 위임).
```

### 예시

```javascript
// renderData({ response: { data: ??? } })에 전달되는 data의 형태:
[
    { name: 'CPU', status: 'normal', value: '72%' },
    { name: 'Memory', status: 'warning', value: '89%' }
]
```

### KEY 매칭 규칙

```
Mixin이 data 배열의 개별 항목 KEY를 해석하지 않는다.
data 배열 전체를 tabulator.setData(data)로 전달한다.
KEY 매칭은 Tabulator 라이브러리가 columns의 field 정의에 따라 내부적으로 수행한다.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.tabulator`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors |
| `renderData({ response })` | 행 데이터 배열을 받아 테이블에 적용 |
| `setData(data)` | 데이터 직접 적용 |
| `clearData()` | 테이블 데이터 비우기 |
| `getInstance()` | Tabulator 인스턴스 반환 (고급 사용) |
| `destroy()` | 인스턴스 destroy + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- tableInstance.destroy()
- tableInstance = null
- ns.renderData = null
- ns.setData = null
- ns.clearData = null
- ns.getInstance = null
- ns.cssSelectors = null
- instance.tabulator = null
```

---

## 6. 사용 예시

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
