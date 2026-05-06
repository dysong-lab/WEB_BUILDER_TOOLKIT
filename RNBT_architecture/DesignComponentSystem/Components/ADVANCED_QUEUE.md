# 2D 컴포넌트 Advanced 생산 대기열

## 세트 정의

| 세트 | 설명 |
|------|------|
| **Standard** | 필수. 범주별 기본 구현 |
| **Advanced** | 선택. 컴포넌트별 고유 확장 변형 |

> 3D Advanced와 달리 2D Advanced는 공통 변형 카탈로그가 없다.
> 각 변형은 컴포넌트별로 고유하게 기획되며, 이 큐에 사전 등록된 항목만 `produce-advanced-loop`으로 생산한다.

---

## 폴더 명명 규칙

```
Components/<컴포넌트경로>/Advanced/<변형이름>/
├── CLAUDE.md
├── scripts/
├── styles/
├── views/
└── preview/
```

**`<컴포넌트경로>`**: `Components/` 아래 컴포넌트 루트 상대경로.
- depth 1 범주: `<범주>` (예: `AppBars`, `Badges`, `Cards`)
- depth 2 범주: `<범주>/<서브범주>` (예: `Buttons/SplitButtons`, `Chips/Assist`)

**변형 이름**: camelCase 권장 (예: `searchEmbedded`, `inlineEditable`)

**Standard와의 분리 정당성**: Advanced 변형은 Standard와 명백히 다른 register.js(Mixin 조합, 구독 토픽, 커스텀 메서드, 이벤트 중 하나 이상)를 가져야 한다. 동일 register.js로 표현 가능한 디자인 변형은 Standard 내부 variant로 둔다.

---

## 생산 대기열

