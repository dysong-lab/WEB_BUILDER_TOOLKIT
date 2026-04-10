# Mixin 범용성 검토

검토일: 2026-03-25

---

## 검토 기준

각 Mixin이 "기능"으로서 충분히 범용적으로 구현되었는지를 분석한다. 현재 용도에서의 적합성과 일반적 사용 시의 제약을 구분한다.

---

## FieldRenderMixin

**하는 일:** 데이터 객체의 key를 DOM 요소에 매핑하여 textContent/dataset을 반영한다.

**범용성:** 현재 용도(모니터링 대시보드의 텍스트/상태 표시)에서는 충분히 범용적.

**제약:** textContent와 dataset만 지원한다. 다음은 처리할 수 없다:

- `img`의 `src` 속성 변경
- `a`의 `href` 속성 변경
- `input`의 `value` 변경
- `innerHTML` (HTML이 포함된 텍스트)

**→ 새 Mixin 후보:** 요소의 속성(attribute)을 변경하는 Mixin, innerHTML을 변경하는 Mixin

---

## ListRenderMixin

**하는 일:** 배열을 template 복제로 반복 생성한다.

**범용성:** 수십~수백 건의 목록에서는 문제없다.

**제약:** 매 렌더링마다 `containerEl.innerHTML = ''`로 전체 교체한다.

- 데이터 1건만 추가되어도 전체를 다시 그림
- 1000건 이상의 목록이면 성능 이슈 가능
- 스크롤 위치가 초기화됨
- 사용자가 항목을 선택 중이었으면 선택 상태 소실

**→ 새 Mixin 후보:** 부분 업데이트(추가/삭제/변경)를 지원하는 목록 Mixin

**참고:** `itemKey` 옵션을 제공하면 `updateItemState`/`getItemState`로 개별 항목의 dataset 상태를 변경/조회할 수 있다 (stateful 모드). `datasetAttrs` 옵션을 제공하면 textContent 대신 data-* 속성으로 값을 설정한다.

---

## EChartsMixin

**하는 일:** ECharts 인스턴스 lazy init, setOption, resize, dispose

**범용성:** `renderData`가 data를 그대로 `setOption`에 전달하므로 ECharts가 지원하는 모든 차트 유형을 사용할 수 있다. Mixin이 차트 유형을 제한하지 않는다.

**제약:** 없음.

---

## TabulatorMixin

**하는 일:** Tabulator 인스턴스 lazy init, setData, clearData, destroy

**범용성:** `tabulatorOptions`로 Tabulator의 모든 옵션을 전달할 수 있다.

```javascript
tableInstance = new Tabulator(containerEl, Object.assign({
    columns: columns,
    data: [],
    layout: 'fitDataFill'   // ← 기본값 (tabulatorOptions로 재정의 가능)
}, tabulatorOptions));
```

`Object.assign`에서 `tabulatorOptions`가 뒤에 오므로, `layout`을 포함한 모든 기본값을 사용자 옵션으로 덮어쓸 수 있다. pagination, movableColumns, groupBy 등 고급 옵션도 `tabulatorOptions`를 통해 전달 가능하다.

**제약:** 없음.

---

## HeatmapJsMixin

**하는 일:** h337 인스턴스 lazy init, setData, configure, clear

**범용성:** preset으로 시각 설정을 전달할 수 있고, `updateConfig`로 런타임 변경도 가능.

**제약:** 없음. (`destroy`에서 dispose 메서드가 없어 데이터만 비우는 방식은 h337 라이브러리의 제약.)

---

## MeshStateMixin

**하는 일:** 메시 이름으로 찾아서 `material.color.setHex()`로 색상 변경

**범용성:** "상태에 따라 색상을 바꾼다"에는 충분.

**제약:** 색상 변경만 지원한다. 3D 상태 표현에 필요할 수 있는 다른 속성은 처리할 수 없다:

- visibility (보이기/숨기기)
- opacity (투명도)
- scale (크기)
- emissive (발광)
- material 교체

또한 `material`이 있는 메시만 대상이 된다. Group이나 material이 없는 Object3D에는 동작하지 않는다.

**→ 새 Mixin 후보:** visibility, opacity, scale 등 시각 속성을 변경하는 3D Mixin

---

## MeshHighlightMixin

**하는 일:** 선택한 대상을 시각적으로 강조한다. 3D 메시의 emissive 색상을 적용/해제하여 선택 상태를 피드백한다.

**범용성:** highlight(개별 강조), unhighlight(개별 해제), clearAll(전체 해제), isHighlighted(상태 조회)을 제공. highlightColor, highlightIntensity 옵션으로 발광 색상/강도를 커스터마이즈 가능.

**제약:** 없음. MeshStateMixin과 다른 채널(color vs emissive)을 사용하므로 동시 적용 가능.

---

