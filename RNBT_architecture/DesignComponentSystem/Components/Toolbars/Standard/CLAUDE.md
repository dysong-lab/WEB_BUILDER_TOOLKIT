# Toolbars — Standard

## 기능 정의

1. **액션 항목 렌더링** — `toolbarActions` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 독립적인 커맨드(icon + optional label)이며, 선택/활성 상태 개념이 없다. 필요 시 개별 항목의 `disabled` 상태를 변경한다.
2. **액션 클릭 이벤트** — 액션 버튼 클릭 시 `@toolbarActionClicked` 발행. 페이지가 `actionid`를 식별하여 해당 커맨드를 실행한다 (라우팅, 모달, API 호출 등).

> MD3 정의 (Material Design 3 — Toolbars):
> "Toolbars display frequently used actions relevant to the current page."
> - **Docked Toolbar**: 창 너비를 채우는 하단 고정 바. 페이지 간에 공유되는 전역 액션에 적합.
> - **Floating Toolbar**: body 콘텐츠 위에 떠 있는 pill/연결 형태. 페이지별 컨텍스트 액션에 적합. 수평/수직 오리엔테이션 지원.
>
> Toolbar는 NavigationBar와 달리 "목적지 전환"이 아닌 "액션 실행"을 수행한다. 따라서 `active`/`selected` 상태 대신 **독립적 커맨드**로 동작한다.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey` 옵션으로 개별 항목 `disabled` 상태 제어 활성화)

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.toolbar__list` | 항목이 추가될 부모 (규약) |
| template | `#toolbar-action-template` | cloneNode 대상 (규약) |
| actionid | `.toolbar__action` | 항목 식별 + 이벤트 매핑 |
| disabled | `.toolbar__action` | 비활성 상태 (data-disabled) |
| icon | `.toolbar__icon` | 아이콘 표시 (Material Symbols 등) |
| label | `.toolbar__label` | 라벨 텍스트 (선택적 — 빈 값이면 `:empty`로 숨김) |

### itemKey

`actionid`

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| actionid | actionid |
| disabled | disabled |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| toolbarActions | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `actionid` (computed property) | `@toolbarActionClicked` |

### 커스텀 메서드

없음 — 페이지가 `targetInstance.listRender.updateItemState(id, { disabled })`를 직접 호출하여 개별 액션을 활성/비활성 전환할 수 있다.

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('toolbarActions', this)──> [Toolbar] 렌더링 ([{ actionid, icon, label, disabled }, ...])

[Toolbar] ──@toolbarActionClicked──> [페이지] ──> 커맨드 실행 (라우팅 / 모달 / API / ...)
                                                (selected/active 전환 없음 — 각 액션 독립)
                                                + 필요 시 updateItemState(id, { disabled: 'true' })
```

### 디자인 변형

| 파일 | 페르소나 | MD3 Variant | 설명 |
|------|---------|-------------|------|
| 01_refined | A: Refined Technical | Docked | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard. 하단 풀 너비 바, icon+label 수직 스택 |
| 02_material | B: Material Elevated | Floating (horizontal) | 블루 팔레트, elevation shadow, 라이트, Roboto. pill 컨테이너 + FAB 스타일 primary 액션 |
| 03_editorial | C: Minimal Editorial | Docked (minimal) | 웜 그레이, 세리프, 라이트, icon-only 슬림 바, 상단 테두리 + 넓은 여백 |
| 04_operational | D: Dark Operational | Floating (vertical) | 시안 팔레트, IBM Plex Mono/JetBrains Mono, 다크. compact 세로 컬럼, 각진 2-4px radius |

> 4가지 변형 모두 **같은 register.js와 cssSelectors 계약**을 공유한다. HTML 구조와 CSS 페르소나만 달라진다.
