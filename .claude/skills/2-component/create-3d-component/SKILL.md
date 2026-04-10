---
name: create-3d-component
description: 개별 단위 3D 컴포넌트를 생성합니다. 단일 GLTF 모델(1 장비 = 1 Mesh)의 컴포넌트를 CLAUDE.md 명세에 따라 구현합니다.
---

# 개별 단위 3D 컴포넌트 생성

단일 GLTF 모델을 제어하는 3D 컴포넌트를 생성한다. 하나의 장비가 하나의 Mesh에 대응하며, meshName이 확정되어 있다.

> **공통 규칙**: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md)
> **다중 Mesh(GLTF 컨테이너)는**: `create-3d-container-component` SKILL을 사용

---

## 전제 조건

이 스킬은 `produce-component` 스킬에서 다음이 완료된 후 호출된다:

- **컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세 (Mixin, 커스텀 메서드, 이벤트) 작성 완료
- **사용자 승인** — CLAUDE.md 내용이 승인됨

이 스킬은 CLAUDE.md 명세를 코드로 변환하는 역할만 한다. 기능 정의나 Mixin 선택을 다시 하지 않는다.

> Mixin이 존재하지 않는 경우에도, 구현 명세에 커스텀 속성/메서드가 정의되어 있으면 그대로 구현한다. 신규 Mixin이 필요한 경우는 `produce-component` → `create-mixin-spec` → `implement-mixin`에서 이미 처리되어 있다.

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 — 캐싱하거나 생략하지 마세요.**

