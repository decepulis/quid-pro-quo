import "./base.js";
import "../styles/index.scss";

import * as d3 from "d3";
import graph from "@/assets/miserables.json";

const onReady = () => {
  // ********************************** //
  // ** DOM
  // ********************************** //
  const body = d3.select("body");

  // initial zoom parameters
  const {
    width: bodyWidth,
    height: bodyHeight
  } = body.node().getBoundingClientRect();
  const initX = bodyWidth / 2;
  const initY = bodyHeight / 2;
  const initScale = 1;
  const initTransform = d3.zoomIdentity
    .translate(initX, initY)
    .scale(initScale);
  const zoom = d3.zoom().on("zoom", handleZoom);

  // page-filling svg
  const svg = body
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .call(zoom) // add zoom functionality
    .call(zoom.transform, initTransform); // zoom function knows about init

  // box in svg that contains graph
  const zoomBox = svg
    .append("g")
    .attr("class", "zoom")
    .attr("transform", initTransform); // dom element knows about init transform

  function handleZoom() {
    if (zoomBox) zoomBox.attr("transform", d3.event.transform);
  }

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
  const drag = {
    started: d => {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    },
    dragged: d => {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    },
    ended: d => {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  node.call(
    d3
      .drag()
      .on("start", drag.started)
      .on("drag", drag.dragged)
      .on("end", drag.ended)
  );
};
document.addEventListener("DOMContentLoaded", onReady);
