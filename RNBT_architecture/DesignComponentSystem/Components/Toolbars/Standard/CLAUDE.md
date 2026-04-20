# Toolbars — Standard

## 기능 정의

1. **헤더 정보 렌더링** — 제목과 보조 설명을 툴바 상단 정보 영역에 반영
2. **액션 목록 렌더링** — 현재 페이지와 관련된 주요 액션을 툴바 명령 행으로 표시
3. **활성 액션 이동** — 액션 클릭 시 활성 상태를 해당 항목으로 이동
4. **Overflow 상태 전환** — overflow 버튼 클릭으로 확장 상태를 토글
5. **액션 이벤트 발행** — 개별 툴바 액션 클릭 시 `@toolbarActionClicked` 이벤트를 발행
6. **Overflow 이벤트 발행** — overflow 버튼 클릭 시 `@toolbarOverflowToggled` 이벤트를 발행

## 구현 명세

### Mixin

FieldRenderMixin + ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.toolbar` | 루트 상태 반영 |
| title | `.toolbar__title` | 제목 텍스트 |
| supportingText | `.toolbar__supporting` | 보조 설명 |
| overflowButton | `.toolbar__overflow` | overflow 토글 버튼 |
| container | `.toolbar__actions` | 액션 컨테이너 |
| template | `#toolbar-action-template` | 액션 템플릿 |
| item | `.toolbar__action` | 액션 버튼 |
| id | `.toolbar__action` | 액션 식별 |
| active | `.toolbar__action` | 현재 활성 상태 |
| emphasis | `.toolbar__action` | 액션 강조 상태 |
| label | `.toolbar__action-label` | 액션 레이블 |
| icon | `.toolbar__action-icon` | 액션 아이콘 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| toolbarInfo | `this.renderToolbarInfo` |

### 이벤트 (customEvents)

없음. 클릭 이벤트는 상태 갱신과 함께 직접 이벤트 버스로 발행한다.

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.normalizeToolbarInfo(payload)` | 제목/설명/액션 배열을 정규화 |
| `this.renderToolbarInfo(payload)` | 헤더와 액션 목록을 렌더링 |
| `this.setActiveAction(id)` | 활성 액션을 변경 |
| `this.toggleOverflow()` | overflow 열림 상태를 토글 |
| `this.getActionElement(id)` | id에 해당하는 액션 버튼을 반환 |

### 데이터 계약

```javascript
{
  title: "Canvas Tools",
  supportingText: "Arrange, annotate, and export the current selection.",
  actions: [
    { id: "align", label: "Align", icon: "⇄", active: "true", emphasis: "false" },
    { id: "annotate", label: "Annotate", icon: "✎", active: "false", emphasis: "true" }
  ]
}
```

### 표시 규칙

- `actions`가 배열이 아니면 빈 배열로 처리
- `active`가 없는 경우 첫 번째 액션을 기본 활성 항목으로 사용
- `active === "true"`인 액션은 현재 작업 컨텍스트로 강조 표시
- `emphasis === "true"`인 액션은 보조 강조 스타일을 적용
- `supportingText`가 비어 있으면 숨김 처리
- overflow 상태는 `root[data-overflow-open]`에 반영

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 글래스 블루 계열의 관리 툴바 |
| 02_material | B: Material Balance | 밝은 서피스 기반 작업 툴바 |
| 03_editorial | C: Editorial Utility | 편집/주석 중심 타이포그래피 툴바 |
| 04_operational | D: Operational Console | 다크 콘솔형 작업 툴바 |
