/**
 * PieChart 컴포넌트
 *
 * 목적: 데이터를 pie 차트로 시각화한다
 * 기능: EChartsMixin으로 차트를 렌더링한다
 *
 * Mixin: EChartsMixin
 * 데이터 규약: { items: [{ name: String, value: Number }, ...] }
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

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

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    pieChartData: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
