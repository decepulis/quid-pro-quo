import * as d3 from "d3";
const Airtable = require("airtable");
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_DB_ID
);
// ********************************** //
// ** Utilities
// ********************************** //
const getWidthHeight = selElement => {
  const { width, height } = selElement.node().getBoundingClientRect();
  return [width, height];
};

// ********************************** //
// ** Handle Loading State
// ********************************** //
const loaded = {
  document: false,
  nodes: false,
  links: false
};
const loadingElements = {
  document: null,
  nodes: "#nodes-loading",
  links: "#links-loading"
};

const updateLoading = completed => {
  loaded[completed] = true;

  Object.entries(loadingElements).forEach(([key, selector]) => {
    if (loaded[key] && !!selector) {
      document.querySelector(selector).style.display = "none";
    }
  });

  if (Object.values(loaded).every(loadComplete => loadComplete)) {
    plotGraph();
  }
};

// ********************************** //
// ** Graphing!!
// ********************************** //
const graph = { nodes: [], links: [] };
const plotGraph = () => {
  // ********************************** //
  // ** DOM
  // ********************************** //
  const body = d3.select("body");

  const tooltip = body.append("div").attr("class", "tooltip");
  const tooltipTitle = tooltip.append("b").text("Title");
  const tooltipText = tooltip.append("div");

  // page-filling svg
  const svg = body
    .append("svg")
    .attr("class", "container")
    .attr("width", "100%")
    .attr("height", "100%");

  // box in svg that contains graph
  const zoomBox = svg.append("g").attr("class", "zoom");

  // links in zoomBox
  const link = zoomBox
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .join("line");

  // node groups in zoomBox
  const nodeColorScale = d3.scaleOrdinal(d3.schemeCategory10);
  const node = zoomBox
    .append("g")
    .attr("class", "nodes")
    // data
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g")
    .attr("class", "node");

  // circles in node groups
  const circleRadius = 11;
  const circles = node
    .append("circle")
    .attr("r", circleRadius)
    .attr("fill", d => nodeColorScale(d.Position));

  // labels in node groups
  const labels = node
    .append("text")
    .text(d => d.Person)
    .attr("x", 6)
    .attr("y", 3);

  // ********************************** //
  // ** Forces
  // ********************************** //
  const ticked = () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);
  };

  const zoomBoxWidth = +zoomBox.attr("width");
  const zoomBoxHeight = +zoomBox.attr("height");

  const simulation = d3
    .forceSimulation(graph.nodes)
    // Simulation gets updated every tick
    .on("tick", ticked)
    // Nodes repel each-other
    .force(
      "charge",
      d3.forceManyBody().strength(-50) // default -30
    )
    // Nodes attracted to canvas center
    .force("center", d3.forceCenter(zoomBoxWidth / 2, zoomBoxHeight / 2))
    // Links are fixed distanced away from each other
    .force(
      "link",
      d3
        .forceLink(graph.links)
        .id(d => d.id)
        .distance(30)
    );

  // ********************************** //
  // ** User Inputs
  // ********************************** //
  // Tooltips
  circles
    .on("mouseover", (d, i, nodes) => {
      const circle = nodes[i];

      d3.select(circle).attr("r", circleRadius * 2);
      d3.select(circle.parentNode)
        .selectAll("text")
        .style("visibility", "hidden");

      tooltipTitle.text(d.Person);
      const photo = d.Photo
        ? `<img src = "${d.Photo}" alt = "Photo of ${d.Person}" >`
        : `<small>No photo available.</small>`;
      tooltipText.html(`
        <p>Position:<br/>${d.Position}</p>
        ${photo}
      `);
      tooltip.style("visibility", "visible");
    })
    .on("mousemove", () =>
      tooltip
        .style("top", d3.event.pageY - 10 + "px")
        .style("left", d3.event.pageX + 10 + "px")
    )
    .on("mouseout", (d, i, nodes) => {
      const circle = nodes[i];

      d3.select(circle).attr("r", circleRadius);
      d3.select(circle.parentNode)
        .selectAll("text")
        .style("visibility", "visible");

      tooltip.style("visibility", "hidden");
    });

  // Zoom, Pan, and Window Resize
  // -- Functions
  // ---- Handling Window Resize
  let xPrc = 0.5;
  let yPrc = 0.5;
  let scale = 1;

  const resizeTransform = () => {
    const { width: bodyWidth, height: bodyHeight } = d3
      .select("body")
      .node()
      .getBoundingClientRect();
    const newX = bodyWidth * xPrc;
    const newY = bodyHeight * yPrc;

    return d3.zoomIdentity.translate(newX, newY).scale(scale);
  };

  // ---- Handling Zoom
  const handleZoom = () => {
    // First, log zoom position so we can apply it
    // during window resize
    const { x, y, k } = d3.event.transform;
    const { width: bodyWidth, height: bodyHeight } = d3
      .select("body")
      .node()
      .getBoundingClientRect();

    xPrc = x / bodyWidth;
    yPrc = y / bodyHeight;
    scale = k;

    // Then, we apply the zoom position
    zoomBox.attr("transform", d3.event.transform);
  };

  const zoomWithExtent = extElement => {
    const [width, height] = getWidthHeight(extElement);
    return d3
      .zoom()
      .scaleExtent([0.5, 10])
      .translateExtent([
        [-width, -height],
        [width, height]
      ])
      .on("zoom", handleZoom);
  };

  // -- Initial Values
  const [initBodyWidth, initBodyHeight] = getWidthHeight(body);
  const initX = initBodyWidth * xPrc;
  const initY = initBodyHeight * yPrc;
  const initScale = scale;
  const initTransform = d3.zoomIdentity
    .translate(initX, initY)
    .scale(initScale);

  // -- Applying to elements
  const zoom = zoomWithExtent(body);
  svg
    .call(zoom) // add zoom functionality
    .call(zoom.transform, initTransform); // zoom function knows about init
  zoomBox.attr("transform", initTransform); // dom element knows about init transform

  d3.select(window).on(`resize.${svg.attr("id")}`, () => {
    const newZoom = zoomWithExtent(body);
    svg.call(newZoom);
    svg.call(newZoom.transform, resizeTransform);
  });
};

// ********************************** //
// ** Data Fetching!!
// ********************************** //
const fetchData = () => {
  base("People")
    .select({ view: "Grid view" })
    .eachPage(
      // for each page of records...
      function page(records, fetchNextPage) {
        // ...we update the graph.nodes array...
        graph.nodes = [
          // ...by appending what we have so far...
          ...graph.nodes,
          // ...and appending a transformed version
          //    of each record...
          ...records.map(record => {
            // ...for which we return an object
            //    containing the record's id and fields.
            const { fields, id } = record;
            return { ...fields, id };
          })
        ];
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          alert(err);
          return;
        }
        updateLoading("nodes");
      }
    );

  base("Relationships")
    .select({ view: "Grid view" })
    .eachPage(
      // for each page of records...
      function page(records, fetchNextPage) {
        // ...we update the graph.links array...
        graph.links = [
          // ...by appending what we have so far...
          ...graph.links,
          // ...and appending a transformed version
          //    of each record...
          ...records.map(record => {
            // ...for which we return an object
            //    containing the record's id and.
            const { fields, id } = record;
            const source = fields.source ? fields.source[0] : null;
            const target = fields.target ? fields.target[0] : null;
            return { ...fields, source, target, id };
          })
        ];
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          alert(err);
          return;
        }
        updateLoading("links");
      }
    );
};
fetchData();

document.addEventListener("DOMContentLoaded", () => updateLoading("document"));
