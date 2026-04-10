# Charts — PieChart

## 기능 정의

1. **파이 차트 렌더링** — `chartData` 토픽으로 수신한 항목 데이터를 도넛 차트로 시각화
2. **비중 비교 표시** — 각 항목의 점유율을 분포 중심으로 표현
3. **리사이즈 대응** — 컨테이너 및 윈도우 크기 변화에 따라 차트를 다시 계산

---

## 구현 명세

### Mixin

EChartsMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.pie-chart__canvas` | ECharts 인스턴스가 마운트될 요소 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| chartData | `this.echarts.renderData` |

### 이벤트 (customEvents)

없음

### 데이터 계약

```javascript
{
    items: [
        { name: 'Core', value: 40 },
        { name: 'Edge', value: 24 },
        { name: 'API', value: 18 },
        { name: 'Batch', value: 12 },
        { name: 'Other', value: 6 }
    ]
}
```

### 옵션 계약

- `items` → `series[0].data`
- `mapData(data, option)`를 사용해 pie series에 병합

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 딥 네이비, 세련된 도넛 분포 |
| 02_material | B: Material Elevated | 라이트 서피스, 균형 잡힌 섹션 분할 |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 인쇄 리포트형 |
| 04_operational | D: Dark Operational | 다크 HUD, 고대비 분포 모니터링 |
