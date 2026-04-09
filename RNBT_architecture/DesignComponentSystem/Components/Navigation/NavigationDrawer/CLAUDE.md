# NavigationDrawer

## MD3 정의

> Navigation drawers let people switch between UI views on larger devices.

## 역할

대형 디바이스에서 사용자가 UI 뷰 간을 전환할 수 있게 한다.

## 핵심 특성

- 기본적으로 열림 또는 닫힘 상태 가능 (드로어의 본질)
- 대형 화면에서는 항상 열린 상태로 사용 (Standard 모드)
- 소형 화면에서는 열기/닫기 + scrim으로 사용 (Modal 모드)
- Standard/Modal은 별도 컴포넌트가 아니라 동일 컴포넌트의 동작 모드
- 가장 자주 사용하는 목적지를 상단에, 관련 목적지끼리 그룹화

## 하위 범주

| 컴포넌트 | 역할 |
|----------|------|
| Standard | 메뉴 항목 렌더링 + 드로어 열기/닫기 (Standard/Modal 모드 통합) |
