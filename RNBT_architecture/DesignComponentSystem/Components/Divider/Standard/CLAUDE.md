# Divider — Standard

## 기능 정의

1. **구분선 표시** — 컨테이너 내부에서 콘텐츠 영역을 나누는 얇은 선을 표시
2. **방향 전환** — 전달된 값에 따라 가로 또는 세로 구분선으로 전환
3. **여백 유형 동기화** — 전달된 inset 값을 기준으로 시작/양쪽/전체 폭 정렬을 적용

---

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY  | VALUE         | 용도                            |
| ---- | ------------- | ------------------------------- |
| root | `.md-divider` | 구분선 루트, 방향/여백 상태 반영 |

### 구독 (subscriptions)

없음

### 이벤트 (customEvents)

없음

### 페이지 연결 사례

```text
[Divider/Standard] ── renderDividerInfo(data) ──▶ [페이지]
                                           └─ 섹션 경계 표시
                                           └─ 패널 내부 그룹 분리
                                           └─ 툴바/리스트 항목 시각 분절
```

### 자체 메서드

| 메서드                        | 설명                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| `this.renderDividerInfo(data)` | `orientation`, `inset`, `thickness`, `emphasis` 값을 루트 상태에 반영 |

### 데이터 계약

```javascript
{
  orientation: "horizontal", // "horizontal" | "vertical"
  inset: "full",             // "full" | "start" | "both"
  thickness: 1,               // px 단위 숫자
  emphasis: "subtle"         // "subtle" | "strong"
}
```

### 표시 규칙

- `orientation`이 없으면 `horizontal`로 처리
- `inset`이 없으면 `full`로 처리
- `thickness`가 1보다 작거나 숫자가 아니면 `1`로 보정
- `emphasis`가 없으면 `subtle`로 처리

### 디자인 변형

| 파일           | 페르소나             | 설명                                |
| -------------- | -------------------- | ----------------------------------- |
| 01_refined     | A: Refined Technical | 정교한 블루 그레이 패널용 라인      |
| 02_material    | B: Material Elevated | MD3 라이트 서피스용 중립 디바이더   |
| 03_editorial   | C: Minimal Editorial | 따뜻한 종이 질감 위 미니멀 분절선   |
| 04_operational | D: Dark Operational  | 다크 HUD용 시안 포인트 분절선       |
