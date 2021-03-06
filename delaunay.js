// gracias a http://bl.ocks.org/mbostock/76342abc327062128604

function drawHeaderBG(selection, width, height, radius, lightness, lightDecay, delaunayOpacity, bgColor) {
  // default width = 960; default height = 500
  // var radius = 10;

  var colorOptions = [ ['#3c3f85','#b6c5f5','#257950','#8dd5b3','#75878c'],
                 ['#6b62a5','#afc6fe','#de91d9','#791c76','#2c7ea9'],
                 ['#ed820a','#871d32','#d0c3c6','#807477','#fe5360'],
                 ['#2c5c39','#a7d297','#2db45c','#c0d122']
               ].map(function(palette) {
                 return palette.map(function(color) { return d3.lab(color); });
               });

  var svg = selection.append("svg")
        .attr("width", width)
        .attr("height", height),
      bgG = svg.append('g'),
      delaunayG = svg.append('g');

  bgG.append('rect').attr('width', width).attr('height', height)
      .style('fill', bgColor);
  delaunayG.style('opacity', delaunayOpacity);

  var sampler = poissonDiscSampler(width + radius * 2, height + radius * 2, radius),
      samples = [],
      sample;

  while (sample = sampler()) samples.push([sample[0] - radius, sample[1] - radius]);

  var voronoi = d3.geom.voronoi()
      .clipExtent([[-1, -1], [width + 1, height + 1]]);

  delaunayG.selectAll("path")
      .data(voronoi.triangles(samples).map(d3.geom.polygon))
    .enter().append("path")
      .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
      .style("fill", function(d) { return color(d.centroid()); })
      .style("stroke", function(d) { return color(d.centroid()); });

  function color(d) {
    var dx = d[0] - width / 2,
        dy = d[1] - height / 2,
        si = d[0]/2*d[1],
        seed = Math.abs(Math.floor(((si* 9301 + 49297) % 233280)/233280 *4)),
        c = colorOptions[0][2],
        lscalar = (75 - (dx * dx + dy * dy) / 5000) / 10000;

    c.l*=1-lscalar;
    // Change this function for different drawing effects
    return d3.lab(lightness - ((d[0]-width)*dx)/lightDecay, 0,0);
    // return d3.lab(75 - (dx * dx + dy * dy) / 5000, 0, 0);
    // return d3.lab(100 - (dx * dx + dy * dy) / 5000, dx / 10, dy / 10);
  }

  // Based on https://www.jasondavies.com/poisson-disc/
  function poissonDiscSampler(width, height, radius) {
    var k = 30, // maximum number of samples before rejection
        radius2 = radius * radius,
        R = 3 * radius2,
        cellSize = radius * Math.SQRT1_2,
        gridWidth = Math.ceil(width / cellSize),
        gridHeight = Math.ceil(height / cellSize),
        grid = new Array(gridWidth * gridHeight),
        queue = [],
        queueSize = 0,
        sampleSize = 0;

    return function() {
      if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

      // Pick a random existing sample and remove it from the queue.
      while (queueSize) {
        var i = Math.random() * queueSize | 0,
            s = queue[i];

        // Make a new candidate between [radius, 2 * radius] from the existing sample.
        for (var j = 0; j < k; ++j) {
          var a = 2 * Math.PI * Math.random(),
              r = Math.sqrt(Math.random() * R + radius2),
              x = s[0] + r * Math.cos(a),
              y = s[1] + r * Math.sin(a);

          // Reject candidates that are outside the allowed extent,
          // or closer than 2 * radius to any existing sample.
          if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
        }

        queue[i] = queue[--queueSize];
        queue.length = queueSize;
      }
    };

    function far(x, y) {
      var i = x / cellSize | 0,
          j = y / cellSize | 0,
          i0 = Math.max(i - 2, 0),
          j0 = Math.max(j - 2, 0),
          i1 = Math.min(i + 3, gridWidth),
          j1 = Math.min(j + 3, gridHeight);

      for (j = j0; j < j1; ++j) {
        var o = j * gridWidth;
        for (i = i0; i < i1; ++i) {
          if (s = grid[o + i]) {
            var s,
                dx = s[0] - x,
                dy = s[1] - y;
            if (dx * dx + dy * dy < radius2) return false;
          }
        }
      }

      return true;
    }

    function sample(x, y) {
      var s = [x, y];
      queue.push(s);
      grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
      ++sampleSize;
      ++queueSize;
      return s;
    }
  }
}
