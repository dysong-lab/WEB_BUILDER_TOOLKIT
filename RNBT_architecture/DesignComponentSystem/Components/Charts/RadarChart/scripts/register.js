/**
 * Charts — RadarChart
 *
 * 목적: 다축 성능 프로파일을 레이더 차트로 시각화한다
 * 기능: EChartsMixin과 mapData로 2개 profile을 렌더링한다
 *
 * Mixin: EChartsMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyEChartsMixin(this, {
    cssSelectors: {
        container: '.radar-chart__canvas'
    },
    option: {
        tooltip: {
            trigger: 'item',
            backgroundColor: '#08111d',
            borderWidth: 0,
            textStyle: { color: '#ffffff', fontFamily: 'SUIT' }
        },
        legend: { show: false },
        radar: {
            radius: '66%',
            splitNumber: 4,
            axisName: { color: 'rgba(205, 225, 255, 0.72)', fontSize: 11, fontFamily: 'SUIT' },
            splitLine: { lineStyle: { color: 'rgba(205, 225, 255, 0.12)' } },
            splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] } },
            axisLine: { lineStyle: { color: 'rgba(205, 225, 255, 0.12)' } }
        },
        series: [
            {
                type: 'radar',
                data: [],
                areaStyle: { color: 'rgba(120, 183, 255, 0.18)' },
                lineStyle: { color: '#78b7ff', width: 2 },
                itemStyle: { color: '#78b7ff' }
            }
        ]
    },
    mapData: function(data, option) {
        option.radar.indicator = data.indicators;
        option.series[0].data = [
            { value: data.values[0], name: 'Profile A' },
            { value: data.values[1], name: 'Profile B' }
        ];
        option.series[0].areaStyle = undefined;
        option.series[0].lineStyle = undefined;
        option.series[0].itemStyle = undefined;
        option.series[0].data[0].lineStyle = { color: '#78b7ff', width: 2 };
        option.series[0].data[0].areaStyle = { color: 'rgba(120, 183, 255, 0.18)' };
        option.series[0].data[0].itemStyle = { color: '#78b7ff' };
        option.series[0].data[1].lineStyle = { color: '#53d2a2', width: 2 };
        option.series[0].data[1].areaStyle = { color: 'rgba(83, 210, 162, 0.16)' };
        option.series[0].data[1].itemStyle = { color: '#53d2a2' };
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
