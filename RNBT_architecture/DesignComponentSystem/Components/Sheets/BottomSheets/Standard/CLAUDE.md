# BottomSheets — Standard

## 기능 정의

1. **시트 헤더 렌더링** — `bottomSheetInfo` 토픽으로 수신한 단일 객체(headline/supporting)를 시트 상단 헤더 영역에 렌더
2. **시트 액션 버튼 렌더링** — `bottomSheetActions` 토픽으로 수신한 배열 데이터를 template 반복으로 시트 하단 액션 영역에 렌더
3. **시트 표시/숨김** — ShadowPopupMixin으로 Shadow DOM 기반 모달 Bottom Sheet 관리 (scrim + 시트 패널)
4. **액션 버튼 클릭 이벤트** — 액션 버튼 클릭 시 `@bottomSheetActionClicked` 발행
5. **시트 닫기 이벤트** — drag handle 또는 scrim 클릭 시 `@bottomSheetClose` 발행

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin + ListRenderMixin

- ShadowPopupMixin — Shadow DOM 기반 Bottom Sheet 오버레이 관리
- FieldRenderMixin — 시트 헤더 콘텐츠 (headline, supporting) — `_popupScope`에 적용
- ListRenderMixin — 시트 액션 버튼 배열 반복 — `_popupScope`에 적용

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 시트 관리

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#bottom-sheet-popup-template` | 시트 HTML/CSS가 담긴 template (규약) |
| closeBtn | `.bottom-sheet__drag-handle` | 드래그 핸들 — Shadow DOM 내부 닫기 트리거 |
| scrim | `.bottom-sheet__scrim` | 배경 오버레이 — Shadow DOM 내부 닫기 트리거 |

#### FieldRenderMixin (`this._popupScope.fieldRender`) — 시트 헤더

| KEY | VALUE | 용도 |
|-----|-------|------|
| headline | `.bottom-sheet__headline` | 시트 제목 |
| supporting | `.bottom-sheet__supporting` | 시트 보조 설명 |

#### ListRenderMixin (`this._popupScope.listRender`) — 시트 액션

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.bottom-sheet__actions` | 항목이 추가될 부모 (규약) |
| template | `#bottom-sheet-action-template` | cloneNode 대상 (규약) |
| actionid | `.bottom-sheet__action` | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.bottom-sheet__action-label` | 액션 라벨 |
| actionIcon | `.bottom-sheet__action-icon` | 액션 아이콘 (선택적) |

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| bottomSheetInfo | `this._renderBottomSheetInfo` (래퍼) |
| bottomSheetActions | `this._renderBottomSheetActions` (래퍼) |

> Mixin은 `_popupScope` 아래에서 `onCreated` 콜백(Shadow DOM 최초 생성) 시점에 생성되므로, 구독 핸들러는 래퍼 메서드로 감싸 `show()` 이후에도 안전하게 동작하도록 한다.

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 | 위치 |
|--------|--------|------|------|
| click | `closeBtn` (shadowPopup.cssSelectors) | `@bottomSheetClose` | bindPopupEvents (Shadow DOM) |
| click | `scrim` (shadowPopup.cssSelectors) | `@bottomSheetClose` | bindPopupEvents (Shadow DOM) |
| click | `.bottom-sheet__action` | `@bottomSheetActionClicked` | bindPopupEvents (Shadow DOM) |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `this._renderBottomSheetInfo({ response })` | `_popupScope.fieldRender` 존재 시 헤더 데이터 렌더 |
| `this._renderBottomSheetActions({ response })` | `_popupScope.listRender` 존재 시 액션 배열 렌더 |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('bottomSheetInfo', this)──> [BottomSheets] 헤더 렌더링
         publish data: { headline, supporting }

[페이지] ──fetchAndPublish('bottomSheetActions', this)──> [BottomSheets] 액션 렌더링
         publish data: [{ actionid, actionLabel, actionIcon }, ...]

[페이지] ──targetInstance.shadowPopup.show()──> 시트 표시
[페이지] ──targetInstance.shadowPopup.hide()──> 시트 숨김

[BottomSheets] ──@bottomSheetClose──> [페이지] ──> shadowPopup.hide()
[BottomSheets] ──@bottomSheetActionClicked──> [페이지] ──> actionid에 따라 분기 처리
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 시트 + 라벤더 드래그 핸들 |
| 02_material | B: Material Elevated | 라이트 블루, Roboto, shadow elevation + 상단 라운드 코너 |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 제목, 샤프한 직각 모서리 + 헤어라인 구분 |
| 04_operational | D: Dark Operational | 다크 시안 컴팩트, JetBrains Mono, 얇은 테두리 + 밀집 레이아웃 |

### MD3 근거

- Bottom sheets show secondary content anchored to the bottom of the screen
- Anatomy: scrim (배경 오버레이) · drag handle · content (headline/supporting) · actions
- Standard 변형은 **Modal bottom sheet** 형태로 구현한다: scrim으로 배경 상호작용을 막고, drag handle 또는 scrim 클릭으로 닫기
- 출처: Material Design 3 — Bottom sheets overview / guidelines (WebFetch 확인, 2026-04-19)
