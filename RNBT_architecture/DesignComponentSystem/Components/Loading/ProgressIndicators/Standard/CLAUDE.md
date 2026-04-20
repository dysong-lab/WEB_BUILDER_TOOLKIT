# ProgressIndicators — Standard

## 기능 정의

1. **확정(determinate) 진행 값 표시** — `progressInfo` 토픽으로 수신한 데이터를 진행 바, 라벨, 값 텍스트, 상태 속성에 렌더한다. 진행 비율(0~100)은 바의 가로 폭(`width: N%`)으로 반영한다.
2. **상태 기반 색상 변형** — 데이터의 `status` 값을 `data-status` 속성으로 반영하여 CSS가 `normal | warning | error | success` 색상을 결정한다.
3. **클릭 이벤트** — 진행 표시기 영역 클릭 시 `@progressClicked` 발행 (취소/재시도 등 부수 액션 연결용).

> 비확정(indeterminate) 진행 표시는 `Loading/LoadingIndicator`가 담당한다. 본 컴포넌트는 **값이 있는 선형(linear)** 진행 표시 전용이다. (MD3 공식 정의: Progress indicators inform users about the status of ongoing processes. Determinate/Indeterminate 두 가지 모드 중 Determinate 선형을 구현.)

---

## 구현 명세

### Mixin

FieldRenderMixin — 고정 DOM에 데이터를 1:N 매핑한다. `styleAttrs`로 `width` 반영, `datasetAttrs`로 `data-status` 반영.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| indicator | `.progress-indicator` | 컨테이너 — customEvents `click` 바인딩 대상 (데이터 매칭 없음) |
| track     | `.progress-indicator__track` | 배경 트랙 (시각적 바닥) |
| progress  | `.progress-indicator__bar` | 전경 채움 바 — styleAttrs `progress` → `width: N%` (KEY가 데이터 필드명과 styleAttrs 키와 일치해야 FieldRenderMixin이 렌더) |
| label     | `.progress-indicator__label` | 진행 항목 라벨 텍스트 |
| valueText | `.progress-indicator__value` | 값 텍스트 (예: "45%", "450 / 1000 MB") |
| status    | `.progress-indicator` | datasetAttrs `status` 대상 요소 (indicator와 동일 요소) |

> `indicator`와 `status`는 동일 요소(`.progress-indicator`)를 가리키지만, **용도가 다르므로 KEY를 분리**한다. `indicator`는 customEvents 바인딩 전용이고(데이터에 해당 KEY가 없으므로 Mixin은 건너뜀), `status`는 datasetAttrs가 소비한다.

### datasetAttrs

| KEY | VALUE | 결과 |
|-----|-------|------|
| status | `status` | `.progress-indicator`에 `data-status="{value}"` |

### styleAttrs

| KEY | property | unit | 결과 |
|-----|----------|------|------|
| progress | `width` | `%` | `.progress-indicator__bar`의 `style.width`에 `{value}%` |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| progressInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `indicator` (cssSelectors) | `@progressClicked` |

### 커스텀 메서드

없음

### 데이터 형식 (progressInfo 토픽 응답)

```json
{
    "progress": 45,
    "label": "Uploading files",
    "valueText": "45%",
    "status": "normal"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| progress | number (0~100) | 진행 비율 (퍼센트) |
| label | string | 진행 항목 라벨 |
| valueText | string | 사람이 읽는 값 표기 (퍼센트/절대값 자유) |
| status | `"normal" \| "warning" \| "error" \| "success"` | 바 색상 상태 |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('progressInfo', this)──> [ProgressIndicators] 렌더링
  ({ progress: 45, label: 'Uploading files', valueText: '45%', status: 'normal' })

[ProgressIndicators] ──@progressClicked──> [페이지] ──> 취소/재시도 등 부수 액션
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크, 그라디언트 채움(Primary→Hover), 트랙은 Primary 색조 저채도 |
| 02_material | B: Material Elevated | 라이트, 단색 채움, elevation track, 둥근 모서리 |
| 03_editorial | C: Minimal Editorial | 라이트, 세리프 라벨, 샤프 모서리, 얇은 바, 여백 넉넉 |
| 04_operational | D: Dark Operational | 다크, 컴팩트, 모노스페이스 값, 쿨톤 시안 채움, 각진 모서리 |

### 결정사항

- **determinate 전용**: indeterminate는 LoadingIndicator가 커버한다. 본 컴포넌트는 `progress` 수치가 반드시 주어지는 사용 사례를 처리한다.
- **styleAttrs로 width 제어**: `progress` 값이 곧 `.progress-indicator__bar`의 `width: N%`가 되도록 FieldRenderMixin의 `styleAttrs`를 사용한다. 별도 렌더 로직 없이 데이터 → 스타일이 성립한다.
- **status 색상**: 이벤트/상태 색상은 MD3 확장 규칙이 아닌 Persona 프로파일의 이벤트 색상을 따른다 (`--normal`, `--warning`, `--major/error`, `--success=normal`).
- **Circular 미포함**: MD3 ProgressIndicators는 Linear+Circular 둘 다 포함하지만, 본 Standard 사이클에서는 Linear determinate만 구현한다. Circular는 Advanced 후보로 남긴다.
