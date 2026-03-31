/**
 * HeatmapJsMixin
 *
 * 히트맵 서피스를 생성하고, 데이터를 매핑하여 표시한다.
 *
 * heatmap.js(h337) 기반으로 히트맵 서피스를 렌더링한다.
 * 데이터 포인트의 위치와 값을 받아 열 분포를 시각화한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyHeatmapJsMixin(this, {
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
 * Mixin이 주입하는 것 (네임스페이스: this.heatmapJs):
 *
 *   this.heatmapJs.cssSelectors    — 선택자
 *   this.heatmapJs.renderData      — { response } → 히트맵 데이터 적용
 *   this.heatmapJs.updateConfig    — 프리셋 변경
 *   this.heatmapJs.clear           — 히트맵 데이터 초기화
 *   this.heatmapJs.getInstance     — h337 인스턴스 반환
 *   this.heatmapJs.destroy         — 서피스 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyHeatmapJsMixin(instance, options) {
    const { cssSelectors = {}, preset = {} } = options;

    const container = cssSelectors.container;

    const ns = {};
    instance.heatmapJs = ns;

    ns.cssSelectors = { ...cssSelectors };

    let heatmapInstance = null;
    let currentPreset = { ...preset };

    /**
     * 히트맵 인스턴스 생성 (lazy init)
     */
    function ensureInstance() {
        if (heatmapInstance) return heatmapInstance;

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[HeatmapJsMixin] container not found: ' + container);

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
    ns.renderData = function({ response: data }) {
        if (!data) throw new Error('[HeatmapJsMixin] data is null');

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
     * h337 인스턴스 반환 (고급 사용)
     */
    ns.getInstance = function() {
        return heatmapInstance;
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
        ns.getInstance = null;
        ns.cssSelectors = null;
        instance.heatmapJs = null;
    };
}
