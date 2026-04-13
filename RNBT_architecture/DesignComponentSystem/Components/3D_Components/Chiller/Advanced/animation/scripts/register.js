/**
 * Chiller — Advanced/animation / scripts / register
 *
 * MeshStateMixin + AnimationMixin
 * 상태 색상 + equipmentStatus의 runningClips 배열 기반 AnimationClip 재생/정지
 *
 * MeshState는 material.color, Animation은 AnimationMixer(bone/transform)를
 * 다루므로 두 Mixin의 조작 채널이 독립적이다.
 */

// ── MeshStateMixin ────────────────────────────────────────────

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

// ── AnimationMixin ────────────────────────────────────────────

applyAnimationMixin(this);

// ── 커스텀 메서드: equipmentStatus → animation ────────────────

this.updateEquipmentAnimation = function({ response: data }) {
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return;

    const desired = new Set(row.runningClips || []);
    const clips = this.animation.getClipNames();

    clips.forEach(name => {
        const shouldRun = desired.has(name);
        const isRunning = this.animation.isPlaying(name);
        if (shouldRun && !isRunning) {
            this.animation.play(name, { loop: THREE.LoopRepeat });
        } else if (!shouldRun && isRunning) {
            this.animation.stop(name);
        }
    });
}.bind(this);

// ── 구독 연결 ────────────────────────────────────────────────

this.subscriptions = {
    equipmentStatus: [this.meshState.renderData, this.updateEquipmentAnimation]
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
