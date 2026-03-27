/**
 * GaugeChart — Dashboard DarkTech
 */

const p = { cyan: '#4dd0e1', grid: '#1a2030', muted: '#4a5568', text: '#c8cdd5' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        series: [{
            type: 'gauge', min: 0, max: 100, startAngle: 200, endAngle: -20,
            progress: { show: true, width: 10, itemStyle: { color: p.cyan } },
            axisLine: { lineStyle: { width: 10, color: [[1, p.grid]] } },
            axisTick: { show: false },
            splitLine: { length: 6, lineStyle: { color: p.muted, width: 1 } },
            axisLabel: { distance: 16, color: p.muted, fontSize: 9, fontFamily: 'IBM Plex Mono' },
            pointer: { show: false },
            title: { offsetCenter: [0, '30%'], color: p.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' },
            detail: { valueAnimation: true, offsetCenter: [0, '0%'], formatter: '{value}%',
                      fontSize: 26, fontWeight: 600, fontFamily: 'IBM Plex Mono', color: p.cyan }
        }]
    },
    mapData: function(data, option) { option.series[0].data = [{ value: data.value, name: data.name }]; return option; }
});

this.subscriptions = { dashboard_gauge: [this.echarts.renderData] };
go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
