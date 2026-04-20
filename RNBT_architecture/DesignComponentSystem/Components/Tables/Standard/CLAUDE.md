# Tables — Standard

## 기능 정의

1. **테이블 정보 렌더링** — 구조화된 행 데이터를 표 형태로 렌더링
2. **열 정의 적용** — 고정 컬럼 정의를 기준으로 셀 값을 매핑
3. **상태 요약 반영** — 제목, 보조 설명, 행 수를 헤더에 동기화
4. **행 선택 이벤트 발행** — 사용자가 행을 클릭하면 `@tableRowClicked` 이벤트를 발행
5. **테이블 라이프사이클 관리** — Tabulator 인스턴스 생성, 데이터 갱신, 정리를 일관되게 처리

## 구현 명세

### Mixin

TabulatorMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.data-table` | 루트 상태 반영 |
| title | `.data-table__title` | 제목 텍스트 |
| supportingText | `.data-table__supporting` | 보조 설명 텍스트 |
| rowCount | `.data-table__count` | 행 수 표시 |
| container | `.data-table__container` | Tabulator 렌더링 컨테이너 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| tableInfo | `this.renderTableInfo` |

### 이벤트 (customEvents)

없음. 행 클릭 이벤트는 `tableBuilt` 이후 Tabulator 인스턴스 이벤트로 직접 연결한다.

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.normalizeTableInfo(payload)` | 제목/보조설명/행 데이터를 정규화 |
| `this.renderTableInfo(payload)` | 테이블 헤더와 Tabulator 데이터를 함께 갱신 |
| `this.bindRowClick()` | Tabulator rowClick 이벤트를 `@tableRowClicked`로 연결 |

### 데이터 계약

```javascript
{
  title: "Device records",
  supportingText: "Live fleet snapshot",
  rows: [
    { id: "UPS-01", name: "Rack UPS", type: "Power", status: "Normal", value: "72%", updated: "09:41:22" },
    { id: "CRAC-02", name: "Cooling Unit", type: "HVAC", status: "Warning", value: "28C", updated: "09:41:10" }
  ]
}
```

### 표시 규칙

- `rows`가 배열이 아니면 빈 배열로 처리
- `title`, `supportingText`는 `null` 또는 `undefined`면 빈 문자열로 처리
- `rowCount`는 항상 현재 행 수를 `"N rows"` 형식으로 표시
- 테이블 컬럼은 `id`, `name`, `type`, `status`, `value`, `updated` 순서를 유지

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 청색 글래스 톤의 데이터 그리드 |
| 02_material | B: Material Balance | 밝은 서피스 기반 운영 테이블 |
| 03_editorial | C: Editorial Utility | 텍스트 대비 중심의 매거진형 테이블 |
| 04_operational | D: Operational Console | 어두운 HMI 콘솔형 모니터링 테이블 |
