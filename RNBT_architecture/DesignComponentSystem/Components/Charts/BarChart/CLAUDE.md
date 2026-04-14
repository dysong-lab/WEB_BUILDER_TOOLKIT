# Charts — BarChart

## 기능 정의

1. **막대 차트 렌더링** — `chartData` 토픽으로 수신한 카테고리/시리즈 데이터를 막대 차트로 시각화
2. **복수 시리즈 표시** — 2개 시리즈를 나란한 막대로 비교 표시
3. **차트 크기 자동 대응** — 컨테이너 크기 및 윈도우 리사이즈에 맞춰 차트를 재계산

---

## 구현 명세

### Mixin

EChartsMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.bar-chart__canvas` | ECharts 인스턴스가 마운트될 요소 |

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
        [120, 168, 142, 210, 196, 184],
        [96, 132, 124, 188, 174, 160]
    ]
}
```

### 옵션 계약

- `values[0]` → `Inbound` 시리즈 데이터
- `values[1]` → `Outbound` 시리즈 데이터
- `categories` → xAxis 레이블

### 페이지 연결 사례

```text
[페이지] ──chartData 토픽──▶ [Charts/BarChart] ──▶ 운영 지표 비교 시각화
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 딥 네이비 패널, 청색 강조, 운영 대시보드용 |
| 02_material | B: Material Elevated | 라이트 서피스, 명확한 elevation, MD 계열 인포 패널 |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 타이포 중심, 리포트 지면형 |
| 04_operational | D: Dark Operational | 다크 HUD, 시안/레드 대비, 고밀도 관제형 |
