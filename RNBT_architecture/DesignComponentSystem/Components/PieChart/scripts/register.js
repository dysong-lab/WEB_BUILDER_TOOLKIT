/**
 * PieChart 컴포넌트
 *
 * 목적: 데이터를 보여준다
 * 기능: EChartsMixin + mapData로 비율 데이터를 파이 차트로 시각화한다
 *
 * Mixin: EChartsMixin
 * 데이터 규약: { items: [{ name: String, value: Number }, ...] }
 */

const { applyEChartsMixin } = Wkit;

// ── 1. Mixin 적용 ──
applyEChartsMixin(this, {
    cssSelectors: {
        container: '.chart__canvas'
    },
    option: {
        series: [{
            type: 'pie',
            radius: ['40%', '65%'],
            label: { show: true, formatter: '{b}: {d}%' }
        }],
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: 10, top: 'center' }
    },
    mapData: function(data, option) {
        option.series[0].data = data.items;
        return option;
    }
});

// ── 2. 구독 ──
this.subscriptions = {
    pieChartData: [this.echarts.renderData]
};

Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => Wkit.subscribe(topic, this, handler))
);
