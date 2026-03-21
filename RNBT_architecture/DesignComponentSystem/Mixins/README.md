# Mixin 가이드

## Mixin을 만드는 기준

**"이 Mixin의 목적이 무엇인가."**

목적이 기존 Mixin과 다르면 새 Mixin이다. 같으면 기존 Mixin을 사용한다.

DOM 조작 방식, 데이터 형태, 구현 패턴은 목적에 의해 결정되는 결과이지, Mixin을 나누는 기준이 아니다.

---

## 현재 Mixin 목록

| Mixin | 목적 |
|-------|------|
| FieldRenderMixin | 기존 요소에 데이터를 표시한다 |
| ListRenderMixin | 항목을 반복 생성하여 표시한다 |
| StatefulListRenderMixin | 항목을 반복 생성하여 표시하고, 생성한 개별 항목의 data 속성을 변경한다 |
| EChartsMixin | ECharts 인스턴스를 생성하고 관리한다 |
| TabulatorMixin | Tabulator 인스턴스를 생성하고 관리한다 |
| HeatmapJsMixin | heatmap.js 기반 열 분포를 시각화하고 관리한다 |
| MeshStateMixin | 3D 메시의 시각 상태를 데이터에 따라 변경한다 |
| CameraFocusMixin | 카메라를 특정 대상으로 이동시킨다 |

---

## Mixin 공통 원칙

- **각 Mixin이 받는 옵션이 그 Mixin의 인터페이스다.** 옵션은 Mixin별 문서를 참고한다.
- **데이터 변환은 Mixin의 관심사가 아니다.** Mixin은 이미 가공된 데이터만 받는다.
- **Mixin은 자기 것만 관리한다.** destroy에서 자기가 만든 것만 정리한다.

---

## Mixin별 상세 문서

| Mixin | 문서 |
|-------|------|
| FieldRenderMixin | [FieldRenderMixin.md](FieldRenderMixin.md) |
| ListRenderMixin | [ListRenderMixin.md](ListRenderMixin.md) |
| StatefulListRenderMixin | [StatefulListRenderMixin.md](StatefulListRenderMixin.md) |
| EChartsMixin | [EChartsMixin.md](EChartsMixin.md) |
| TabulatorMixin | [TabulatorMixin.md](TabulatorMixin.md) |
| HeatmapJsMixin | [HeatmapJsMixin.md](HeatmapJsMixin.md) |
| MeshStateMixin | [MeshStateMixin.md](MeshStateMixin.md) |
| CameraFocusMixin | [CameraFocusMixin.md](CameraFocusMixin.md) |
