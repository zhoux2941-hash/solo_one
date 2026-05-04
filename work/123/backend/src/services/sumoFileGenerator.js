const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createCoordinateConverter } = require('./coordinateService');
const websocketService = require('./websocketService');

let globalConverter = null;
const converterCache = new Map();

const getOrCreateConverter = (network, simulationId) => {
  if (converterCache.has(simulationId)) {
    return converterCache.get(simulationId);
  }

  const converter = createCoordinateConverter(network);
  converterCache.set(simulationId, converter);
  globalConverter = converter;
  
  return converter;
};

const getConverter = (simulationId) => {
  return converterCache.get(simulationId) || globalConverter;
};

const clearConverterCache = (simulationId) => {
  converterCache.delete(simulationId);
};

const generateSumoFiles = async (config, outputDir, simulationId) => {
  const { network, trafficLights, trafficFlows, simulationConfig } = config;

  websocketService.updateSimulationProgress(
    simulationId,
    websocketService.SimulationPhase.NETWORK_GENERATION,
    { phaseProgress: 0.1 }
  );

  const converter = getOrCreateConverter(network, simulationId);
  
  const convertedNetwork = converter.convertNetworkToLocal(network);
  
  const coordinateConfig = converter.getConfig();
  await fs.writeJson(path.join(outputDir, 'coordinate_config.json'), {
    ...coordinateConfig,
    originalNodes: network.nodes?.map(n => ({
      id: n.id,
      x: n.x,
      y: n.y
    })) || []
  });

  websocketService.updateSimulationProgress(
    simulationId,
    websocketService.SimulationPhase.NETWORK_GENERATION,
    { phaseProgress: 0.5 }
  );

  await generateNetFile(convertedNetwork, trafficLights, outputDir, simulationId);
  
  websocketService.updateSimulationProgress(
    simulationId,
    websocketService.SimulationPhase.ROUTE_GENERATION,
    { phaseProgress: 0.3 }
  );

  await generateRouteFile(trafficFlows, convertedNetwork, outputDir, simulationId);
  
  websocketService.updateSimulationProgress(
    simulationId,
    websocketService.SimulationPhase.SIGNAL_CONFIG,
    { phaseProgress: 0.5 }
  );

  await generateAdditionalFile(trafficLights, convertedNetwork, outputDir, simulationId);
  
  websocketService.updateSimulationProgress(
    simulationId,
    websocketService.SimulationPhase.SIGNAL_CONFIG,
    { phaseProgress: 1.0 }
  );

  await generateConfigFile(simulationId, simulationConfig, outputDir);

  return {
    netFile: path.join(outputDir, `${simulationId}.net.xml`),
    routeFile: path.join(outputDir, `${simulationId}.rou.xml`),
    addFile: path.join(outputDir, `${simulationId}.add.xml`),
    configFile: path.join(outputDir, `${simulationId}.sumocfg`),
    converter
  };
};

const generateNetFile = async (network, trafficLights, outputDir, simulationId) => {
  const { nodes, edges } = network;
  
  let nodeXml = '';
  let edgeXml = '';
  let connectionXml = '';

  const trafficLightNodeIds = new Set(
    trafficLights?.map(tl => tl.intersectionId) || []
  );

  for (const node of nodes) {
    const nodeType = trafficLightNodeIds.has(node.id) ? 'traffic_light' : (node.type || 'priority');
    nodeXml += `    <node id="${node.id}" x="${node.x}" y="${node.y}" type="${nodeType}"/>\n`;
  }

  for (const edge of edges) {
    const numLanes = edge.lanes || 1;
    const speed = edge.speed || 13.89;
    const priority = edge.priority || 1;
    
    edgeXml += `    <edge id="${edge.id}" from="${edge.from}" to="${edge.to}" priority="${priority}" speed="${speed}" numLanes="${numLanes}"/>\n`;

    for (let i = 0; i < numLanes; i++) {
      edgeXml += `    <lane id="${edge.id}_${i}" index="${i}" speed="${speed}" length="${edge.length || 100}"/>\n`;
    }
  }

  const connections = generateConnections(edges, nodes);
  for (const conn of connections) {
    connectionXml += `    <connection from="${conn.from}" to="${conn.to}" fromLane="${conn.fromLane}" toLane="${conn.toLane}"/>\n`;
  }

  const netContent = `<?xml version="1.0" encoding="UTF-8"?>
<net version="1.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://sumo.dlr.de/xsd/net_file.xsd">

  <location netOffset="0.00,0.00" convBoundary="${calculateBoundary(nodes)}" projBoundary="0.00,0.00,500.00,500.00" origBoundary="-10000.00,-10000.00,10000.00,10000.00" projParameter="!"/>

  <edges version="1.9">
${edgeXml}  </edges>

  <nodes version="1.9">
${nodeXml}  </nodes>

  <connections version="1.9">
${connectionXml}  </connections>

</net>`;

  await fs.writeFile(path.join(outputDir, `${simulationId}.net.xml`), netContent);
};

