# SplitButtons — Standard

## 기능 정의

1. **리딩 액션 버튼 렌더링** — `splitButtonAction` 토픽으로 수신한 데이터(아이콘/라벨)를 주 액션 버튼에 표시한다
2. **메뉴 항목 렌더링** — `splitButtonMenuItems` 토픽으로 수신한 배열 데이터를 template 반복으로 드롭다운 메뉴에 렌더링하고, 개별 항목의 선택 상태를 관리한다
3. **리딩 액션 클릭 이벤트** — 주 액션 버튼 클릭 시 `@splitActionClicked` 발행
4. **메뉴 토글 이벤트** — 트레일링 화살표 버튼 클릭 시 `@splitMenuToggled` 발행 (페이지에서 `data-open` 속성을 토글)
5. **메뉴 항목 클릭 이벤트** — 메뉴 항목 클릭 시 `@splitMenuItemClicked` 발행

---

## 구현 명세

### Mixin

FieldRenderMixin + ListRenderMixin

- FieldRenderMixin — 리딩 액션 버튼 (단일 객체: icon, label)
- ListRenderMixin — 드롭다운 메뉴 항목 (배열 반복)

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 리딩 액션 버튼

| KEY | VALUE | 용도 |
|-----|-------|------|
| action     | `.split-button__action`       | 리딩 액션 버튼 — 이벤트 매핑 |
| actionIcon | `.split-button__action-icon`  | 리딩 아이콘 |
| label      | `.split-button__action-label` | 리딩 라벨 |

> 데이터 KEY `icon`이 cssSelectors KEY와 달라 직접 매핑되지 않으므로, 페이지는 `actionIcon`/`label` KEY에 맞춘 형태로 publish 한다. (아래 "페이지 연결 사례" 참조)

#### ListRenderMixin (`this.listRender`) — 메뉴 항목

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.split-button__menu`             | 항목이 추가될 부모 (규약) |
| template  | `#split-button-menu-item-template`| cloneNode 대상 (규약) |
| menuid    | `.split-button__menu-item`        | 항목 식별 + 이벤트 매핑 |
| selected  | `.split-button__menu-item`        | 선택 상태 (data-selected) |
| menuLabel | `.split-button__menu-label`       | 메뉴 항목 라벨 |
| menuIcon  | `.split-button__menu-icon`        | 메뉴 항목 아이콘 (선택적) |

> **체크마크 처리**: `.split-button__menu-check`는 template에 고정 존재하며 `data-selected="true"` 시 CSS로만 표시된다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

#### 사용자 정의 (cssSelectors 외부)

| KEY | VALUE | 용도 |
|-----|-------|------|
| trigger | `.split-button__trigger` | 메뉴 토글 트레일링 버튼 — 이벤트 매핑 전용 |

> `trigger` 선택자는 customEvents에서 직접 문자열로 바인딩한다 (Mixin 대상이 아니므로 하드코딩이 아닌 컴포넌트 소유 고정 계약).

### itemKey

menuid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | menuid   | menuid |
| ListRenderMixin | selected | selected |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| splitButtonAction    | `this.fieldRender.renderData` |
| splitButtonMenuItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `action` (fieldRender.cssSelectors)   | `@splitActionClicked` |
| click | `.split-button__trigger`              | `@splitMenuToggled` |
| click | `menuid` (listRender.cssSelectors)    | `@splitMenuItemClicked` |

### 커스텀 메서드

없음 (메뉴 열림/닫힘 상태는 페이지가 `.split-button` 루트의 `data-open` 속성으로 관리)

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('splitButtonAction', this)──> [SplitButtons] 리딩 렌더링
         publish data: { actionIcon: 'send', label: 'Send' }

[페이지] ──fetchAndPublish('splitButtonMenuItems', this)──> [SplitButtons] 메뉴 렌더링
         publish data: [{ menuid, menuIcon, menuLabel, selected }, ...]

[SplitButtons] ──@splitActionClicked──> [페이지] ──> 주 액션 실행

[SplitButtons] ──@splitMenuToggled──> [페이지] ──> 루트 요소의 data-open 토글
                                                   element.dataset.open = element.dataset.open === 'true' ? 'false' : 'true'

[SplitButtons] ──@splitMenuItemClicked──> [페이지] ──> single-select: 이전 해제 + 클릭된 항목 선택
                                                    + listRender.updateItemState(id, { selected: 'true' })
                                                    + data-open='false' (메뉴 닫기)
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 selected |
| 02_material    | B: Material Elevated | Filled 라이트 블루, Roboto, shadow elevation |
| 03_editorial   | C: Minimal Editorial | 웜 그레이 미니멀, Georgia 세리프, outlined |
| 04_operational | D: Dark Operational  | 다크 시안, JetBrains Mono, 컴팩트 |
