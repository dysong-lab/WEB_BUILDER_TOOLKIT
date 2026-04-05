# Hook 스크립트 가이드

## 개요

이 디렉토리의 셸 스크립트는 Claude Code가 파일을 편집(Edit/Write)할 때 자동으로 실행됩니다.
위반이 감지되면 `exit 2`로 피드백을 반환하고, Claude가 즉시 수정하도록 유도합니다.

설계 근거: [PRODUCTION_HOOKS.md](../docs/PRODUCTION_HOOKS.md)

---

## 동작 방식

```
사용자 요청 → Claude가 파일 편집 → PostToolUse 이벤트 발생
                                        ↓
                                   settings.json의 Hook 목록 순회
                                        ↓
                              각 스크립트가 $CLAUDE_FILE_PATH를 받아 실행
                                        ↓
                              ┌─ exit 0 → 통과 (다음 Hook으로)
                              └─ exit 2 → 위반 메시지가 Claude에게 전달 → 즉시 수정
```

모든 스크립트는 **대상 파일이 아니면 즉시 exit 0**으로 통과합니다.
대상 판별은 파일명(basename)과 경로 패턴으로 수행합니다.

---

## Phase 1: 단일 파일 검사

편집된 파일 하나만 읽어서 정규식으로 검사합니다.

### check-register.sh

| 항목 | 내용 |
|------|------|
| 대상 | `*/register.js` (DesignComponentSystem 내) |
| 계약 | **P0-2**: 렌더링/fetch 로직 혼입 차단 |
|       | **P1-1**: Mixin 적용 + 구독 연결 존재 확인 |

**P0-2 검출 키워드**: `innerHTML`, `appendChild`, `createElement`, `insertAdjacentHTML`, `fetch(`, `XMLHttpRequest`, `axios`

**P1-1 필수 존재**:
- `apply*Mixin` 또는 `loadMixin` — Step 1 (Mixin 적용)
- `subscribe(` — Step 2 (구독 연결)

### check-beforeDestroy.sh

| 항목 | 내용 |
|------|------|
| 대상 | `*/beforeDestroy.js` (DesignComponentSystem 내) |
| 계약 | **P1-4**: null 정리 + destroy() + unsubscribe 존재 확인 |

**필수 존재**:
- `= null` — 참조 정리
- `.destroy()` 또는 `?.destroy()` — Mixin 정리
- `unsubscribe` — 구독 해제

### check-page-loaded.sh

| 항목 | 내용 |
|------|------|
| 대상 | `*/page_scripts/loaded.js` 또는 `*/page/loaded.js` |
| 계약 | **P0-4**: DOM 조작 차단 |
|       | **필수**: 데이터 매핑 정의 존재 |

**P0-4 검출**: `innerHTML`, `appendChild`, `createElement`, `insertAdjacentHTML`, `querySelector`

### check-page-before-load.sh

| 항목 | 내용 |
|------|------|
| 대상 | `*/page_scripts/before_load.js` 또는 `*/page/before_load.js` |
| 계약 | **P0-4**: DOM 조작 차단 |
|       | **필수**: 이벤트 핸들러 등록 존재 |

### check-page-before-unload.sh

| 항목 | 내용 |
|------|------|
| 대상 | `*/page_scripts/before_unload.js` 또는 `*/page/before_unload.js` |
| 계약 | **P1**: 핵심 정리 호출 존재 확인 |

**필수 존재**:
- `offEventBusHandlers` — 이벤트 핸들러 해제
- `unregisterMapping` — 데이터 매핑 해제
- `= null` — 참조 정리

### check-p3.sh

| 항목 | 내용 |
|------|------|
| 대상 | `*.css`, `*.js`, `*/preview/*.html` |
| 계약 | **P3-1**: CSS rem/em 금지 |
|       | **P3-2**: JS var 금지 |
|       | **P3-3**: preview.html 로컬 CSS link 금지 |

---

## Phase 2: 파일 간 교차 검증

편집된 파일과 관련 파일을 함께 읽어서 정합성을 검증합니다.

### cross-register-destroy.sh

| 항목 | 내용 |
|------|------|
| 트리거 | `register.js` 또는 `beforeDestroy.js` 편집 시 |
| 교차 대상 | 같은 디렉토리의 상대 파일 |
| 계약 | **P1-2**: 역순 검증, **P1-3**: 수 대응, **P1-4**: 함수 null |

**검증 항목**:
1. `apply*Mixin` 수 = `.destroy()` 수
2. `bindEvents`/`bind3DEvents` 존재 시 `removeCustomEvents` 필수
3. `this.customEvents` 정의 시 `this.customEvents = null` 필수
4. `this.subscriptions` 정의 시 `this.subscriptions = null` 필수
5. `this.xxx = function` 정의마다 `this.xxx = null` 필수
6. 정리 순서가 생성의 역순인지 (행 번호 비교)

### cross-selectors-html.sh

| 항목 | 내용 |
|------|------|
| 트리거 | `register.js` 편집 시 (2D만, 3D 제외) |
| 교차 대상 | 같은 컴포넌트의 `views/*.html` |
| 계약 | **P2-1**: cssSelectors → HTML 존재, **P2-2**: ListRenderMixin → template 태그 |

**검증 항목**:
1. `cssSelectors` 객체의 값(`.class-name`, `#id`)이 HTML에 존재하는지
2. `applyListRenderMixin` 사용 시 HTML에 `<template>` 태그가 있는지

### cross-page-lifecycle.sh

| 항목 | 내용 |
|------|------|
| 트리거 | `before_unload.js` 또는 `loaded.js` 편집 시 |
| 교차 대상 | 같은 디렉토리의 `loaded.js`, `before_load.js`, `before_unload.js` |
| 계약 | **P1-2**: 생성-정리 매칭 |

**검증 항목 (loaded.js 기준)**:
1. `pageDataMappings` → `unregisterMapping` + `pageDataMappings = null`
2. `startAllIntervals` → `stopAllIntervals`
3. `pageParams` → `pageParams = null`

**검증 항목 (before_load.js 기준)**:
4. `pageEventBusHandlers` → `offEventBusHandlers` + `pageEventBusHandlers = null`
5. `raycastingEvents` (3D) → `removeEventListener` + `raycastingEvents = null`
6. `initThreeRaycasting` (3D) → `disposeAllThreeResources`

---

## 2D vs 3D 차이

| 검사 항목 | 2D | 3D |
|-----------|----|----|
| 이벤트 바인딩 | `bindEvents` | `bind3DEvents` / `bindCustomEvents` |
| 이벤트 해제 | `removeCustomEvents` | `removeCustomEvents` (동일) |
| 01_status 이벤트 | 해당 없음 | 없는 것이 정상 |
| cssSelectors ↔ HTML | 검사함 | 검사 안 함 (3D는 HTML 뷰 없음) |
| page before_unload | 3단계 정리 | 5단계 정리 (raycasting + Three 리소스) |
| destroy 호출 | `.destroy()` | `?.destroy()` 허용 |

---

## 테스트 방법

```bash
# 특정 파일에 대해 Hook 수동 실행
CLAUDE_FILE_PATH="path/to/register.js" bash .claude/hooks/check-register.sh

# 전수 테스트 (exit 0이면 PASS)
for f in $(find RNBT_architecture/DesignComponentSystem -name "register.js"); do
    CLAUDE_FILE_PATH="$f" bash .claude/hooks/cross-register-destroy.sh || echo "FAIL: $f"
done
```