| 순번 | 컴포넌트경로 | 변형 이름 | 설명 | 상태 |
|------|-------------|----------|------|------|
| 1 | AppBars | searchEmbedded | 임베디드 검색 입력 AppBar — @searchInputChanged/@searchCleared 발행 | 완료 |
| 2 | AppBars | contextual | 선택 모드 AppBar — selectionInfo 구독, @selectionActionClicked/@selectionCleared 발행 | 완료 |
| 3 | AppBars | scrollCollapsing | 페이지 스크롤에 따라 AppBar 높이 축소/확장 — scrollListener + expand/collapse 메서드 | 완료 |
| 4 | AppBars | notificationBadge | 알림 배지 표시 + 클릭 이벤트 — badgeInfo 구독, @badgeClicked 발행 | 완료 |
| 5 | Badges | realtime | 실시간 카운트 갱신 시 펄스 애니메이션 — onBadgeUpdate + AnimationMixin pulse | 완료 |
| 6 | Badges | pulseOnChange | 값 변경 감지 시 펄스 애니메이션 — previousValue 추적, @valueChanged 발행 | 완료 |
| 7 | Buttons/Buttons | longPress | 길게 누르기(500ms) 이벤트 — pointerdown/up 추적, @buttonLongPressed 발행 | 완료 |
| 8 | Buttons/Buttons | confirmation | 클릭 시 2단계 확인 UI 후 액션 실행 — confirmationState, @confirmationNeeded | 완료 |
| 9 | Buttons/Buttons | holdToConfirm | 누르고 있어야 액션 실행 (progress bar) — holdTimer + @holdConfirmed | 완료 |
| 10 | Buttons/ExtendedFABs | draggable | FAB 드래그 가능 — pointerdown/move/up + position 제어 | 완료 |
| 11 | Buttons/ExtendedFABs | speedDial | 클릭 시 방사형 보조 액션 펼침 — speedDialItems 토픽 + 각도 계산 | 완료 |
| 12 | Buttons/FAB | draggable | FAB 드래그 가능 — pointerdown/move/up + position CSS 제어 | 완료 |
| 13 | Buttons/FAB | speedDial | 클릭 시 주변 방사형 액션 메뉴 펼침 — speedDialItems + 각도 계산 | 완료 |
| 14 | Buttons/FABMenu | contextAware | 위치/화면 영역에 따라 다른 메뉴 표시 — viewport 감지 + menuByContext 토픽 | 완료 |
| 15 | Buttons/IconButtons | toggleGroup | 그룹 내 단일 선택 강제 — selected 상태 관리, @iconButtonToggled | 완료 |
| 16 | Buttons/SegmentedButtons | multiSelect | 다중 선택 모드 — selectedMultiple 배열, @segmentMultiSelected | 완료 |
| 17 | Buttons/SegmentedButtons | draggableReorder | 드래그로 세그먼트 순서 변경 — dragstart/over/drop, @reorderItems | 완료 |
| 18 | Buttons/SplitButtons | recentActions | 최근 사용 액션 상단 고정 — recentActionsStorage + recent 섹션 렌더 | 완료 |
| 19 | Cards | expandable | 클릭 시 본문 확장/접힘 — toggleExpand, @cardExpanded/@cardCollapsed | 완료 |
| 20 | Cards | sortable | 드래그로 카드 순서 변경 — dragstart/over/drop, @cardReordered | 완료 |
| 21 | Cards | selectable | 선택 체크박스 + 다중 선택 모드 — selected 상태 추적, @cardSelected | 완료 |
| 22 | Cards | swipeAction | 스와이프하여 숨겨진 액션 표시 — touch move/end + transform 제어 | 완료 |
| 23 | Checkbox | indeterminate | tri-state 중간 상태 (그룹 선택용) — indeterminate 상태 + 그룹 cascade | 완료 |
| 24 | Checkbox | nestedTree | 트리 구조 + 부모/자식 cascade — 신규 TreeCheckboxMixin 필요 | 완료 |
| 25 | Chips/Assist | coloredByType | type별 색상 자동 변경 — type 필드 + data-chip-type 반영 | 완료 |
| 26 | Chips/Filter | multiSelectGroup | 그룹별 다중 선택 (그룹 간 배타) — group 필드 + 배타성 유지 | 완료 |
| 27 | Chips/Filter | removable | × 버튼으로 제거 — removeBtn selector + @chipRemoved | 완료 |
| 28 | Chips/Input | tagAutoComplete | 입력 시 자동완성 제안 — suggestedTags 토픽 + input 이벤트 | 완료 |
| 29 | Chips/Input | pasteMultiple | 콤마/공백 구분 다건 입력 — paste 이벤트 + split/trim | 완료 |
| 30 | Chips/Suggestion | dynamic | 외부 API/검색어 기반 동적 갱신 — suggestionSource 토픽 + @suggestionRefresh | 완료 |
| 31 | Dialogs | fullscreen | 전체 화면 레이아웃 — fullscreen CSS class + breakpoint 감지 | 완료 |
| 32 | Dialogs | draggable | 헤더 드래그로 이동 — mousedown/move/up on header + position 제어 | 완료 |
| 33 | Dialogs | resizable | 모서리 드래그로 크기 조절 — resize handle + width/height 계산 | 완료 |
| 34 | Lists | virtualScroll | 대량 데이터 가상 스크롤 — 신규 VirtualScrollMixin 필요 | 완료 |
| 35 | Lists | draggableReorder | 항목 드래그 정렬 — dragstart/over/drop, @itemReordered | 완료 |
| 36 | Lists | swipeToDelete | 좌/우 스와이프로 삭제 — touch move/end, @itemSwipeDelete | 완료 |
| 37 | Lists | infiniteScroll | 하단 도달 시 자동 페이지 로드 — scroll listener, @loadMore | 완료 |
| 38 | Lists | multiSelect | 다중 선택 + 전체 선택 — selectedItems 배열, @listMultiSelected | 완료 |
| 39 | Loading/ProgressIndicators | progressWithCancel | 진행 표시 + 취소 버튼 — cancelBtn selector + @progressCancelled | 완료 |
| 40 | Loading/ProgressIndicators | determinateWithETA | 진행률 + ETA 표시 — etaText 필드 + timeRemaining 계산 | 완료 |
| 41 | Menus | cascading | 다단계(hover) submenu — 신규 CascadingMenuMixin 필요 | 완료 |
| 42 | Menus | contextMenu | 우클릭 컨텍스트 메뉴 — contextmenu 이벤트 + position 계산 | 완료 |
| 43 | Menus | keyboardNavigable | 화살표 키 네비게이션 — keydown 핸들러 + focus 제어 | 완료 |
| 44 | Navigation/NavigationBar | badgeNotification | 항목별 실시간 알림 배지 — badge 토픽 구독 | 완료 |
| 45 | Navigation/NavigationDrawer | collapsible | 축소/확장 토글 — collapsed state + width 토글 | 완료 |
| 46 | Navigation/NavigationDrawer | nestedItems | 메뉴 항목 중첩 (submenu) — 신규 NestedMenuMixin 필요 | 완료 |
| 47 | Navigation/NavigationRail | hoverExpand | hover 시 라벨 펼침 — mouseenter/leave + expanded width | 완료 |
| 48 | Search | autoComplete | 입력 시 서버 자동완성 — autocompleteSource 토픽 + debounce | 완료 |
| 49 | Search | recentHistory | 최근 검색어 표시 — localStorage 추적 + @recentLoaded | 완료 |
| 50 | Search | filtered | 필터 칩 + 검색 결과 결합 — filterChips 토픽 + searchResults | 완료 |
| 51 | Search | voiceInput | 마이크 음성 입력 — Web Speech API + @voiceTranscribed | 완료 |
| 52 | Sheets/BottomSheets | draggableHeight | 드래그로 높이 조절 — touchmove on handle + height 계산 | 완료 |
| 53 | Sheets/BottomSheets | snapPoints | 50%/75%/100% 스냅 — snap calculation + velocity 기반 | 완료 |
| 54 | Sheets/BottomSheets | swipeToDismiss | 아래로 스와이프 닫기 — swipe velocity, @swipeDismissed | 완료 |
| 55 | Sheets/SideSheets | resizable | 우측 모서리 너비 조절 — pointerdown on edge + width 제어 | 완료 |
| 56 | Sliders/Basic | tooltip | 드래그 중 값 tooltip — tooltipValue + visible state | 완료 |
| 57 | Sliders/Basic | discreteWithMarks | 눈금 + snap — marks 배열 + snap logic | 완료 |
| 58 | Sliders/Basic | keyboardArrowControl | 화살표 키 미세 조정 — keydown 핸들러 + step 단위 증감 | 완료 |
| 59 | Sliders/Centered | tooltip | 중앙 offset tooltip — tooltip visible + format | 완료 |
| 60 | Sliders/Centered | discreteWithMarks | 눈금 + 중앙 마커 — marks array + center mark | 완료 |
| 61 | Sliders/Range | tooltip | 양 끝점 tooltip — low/highTooltip state | 완료 |
| 62 | Sliders/Range | discreteWithMarks | 눈금 + snap — marks array + snap to marks | 완료 |
| 63 | Snackbar | queue | 다중 메시지 순차 표시 — messageQueue + auto-dismiss chain | 완료 |
| 64 | Snackbar | action | 액션 버튼 + 이벤트 — actionButton selector | 완료 |
| 65 | Snackbar | persistent | 자동 dismiss 없이 지속 — persistent flag + clearTimer 조건 | 완료 |
| 66 | Switch | confirmBeforeToggle | on/off 전환 전 확인 — confirmationNeeded 상태 + @switchConfirmation | 완료 |
| 67 | Tables | virtualScroll | 대량 행 가상 스크롤 — 신규 VirtualScrollMixin 필요 | 완료 |
| 68 | Tables | sortableColumn | 컬럼 헤더 클릭 정렬 — sortBy/sortOrder + @columnSorted | 완료 |
| 69 | Tables | filterableHeader | 헤더 필터 입력 — filterValue per column + @filtered | 완료 |
| 70 | Tables | columnResize | 컬럼 경계 드래그 — resize handle + width 계산 | 완료 |
| 71 | Tables | rowSelectable | 행 선택 + 다중 선택 — selectedRows set + @rowsSelected | 완료 |
| 72 | Tables | inlineEdit | 셀 클릭 인라인 편집 — editingCellId + blur로 저장 | 완료 |
| 73 | Tables | expandableRow | 행 좌측 버튼으로 상세 확장 — expandedRows set + detail content | 완료 |
| 74 | Tabs | scrollable | 탭 많을 때 좌/우 스크롤 버튼 — overflow detection + scroll buttons | 완료 |
| 75 | Tabs | closable | 각 탭 × 버튼 — closeBtn selector + @tabClosed | 완료 |
| 76 | Tabs | draggableReorder | 드래그로 탭 순서 변경 — dragstart/over/drop, @tabReordered | 완료 |
| 77 | Tabs | lazyContent | 활성 탭만 콘텐츠 로드 — contentLoaded map + @contentRequested | 완료 |
| 78 | TextFields | masking | 전화번호/카드번호 마스킹 — maskPattern + format/unformat | 완료 |
| 79 | TextFields | autoComplete | 자동완성 제안 — suggestedValues 토픽 | 완료 |
| 80 | TextFields | validation | 실시간 검증 + 에러 표시 — validators array + @validationError | 완료 |
| 81 | TextFields | characterCounter | 글자수 카운터 — charCount/maxChars 필드 | 완료 |
| 82 | TextFields | multilineAutoGrow | 입력 시 높이 자동 확장 — textarea height 계산 + @heightChanged | 완료 |
| 83 | Toolbars | overflowMenu | 공간 부족 시 ··· 메뉴 — overflow detection + menu popup | 완료 |
| 84 | Toolbars | groupedActions | 액션 그룹 구분선 — group 필드 + group divider 렌더 | 완료 |
| 85 | Tooltips | richContent | HTML/링크 포함 rich 콘텐츠 — html/richText 필드 + sanitize | 완료 |
| 86 | Tooltips | persistent | 클릭 시 고정 — persistent state + clickTarget 추적 | 완료 |
| 87 | Trees | draggableReorder | 노드 드래그로 순서/부모 변경 — drag over parent + @nodeDropped | 완료 |
| 88 | Trees | lazyLoad | 노드 확장 시 자식 lazy 로드 — childrenLoaded map + @childrenRequested | 완료 |
| 89 | Trees | checkbox | 트리 선택 모드 + cascade — selectedNodes set + cascade logic | 완료 |
| 90 | Trees | filterSearch | 검색어로 트리 필터링 — filterText + @filtered | 완료 |
| 91 | Buttons/ButtonGroups | toggleGroup | 연결된 버튼 그룹 단일 선택 강제 — `_selectedId` 상태 + `@buttonGroupToggled` | 완료 |
| 92 | Buttons/ButtonGroups | multiSelect | 연결된 버튼 그룹 다중 선택 누적 — `_selectedIds:Set` + `@buttonGroupMultiSelected` | 완료 |

> depth 2 케이스 등록 예시: `| N | Buttons/SplitButtons | ... | ... | 대기 |`

---

## 상태 값

- **대기**: 아직 착수하지 않음 (`produce-advanced-loop`의 다음 대상)
- **진행 중**: 현재 사이클에서 생산 중
- **완료**: 생산 완료, 폴더 존재
