const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

const maxOpacity = 1;
const middleOpacity = 0.5;
const minOpacity = 0;
const bubbleOpacity = 0.7;

const minStrokeWidth = 1;
const maxStrokeWidth = 2;


loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    function updateBar(){

        let regions = new Set();

        data.forEach(function(d) {
            regions.add(d.region);
            d.m = +d[param][year];
        });

        data.forEach(function(d) {
            regions.forEach(function(r) {
                if (d.region === r) {
                    d[r] = +d[param][year];
                }
            })
        });

        let mean_values = [];
        regions.forEach(function(r) {
            let mean = d3.mean(data, function(d) { return d[r]; });
            mean_values.push([r, mean]);
        });

        addAxesBarChart(regions, mean_values);

        barChart.selectAll('rect').remove();
        barChart.selectAll('rect').data(mean_values).enter().append('rect')
            .attr('x', d => xBar(d[0]))
            .attr('y', d => yBar(d[1]) - margin)
            .attr('width', xBar.bandwidth())
            .attr('height',  d => height - yBar(d[1]))
            .attr('fill', d => colorScale(d[0]))
            .on('click', function(data) {
                if (highlighted !== this) {
                    barChart.selectAll('rect').attr('opacity',  middleOpacity);
                    d3.select(this).attr('opacity', maxOpacity);
                    scatterPlot.selectAll('circle').style('opacity', minOpacity);
                    scatterPlot.selectAll('circle').filter(d  =>  d.region  ===  data[0])
                        .style('opacity',  bubbleOpacity);
                    highlighted = this;
                }
                else {
                    barChart.selectAll('rect').attr('opacity',  maxOpacity);
                    scatterPlot.selectAll('circle').style('opacity', bubbleOpacity);
                    highlighted = '';
                }
            });
    }

    function addAxesBarChart(regions, mean_values){
        xBar.domain(Array.from(regions));
        xBarAxis.call(d3.axisBottom(xBar));

        yBar.domain([0, d3.max(mean_values, function(d) { return d[1]; })]);
        yBarAxis.call(d3.axisLeft(yBar));
    }

    function updateScatterPlot(){
        addAxesScatterPlot();

        scatterPlot.selectAll('circle').remove();

        scatterPlot.selectAll('circle').data(data).enter().append('circle')
                .attr('cx', d => x(d[xParam][year]))
                .attr('cy', d => y(d[yParam][year]))
                .attr('r', d => radiusScale(d[rParam][year]))
                .attr('fill', d => colorScale(d.region))
                .attr('region', d => (d.region))
                .on('click', function(){
                    if (selected !== this) {
                        scatterPlot.selectAll('circle').attr('stroke-width',  minStrokeWidth);
                        d3.select(this).attr('stroke-width',  maxStrokeWidth).raise();
                        selected = this;
                    }
                    else {
                        selected = '';
                    }
                });
    }

    function addAxesScatterPlot(){
        data.forEach(function(d) {
            d.x = +d[xParam][year];
            d.y = +d[yParam][year];
            d.r = +d[rParam][year];
        });

        let xMax = d3.max(data, function(d) { return d.x; });
        let xMin = d3.min(data, function(d) { return d.x; });

        let yMax = d3.max(data, function(d) { return d.y; });
        let yMin = d3.min(data, function(d) { return d.y; });

        let rMax = d3.max(data, function(d) { return d.r; });
        let rMin = d3.min(data, function(d) { return d.r; });

        x.domain([xMin, xMax]);
        y.domain([yMin, yMax]);
        radiusScale.domain([rMin, rMax]);

        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y));
    }

    updateBar();
    updateScatterPlot();
});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}