/**
 * LineChart 컴포넌트
 *
 * 목적: 데이터를 보여준다
 * 기능: EChartsMixin으로 시계열 데이터를 라인 차트로 시각화한다
 *
 * Mixin: EChartsMixin
 * 데이터 규약: { categories: [...], values: [[...], [...]] }
 */

const { applyEChartsMixin } = Wkit;

// ── 1. Mixin 적용 ──
applyEChartsMixin(this, {
    cssSelectors: {
        container: '.chart__canvas'
    },
    option: {
        xAxis: { type: 'category' },
        yAxis: { type: 'value' },
        series: [
            { name: 'CPU', type: 'line', smooth: true },
            { name: 'Memory', type: 'line', smooth: true }
        ],
        tooltip: { trigger: 'axis' },
        legend: { data: ['CPU', 'Memory'] }
    }
});

// ── 2. 구독 ──
this.subscriptions = {
    chartData: [this.echarts.renderData]
};

Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => Wkit.subscribe(topic, this, handler))
);
