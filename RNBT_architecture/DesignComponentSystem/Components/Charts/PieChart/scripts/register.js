/**
 * Charts — PieChart
 *
 * 목적: 운영 지표 비중을 도넛 차트로 시각화한다
 * 기능: EChartsMixin과 mapData로 항목 분포를 렌더링한다
 *
 * Mixin: EChartsMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyEChartsMixin(this, {
    cssSelectors: {
        container: '.pie-chart__canvas'
    },
    option: {
        tooltip: {
            trigger: 'item',
            backgroundColor: '#08111d',
            borderWidth: 0,
            textStyle: { color: '#ffffff', fontFamily: 'SUIT' }
        },
        legend: { show: false },
        color: ['#78b7ff', '#53d2a2', '#ffd166', '#ff8a65', '#c9d6e8'],
        series: [
            {
                type: 'pie',
                radius: ['52%', '74%'],
                center: ['50%', '54%'],
                itemStyle: { borderColor: '#0c1624', borderWidth: 3 },
                label: { color: 'rgba(205, 225, 255, 0.76)', fontFamily: 'SUIT', fontSize: 12 },
                labelLine: { lineStyle: { color: 'rgba(205, 225, 255, 0.24)' } }
            }
        ]
    },
    mapData: function(data, option) {
        option.series[0].data = data.items;
        return option;
    }
});

this.subscriptions = {
    chartData: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

this.customEvents = {};
bindEvents(this, this.customEvents);
