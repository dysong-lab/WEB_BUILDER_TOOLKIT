/**
 * PieChart — Dashboard Minimal
 */

const c = { dark: '#1d1d1f', mid: '#86868b', light: '#d2d2d7' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        series: [{
            type: 'pie', radius: ['50%', '72%'], center: ['40%', '52%'],
            label: { show: true, formatter: '{b}', color: c.mid, fontSize: 11, fontFamily: 'Instrument Sans' },
            labelLine: { lineStyle: { color: c.light } },
            itemStyle: { borderColor: '#fcfcfb', borderWidth: 3 }
        }],
        tooltip: { trigger: 'item', backgroundColor: c.dark, borderWidth: 0,
                   textStyle: { color: '#fff', fontSize: 12, fontFamily: 'Instrument Sans' } },
        color: [c.dark, '#86868b', '#aeaeb2', '#d2d2d7', '#e8e8ed']
    },
    mapData: function(data, option) { option.series[0].data = data.items; return option; }
});

this.subscriptions = { dashboard_pieChart: [this.echarts.renderData] };
go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
