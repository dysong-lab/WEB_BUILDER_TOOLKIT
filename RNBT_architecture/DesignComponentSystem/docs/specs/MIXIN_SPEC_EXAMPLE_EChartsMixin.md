# Mixin 명세서: EChartsMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여준다 |
| **기능** | ECharts 차트를 생성하고 데이터를 시각화한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | TabulatorMixin (데이터를 보여준다), HeatmapJsMixin (데이터를 보여준다) |
| **기능의 차이** | TabulatorMixin은 테이블로, HeatmapJsMixin은 히트맵으로 시각화한다. EChartsMixin은 ECharts 라이브러리에 옵션 객체를 위임하여 차트로 시각화한다. 세 Mixin 모두 외부 라이브러리 인스턴스의 라이프사이클을 관리하는 동일한 패턴(lazy init, 데이터 적용, destroy)을 따른다. |

---

## 2. 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| `container` | 규약 | 차트가 렌더링될 요소. `echarts.init(containerEl)`의 대상 |

> **규약 KEY**: Mixin 내부에서 `cssSelectors.container`를 직접 참조하여 ECharts 인스턴스를 생성한다. 없으면 ensureInstance에서 throw.

### datasetAttrs

해당 없음.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `option` | X | 차트의 기본 옵션 객체. renderData가 데이터를 이 옵션에 병합하여 setOption에 전달 |
| `mapData` | X | 커스텀 병합 함수. `(data, optionCopy) => mergedOption`. Pie, Gauge 등 기본 규약에 맞지 않는 차트에 사용 |

---

## 3. renderData 기대 데이터

### 데이터 형태

```
순수 데이터 객체. option에 병합하여 setOption에 전달한다.
mapData 미제공 시 기본 규약 적용, 제공 시 커스텀 병합.
```

### 예시

```javascript
// 기본 규약 (mapData 미제공) — renderData({ response: ??? })에 전달되는 response의 형태:
{
    categories: ['Mon', 'Tue', 'Wed'],
    values: [[150, 230, 224]]
}
// → option.xAxis.data = categories, option.series[0].data = values[0]
```

### KEY 매칭 규칙

```
기본 규약 (mapData 미제공 시):
  data.categories → option.xAxis.data (Cartesian 계열)
  data.values[i]  → option.series[i].data (series 순서와 1:1 대응)
  병합된 option을 echarts.setOption(merged)으로 전달한다.

커스텀 (mapData 제공 시):
  컴포넌트가 정의한 mapData(data, optionCopy)가 병합을 수행한다.
  Pie, Gauge, Radar 등 기본 규약에 맞지 않는 차트에 사용한다.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.echarts`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors |
| `renderData({ response })` | ECharts 옵션을 받아 차트에 적용 |
| `setOption(option, notMerge)` | 옵션 직접 적용. notMerge=true이면 기존 옵션 대체 |
| `resize()` | 차트 리사이즈 (윈도우 리사이즈 시 호출) |
| `getInstance()` | ECharts 인스턴스 반환 (고급 사용) |
| `destroy()` | 인스턴스 dispose + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- window.removeEventListener('resize', _resizeHandler)
- _resizeHandler = null
- chartInstance.dispose()
- chartInstance = null
- ns.renderData = null
- ns.setOption = null
- ns.resize = null
- ns.getInstance = null
- ns.cssSelectors = null
- instance.echarts = null
```

---

## 6. 사용 예시

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
