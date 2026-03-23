# Mixin 범용성 검토

검토일: 2026-03-23

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

---

## StatefulListRenderMixin

**하는 일:** 배열 반복 생성 + 개별 항목의 dataset 상태 변경

**범용성:** "목록 표시 + 개별 항목 상태 변경" 패턴에 적합.

**제약:** `updateItemState`는 dataset만 변경 가능하다. 개별 항목의 textContent를 부분 업데이트하는 것은 지원하지 않는다.

---

## EChartsMixin

**하는 일:** ECharts 인스턴스 lazy init, setOption, resize, dispose

**범용성:** `renderData`가 data를 그대로 `setOption`에 전달하므로 ECharts가 지원하는 모든 차트 유형을 사용할 수 있다. Mixin이 차트 유형을 제한하지 않는다.

**제약:** 없음.

---

## TabulatorMixin

**하는 일:** Tabulator 인스턴스 lazy init, setData, clearData, destroy

**범용성:** 단순한 데이터 테이블에는 충분.

**제약:** `ensureInstance`에서 `layout: 'fitColumns'`가 하드코딩되어 있다.

```javascript
tableInstance = new Tabulator(containerEl, {
    columns: columns,
    data: [],
    layout: 'fitColumns'    // ← 하드코딩
});
```

Tabulator의 고급 옵션(pagination, movableColumns, groupBy 등)을 전달할 수 없다. 사용 시 옵션 확장이 필요할 가능성이 높다.

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

## CameraFocusMixin

**하는 일:** 카메라를 대상으로 부드럽게 이동, 초기 위치 복귀

**범용성:** focusOn(메시 기반), focusOnPosition(좌표 기반), reset(초기 복귀)을 제공. offset, camera/controls override도 지원.

**제약:** 없음.

---

## 요약

| Mixin | 범용성 | 제약 |
|-------|--------|------|
| FieldRender | ✅ | textContent/dataset만 (속성 변경 미지원) |
| ListRender | ✅ | 전체 교체 방식 (대량 데이터 시 성능/UX) |
| StatefulListRender | ✅ | updateItemState는 dataset만 |
| ECharts | ✅ | 없음 |
| Tabulator | ⚠️ | 초기 옵션 하드코딩 |
| HeatmapJs | ✅ | 없음 |
| MeshState | ⚠️ | 색상만 변경 |
| CameraFocus | ✅ | 없음 |

## 새 Mixin 후보

| 제약에서 도출 | 행위 패턴 |
|---------------|----------|
| FieldRender의 textContent 한정 | 요소의 속성(src, href, value 등)을 데이터에 따라 변경 |
| ListRender의 전체 교체 | 부분 업데이트(추가/삭제/변경)로 목록 관리 |
| MeshState의 색상 한정 | 3D 메시의 다양한 시각 속성(visibility, opacity 등) 변경 |
