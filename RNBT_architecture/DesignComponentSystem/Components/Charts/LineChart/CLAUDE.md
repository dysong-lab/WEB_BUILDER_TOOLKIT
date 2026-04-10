# Charts — LineChart

## 기능 정의

1. **라인 차트 렌더링** — `chartData` 토픽으로 수신한 카테고리/시리즈 데이터를 선 그래프로 시각화
2. **복수 추세 비교** — 2개 시리즈의 추세를 같은 좌표계에서 비교 표시
3. **리사이즈 대응** — 컨테이너 및 윈도우 크기 변화에 따라 차트를 다시 계산

---

## 구현 명세

### Mixin

EChartsMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.line-chart__canvas` | ECharts 인스턴스가 마운트될 요소 |

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
        [42, 58, 49, 71, 65, 74],
        [36, 44, 41, 59, 55, 62]
    ]
}
```

### 옵션 계약

- `values[0]` → `Inbound` 시리즈 데이터
- `values[1]` → `Outbound` 시리즈 데이터
- `categories` → xAxis 레이블

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 딥 네이비, 글로우 라인, 정제된 운영 대시보드 |
| 02_material | B: Material Elevated | 라이트 서피스, 부드러운 elevation, MD 계열 |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 타이포 중심, 리포트형 |
| 04_operational | D: Dark Operational | 다크 HUD, 시안/레드 대비, 관제형 |
