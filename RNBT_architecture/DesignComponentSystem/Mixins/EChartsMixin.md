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

### 기타 옵션

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `option` | `object` (ECharts option) | X | `{}` | 차트의 기본 옵션. `renderData` 호출 시 매번 `JSON.parse(JSON.stringify(option))`으로 deep clone된 후 데이터가 병합됨 |
| `mapData` | `(data, optionCopy) => mergedOption` | X | — | 데이터 병합 커스텀 함수. Pie/Gauge/Radar 등 기본 규약에 맞지 않는 차트에 사용. 미제공 시 기본 규약 적용 |

```javascript
option: {
    xAxis: { type: 'category' },
    yAxis: { type: 'value' },
    series: [{ type: 'line' }]
}
```

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

---

## 메서드 입력 포맷

### `renderData(payload)`

**`payload` 형태**

```javascript
// 기본 규약 (mapData 미제공 시):
{
    response: {
        categories: Array<string | number>,  // xAxis.data 로 매핑
        values:     Array<Array<number>>     // values[i] → series[i].data
    }
}

// mapData 제공 시: response는 mapData 함수의 첫 인자로 그대로 전달됨 (자유 스키마)
```

| 필드 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `response` | `object` | ✓ | — | `null` 이면 **Error throw** (`[EChartsMixin] data is null`). 내부에서 option deep clone 후 병합하여 `setOption` 호출 |

**병합 규칙**

| 조건 | 처리 |
|------|------|
| `mapData` 제공 | `mapData(data, optionCopy)` 반환값을 그대로 `setOption`에 전달 |
| `mapData` 미제공 + `data.categories` 있음 + `option.xAxis` 있음 | `option.xAxis.data = data.categories` |
| `mapData` 미제공 + `data.values` 있음 + `option.series` 있음 | `option.series[i].data = data.values[i]` (series 길이만큼) |

**반환**: `void`

### `setOption(option, notMerge?)`

| 파라미터 | 타입 | 필수 | 기본값 | 의미 |
|---------|------|------|--------|------|
| `option` | `object` (ECharts option) | ✓ | — | ECharts에 직접 전달 |
| `notMerge` | `boolean` | X | `false` | `true`면 기존 옵션 대체, `false`면 merge |

**반환**: `void` (내부적으로 `ensureInstance()`로 lazy init 후 ECharts의 `setOption` 호출)

### 파라미터 없는 메서드

| 메서드 | 의미 | 반환 |
|--------|------|------|
| `resize` | ECharts 인스턴스의 `resize()` 호출. 인스턴스 미생성 시 no-op | `void` |
| `getInstance` | 현재 ECharts 인스턴스 반환. `renderData`/`setOption` 호출 전이면 `null` | `echarts.ECharts \| null` |
| `destroy` | window resize 리스너 해제 + 인스턴스 `dispose()` + 네임스페이스 null | `void` |

**비고**: `container`가 `appendElement`에 없으면 `ensureInstance()`가 **Error throw** (`container not found`). 즉 `renderData`/`setOption` 첫 호출 시까지 오류 발견이 지연됨.