## MeshVisibilityMixin

**하는 일:** 3D 장면의 특정 부분을 선택적으로 보여준다. 메시의 visible 속성을 토글하여 show/hide를 제어한다.

**범용성:** show, hide, toggle(개별 제어), showOnly(선택적 표시), showAll/hideAll(일괄 제어), isVisible(상태 조회)을 제공. 층별 분리, X-ray 뷰 등 다양한 시나리오에 대응.

**제약:** 없음.

---

## CameraFocusMixin

**하는 일:** 보는 위치를 전환한다. 카메라를 특정 메시나 좌표로 부드럽게 이동시키고, 초기 위치로 복귀한다.

**범용성:** focusOn(메시 기반), focusOnPosition(좌표 기반), reset(초기 복귀)을 제공. offset, camera/controls override도 지원.

**제약:** 없음.

---

## ShadowPopupMixin

**하는 일:** Shadow DOM으로 팝업을 생성하고, 표시/숨김/정리를 관리한다. `<template>` 태그에서 HTML/CSS를 가져와 Shadow DOM에 주입한다.

**범용성:** 스타일 격리(Shadow DOM), 선택자 계약(cssSelectors), 이벤트 전파(bindPopupEvents → Weventbus)를 지원. 팝업 내부에서 다른 Mixin을 사용할 수 있다(`appendElement`를 `shadowRoot`로 지정하는 래퍼 패턴).

**제약:** 팝업 위치를 제어하는 옵션이 없다. 현재는 CSS로 위치를 결정한다(`position: fixed` + `inset: 0`으로 화면 중앙 오버레이). 팝업을 특정 요소 근처에 띄우는(tooltip, dropdown) 용도에는 CSS만으로는 한계가 있을 수 있다.

**→ 새 Mixin 후보:** 특정 요소 기준 위치 지정이 필요하면 별도 Mixin 또는 옵션 확장 검토

---

## 3DShadowPopupMixin

**하는 일:** 3D 컴포넌트에서 Shadow DOM으로 팝업을 생성하고, 표시/숨김/정리를 관리한다. `getHTML()`/`getStyles()` 문자열로 콘텐츠를 받아 `instance.page.appendElement`에 부착한다.

**범용성:** ShadowPopupMixin과 동일한 스타일 격리 및 이벤트 전파를 제공하면서, 3D 컴포넌트(`appendElement`가 `THREE.Group`)에서도 사용 가능.

**제약:** ShadowPopupMixin과 동일 (팝업 위치 제어 옵션 없음, CSS 의존).

---

## TreeRenderMixin

**하는 일:** 재귀적 배열(children)을 받아 template 복제로 트리 구조를 렌더링하고, 각 노드의 확장/축소 상태를 관리한다.

**범용성:** 장비 트리, 조직 트리, 파일 트리 등 계층적 데이터 표시에 범용적.

**제약:** ListRenderMixin과 동일하게 매 렌더링마다 `containerEl.innerHTML = ''`로 전체 교체한다. 대규모 트리(수천 노드)에서는 성능 이슈 가능. 들여쓰기가 `paddingLeft`로 고정되어 있으나 CSS로 덮어쓸 수 있다.

---

## 요약

| Mixin | 범용성 | 제약 |
|-------|--------|------|
| FieldRender | ✅ | textContent/dataset만 (속성 변경 미지원) |
| ListRender | ✅ | 전체 교체 방식 (대량 데이터 시 성능/UX). `itemKey` 옵션 시 stateful 모드 (updateItemState는 dataset만) |
| ECharts | ✅ | 없음 |
| Tabulator | ✅ | 없음 (tabulatorOptions로 모든 옵션 재정의 가능) |
| HeatmapJs | ✅ | 없음 |
| MeshState | ⚠️ | 색상만 변경 |
| MeshHighlight | ✅ | 없음 |
| MeshVisibility | ✅ | 없음 |
| CameraFocus | ✅ | 없음 |
| ShadowPopup | ✅ | 팝업 위치 제어 옵션 없음 (CSS 의존) |
| 3DShadowPopup | ✅ | 팝업 위치 제어 옵션 없음 (CSS 의존) |
| TreeRender | ✅ | 전체 교체 방식 (대규모 트리 시 성능) |

## 새 Mixin 후보

| 제약에서 도출 | 행위 패턴 |
|---------------|----------|
| FieldRender의 textContent 한정 | 요소의 속성(src, href, value 등)을 데이터에 따라 변경 |
| ListRender의 전체 교체 | 부분 업데이트(추가/삭제/변경)로 목록 관리 |
| MeshState의 색상 한정 | 3D 메시의 다양한 시각 속성(visibility, opacity 등) 변경 |
| ShadowPopup의 위치 제어 부재 | 특정 요소 기준 위치 지정 (tooltip/dropdown 용도) |
