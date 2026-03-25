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
| `renderData({ response })` | 행 데이터 배열을 받아 테이블에 적용 |
| `setData(data)` | 데이터 직접 적용 |
| `clearData()` | 테이블 데이터 비우기 |
| `getInstance()` | Tabulator 인스턴스 반환 (고급 사용) |
| `destroy()` | 인스턴스 destroy + 모든 속성/메서드 정리 |
