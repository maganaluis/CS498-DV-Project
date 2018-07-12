function createdonutcharts(domainData) {
  var parseDate = d3.time.format("%Y-%m-%d")
  var startDate = parseDate(domainData[0])
  var endDate = parseDate(domainData[1])
  d3.json("/get_donutchart_data")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({
        start: startDate,
        end: endDate
      }), function(error, data) {
        var period =  startDate + ' - ' + endDate;
        var donuts = new DonutCharts();
        donuts.create(data, period);

    });
}

  function DonutCharts() {

    var charts = d3.select('#donut-charts');

    var chart_m,
      chart_r,
      color = d3.scale.category10();

      var getCatNames = function(dataset){
          var Cats = new Array();
          for(var i = 0; i < dataset.length; i++){
              var CatNames = new Array();
              for(var j = 0; j < dataset[i].data.length; j++){
                  CatNames.push(dataset[i].data[j].cat);
              }
            Cats.push(CatNames);
          }

          return Cats;
      }

      var createLegend = function(catNames, period) {
            var legendsDiv = charts.selectAll('.doni-div')
            .data(catNames)
            .append('svg:svg')
            .attr('width', '55%')
            .attr('height', '100%')
            .attr('transform', 'translate(20, -100)')
            .attr('class', function(d, i){
                  return "legend-" + i;
                  });

        for(var i = 0; i < catNames.length; i++){
          var svg = d3.select(".legend-" + i);
          var legend = svg.selectAll('.legend-g')
                 .data(catNames[i])
                 .enter()
                 .append('g')
                 .attr("class", "legend-g")
                 .attr('transform', function(d, i) {
                   if (i < 5) {
                    return "translate(10," + (i + 1) * 22 + ")";
                  } else {
                    var transL = (6 - (10 - i))
                    return "translate(320," + transL * 22 + ")";
                  }
               });

               legend.append('circle')
                 .attr('class', 'legend-icon')
                 .attr('r', 7)
                 .style('fill', function(d, i) {
                   return color(i);
                 });

               legend.append('text')
                 .attr('dx', '1em')
                 .attr('dy', '.3em')
                 .style('font-size','10')
                 .text(function(d) {
                   return d;
                 });
        }
        otherLegend = svg.selectAll('.OtherLegend')
                        .data([0])
                        .enter()
                        .append('g')
                        .attr("class", "OtherLegend")
                        .attr("transform", "translate(155, 145)");

                      otherLegend.append('text')
                      .attr('dx', '1em')
                      .attr('dy', '.3em')
                      .style('font-size','10')
                      .text('Data for period: ' + period);
      }

    var createCenter = function(pie) {

      var eventObj = {
        'mouseover': function(d, i) {
          d3.select(this)
            .transition()
            .attr("r", chart_r * 0.65);
        },

        'mouseout': function(d, i) {
          d3.select(this)
            .transition()
            .duration(500)
            .ease('bounce')
            .attr("r", chart_r * 0.6);
        },

        'click': function(d, i) {
          var paths = charts.selectAll('.clicked');
          pathAnim(paths, 0);
          paths.classed('clicked', false);
          resetAllCenterText();
        }
      }

      var donuts = d3.selectAll('.donut');

      // The circle displaying total data.
      donuts.append("svg:circle")
        .attr("r", chart_r * 0.6)
        .style("fill", "#E7E7E7")
        .on(eventObj);

      donuts.append('text')
        .attr('class', 'center-txt type')
        .attr('y', chart_r * -0.16)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(function(d, i) {
          return d.type;
        });
      donuts.append('text')
        .attr('class', 'center-txt value')
        .attr('text-anchor', 'middle');
      donuts.append('text')
        .attr('class', 'center-txt percentage')
        .attr('y', chart_r * 0.16)
        .attr('text-anchor', 'middle')
        .style('fill', '#A2A2A2');
      donuts.append('text')
        .attr('class', 'center-txt category')
        .attr('y', chart_r * 0.28)
        .attr('text-anchor', 'middle')
        .style('fill', '#A2A2A2');
    }

    var setCenterText = function(thisDonut) {
      var cat;
      var sum = d3.sum(thisDonut.selectAll('.clicked').data(), function(d) {
        cat = d.data.cat;
        return d.data.val;
      });

      thisDonut.select('.value')
        .text(function(d) {
          return (sum) ? sum.toFixed(1) + ' ' + d.unit :
            d.total.toFixed(1) + ' ' + d.unit;
        });
      thisDonut.select('.percentage')
        .text(function(d) {
          return (sum) ? (sum / d.total * 100).toFixed(2) + '%' :
            '';
        });
      thisDonut.select('.category')
        .text(function(d) {
          return (cat) ? cat : '';
        });
    }

    var resetAllCenterText = function() {
      charts.selectAll('.value')
        .text(function(d) {
          return d.total.toFixed(1) + ' ' + d.unit;
        });
      charts.selectAll('.percentage')
        .text('');
      charts.selectAll('.category')
        .text('');
    }

    var pathAnim = function(path, dir) {
      switch (dir) {
        case 0:
          path.transition()
            .duration(500)
            .ease('bounce')
            .attr('d', d3.svg.arc()
              .innerRadius(chart_r * 0.7)
              .outerRadius(chart_r)
            );
          break;

        case 1:
          path.transition()
            .attr('d', d3.svg.arc()
              .innerRadius(chart_r * 0.7)
              .outerRadius(chart_r * 1.08)
            );
          break;
      }
    }

    var updateDonut = function() {

      var eventObj = {

        'mouseover': function(d, i, j) {
          pathAnim(d3.select(this), 1);

          var thisDonut = charts.select('.type' + j);
          thisDonut.select('.value').text(function(donut_d) {
            return d.data.val.toFixed(1) + ' ' + donut_d.unit;
          });
          thisDonut.select('.percentage').text(function(donut_d) {
            return (d.data.val / donut_d.total * 100).toFixed(2) + '%';
          })
          thisDonut.select('.category').text(function(donut_d) {
            return d.data.cat;
          });
        },

        'mouseout': function(d, i, j) {
          var thisPath = d3.select(this);
          if (!thisPath.classed('clicked')) {
            pathAnim(thisPath, 0);
          }
          var thisDonut = charts.select('.type' + j);
          setCenterText(thisDonut);
        },

        'click': function(d, i, j) {
          var thisDonut = charts.select('.type' + j);

          if (0 === thisDonut.selectAll('.clicked')[0].length) {
            thisDonut.select('circle').on('click')();
          }

          var thisPath = d3.select(this);
          var clicked = thisPath.classed('clicked');
          pathAnim(thisPath, ~~(!clicked));
          thisPath.classed('clicked', !clicked);

          setCenterText(thisDonut);
        }
      };

      var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) {
          return d.val;
        });

      var arc = d3.svg.arc()
        .innerRadius(chart_r * 0.7)
        .outerRadius(function() {
          return (d3.select(this).classed('clicked')) ? chart_r * 1.08 :
            chart_r;
        });

      // Start joining data with paths
      var paths = charts.selectAll('.donut')
        .selectAll('path')
        .data(function(d, i) {
          return pie(d.data);
        });

      paths
        .transition()
        .duration(1000)
        .attr('d', arc);

      paths.enter()
        .append('svg:path')
        .attr('d', arc)
        .style('fill', function(d, i) {
          return color(i);
        })
        .style('stroke', '#FFFFFF')
        .on(eventObj)

      paths.exit().remove();

      resetAllCenterText();
    }

    this.create = function(dataset, period) {
      // Remove Old SVG within the Div
      d3.select("#donut-charts").selectAll('svg').remove();
      d3.select("#donut-charts").selectAll('div').remove();

      var $charts = $('#donut-charts');
      chart_m = $charts.innerWidth() / dataset.length / 2 * 0.10;
      chart_r = $charts.innerWidth() / dataset.length / 2 * 0.55;


      var donut = charts.selectAll('.donut')
        .data(dataset)
        .enter()
        .append('div:div')
        .attr('class', 'doni-div')
        .append('svg:svg')
        .attr('width', (chart_r + chart_m) * 2)
        .attr('height', (chart_r + chart_m) * 2)
        .append('svg:g')
        .attr('class', function(d, i) {
          return 'donut type' + i;
        })
        .attr('transform', 'translate(' + (chart_r + chart_m) + ',' + (chart_r + chart_m) + ')');

      createCenter();
      updateDonut();
      createLegend(getCatNames(dataset), period);
    }

    this.update = function(dataset) {
      // Assume no new categ of data enter
      var donut = charts.selectAll(".donut")
        .data(dataset);

      updateDonut();
    }
  }
