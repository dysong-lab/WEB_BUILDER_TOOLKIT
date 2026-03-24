# Mixin 명세서: EChartsMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여준다 |
| **수단** | ECharts 인스턴스를 생성하고, 옵션 객체를 setOption에 위임한다 |
| **기능** | 컨테이너에 ECharts 인스턴스를 lazy init하고, 데이터(ECharts 옵션)를 그대로 setOption에 전달하여 차트를 렌더링한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | TabulatorMixin (데이터를 보여준다), HeatmapJsMixin (데이터를 보여준다) |
| **수단의 차이** | TabulatorMixin은 테이블로, HeatmapJsMixin은 히트맵으로 시각화한다. EChartsMixin은 ECharts 라이브러리에 옵션 객체를 위임하여 차트로 시각화한다. 세 Mixin 모두 외부 라이브러리 인스턴스의 라이프사이클을 관리하는 동일한 패턴(lazy init, 데이터 적용, destroy)을 따른다. |

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

없음.

---

## 3. renderData 기대 데이터

### 데이터 형태

```
ECharts 옵션 객체. Mixin이 해석하지 않고 그대로 setOption에 전달한다 (라이브러리 위임).
```

### 예시

```javascript
// renderData({ response: { data: ??? } })에 전달되는 data의 형태:
{
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
    yAxis: { type: 'value' },
    series: [{ data: [150, 230, 224], type: 'line' }]
}
```

### KEY 매칭 규칙

```
Mixin이 data의 KEY를 해석하지 않는다.
data 객체 전체를 echarts.setOption(data)로 전달한다.
KEY 매칭은 ECharts 라이브러리가 내부적으로 수행한다.
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
    }
});

this.subscriptions = {
    chartData: [this.echarts.renderData]
};
```

---