1. **대상 컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세
2. [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — 공통 규칙
3. [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — 코딩 스타일
4. **Mixin 문서 확인** — 구현 명세에 명시된 Mixin의 .md 파일
5. **기존 예제 확인** — 같은 패턴의 기존 컴포넌트를 참조:
   - [BATT](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/BATT/) — 대표 개별 단위 컴포넌트

---

## 개별 단위 3D 컴포넌트의 특징

```
특징:
  - 1 GLTF 모델 = 1 장비 = 1 Mesh
  - meshName이 확정됨 (하드코딩)
  - 이벤트 이름이 장비 고유 (예: '@battClicked')
  - showDetail()에 인자 없음 (자기 자신의 상태를 내부에서 조회)

예시:
  BATT, Chiller, Panel, UPS, thermohygrostat, tempHumiTH2B
```

---

## 변형 구조

변형은 Standard(필수)와 Advanced(선택)로 구분된다. 실제 조합은 CLAUDE.md 구현 명세에서 결정된다.

| 세트 | 번호 | 이름 | Mixin 조합 |
|------|------|------|-----------|
| Standard | 01 | status | MeshState |
| Advanced | 02 | camera | MeshState + CameraFocus |
| Advanced | 03 | popup | MeshState + 3DShadowPopup |
| Advanced | 04 | highlight | MeshState + MeshHighlight |
| Advanced | 05 | camera_highlight | MeshState + CameraFocus + MeshHighlight |
| Advanced | 06 | visibility | MeshState + MeshVisibility |
| Advanced | 07 | animation | MeshState + AnimationMixin |
| Advanced | 08 | clipping | MeshState + ClippingPlaneMixin |

> 기존 생산된 01~03은 `01_status`, `02_status_camera`, `03_status_popup` 폴더명을 유지한다.
> 신규 생산분(04~)부터 새 명명 규칙을 적용한다.

---

## 01_status — register.js

```javascript
/**
 * 01_status: MeshStateMixin만 적용
 * - 데이터 수신 시 Mesh 색상을 상태에 따라 변경
 */

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 (01에서는 없음)
// ======================
```

## 01_status — beforeDestroy.js

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리
this.meshState?.destroy();
```

---

## 02_status_camera — register.js

```javascript
/**
 * 02_status_camera: MeshStateMixin + CameraFocusMixin
 * - 상태 색상 표시 + 클릭 시 카메라 포커스
 *
 * 개별 단위에서는 meshName이 확정이므로
 * resolveMeshName이 불필요하다.
 * page before_load.js에서 하드코딩된 meshName으로 focusOn을 호출한다.
 */

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

applyCameraFocusMixin(this, {
    camera:   wemb.threeElements.camera,
    controls: wemb.threeElements.mainControls,
    duration: 1000
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 (개별 단위 02에서는 없음)
// ======================
// 클릭 이벤트는 page before_load.js에서 처리한다.
// meshName이 확정이므로 컴포넌트 레벨에서 이벤트를 바인딩할 필요 없음.
```

## 02_status_camera — beforeDestroy.js

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.cameraFocus.destroy();
this.meshState?.destroy();
```

---

## 03_status_popup — register.js

```javascript
/**
 * 03_status_popup: MeshStateMixin + 3DShadowPopupMixin
 * - 상태 색상 표시 + 클릭 시 팝업으로 상세 정보 표시
 *
 * 개별 단위에서는:
 * - meshName이 확정이므로 resolveMeshName 불필요
 * - showDetail()에 인자 없음 — 내부에서 getMeshState로 상태 조회
 * - 이벤트 이름이 장비 고유 (예: '@battClicked')
 */

// ======================
// 1. MIXIN 적용
// ======================

// ── MeshStateMixin ────────────────────────────────────────────
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ── 3DShadowPopupMixin ────────────────────────────────────────
const { htmlCode, cssCode } = this.properties.publishCode || {};

apply3DShadowPopupMixin(this, {
    getHTML:   () => htmlCode || '',
    getStyles: () => cssCode || '',
    onCreated: () => {
        this.shadowPopup.bindPopupEvents({
            click: {
                '.popup-close': () => this.shadowPopup.hide()
            }
        });
    }
});

// ======================
// 3. 이벤트 매핑 + showDetail 정의
// ======================

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@장비명Clicked'   // ← 실제 이벤트 이름으로 교체
};
bind3DEvents(this, this.customEvents);

/**
 * showDetail — 인자 없이 호출 (개별 단위 패턴)
 * 내부에서 getMeshState로 자기 자신의 상태를 조회하여 팝업에 표시
 */
this.showDetail = () => {
    this.shadowPopup.show();

    const nameEl = this.shadowPopup.query('.popup-name');
    const statusEl = this.shadowPopup.query('.popup-status');

    if (nameEl) nameEl.textContent = this.name || '장비명';
    if (statusEl) {
        const currentStatus = this.meshState.getMeshState('장비명') || 'normal';
        statusEl.textContent = currentStatus;
        statusEl.dataset.status = currentStatus;
    }
};
```

## 03_status_popup — beforeDestroy.js

```javascript
const { removeCustomEvents } = Wkit;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순) + showDetail 정리
this.showDetail = null;
this.shadowPopup.destroy();
this.meshState?.destroy();
```

---

## 04_highlight — register.js

```javascript
/**
 * 04_highlight: MeshStateMixin + MeshHighlightMixin
 * - 상태 색상 표시 + 클릭 시 선택 강조
 *
 * MeshHighlightMixin은 emissive 채널을 사용하므로
 * MeshStateMixin(color 채널)과 동시 적용 가능하다.
 */

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

applyMeshHighlightMixin(this, {
    highlightColor:     0xFFFF00,
    highlightIntensity: 0.3,
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================
const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@장비명Clicked'   // ← 실제 이벤트 이름으로 교체
};
bind3DEvents(this, this.customEvents);
```

## 04_highlight — beforeDestroy.js

```javascript
const { removeCustomEvents } = Wkit;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.meshHighlight.destroy();
this.meshState?.destroy();
```

---

## 05_camera_highlight — register.js

```javascript
/**
 * 05_camera_highlight: MeshStateMixin + CameraFocusMixin + MeshHighlightMixin
 * - 상태 색상 + 클릭 시 카메라 포커스 + 선택 강조
 */

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

applyCameraFocusMixin(this, {
    camera:   wemb.threeElements.camera,
    controls: wemb.threeElements.mainControls,
    duration: 1000
});

applyMeshHighlightMixin(this, {
    highlightColor:     0xFFFF00,
    highlightIntensity: 0.3,
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================
const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@장비명Clicked'   // ← 실제 이벤트 이름으로 교체
};
bind3DEvents(this, this.customEvents);
```

## 05_camera_highlight — beforeDestroy.js

```javascript
const { removeCustomEvents } = Wkit;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.meshHighlight.destroy();
this.cameraFocus.destroy();
this.meshState?.destroy();
```

---

## page scripts

### loaded.js (모든 변형 공통)

```javascript
const { registerMapping, fetchAndPublish } = GlobalDataPublisher;
const { each, go } = fx;

this.pageDataMappings = [
    {
        topic: 'equipmentStatus',
        datasetInfo: {
            datasetName: '장비명Status',  // ← API 엔드포인트명
            param: {}
        },
        refreshInterval: 30000
    }
];

this.pageParams = {};

go(
    this.pageDataMappings,
    each(registerMapping),
    each(({ topic }) => this.pageParams[topic] = {}),
    each(({ topic }) =>
        fetchAndPublish(topic, this)
            .catch(err => console.error(`[Page] ${topic}:`, err))
    )
);

this.startAllIntervals = () => {
    this.pageIntervals = {};

    go(
        this.pageDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                const state = { _stopped: false, _timerId: null };
                this.pageIntervals[topic] = state;

                const scheduleNext = () => {
                    if (state._stopped) return;
                    state._timerId = setTimeout(() => {
                        fetchAndPublish(topic, this, this.pageParams[topic] || {})
                            .catch(err => console.error(`[Page] ${topic}:`, err))
                            .finally(scheduleNext);
                    }, refreshInterval);
                };
                scheduleNext();
            }
        })
    );
};

this.stopAllIntervals = () => {
    go(
        Object.values(this.pageIntervals || {}),
        each(state => {
            state._stopped = true;
            clearTimeout(state._timerId);
        })
    );
};

this.startAllIntervals();
```

### before_load.js — 03_status_popup

```javascript
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@장비명Clicked': ({ targetInstance }) => {
        targetInstance.showDetail();  // 인자 없이 호출 (개별 단위 패턴)
    },
};

onEventBusHandlers(this.pageEventBusHandlers);
```

### before_load.js — 04_highlight / 05_camera_highlight

```javascript
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@장비명Clicked': ({ targetInstance }) => {
        // 이전 강조 해제 + 새 강조 적용
        targetInstance.meshHighlight.clearAll();
        targetInstance.meshHighlight.highlight('장비명');  // ← 실제 meshName

        // 05에서만: 카메라 포커스
        // targetInstance.cameraFocus.focusOn({ meshName: '장비명' });
    },
};

onEventBusHandlers(this.pageEventBusHandlers);
```

### before_unload.js (모든 변형 공통)

```javascript
const { unregisterMapping } = GlobalDataPublisher;
const { offEventBusHandlers } = Wkit;
const { each, go } = fx;

if (this.stopAllIntervals) this.stopAllIntervals();
this.pageIntervals = null;

offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;

go(
    this.pageDataMappings,
    each(({ topic }) => unregisterMapping(topic))
);
this.pageDataMappings = null;
this.pageParams = null;
```

---

## 출력 구조

```
Components/3D_Components/
└── {장비명}/
    ├── scripts/
    │   ├── 01_status/
    │   │   ├── component/
    │   │   │   ├── register.js
    │   │   │   └── beforeDestroy.js
    │   │   └── page/
    │   │       ├── before_load.js
    │   │       ├── loaded.js
    │   │       └── before_unload.js
    │   ├── 02_status_camera/
    │   │   ├── component/
    │   │   │   ├── register.js
    │   │   │   └── beforeDestroy.js
    │   │   └── page/
    │   │       ├── before_load.js
    │   │       ├── loaded.js
    │   │       └── before_unload.js
    │   ├── 03_status_popup/
    │   │   ├── component/
    │   │   │   ├── register.js
    │   │   │   └── beforeDestroy.js
    │   │   └── page/
    │   │       ├── before_load.js
    │   │       ├── loaded.js
    │   │       └── before_unload.js
    │   ├── 04_highlight/       # 구현 명세에 따라 선택
    │   │   └── ...
    │   └── 05_camera_highlight/
    │       └── ...
    └── preview/
        ├── 01_status.html
        ├── 02_status_camera.html
        ├── 03_status_popup.html
        ├── 04_highlight.html     # 구현 명세에 따라 선택
        └── 05_camera_highlight.html
```

---

## 금지 사항

> 공통 금지 사항은 [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

- ❌ meshName을 동적으로 추출하지 않는다 — 개별 단위는 이름이 확정됨
- ❌ resolveMeshName 함수를 만들지 않는다 — GLTF 컨테이너 전용 패턴
- ❌ showDetail에 meshName/data 인자를 넣지 않는다 — 내부에서 getMeshState로 조회
- ❌ 이벤트 이름에 '@meshClicked'를 사용하지 않는다 — 범용 이름은 GLTF 컨테이너 전용
- ❌ fetchData를 page before_load.js에서 호출하지 않는다 — 개별 단위는 구독 데이터만 사용

---

## 관련 자료

| 문서 | 경로 |
|------|------|
| MeshStateMixin | [Mixins/MeshStateMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md) |
| MeshHighlightMixin | [Mixins/MeshHighlightMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshHighlightMixin.md) |
| MeshVisibilityMixin | [Mixins/MeshVisibilityMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshVisibilityMixin.md) |
| CameraFocusMixin | [Mixins/CameraFocusMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/CameraFocusMixin.md) |
| AnimationMixin | [Mixins/AnimationMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/AnimationMixin.md) |
| ClippingPlaneMixin | [Mixins/ClippingPlaneMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ClippingPlaneMixin.md) |
| 3DShadowPopupMixin | [Mixins/3DShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/3DShadowPopupMixin.md) |
| GLTF 컨테이너 패턴 | [create-3d-container-component](/.claude/skills/2-component/create-3d-container-component/SKILL.md) |
| BATT (참조 구현) | [Components/3D_Components/BATT](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/BATT/) |

---
