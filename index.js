
import fs from "fs-extra";
import path from "path";

const sourcesDir = path.resolve("./sources");
const graphsDir = path.resolve("./graphs");
const processedFile = path.resolve("./processed_files.txt");
const configFile = path.resolve("./graph-config.json");

async function getProcessedFiles() {
  if (!await fs.pathExists(processedFile)) return [];
  const data = await fs.readFile(processedFile, "utf8");
  return data.split("\n").map(x => x.trim()).filter(Boolean);
}

async function markFileProcessed(filename) {
  await fs.appendFile(processedFile, filename + "\n");
}

function mapCustomGraph(json) {
  const nodes = [];
  const edges = [];
  const nodeSet = new Set();
  json.forEach((item, idx) => {
    if (item.entity) {
      nodes.push({
        id: item.entity.name,
        label: item.entity.name,
        type: item.entity.type,
        description: item.entity.description,
      });
      nodeSet.add(item.entity.name);
    }
    if (item.relationship) {
      edges.push({
        id: item.relationship.source_entity + "->" + item.relationship.target_entity,
        source: item.relationship.source_entity,
        target: item.relationship.target_entity,
        label: item.relationship.description,
        strength: parseInt(item.relationship.strength)
      });
    }
  });
  // Mark unconnected nodes
  const connected = new Set(edges.flatMap(e => [e.source, e.target]));
  nodes.forEach(n => {
    n.unconnected = !connected.has(n.id);
  });
  return { nodes, edges };
}

async function processFiles() {
  const files = await fs.readdir(sourcesDir);
  const processed = await getProcessedFiles();
  for (const file of files) {
    if (!file.endsWith(".json") || processed.includes(file)) continue;
    const filePath = path.join(sourcesDir, file);
    const graphJson = await fs.readJson(filePath);
    const graphData = mapCustomGraph(graphJson);
    const htmlName = file.replace(/\.json$/, ".html");
    const htmlPath = path.join(graphsDir, htmlName);
    await generateGraphHtml(graphData, htmlPath, file);
    await markFileProcessed(file);
    console.log(`Processed: ${file}`);
  }
}

