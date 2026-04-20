# Dialogs — Standard

## 기능 정의

1. **다이얼로그 콘텐츠 렌더링** — `dialogInfo` 토픽으로 수신한 단일 객체 데이터(아이콘/헤드라인/본문)를 팝업 내부에 렌더
2. **액션 버튼 렌더링** — `dialogActions` 토픽으로 수신한 배열 데이터를 template 반복으로 팝업 하단 액션 영역에 렌더
3. **다이얼로그 표시/숨김** — ShadowPopupMixin으로 Shadow DOM 기반 오버레이 관리
4. **액션 버튼 클릭 이벤트** — 액션 버튼 클릭 시 `@dialogActionClicked` 발행
5. **오버레이 닫기 이벤트** — 닫기 버튼 클릭 시 `@dialogClose` 발행

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin + ListRenderMixin

- ShadowPopupMixin — Shadow DOM 기반 팝업 오버레이 관리
- FieldRenderMixin — 팝업 내부 콘텐츠 (headline, supporting, icon) — `_popupScope`에 적용
- ListRenderMixin — 팝업 내부 액션 버튼 배열 반복 — `_popupScope`에 적용

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 팝업 관리

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#dialog-popup-template` | 팝업 HTML/CSS가 담긴 template (규약) |
| closeBtn | `.dialog__close-btn` | 닫기 버튼 — Shadow DOM 내부 이벤트 |

#### FieldRenderMixin (`this._popupScope.fieldRender`) — 팝업 내부 콘텐츠

| KEY | VALUE | 용도 |
|-----|-------|------|
| icon | `.dialog__icon` | 헤드라인 아이콘 |
| headline | `.dialog__headline` | 다이얼로그 제목 |
| supporting | `.dialog__supporting` | 본문 텍스트 |

#### ListRenderMixin (`this._popupScope.listRender`) — 팝업 내부 액션

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.dialog__actions` | 항목이 추가될 부모 (규약) |
| template | `#dialog-action-template` | cloneNode 대상 (규약) |
| actionid | `.dialog__action` | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.dialog__action-label` | 액션 라벨 |

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| dialogInfo | `this._popupScope.fieldRender.renderData` |
| dialogActions | `this._popupScope.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 | 위치 |
|--------|--------|------|------|
| click | `closeBtn` (shadowPopup.cssSelectors) | `@dialogClose` | bindPopupEvents (Shadow DOM) |
| click | `actionid` (listRender.cssSelectors) | `@dialogActionClicked` | bindPopupEvents (Shadow DOM) |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('dialogInfo', this)──> [Dialog] 팝업 콘텐츠 렌더링
         publish data: { icon, headline, supporting }

[페이지] ──fetchAndPublish('dialogActions', this)──> [Dialog] 액션 버튼 렌더링
         publish data: [{ actionid, actionLabel }, ...]

[페이지] ──targetInstance.shadowPopup.show()──> 팝업 표시
[페이지] ──targetInstance.shadowPopup.hide()──> 팝업 숨김

[Dialog] ──@dialogClose──> [페이지] ──> shadowPopup.hide()
[Dialog] ──@dialogActionClicked──> [페이지] ──> actionid에 따라 분기 처리
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 오버레이 + 테두리 강조 |
| 02_material | B: Material Elevated | 라이트 배경, Roboto, shadow elevation 다이얼로그 |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 제목, 미니멀 여백 + 헤어라인 구분 |
| 04_operational | D: Dark Operational | 다크 시안 컴팩트, JetBrains Mono, 얇은 테두리 + 밀집 레이아웃 |
