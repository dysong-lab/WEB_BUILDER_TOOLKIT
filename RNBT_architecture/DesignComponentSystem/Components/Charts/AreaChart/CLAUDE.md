# Charts — AreaChart

## 기능 정의

1. **영역 차트 렌더링** — `chartData` 토픽으로 수신한 카테고리/시리즈 데이터를 면적 그래프로 시각화
2. **누적감 있는 추세 표현** — 라인과 면 채움을 함께 사용해 변화량을 강조
3. **리사이즈 대응** — 컨테이너 및 윈도우 크기 변화에 따라 차트를 다시 계산

---

## 구현 명세

### Mixin

EChartsMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.area-chart__canvas` | ECharts 인스턴스가 마운트될 요소 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| chartData | `this.echarts.renderData` |

### 이벤트 (customEvents)

없음

### 데이터 계약

```javascript
{
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    values: [
        [68, 72, 80, 96, 88, 104],
        [42, 48, 55, 62, 58, 70]
    ]
}
```

### 옵션 계약

- `values[0]` → `Capacity` 시리즈 데이터
- `values[1]` → `Usage` 시리즈 데이터
- `categories` → xAxis 레이블

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 딥 네이비, 투명한 area fill, 정제된 대시보드 |
| 02_material | B: Material Elevated | 라이트 서피스, 부드러운 면 분리 |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 종이 질감 리포트형 |
| 04_operational | D: Dark Operational | 다크 HUD, 고대비 면적 레이어 |
