# Switch — Standard

## 기능 정의

1. **스위치 항목 렌더링** — `switchItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 라벨 + 트랙(track) + 썸(thumb)으로 구성되며, 개별 항목의 on/off 상태(checked)와 비활성 상태(disabled)를 관리한다.
2. **스위치 클릭 이벤트** — 항목 클릭 시 `@switchClicked` 발행 (페이지가 다음 on/off 상태를 결정하여 토글)

---

## MD3 근거

Material Design 3 Switch는 **track + thumb**의 2-요소 구조(선택적 thumb icon 포함)이며, on/off 두 상태만 가진다(Checkbox의 indeterminate 상태는 없다). 항목 클릭/드래그로 토글하며, 목록 안에서 각 항목이 **독립적으로 on/off** 가능한 경우 Radio 대신 Switch를 사용한다. 출처: [Material Design 3 — Switch](https://m3.material.io/components/switch/overview), [Open UI — Switch Explainer](https://open-ui.org/components/switch.explainer/).

> MD3 공식 specs 페이지(m3.material.io/components/switch/specs)는 실측치(트랙 52×32, 썸 16/24/28 등)를 포함하지만 WebFetch로 본문 추출에 실패했다. 본 구현은 페르소나별 시각 토큰을 우선하므로 절대 수치는 페르소나 프로파일을 따르고, 구조(track + thumb + 2-state)만 MD3에 맞춘다.

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.switch__list` | 항목이 추가될 부모 (규약) |
| template  | `#switch-item-template` | cloneNode 대상 (규약) |
| switchid  | `.switch__item` | 항목 식별 + 이벤트 매핑 |
| checked   | `.switch__item` | on/off 상태 (data-checked: "true"/"false") |
| disabled  | `.switch__item` | 비활성화 상태 (data-disabled) |
| label     | `.switch__label` | 라벨 텍스트 |

> **track/thumb 처리**: `.switch__track`(배경 바)와 `.switch__thumb`(이동하는 원형 노브)은 template에 고정 존재하며 `data-checked` 값에 따라 CSS로만 위치/색상을 제어한다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

### itemKey

switchid

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| switchid | switchid |
| checked  | checked |
| disabled | disabled |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| switchItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `switchid` (computed property) | `@switchClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('switchItems', this)──> [Switch] 렌더링 ([{ switchid, label, checked, ... }, ...])

[Switch] ──@switchClicked──> [페이지] ──> toggle: checked <-> !checked
                                          + updateItemState(id, { checked: next })
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 남색 배경, Pretendard, 퍼플 그라디언트 트랙 |
| 02_material    | B: Material Elevated | 라이트 블루 accent, Roboto, outlined off + filled on (MD3 느낌) |
| 03_editorial   | C: Minimal Editorial | 웜 베이지 배경, Georgia 세리프, 샤프한 얇은 트랙 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, JetBrains Mono, 각진 트랙 + 미세 테두리 |

### 결정사항

- **bi-state** 표현: `data-checked="true" | "false"`. indeterminate 상태 없음(MD3 명세).
- **track + thumb 구조**: 트랙은 항상 표시되고, 썸은 `data-checked` 값에 따라 left(off) / right(on)로 CSS 위치 전환. SVG 불필요 — 2개의 div로 충분.
- **토글 결정은 페이지에 위임**: Mixin은 순수 렌더링만 수행. 페이지가 on↔off 상태 전환을 결정.
- **Checkbox와 핵심 차이**: tri-state(indeterminate) 없음, 시각 구조가 "박스+체크마크"가 아니라 "트랙+썸". 선택자 KEY는 동일 계열(id/checked/disabled/label)이나 `switchid` 네이밍으로 구분.
- **Radio와 핵심 차이**: 목록 내 복수 항목이 **독립적으로** on/off 가능 (Radio는 단일 선택, Switch는 각 항목별 독립 토글).
