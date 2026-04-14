/**
 * Charts — ScatterChart
 *
 * 목적: 점군 분포를 산점도로 시각화한다
 * 기능: EChartsMixin과 mapData로 2개 scatter series를 렌더링한다
 *
 * Mixin: EChartsMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyEChartsMixin(this, {
    cssSelectors: {
        container: '.scatter-chart__canvas'
    },
    option: {
        animationDuration: 500,
        tooltip: {
            trigger: 'item',
            backgroundColor: '#08111d',
            borderWidth: 0,
            textStyle: { color: '#ffffff', fontFamily: 'SUIT' }
        },
        legend: { show: false },
        xAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: 'rgba(205, 225, 255, 0.12)' } },
            axisLabel: { color: 'rgba(205, 225, 255, 0.62)', fontSize: 11, fontFamily: 'SUIT' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: 'rgba(205, 225, 255, 0.12)' } },
            axisLabel: { color: 'rgba(205, 225, 255, 0.62)', fontSize: 11, fontFamily: 'SUIT' }
        },
        series: [
            {
                name: 'Cluster A',
                type: 'scatter',
                symbolSize: 14,
                itemStyle: { color: '#78b7ff' }
            },
            {
                name: 'Cluster B',
                type: 'scatter',
                symbolSize: 14,
                itemStyle: { color: '#53d2a2' }
            }
        ]
    },
    mapData: function(data, option) {
        option.series[0].data = data.values[0];
        option.series[1].data = data.values[1];
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
