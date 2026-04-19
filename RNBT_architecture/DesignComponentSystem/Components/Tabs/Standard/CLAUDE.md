# Tabs — Standard

## 기능 정의

1. **탭 항목 렌더링** — `tabItems` 토픽으로 수신한 배열(2~6개)을 template 반복으로 렌더링하고, 개별 탭의 활성 상태(`active`)를 관리한다
2. **탭 클릭 이벤트** — 탭 클릭 시 `@tabClicked` 발행. 페이지가 수신하여 `updateItemState`로 활성 탭을 전환하고 대응하는 콘텐츠 뷰로 전환한다
3. **뱃지 표시** — 탭에 `badge` 값이 있으면 라벨 옆에 뱃지로 알림 수/상태를 표시한다 (빈 문자열이면 `:empty`로 숨김)

> MD3 정의: "Tabs organize content across different screens and views." Primary tabs는 앱 바 아래 콘텐츠 영역 상단에 위치하여 주요 콘텐츠 목적지 간 전환을 제공한다. 탭 anatomy는 Container / Label / Icon(optional) / Badge(optional) / Active indicator / Divider로 구성된다. Standard는 **Primary Tabs** — 상단 배치 + 하단 active indicator + 하단 divider 관례를 따른다.
>
> 근거: [MD3 Tabs spec](https://m3.material.io/components/tabs/specs) (WebFetch 본문 미추출 → WebSearch 결과 근거)

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey` 옵션으로 개별 탭 상태 변경 활성화)

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.tabs__list` | 탭이 추가될 부모 (규약) |
| template | `#tabs-item-template` | cloneNode 대상 (규약) |
| tabid | `.tabs__item` | 탭 식별 + 이벤트 매핑 |
| active | `.tabs__item` | 활성 상태 (data-active) |
| icon | `.tabs__icon` | 아이콘 표시 (Material Symbols 등) |
| label | `.tabs__label` | 라벨 텍스트 |
| badge | `.tabs__badge` | 뱃지 텍스트 (빈 값이면 `:empty`로 숨김) |

> **Active Indicator 처리:** `.tabs__indicator`는 template에 고정 존재하며 `.tabs__item[data-active="true"]` 상태에서 CSS로만 표시된다 (bottom border/stripe). 데이터 바인딩 대상이 아니므로 cssSelectors KEY로 등록하지 않는다. 페르소나별로 indicator의 시각 표현이 다르다.

### itemKey

`tabid`

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| tabid | tabid |
| active | active |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| tabItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `tabid` (computed property) | `@tabClicked` |

### 커스텀 메서드

없음 — 페이지가 `targetInstance.listRender.updateItemState(id, { active })`를 직접 호출한다.

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('tabItems', this)──> [Tabs] 렌더링 ([{ tabid, label, icon, badge, active }, ...])

[Tabs] ──@tabClicked──> [페이지] ──> 콘텐츠 뷰 전환
                                      + updateItemState(prevId, { active: 'false' })
                                      + updateItemState(currId, { active: 'true' })
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard. 활성 탭은 하단 4px pill indicator |
| 02_material | B: Material Elevated | 블루 팔레트, elevation shadow, 라이트, Roboto. MD3 표준 3px bottom indicator + divider |
| 03_editorial | C: Minimal Editorial | 웜 그레이, DM Serif Display 라벨, 라이트, 하단 2px 얇은 indicator + 넓은 여백 |
| 04_operational | D: Dark Operational | 시안 팔레트, IBM Plex Mono, 다크, 각진 2px indicator + 컴팩트 |