async function generateGraphHtml(graphData, htmlPath, graphName) {
  const config = await fs.readJson(configFile);
  // Mapowanie do formatu sigmajs 1.x
  const sigmaGraph = { nodes: [], edges: [] };
  const nodeIds = new Set();
  graphData.nodes.forEach((n, idx) => {
    if (!nodeIds.has(n.id)) {
      sigmaGraph.nodes.push({
        id: n.id,
        label: n.label,
        x: Math.cos(idx / graphData.nodes.length * 2 * Math.PI) * 100,
        y: Math.sin(idx / graphData.nodes.length * 2 * Math.PI) * 100,
        size: n.unconnected ? config.node.defaultSize * 1.5 : config.node.defaultSize,
        color: n.unconnected ? '#ff6666' : config.node.defaultColor,
        type: n.type,
        description: n.description
      });
      nodeIds.add(n.id);
    }
  });
  const edgeIds = new Set();
  graphData.edges.forEach((e, idx) => {
    const edgeKey = e.source + '->' + e.target;
    if (!edgeIds.has(edgeKey)) {
      sigmaGraph.edges.push({
        id: edgeKey,
        source: e.source,
        target: e.target,
        label: e.label,
        color: config.edge.defaultColor,
        size: config.edge.defaultSize + (e.strength ? e.strength / 50 : 0),
        strength: e.strength
      });
      edgeIds.add(edgeKey);
    }
  });
  const html = `<!DOCTYPE html>
<html lang=\"pl\">
<head>
  <meta charset=\"UTF-8\">
  <title>Graph: ${graphName}</title>
  <style>
    html, body { height: 100%; margin: 0; background: ${config.backgroundColor}; }
    #sigma-container { width: 100vw; height: 90vh; }
    #controls { padding: 10px; background: #f5f5f5; }
    label, select, input { margin-right: 10px; }
  </style>
  <script src=\"https://cdn.jsdelivr.net/npm/sigma@1.2.1/build/sigma.min.js\"></script>
</head>
<body>
  <div id=\"controls\">
    <label>Filtruj węzły po typie: <select id=\"node-type-filter\"><option value=\"\">Wszystkie</option></select></label>
    <label>Filtruj krawędzie po sile: <input type=\"number\" id=\"edge-strength-filter\" min=\"0\" max=\"100\" value=\"0\"></label>
    <button id=\"reset-filter\">Resetuj filtry</button>
    <span id=\"stats\"></span>
  </div>
  <div id=\"sigma-container\"></div>
  <script>
    var graph = ${JSON.stringify(sigmaGraph)};
    var s = new sigma({
      graph: graph,
      container: 'sigma-container',
      settings: {
        defaultNodeColor: '${config.node.defaultColor}',
        defaultEdgeColor: '${config.edge.defaultColor}',
        labelColor: '${config.node.labelColor}',
        defaultLabelSize: ${config.node.defaultSize},
        defaultEdgeLabelSize: ${config.edge.defaultSize},
        minArrowSize: 10
      }
    });
    // Statystyki
    function updateStats() {
      document.getElementById('stats').textContent = 'Węzły: ' + graph.nodes.length + ', Krawędzie: ' + graph.edges.length;
    }
    updateStats();
    // Filtrowanie typów węzłów
    var nodeTypeFilter = document.getElementById('node-type-filter');
    var allTypes = [];
    graph.nodes.forEach(function(n) {
      if (n.type) {
        n.type.split(',').map(function(t) { t = t.trim(); if (t && allTypes.indexOf(t) === -1) allTypes.push(t); });
      }
    });
    allTypes.forEach(function(type) {
      var opt = document.createElement('option');
      opt.value = type; opt.textContent = type;
      nodeTypeFilter.appendChild(opt);
    });
    nodeTypeFilter.onchange = function() {
      var type = nodeTypeFilter.value;
      graph.nodes.forEach(function(n) {
        n.hidden = type && (!n.type || n.type.indexOf(type) === -1);
      });
      s.refresh();
    };
    // Filtrowanie krawędzi po sile
    var edgeStrengthFilter = document.getElementById('edge-strength-filter');
    edgeStrengthFilter.oninput = function() {
      var minStrength = parseInt(edgeStrengthFilter.value);
      graph.edges.forEach(function(e) {
        e.hidden = minStrength > 0 && e.strength < minStrength;
      });
      s.refresh();
    };
    // Reset filtrów
    document.getElementById('reset-filter').onclick = function() {
      nodeTypeFilter.value = '';
      edgeStrengthFilter.value = 0;
      graph.nodes.forEach(function(n) { n.hidden = false; });
      graph.edges.forEach(function(e) { e.hidden = false; });
      s.refresh();
    };
    // Podświetlanie sieci powiązań po kliknięciu węzła
    s.bind('clickNode', function(e) {
      var nodeId = e.data.node.id;
      var neighbors = {};
      graph.edges.forEach(function(edge) {
        if (edge.source === nodeId) neighbors[edge.target] = true;
        if (edge.target === nodeId) neighbors[edge.source] = true;
      });
      graph.nodes.forEach(function(n) {
        n.color = (n.id === nodeId || neighbors[n.id]) ? n.color : '#eee';
      });
      graph.edges.forEach(function(edge) {
        edge.color = (edge.source === nodeId || edge.target === nodeId) ? edge.color : '#eee';
      });
      s.refresh();
    });
    s.bind('clickStage', function() {
      graph.nodes.forEach(function(n) { n.color = n.unconnected ? '#ff6666' : '${config.node.defaultColor}'; });
      graph.edges.forEach(function(e) { e.color = '${config.edge.defaultColor}'; });
      s.refresh();
    });
  </script>
</body>
</html>`;
  await fs.writeFile(htmlPath, html, "utf8");
}

processFiles();
