# AppBars — Advanced / searchEmbedded

## 기능 정의

1. **임베디드 검색 입력** — AppBar의 제목 영역을 검색 input으로 대체. 페이지가 publish한 placeholder/결과 개수를 표시한다.
2. **실시간 입력 릴레이** — input 값이 바뀔 때마다 `@searchInputChanged`를 발행한다. 디바운스/검색 호출은 페이지의 onEventBusHandlers가 담당한다.
3. **검색 초기화** — clear 아이콘 클릭 시 `@searchCleared`를 발행한다. 페이지가 input.value 초기화와 검색 상태 리셋을 처리한다.
4. **네비게이션 트리거** — nav-icon 클릭 시 `@navigationClicked`를 발행한다.

> Standard와의 분리 정당성: 새 토픽(`searchInfo`) 구독, 새 이벤트 타입(`input`), 새 이벤트 3개 → register.js가 명백히 다름.

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| bar | `.top-app-bar` | 루트 요소 |
| placeholder | `.top-app-bar__search-input` | 검색 input — placeholder 텍스트 렌더 + input 이벤트 위임 |
| count | `.top-app-bar__count` | 결과 개수 표시 |
| navIcon | `.top-app-bar__nav-icon` | 네비게이션 아이콘 |
| clearIcon | `.top-app-bar__clear` | 검색 초기화 아이콘 |

### elementAttrs

| KEY | 속성 |
|-----|------|
| placeholder | `placeholder` |

> `placeholder` 데이터 키 → input 요소의 `placeholder` 속성으로 매핑.
> `count`는 elementAttrs에 없으므로 textContent로 렌더된다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| searchInfo | `this.fieldRender.renderData` |

페이로드 예시:
```json
{ "response": { "placeholder": "Search devices…", "count": "12 results" } }
```

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| input | `placeholder` | `@searchInputChanged` |
| click | `navIcon` | `@navigationClicked` |
| click | `clearIcon` | `@searchCleared` |

### 페이지 연결 사례

```
[AppBars/Advanced/searchEmbedded] ──@searchInputChanged──▶ [페이지]
                                       │
                                       ├─ debounce(200ms)
                                       ├─ search API 호출
                                       └─ publish('searchInfo', { count: 'N results' })

[AppBars/Advanced/searchEmbedded] ──@searchCleared──────▶ [페이지]
                                       │
                                       ├─ input.value = ''
                                       └─ publish('searchInfo', { count: '' })

[AppBars/Advanced/searchEmbedded] ──@navigationClicked──▶ [페이지]
                                       └─ NavigationDrawer.open() 등
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard |
