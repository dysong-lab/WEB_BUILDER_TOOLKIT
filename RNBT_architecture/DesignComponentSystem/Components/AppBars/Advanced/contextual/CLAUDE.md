# AppBars — Advanced / contextual

## 기능 정의

1. **선택 카운트 표시** — `selectionInfo` 토픽으로 수신한 count 값을 제목 영역에 렌더 (예: "3 selected").
2. **동적 액션 리스트** — `selectionInfo.actions[]` 배열을 우측 액션 영역에 리스트로 렌더. 페이지가 선택 맥락에 따라 delete/archive/share 등을 구성한다.
3. **액션 클릭 릴레이** — 액션 아이템 클릭 시 `@selectionActionClicked`를 발행한다. payload에 액션 식별자(id)를 담아 페이지가 어떤 액션이 눌렸는지 구분한다.
4. **선택 해제 트리거** — close 아이콘 클릭 시 `@selectionCleared`를 발행한다. 페이지가 선택 상태 리셋과 원래 AppBar 복귀를 처리한다.

> **Standard와의 분리 정당성**: Mixin 조합(+ ListRenderMixin), 토픽(`selectionInfo`), 이벤트(`@selectionActionClicked`/`@selectionCleared`) 3축 모두 Standard와 상이 → register.js가 명백히 다름. Standard 내부 variant로 흡수 불가.
>
> **MD3 근거**: Contextual action bar — 목록/갤러리에서 항목 선택 시 AppBar가 선택 모드로 전환되는 표준 패턴.

---

## 구현 명세

### Mixin

FieldRenderMixin + ListRenderMixin

- FieldRenderMixin: count 텍스트 렌더
- ListRenderMixin: actions[] 배열을 template 기반 반복 렌더

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| bar | `.top-app-bar` | 루트 요소 |
| count | `.top-app-bar__count` | 선택 카운트 텍스트 |
| closeIcon | `.top-app-bar__close` | 선택 해제 아이콘 |
| actionList | `.top-app-bar__action-list` | 액션 리스트 컨테이너 (ListRender root) |
| actionTemplate | `#top-app-bar-action-template` | 액션 아이템 template |
| actionItem | `.top-app-bar__action-item` | 렌더된 액션 아이템 — click 위임 |
| actionLabel | `.top-app-bar__action-item` | 액션 버튼의 `aria-label` 속성 |

### elementAttrs

| KEY | 속성 |
|-----|------|
| actionLabel | `aria-label` |

> count는 textContent로 렌더된다.
> actionList 내부 아이템은 ListRenderMixin이 `id`, `icon`, `label` 필드를 template에 바인딩하고, `actionLabel`은 버튼의 `aria-label` 속성으로 동기화한다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| selectionInfo | `this.renderSelection` — 페이로드를 두 Mixin으로 분배하는 커스텀 dispatcher |

`renderSelection`은 `selectionInfo` 페이로드를 받아 `count`는 `fieldRender.renderData`로, `actions[]`은 `listRender.renderData`로 각각 전달한다. 두 Mixin이 서로 다른 데이터 셰이프(객체 vs 배열)를 기대하기 때문이다.

페이로드 예시:
```json
{
  "response": {
    "count": "3 selected",
    "actions": [
      { "id": "delete",  "icon": "delete",  "label": "Delete" },
      { "id": "archive", "icon": "archive", "label": "Archive" },
      { "id": "share",   "icon": "share",   "label": "Share" }
    ]
  }
}
```

- `count` → FieldRenderMixin이 `.top-app-bar__count` textContent에 바인딩
- `actions[]` → ListRenderMixin이 actionTemplate을 반복 렌더 (`icon` textContent는 material symbol 리거처명 또는 이모지 — 디자인 변형에 따름)
- `actionLabel` → `label` 값에서 파생되어 액션 버튼의 `aria-label`로 바인딩
- `id` → `datasetAttrs: { id: 'id' }`로 `data-id` 속성에 바인딩 (클릭 payload에서 참조)

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `actionItem` | `@selectionActionClicked` | `{ id: string }` — 클릭된 아이템의 data-id |
| click | `closeIcon` | `@selectionCleared` | — |

### 페이지 연결 사례

> **주의**: 선택 상태는 순수 클라이언트 상태이므로 `GlobalDataPublisher.fetchAndPublish`(=서버 fetch 경유) 대상이 아니다. 페이지가 보유한 AppBar 인스턴스 참조를 통해 `renderSelection`을 직접 호출한다. `subscriptions`에 `selectionInfo` 토픽을 남겨 둔 것은, 향후 선택 맥락이 서버-backed로 확장될 때(예: 서버의 "권한별 가능 액션" 조회) `fetchAndPublish` 경로로 자연스럽게 전환할 수 있도록 하기 위함이다.

```
[목록 페이지 항목 선택 3개]
        │
        └─ appBarInstance.renderSelection({
             response: {
               count: '3 selected',
               actions: [{id:'delete',...}, {id:'archive',...}, {id:'share',...}]
             }
           })

[AppBars/Advanced/contextual]
   │
   ├──@selectionActionClicked──▶ [페이지]
   │   (event.target.closest('.top-app-bar__action-item').dataset.id 로 액션 id 추출)
   │      ├─ 선택된 항목 삭제 API 호출
   │      └─ 선택 상태 리셋
   │
   └──@selectionCleared─────────▶ [페이지]
         ├─ 선택 상태 리셋
         └─ 원래 AppBar로 복귀 (Standard AppBar 인스턴스로 교체 또는
            이 인스턴스의 renderSelection({ response: { count: '', actions: [] }}))
```

---

## 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard |
| 02_material | B: Material Elevated | 블루 팔레트, 라이트 서피스, Roboto, MD3 contextual actions |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 헤드라인, 라이트, understated actions |
| 04_operational | D: Dark Operational | 시안 팔레트, 모노스페이스, 다크, control-room selection bar |
