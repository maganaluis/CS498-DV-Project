var margin = {
    top: 10,
    right: 10,
    bottom: 100,
    left: 40
  },
  margin2 = {
    top: 490,
    right: 10,
    bottom: 20,
    left: 40
  },
  width = 960 - margin.left - margin.right,
  height = 550 - margin.top - margin.bottom,
  height2 = 550 - margin2.top - margin2.bottom;

var color = d3.scale.category10();

var parseDate = d3.time.format("%Y-%m-%d").parse;

var x = d3.time.scale().range([0, width]),
  x2 = d3.time.scale().range([0, width]),
  y = d3.scale.linear().range([height, 0]),
  y2 = d3.scale.linear().range([height2, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom"),
  xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
  yAxis = d3.svg.axis().scale(y).orient("left");

// https://github.com/d3/d3-3.x-api-reference/blob/master/SVG-Controls.md
var brush = d3.svg.brush()
  .x(x2)
  .on("brush", brush)
  .on("brushend", function(){
    createbarchart(x.domain());
    createdonutcharts(x.domain());
  });

// Define the div for the tooltip
var div = d3.select("#multilinetooltip")
  .attr("class", "tooltip")
  .style("opacity", 0);

var line = d3.svg.line()
  .defined(function(d) {
    return !isNaN(d.valcount);
  })
  .interpolate("cubic")
  .x(function(d) {
    return x(d.date);
  })
  .y(function(d) {
    return y(d.valcount);
  });

var line2 = d3.svg.line()
  .defined(function(d) {
    return !isNaN(d.valcount);
  })
  .interpolate("cubic")
  .x(function(d) {
    return x2(d.date);
  })
  .y(function(d) {
    return y2(d.valcount);
  });

var svg = d3.select("#multilinechart")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

var focus = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
  .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

d3.csv("static/data/MostComplainedCompanies.csv", function(error, data) {

  color.domain(d3.keys(data[0]).filter(function(key) {
    return key !== "Date received";
  }));

  data.forEach(function(d) {
    d['Date received'] = parseDate(d['Date received']);
  });

  var sources = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {
          date: d['Date received'],
          valcount: +d[name]
        };
      })
    };
  });

  x.domain(d3.extent(data, function(d) {
    return d['Date received'];
  }));
  y.domain([d3.min(sources, function(c) {
      return d3.min(c.values, function(v) {
        return v.valcount;
      });
    }),
    d3.max(sources, function(c) {
      return d3.max(c.values, function(v) {
        return v.valcount;
      });
    })
  ]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  var focuslineGroups = focus.selectAll("g")
    .data(sources)
    .enter().append("g");


  var focuslines = focuslineGroups.append("path")
    .attr("class", "line")
    .attr("d", function(d) {
      return line(d.values);
    })
    .style("stroke", function(d) {
      return color(d.name);
    })
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .style("stroke-width", 1.5)
    .on("mouseover", function(d) {
      div.transition()
        .duration(200)
        .style("opacity", .9);
      var value = d3.max(d.values, function(v) {
        return v.valcount;
      });
      var nameLen = d.name.length;
      var coordinates = [0, 0];
      coordinates = d3.mouse(this);
      var x = coordinates[0];
      var y = coordinates[1] + 120;
      div.html(d.name + "<br/>" + " Max: " + value)
        .style("left", x + "px")
        .style("top", y + "px");
    })
    .on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .attr("clip-path", "url(#clip)");

  focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  focus.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Complaint Cnts. Per Day");

  var contextlineGroups = context.selectAll("g")
    .data(sources)
    .enter().append("g");

  var contextLines = contextlineGroups.append("path")
    .attr("class", "line")
    .attr("d", function(d) {
      return line2(d.values);
    })
    .style("stroke", function(d) {
      return color(d.name);
    })
    .attr("clip-path", "url(#clip)");

  context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  context.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
    .attr("y", -6)
    .attr("height", height2 + 7);


  var company = svg.selectAll(".company")
    .data(sources)
    .enter().append("g")
    .attr("class", "company");

  company.append("path")
    .attr("class", "line")
    .attr("data-legend", function(d) {
      return d.name
    })
    .style("stroke", function(d) {
      return color(d.name);
    });

  legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(80,25)")
    .style("font-size", "12px")
    .call(d3.legend)
});

function brush() {
  x.domain(brush.empty() ? x2.domain() : brush.extent());
  focus.selectAll("path.line").attr("d", function(d) {
    return line(d.values)
  });
  focus.select(".x.axis").call(xAxis);
  focus.select(".y.axis").call(yAxis);
}
