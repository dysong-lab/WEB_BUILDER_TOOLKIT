/**
 * AnimationMixin
 *
 * 3D 모델의 동작을 재현한다.
 *
 * GLTF AnimationClip을 AnimationMixer로 재생/정지/속도 제어한다.
 * instance.appendElement로 Mixer를 생성하고,
 * instance.animations에서 클립을 자동 획득한다.
 * 재생 중인 Action이 있을 때만 내부 RAF 루프를 유지한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyAnimationMixin(this);
 *
 *   this.animation.play('FanRotation', { loop: THREE.LoopRepeat });
 *   this.animation.stop('FanRotation');
 *   this.animation.stopAll();
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.animation):
 *
 *   this.animation.play          — 클립 재생
 *   this.animation.stop          — 클립 정지
 *   this.animation.setSpeed      — 재생 속도 변경
 *   this.animation.stopAll       — 모든 클립 정지
 *   this.animation.isPlaying     — 재생 상태 조회
 *   this.animation.getClipNames  — 사용 가능한 클립 이름 목록
 *   this.animation.destroy       — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyAnimationMixin(instance) {
    const ns = {};
    instance.animation = ns;

    const mixer = new THREE.AnimationMixer(instance.appendElement);
    const clock = new THREE.Clock(false);
    const actionMap = new Map();

    let rafId = null;

    /**
     * 내부 RAF 루프 시작
     */
    function startLoop() {
        if (rafId !== null) return;
        clock.start();

        function tick() {
            const delta = clock.getDelta();
            mixer.update(delta);
            rafId = requestAnimationFrame(tick);
        }

        rafId = requestAnimationFrame(tick);
    }

    /**
     * 내부 RAF 루프 중단
     */
    function stopLoop() {
        if (rafId === null) return;
        cancelAnimationFrame(rafId);
        rafId = null;
        clock.stop();
    }

    /**
     * 활성 Action 수 확인 후 루프 중단 여부 결정
     */
    function checkAndStopLoop() {
        let hasActive = false;
        actionMap.forEach(function(action) {
            if (action.isRunning()) hasActive = true;
        });
        if (!hasActive) stopLoop();
    }

    /**
     * 클립 재생
     *
     * @param {string} clipName - 재생할 AnimationClip 이름
     * @param {Object} [options]
     * @param {number} [options.loop] - THREE.LoopRepeat / THREE.LoopOnce / THREE.LoopPingPong
     * @param {number} [options.timeScale] - 재생 속도 배율
     * @param {boolean} [options.clampWhenFinished] - LoopOnce 시 마지막 프레임 유지
     */
    ns.play = function(clipName, options) {
        const clips = instance.animations;
        if (!clips || clips.length === 0) return;

        // 이미 재생 중이면 무시
        if (actionMap.has(clipName) && actionMap.get(clipName).isRunning()) return;

        const clip = THREE.AnimationClip.findByName(clips, clipName);
        if (!clip) return;

        const {
            loop = THREE.LoopRepeat,
            timeScale = 1.0,
            clampWhenFinished = false
        } = options || {};

        const action = mixer.clipAction(clip);
        action.loop = loop;
        action.timeScale = timeScale;
        action.clampWhenFinished = clampWhenFinished;
        action.reset().play();

        actionMap.set(clipName, action);
        startLoop();
    };

    /**
     * 클립 정지
     *
     * @param {string} clipName - 정지할 클립 이름
     */
    ns.stop = function(clipName) {
        const action = actionMap.get(clipName);
        if (!action) return;

        action.stop();
        actionMap.delete(clipName);
        checkAndStopLoop();
    };

    /**
     * 재생 중인 클립의 속도 변경
     *
     * @param {string} clipName
     * @param {number} speed - 재생 속도 배율
     */
    ns.setSpeed = function(clipName, speed) {
        const action = actionMap.get(clipName);
        if (!action || !action.isRunning()) return;

        action.timeScale = speed;
    };

    /**
     * 모든 클립 정지
     */
    ns.stopAll = function() {
        actionMap.forEach(function(action) {
            action.stop();
        });
        actionMap.clear();
        stopLoop();
    };

    /**
     * 클립 재생 상태 조회
     *
     * @param {string} clipName
     * @returns {boolean}
     */
    ns.isPlaying = function(clipName) {
        const action = actionMap.get(clipName);
        return action ? action.isRunning() : false;
    };

    /**
     * 사용 가능한 클립 이름 목록 반환
     *
     * @returns {string[]}
     */
    ns.getClipNames = function() {
        const clips = instance.animations;
        if (!clips || clips.length === 0) return [];
        return clips.map(function(clip) { return clip.name; });
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        stopLoop();
        mixer.stopAllAction();
        mixer.uncacheRoot(instance.appendElement);
        actionMap.clear();
        ns.play = null;
        ns.stop = null;
        ns.setSpeed = null;
        ns.stopAll = null;
        ns.isPlaying = null;
        ns.getClipNames = null;
        instance.animation = null;
    };
}
