# Charts — RadarChart

## 기능 정의

1. **레이더 차트 렌더링** — `chartData` 토픽으로 수신한 지표 데이터를 레이더 차트로 시각화
2. **프로파일 비교** — 2개 그룹의 다축 특성을 한 화면에서 비교 표시
3. **리사이즈 대응** — 컨테이너 및 윈도우 크기 변화에 따라 차트를 다시 계산

---

## 구현 명세

### Mixin

EChartsMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.radar-chart__canvas` | ECharts 인스턴스가 마운트될 요소 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| chartData | `this.echarts.renderData` |

### 이벤트 (customEvents)

없음

### 데이터 계약

```javascript
{
    indicators: [
        { name: 'CPU', max: 100 },
        { name: 'Memory', max: 100 },
        { name: 'I/O', max: 100 },
        { name: 'Queue', max: 100 },
        { name: 'Latency', max: 100 }
    ],
    values: [
        [72, 66, 80, 58, 46],
        [54, 61, 48, 72, 64]
    ]
}
```

### 옵션 계약

- `indicators` → `radar.indicator`
- `values[0]` → `Profile A`
- `values[1]` → `Profile B`
- `mapData(data, option)`를 사용해 radar series에 병합

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 딥 네이비, 투명 폴리곤 레이어 |
| 02_material | B: Material Elevated | 라이트 서피스, 균형 잡힌 프로파일 비교 |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 분석 리포트형 |
| 04_operational | D: Dark Operational | 다크 HUD, 프로파일 감시형 |