const generateConnections = (edges, nodes) => {
  const connections = [];
  const edgeMap = new Map();

  for (const edge of edges) {
    if (!edgeMap.has(edge.from)) {
      edgeMap.set(edge.from, { outgoing: [], incoming: [] });
    }
    if (!edgeMap.has(edge.to)) {
      edgeMap.set(edge.to, { outgoing: [], incoming: [] });
    }
    edgeMap.get(edge.from).outgoing.push(edge);
    edgeMap.get(edge.to).incoming.push(edge);
  }

  for (const [nodeId, nodeEdges] of edgeMap) {
    for (const incomingEdge of nodeEdges.incoming) {
      const inLanes = incomingEdge.lanes || 1;
      
      for (const outgoingEdge of nodeEdges.outgoing) {
        if (incomingEdge.id === outgoingEdge.id) continue;
        
        const outLanes = outgoingEdge.lanes || 1;
        const minLanes = Math.min(inLanes, outLanes);
        
        for (let i = 0; i < minLanes; i++) {
          connections.push({
            from: incomingEdge.id,
            to: outgoingEdge.id,
            fromLane: i,
            toLane: i
          });
        }
      }
    }
  }

  return connections;
};

const calculateBoundary = (nodes) => {
  if (nodes.length === 0) return '0.00,0.00,500.00,500.00';
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }
  
  const padding = 50;
  return `${minX - padding},${minY - padding},${maxX + padding},${maxY + padding}`;
};

const generateRouteFile = async (trafficFlows, network, outputDir, simulationId) => {
  let vehicleTypeXml = `    <vType id="car" accel="2.6" decel="4.5" sigma="0.5" length="5.0" minGap="2.5" maxSpeed="55.56" color="1,1,0"/>\n`;
  
  let routeXml = '';
  let flowXml = '';
  
  const edges = network.edges || [];
  const routes = generateRoutes(edges, network.nodes);

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    routeXml += `    <route id="route_${i}" edges="${route.edges.join(' ')}"/>\n`;
  }

  if (trafficFlows && trafficFlows.length > 0) {
    for (const flow of trafficFlows) {
      const routeIndex = flow.routeIndex !== undefined ? flow.routeIndex : 0;
      const flowId = flow.id || `flow_${uuidv4()}`;
      
      if (flow.type === 'flow') {
        flowXml += `    <flow id="${flowId}" begin="${flow.begin || 0}" end="${flow.end || 3600}" vehsPerHour="${flow.vehsPerHour || 600}" route="route_${routeIndex}" type="car"/>\n`;
      } else if (flow.type === 'vehicle') {
        flowXml += `    <vehicle id="${flowId}" depart="${flow.depart || 0}" route="route_${routeIndex}" type="car"/>\n`;
      }
    }
  } else {
    for (let i = 0; i < routes.length; i++) {
      flowXml += `    <flow id="flow_${i}" begin="0" end="3600" vehsPerHour="600" route="route_${i}" type="car"/>\n`;
    }
  }

  const routeContent = `<?xml version="1.0" encoding="UTF-8"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://sumo.dlr.de/xsd/routes_file.xsd">

${vehicleTypeXml}
${routeXml}
${flowXml}
</routes>`;

  await fs.writeFile(path.join(outputDir, `${simulationId}.rou.xml`), routeContent);
};

