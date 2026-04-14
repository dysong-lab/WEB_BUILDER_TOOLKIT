# Charts — ScatterChart

## 기능 정의

1. **산점도 렌더링** — `chartData` 토픽으로 수신한 좌표 데이터를 산점도로 시각화
2. **클러스터 비교** — 2개 그룹의 x/y 분포를 같은 좌표계에서 비교 표시
3. **리사이즈 대응** — 컨테이너 및 윈도우 크기 변화에 따라 차트를 다시 계산

---

## 구현 명세

### Mixin

EChartsMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.scatter-chart__canvas` | ECharts 인스턴스가 마운트될 요소 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| chartData | `this.echarts.renderData` |

### 이벤트 (customEvents)

없음

### 데이터 계약

```javascript
{
    values: [
        [[12, 28], [18, 34], [24, 42], [31, 48], [36, 52]],
        [[8, 16], [14, 22], [20, 26], [26, 33], [30, 36]]
    ]
}
```

### 옵션 계약

- `values[0]` → `Cluster A` 산점 데이터
- `values[1]` → `Cluster B` 산점 데이터
- `mapData(data, option)`를 사용해 각 series의 `data`에 병합

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 딥 네이비, 미세 그리드, 세련된 분포도 |
| 02_material | B: Material Elevated | 라이트 서피스, 부드러운 점 밀도 |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 분석 리포트형 |
| 04_operational | D: Dark Operational | 다크 HUD, 클러스터 감시형 |
