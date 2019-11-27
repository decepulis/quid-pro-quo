import "./base.js";
import "../styles/index.scss";

import * as d3 from "d3";
import graph from "@/assets/miserables.json";

const getWidthHeight = selElement => {
  const { width, height } = selElement.node().getBoundingClientRect();
  return [width, height];
};

const onReady = () => {
  // ********************************** //
  // ** DOM
  // ********************************** //
  const body = d3.select("body");

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
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value) / 2);

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
  const circles = node
    .append("circle")
    .attr("r", 5)
    .attr("fill", d => nodeColorScale(d.group));

  // labels in node groups
  const labels = node
    .append("text")
    .text(d => d.id)
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
document.addEventListener("DOMContentLoaded", onReady);