const generateRoutes = (edges, nodes) => {
  const routes = [];
  
  if (edges.length === 0) return routes;

  const adjacencyList = new Map();
  const nodeMap = new Map();

  for (const node of nodes) {
    adjacencyList.set(node.id, []);
    nodeMap.set(node.id, node);
  }

  for (const edge of edges) {
    if (adjacencyList.has(edge.from)) {
      adjacencyList.get(edge.from).push(edge);
    }
  }

  const sourceNodes = [];
  const sinkNodes = [];

  for (const node of nodes) {
    const outgoing = edges.filter(e => e.from === node.id).length;
    const incoming = edges.filter(e => e.to === node.id).length;
    
    if (outgoing > 0 && incoming === 0) {
      sourceNodes.push(node.id);
    }
    if (incoming > 0 && outgoing === 0) {
      sinkNodes.push(node.id);
    }
  }

  if (sourceNodes.length === 0) {
    sourceNodes.push(nodes[0]?.id);
  }
  if (sinkNodes.length === 0) {
    sinkNodes.push(nodes[nodes.length - 1]?.id);
  }

  for (const source of sourceNodes) {
    for (const sink of sinkNodes) {
      if (source === sink) continue;
      
      const path = findPath(adjacencyList, source, sink, edges);
      if (path && path.length > 0) {
        routes.push({
          source,
          sink,
          edges: path
        });
      }
    }
  }

  if (routes.length === 0 && edges.length > 0) {
    routes.push({
      source: edges[0].from,
      sink: edges[0].to,
      edges: [edges[0].id]
    });
  }

  return routes;
};

const findPath = (adjacencyList, start, end, edges) => {
  const visited = new Set();
  const queue = [[start, []]];

  while (queue.length > 0) {
    const [current, path] = queue.shift();
    
    if (current === end && path.length > 0) {
      return path;
    }
    
    if (visited.has(current)) continue;
    visited.add(current);

    const outgoingEdges = adjacencyList.get(current) || [];
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.to)) {
        queue.push([edge.to, [...path, edge.id]]);
      }
    }
  }

  return null;
};

const generateAdditionalFile = async (trafficLights, network, outputDir, simulationId) => {
  if (!trafficLights || trafficLights.length === 0) {
    const emptyContent = `<?xml version="1.0" encoding="UTF-8"?>
<additional xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://sumo.dlr.de/xsd/additional_file.xsd">
</additional>`;
    await fs.writeFile(path.join(outputDir, `${simulationId}.add.xml`), emptyContent);
    return;
  }

  let tlLogicXml = '';

  for (const tl of trafficLights) {
    const phases = tl.phases || generateDefaultPhases();
    const nodeId = tl.intersectionId;

    let phaseXml = '';
    for (const phase of phases) {
      phaseXml += `        <phase duration="${phase.duration}" state="${phase.state}"/>\n`;
    }

    tlLogicXml += `    <tlLogic id="${nodeId}" type="static" programID="0" offset="0">\n${phaseXml}    </tlLogic>\n`;
  }

  const additionalContent = `<?xml version="1.0" encoding="UTF-8"?>
<additional xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://sumo.dlr.de/xsd/additional_file.xsd">

${tlLogicXml}
</additional>`;

  await fs.writeFile(path.join(outputDir, `${simulationId}.add.xml`), additionalContent);
};

const generateDefaultPhases = () => {
  return [
    { duration: 30, state: 'GrGr' },
    { duration: 3, state: 'yryr' },
    { duration: 30, state: 'rGrG' },
    { duration: 3, state: 'ryry' }
  ];
};

const generateConfigFile = async (simulationId, simulationConfig, outputDir) => {
  const configContent = `<?xml version="1.0" encoding="UTF-8"?>

<configuration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://sumo.dlr.de/xsd/sumoConfiguration.xsd">

    <input>
        <net-file value="${simulationId}.net.xml"/>
        <route-files value="${simulationId}.rou.xml"/>
        <additional-files value="${simulationId}.add.xml"/>
    </input>

    <time>
        <begin value="0"/>
        <end value="${simulationConfig?.duration || 3600}"/>
    </time>

    <output>
        <fcd-output value="fcd_output.xml"/>
        <tripinfo-output value="tripinfo_output.xml"/>
        <summary-output value="summary_output.xml"/>
        <queue-output value="queue_output.xml"/>
    </output>

    <report>
        <verbose value="true"/>
        <no-step-log value="true"/>
    </report>

</configuration>`;

  await fs.writeFile(path.join(outputDir, `${simulationId}.sumocfg`), configContent);
};

module.exports = {
  generateSumoFiles,
  generateNetFile,
  generateRouteFile,
  generateAdditionalFile,
  generateConfigFile,
  getConverter,
  getOrCreateConverter,
  clearConverterCache
};
