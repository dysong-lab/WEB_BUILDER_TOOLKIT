# EChartsMixin

## 설계 의도

차트 인스턴스를 생성하고, 옵션을 적용하여 표시한다.

ECharts 인스턴스의 라이프사이클(생성, 옵션 적용, 리사이즈, 정리)을 관리한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### cssSelectors

| KEY | 필수 | 의미 |
|-----|------|------|
| `container` | O | 차트가 렌더링될 요소 |

### renderData가 기대하는 데이터

ECharts 옵션 객체. 그대로 `setOption`에 전달된다.

```javascript
// 이 데이터가 renderData에 전달되면:
{
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
    yAxis: { type: 'value' },
    series: [{ data: [150, 230, 224], type: 'line' }]
}
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
