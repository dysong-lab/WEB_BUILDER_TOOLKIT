/**
 * HeatmapRenderMixin
 *
 * 히트맵 서피스를 생성하고, 데이터를 매핑하여 표시한다.
 *
 * GPU Shader 기반으로 히트맵 서피스를 렌더링한다.
 * 데이터 포인트의 위치와 값을 받아 열 분포를 시각화한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyHeatmapRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.heatmap-container'
 *       },
 *       preset: {
 *           radius: 25,
 *           maxOpacity: 0.8,
 *           blur: 0.85,
 *           gradient: { 0.4: 'blue', 0.6: 'green', 0.8: 'yellow', 1.0: 'red' }
 *       }
 *   });
 *
 *   // renderData는 히트맵 데이터 포인트 배열을 받는다:
 *   // [{ x: 100, y: 200, value: 0.8 }, ...]
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.heatmapRender):
 *
 *   this.heatmapRender.cssSelectors    — 선택자
 *   this.heatmapRender.renderData      — { response } → 히트맵 데이터 적용
 *   this.heatmapRender.updateConfig    — 프리셋 변경
 *   this.heatmapRender.clear           — 히트맵 데이터 초기화
 *   this.heatmapRender.destroy         — 서피스 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyHeatmapRenderMixin(instance, options) {
    const { cssSelectors = {}, preset = {} } = options;

    const container = cssSelectors.container;

    const ns = {};
    instance.heatmapRender = ns;

    ns.cssSelectors = { ...cssSelectors };

    let heatmapInstance = null;
    let currentPreset = { ...preset };

    /**
     * 히트맵 인스턴스 생성 (lazy init)
     */
    function ensureInstance() {
        if (heatmapInstance) return heatmapInstance;

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[HeatmapRenderMixin] container not found: ' + container);

        heatmapInstance = h337.create({
            container: containerEl,
            ...currentPreset
        });
        return heatmapInstance;
    }

    /**
     * 데이터 렌더링 — 히트맵 데이터 포인트 적용
     *
     * @param {{ response: { data: Object } }} payload
     *   data.max — 최대값
     *   data.points — [{ x, y, value }, ...]
     */
    ns.renderData = function({ response }) {
        const { data } = response;
        if (!data) throw new Error('[HeatmapRenderMixin] data is null');

        ensureInstance().setData({
            max: data.max || 1,
            data: data.points || data
        });
    };

    /**
     * 프리셋 변경
     *
     * @param {Object} newPreset - 변경할 프리셋 값
     */
    ns.updateConfig = function(newPreset) {
        currentPreset = { ...currentPreset, ...newPreset };
        if (heatmapInstance) {
            heatmapInstance.configure(currentPreset);
        }
    };

    /**
     * 히트맵 데이터 초기화
     */
    ns.clear = function() {
        if (heatmapInstance) heatmapInstance.setData({ max: 1, data: [] });
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        if (heatmapInstance) {
            heatmapInstance.setData({ max: 1, data: [] });
            heatmapInstance = null;
        }
        currentPreset = null;
        ns.renderData = null;
        ns.updateConfig = null;
        ns.clear = null;
        ns.cssSelectors = null;
        instance.heatmapRender = null;
    };
}
