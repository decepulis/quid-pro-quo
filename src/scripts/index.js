import "./base.js";
import "../styles/index.scss";

import * as d3 from "d3";
import graph from "@/assets/miserables.json";

const onReady = () => {
  // ** SIMULATION SETUP ** //
  const svg = d3.select("svg");
  const svgWidth = +svg.attr("width");
  const svgHeight = +svg.attr("height");

  const simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3.forceLink().id(d => d.id)
    )
    // Repel each-other
    .force("charge", d3.forceManyBody())
    // Attracted to canvas center
    .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2));

  const link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line");

  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter()
    .append("circle")
    .attr("r", 2.5);

  node.append("title").text(d => d.id);

  // ** FUNCTION DECLARATION AND BINDING ** //
  const ticked = () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x).attr("cy", d => d.y);
  };
  simulation.nodes(graph.nodes).on("tick", ticked);

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

  simulation.force("link").links(graph.links);
};
document.addEventListener("DOMContentLoaded", onReady);
