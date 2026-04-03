# EChartsMixin

## 설계 의도

차트 인스턴스를 생성하고, 데이터를 적용하여 표시한다.

ECharts 인스턴스의 라이프사이클(생성, 옵션 적용, 리사이즈, 정리)을 관리한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### cssSelectors

| KEY | 필수 | 의미 |
|-----|------|------|
| `container` | O | 차트가 렌더링될 요소 |

### option (선택)

차트의 기본 옵션 객체. Mixin 적용 시 전달하며, renderData가 데이터를 이 옵션에 병합한다.

```javascript
option: {
    xAxis: { type: 'category' },
    yAxis: { type: 'value' },
    series: [{ type: 'line' }]
}
```

### mapData (선택)

데이터를 옵션에 병합하는 커스텀 함수. `(data, optionCopy) => mergedOption` 형태. Pie, Gauge, Radar 등 기본 규약에 맞지 않는 차트에 사용한다. 미제공 시 기본 규약이 적용된다.

### renderData가 기대하는 데이터

순수 데이터 객체. option에 병합하여 `setOption`에 전달된다.

**기본 규약** (mapData 미제공 시):
- `data.categories` → `xAxis.data`
- `data.values[i]` → `series[i].data`

**커스텀** (mapData 제공 시): mapData 함수가 병합을 수행한다.

```javascript
// 기본 규약 — 이 데이터가 renderData에 전달되면:
{
    categories: ['Mon', 'Tue', 'Wed'],
    values: [[150, 230, 224]]
}
// → option.xAxis.data = categories, option.series[0].data = values[0]
```

---

## 사용 예시

### HTML

```html
<div class="chart-panel">
    <div class="chart-panel__chart" style="width: 100%; height: 300px;"></div>
</div>
```

### register.js

```javascript
applyEChartsMixin(this, {
    cssSelectors: {
        container: '.chart-panel__chart'
    },
    option: {
        xAxis: { type: 'category' },
        yAxis: { type: 'value' },
        series: [{ type: 'line' }]
    }
});

this.subscriptions = {
    chartData: [this.echarts.renderData]
};
```

---

## 주입되는 네임스페이스

`this.echarts`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors |
| `renderData({ response })` | ECharts 옵션을 받아 차트에 적용 |
| `setOption(option, notMerge)` | 옵션 직접 적용. notMerge=true이면 기존 옵션 대체 |
| `resize()` | 차트 리사이즈 (윈도우 리사이즈 시 호출) |
| `getInstance()` | ECharts 인스턴스 반환 (고급 사용) |
| `destroy()` | 인스턴스 dispose + 모든 속성/메서드 정리 |
