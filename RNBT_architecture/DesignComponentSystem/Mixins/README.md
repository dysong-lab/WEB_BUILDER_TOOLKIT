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
| ChartRenderMixin | 차트 인스턴스를 생성하고, 옵션을 적용하여 표시한다 |
| TableRenderMixin | 테이블 인스턴스를 생성하고, 데이터를 적용하여 표시한다 |
| HeatmapRenderMixin | 히트맵 서피스를 생성하고, 데이터를 매핑하여 표시한다 |
| MeshStateMixin | 3D 메시의 시각 상태를 데이터에 따라 변경한다 |
| CameraFocusMixin | 카메라를 특정 대상으로 이동시킨다 |

---

## Mixin 공통 원칙

- **선택자는 인터페이스다.** KEY는 Mixin이 정의한다. VALUE는 HTML에서 온다.
- **Mixin에 주입되는 것은 cssSelectors와 datasetSelectors 두 객체뿐이다.**
- **데이터 변환은 Mixin의 관심사가 아니다.** Mixin은 이미 selector KEY에 맞춰진 데이터만 받는다.
- **Mixin은 자기 것만 관리한다.** destroy에서 자기가 만든 것만 정리한다.

---

## Mixin별 상세 문서

| Mixin | 문서 |
|-------|------|
| FieldRenderMixin | [FieldRenderMixin.md](FieldRenderMixin.md) |
| ListRenderMixin | [ListRenderMixin.md](ListRenderMixin.md) |
| StatefulListRenderMixin | [StatefulListRenderMixin.md](StatefulListRenderMixin.md) |
| ChartRenderMixin | [ChartRenderMixin.md](ChartRenderMixin.md) |
| TableRenderMixin | [TableRenderMixin.md](TableRenderMixin.md) |
| HeatmapRenderMixin | [HeatmapRenderMixin.md](HeatmapRenderMixin.md) |
| MeshStateMixin | [MeshStateMixin.md](MeshStateMixin.md) |
| CameraFocusMixin | [CameraFocusMixin.md](CameraFocusMixin.md) |
