# Search — Standard

## 기능 정의

1. **검색 정보 렌더링** — `placeholder`, `value`, `supportingText`를 검색바 DOM에 반영
2. **입력 변경 릴레이** — input 값이 바뀔 때마다 `@searchInputChanged`를 발행
3. **명시적 검색 실행** — Enter 또는 submit 버튼 클릭 시 `@searchSubmitted`를 발행
4. **검색 초기화** — clear 버튼 클릭 시 내부 값을 비우고 `@searchCleared`를 발행
5. **컨트롤 상태 동기화** — 현재 입력값에 따라 clear 버튼 표시/비활성 상태와 접근성 속성을 동기화

---

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.search-bar` | 루트 요소 |
| form | `.search-bar__form` | submit 이벤트 타깃 |
| input | `.search-bar__input` | 검색 입력 |
| leadingIcon | `.search-bar__leading` | 리딩 아이콘 |
| clearButton | `.search-bar__clear` | 검색 초기화 버튼 |
| submitButton | `.search-bar__submit` | 검색 실행 버튼 |
| supportingText | `.search-bar__supporting` | 보조 텍스트 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| searchInfo | `this.renderSearchInfo` |

### 이벤트

| 이벤트 | 선택자/트리거 | 발행 |
|--------|---------------|------|
| input | `.search-bar__input` | `@searchInputChanged` |
| click | `.search-bar__clear` | `@searchCleared` |
| click | `.search-bar__submit` | `@searchSubmitted` |
| submit | `.search-bar__form` | `@searchSubmitted` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.getElement(key)` | selector key에 해당하는 DOM 요소를 반환 |
| `this.syncControls()` | clear button hidden/disabled, input/button aria 속성 동기화 |
| `this.clearQuery()` | input 값을 비우고 supportingText는 유지한 채 control 상태를 갱신 |
| `this.renderSearchInfo(data)` | `placeholder`, `value`, `supportingText`를 정규화 후 렌더링 |

### 데이터 계약

```javascript
{
  placeholder: "Search devices",
  value: "ups",
  supportingText: "12 results"
}
```

### 페이지 연결 사례

```text
[Search/Standard] ──@searchInputChanged──▶ [페이지]
                        └─ debounce 후 fetchAndPublish('searchInfo', page, { query })

[Search/Standard] ──@searchSubmitted────▶ [페이지]
                        └─ 즉시 검색 실행 / 현재 input 값으로 fetch

[Search/Standard] ──@searchCleared──────▶ [페이지]
                        └─ 결과 초기화 또는 빈 query로 재호출
```

### 표시 규칙

- `placeholder`, `value`, `supportingText`가 `null` 또는 `undefined`면 빈 문자열로 처리
- input은 항상 `type="search"` 유지
- form은 항상 `role="search"` 유지
- clear button은 input 값이 비어 있으면 `hidden` + `disabled` 상태
- submit / clear 버튼은 항상 `aria-label`을 가진다

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크 글래스 + 전기 청색 포인트 |
| 02_material | B: Material Search | MD3 라이트 서피스 기반 검색바 |
| 03_editorial | C: Editorial Utility | 웜 뉴트럴 매거진형 검색바 |
| 04_operational | D: Operational Console | 다크 HMI 콘솔형 검색바 |
