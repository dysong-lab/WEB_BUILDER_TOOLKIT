/**
 * ChartRenderMixin
 *
 * 차트 인스턴스를 생성하고, 옵션을 적용하여 표시한다.
 *
 * ListRenderMixin이 template을 복제하여 DOM을 생성하듯,
 * ChartRenderMixin은 ECharts 인스턴스를 생성하여 차트를 렌더링한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyChartRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.chart-container'
 *       }
 *   });
 *
 *   // renderData는 ECharts 옵션 객체를 받는다:
 *   // { xAxis: {...}, yAxis: {...}, series: [...] }
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.chartRender):
 *
 *   this.chartRender.cssSelectors   — 선택자
 *   this.chartRender.renderData     — { response } → 차트 옵션 적용
 *   this.chartRender.setOption      — 옵션 직접 적용 (merge 가능)
 *   this.chartRender.resize         — 차트 리사이즈
 *   this.chartRender.getInstance    — ECharts 인스턴스 반환
 *   this.chartRender.destroy        — 인스턴스 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyChartRenderMixin(instance, options) {
    const { cssSelectors = {} } = options;

    const container = cssSelectors.container;

    const ns = {};
    instance.chartRender = ns;

    ns.cssSelectors = { ...cssSelectors };

    let chartInstance = null;

    /**
     * 컨테이너에 차트 인스턴스 생성 (lazy init)
     */
    function ensureInstance() {
        if (chartInstance) return chartInstance;

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[ChartRenderMixin] container not found: ' + container);

        chartInstance = echarts.init(containerEl);
        return chartInstance;
    }

    /**
     * 데이터 렌더링 — ECharts 옵션 적용
     *
     * @param {{ response: { data: Object } }} payload
     */
    ns.renderData = function({ response }) {
        const { data } = response;
        if (!data) throw new Error('[ChartRenderMixin] data is null');

        ensureInstance().setOption(data);
    };

    /**
     * 옵션 직접 적용
     *
     * @param {Object} option - ECharts 옵션
     * @param {boolean} [notMerge=false] - true이면 기존 옵션 대체
     */
    ns.setOption = function(option, notMerge) {
        ensureInstance().setOption(option, notMerge);
    };

    /**
     * 차트 리사이즈
     */
    ns.resize = function() {
        if (chartInstance) chartInstance.resize();
    };

    /**
     * ECharts 인스턴스 반환 (고급 사용)
     */
    ns.getInstance = function() {
        return chartInstance;
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        if (chartInstance) {
            chartInstance.dispose();
            chartInstance = null;
        }
        ns.renderData = null;
        ns.setOption = null;
        ns.resize = null;
        ns.getInstance = null;
        ns.cssSelectors = null;
        instance.chartRender = null;
    };
}
