// Setup svg using Bostock's margin convention
function createbarchart(domainData) {
  var parseDate = d3.time.format("%Y-%m-%d")
  var startDate = parseDate(domainData[0])
  var endDate = parseDate(domainData[1])

  d3.json("/get_stackedbar_data")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({
      start: startDate,
      end: endDate
    }), function(error, data) {
      var margin = {
        top: 20,
        right: 160,
        bottom: 50,
        left: 40
      };
      var width = 960 - margin.left - margin.right,
        height = 550 - margin.top - margin.bottom;

      // Remove Old SVG within the Div
      d3.select("#stackedbarchart").select('svg').remove();

      var svg = d3.select("#stackedbarchart").append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var columns = []
      d3.keys(data[0]).filter(function(key) {
        if (key !== 'Company') {
          columns.push(key);
        }
      })

      // Transpose the data into layers
      var dataset = d3.layout.stack()(columns.map(function(product) {
        var sum = 0;
        data.forEach(function(d) {
          sum += d[product];
        });
        return data.map(function(d) {
          return {
            x: d['Company'],
            y: +d[product],
            s: sum
          };
        });
      }));


      // Set x, y and colors
      var x = d3.scale.ordinal()
        .domain(dataset[0].map(function(d) {
          return d.x;
        }))
        .rangeRoundBands([10, width - 10], 0.02);

      var y = d3.scale.linear()
        .domain([0, d3.max(dataset, function(d) {
          return d3.max(d, function(d) {
            return d.y0 + d.y;
          });
        })])
        .range([height, 0]);

      //var colors = ["#001f3f", "#0074D9", "#7FDBFF", "#39CCCC", "#3D9970", "#2ECC40", "#01FF70", "#FFDC00", "#FF851B", "#FF4136"]
      var colorRange = d3.range(columns.length);
      var colors = d3.scale.category10();

      colors.domain(d3.keys(data[0]).filter(function(key) {
        return key !== "Company";
      }));


      // Define and draw axes
      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5)
        .tickSize(-width, 0, 0)
        .tickFormat(function(d) {
          return d
        });

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

      var period =  startDate + ' - ' + endDate;

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Complaint Cnts : " + period);


      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll(".tick text")
        .call(wrap, x.rangeBand());



      // Create groups for each series, rects for each segment
      var groups = svg.selectAll("g.cost")
        .data(dataset)
        .enter().append("g")
        .attr("col-num", function(d, i) {
          return columns[i];
        })
        .style("fill", function(d, i) {
          return colors(i);
        });

      var rect = groups.selectAll("rect")
        .data(function(d) {
          return d;
        })
        .enter()
        .append("rect")
        .attr("x", function(d) {
          return x(d.x);
        })
        .attr("y", function(d) {
          return y(d.y0 + d.y);
        })
        .attr("height", function(d) {
          return y(d.y0) - y(d.y0 + d.y);
        })
        .attr("width", x.rangeBand())
        .on("mouseover", function() {
          tooltip.style("display", null);
        })
        .on("mouseout", function(d, i) {
          tooltip.style("display", "none");
        })
        .on("mousemove", function(d, i) {
          var xPosition = d3.mouse(this)[0] - 15;
          var yPosition = d3.mouse(this)[1] - 35;
          tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
          c = d3.select(this.parentNode).attr("col-num")
          var text1 = "Complaints: " + d.y
          var text2 = "Product: " + c
          tooltip.select('.text1').text(text1);
          tooltip.select('.text2').text(text2);
        })
        .on("click", function(d, i) { // May be later
          d3.select(this).append('rect')
            .attr('x', x(d.x))
            .attr('y', d.s);
        });

      // Draw legend
      var legend = svg.selectAll(".legend")
        .data(colorRange)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
          return "translate(30," + i * 19 + ")";
        });

      legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) {
          return colors(i);
        });

      legend.append("text")
        .attr("x", width + 5)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d, i) {
          return columns[i]
        });


      // Prep the tooltip bits, initial display is hidden
      var tooltip = svg.append("g")
        .attr("class", "tooltip")
        .style("display", "none");

      tooltip.append("rect")
        .attr("width", 160)
        .attr("height", 30)
        .attr("fill", "black")
        .style("opacity", 0.5);


      tooltip.append("text")
        .attr("x", 10)
        .attr("y", 12)
        .attr("fill", "white")
        .attr("class", "text1")
        .style("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

      tooltip.append("text")
        .attr("x", 10)
        .attr("y", 27)
        .attr("fill", "white")
        .attr("class", "text2")
        .style("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

      tooltip.append("text")
        .attr("x", 15)
        .attr("dy", "1.2em")
        .attr("class", "wraprect")
        .style("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

      function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
          }
        });
      }
    });
}
