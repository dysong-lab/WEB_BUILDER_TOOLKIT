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

> depth 2 케이스 등록 예시: `| 3 | Buttons/SplitButtons | ... | ... | 대기 |`

---

## 상태 값

- **대기**: 아직 착수하지 않음 (`produce-advanced-loop`의 다음 대상)
- **진행 중**: 현재 사이클에서 생산 중
- **완료**: 생산 완료, 폴더 존재
