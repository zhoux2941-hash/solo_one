const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const xml2js = require('xml2js');
const config = require('../config');
const { getSimulationPath, writeJsonFile, readJsonFile } = require('../utils/fileUtils');
const sumoFileGenerator = require('./sumoFileGenerator');
const websocketService = require('./websocketService');
const { createCoordinateConverter } = require('./coordinateService');

let globalConverter = null;
const converterCache = new Map();

const processSimulationJob = async (job) => {
  const { simulationId, configData } = job.data;
  const { network, trafficLights, trafficFlows, simulationConfig } = configData;

  console.log(`[Worker] Starting simulation job: ${simulationId}`);

  const pendingPath = getSimulationPath(simulationId, 'pending');
  const runningPath = getSimulationPath(simulationId, 'running');

  try {
    websocketService.updateSimulationProgress(
      simulationId,
      websocketService.SimulationPhase.INITIALIZING,
      { phaseProgress: 0.1 }
    );

    await fs.move(pendingPath, runningPath);

    const converter = createCoordinateConverter(network);
    converterCache.set(simulationId, converter);
    globalConverter = converter;

    websocketService.updateSimulationProgress(
      simulationId,
      websocketService.SimulationPhase.NETWORK_GENERATION,
      { phaseProgress: 0.5 }
    );

    const convertedNetwork = converter.convertNetworkToLocal(network);
    
    const coordinateConfig = converter.getConfig();
    await fs.writeJson(path.join(runningPath, 'coordinate_config.json'), {
      ...coordinateConfig,
      originalNodes: network.nodes?.map(n => ({
        id: n.id,
        x: n.x,
        y: n.y
      })) || []
    });

    const { nodes, edges } = convertedNetwork;
    await generateNetFile(nodes, edges, trafficLights, runningPath, simulationId);
    
    websocketService.updateSimulationProgress(
      simulationId,
      websocketService.SimulationPhase.ROUTE_GENERATION,
      { phaseProgress: 0.5 }
    );

    await generateRouteFile(trafficFlows, convertedNetwork, runningPath, simulationId);

    websocketService.updateSimulationProgress(
      simulationId,
      websocketService.SimulationPhase.SIGNAL_CONFIG,
      { phaseProgress: 0.5 }
    );

    await generateAdditionalFile(trafficLights, runningPath, simulationId);
    await generateConfigFile(simulationId, simulationConfig, runningPath);

    websocketService.updateSimulationProgress(
      simulationId,
      websocketService.SimulationPhase.SIMULATION_START,
      { phaseProgress: 0.5 }
    );

    const sumoAvailable = await checkSumoAvailability();
    
    if (sumoAvailable) {
      await runSumoSimulation(simulationId, runningPath, configData, converter);
    } else {
      console.log('[Worker] SUMO not available, generating mock simulation data...');
      await generateMockSimulationDataWithConverter(simulationId, runningPath, configData, converter);
    }

    websocketService.updateSimulationProgress(
      simulationId,
      websocketService.SimulationPhase.OUTPUT_CONVERSION,
      { phaseProgress: 0.5 }
    );

    await completeSimulation(simulationId, runningPath);

    websocketService.completeSimulation(simulationId, {
      completedAt: new Date().toISOString()
    });

    console.log(`[Worker] Simulation ${simulationId} completed successfully`);
    return { success: true, simulationId };

  } catch (error) {
    console.error(`[Worker] Simulation ${simulationId} failed:`, error);
    
    websocketService.failSimulation(simulationId, error);
    
    await failSimulation(simulationId, runningPath, error);
    
    throw error;
  }
};

const checkSumoAvailability = async () => {
  try {
    const sumoPath = config.sumo.binPath;
    if (!await fs.pathExists(sumoPath)) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

const runSumoSimulation = (simulationId, simulationPath, configData, converter) => {
  return new Promise((resolve, reject) => {
    const sumoPath = config.sumo.binPath;
    const configFile = path.join(simulationPath, `${simulationId}.sumocfg`);
    
    const args = ['-c', configFile, '--step-length', configData.simulationConfig.timeStep.toString()];
    
    const child = execFile(sumoPath, args, {
      cwd: simulationPath,
      maxBuffer: 1024 * 1024 * 50
    }, async (error, stdout, stderr) => {
      if (error) {
        console.error('[Worker] SUMO execution error:', error);
        reject(error);
        return;
      }
      
      try {
        await parseSumoOutputsWithConverter(simulationPath, simulationId, configData, converter);
        resolve();
      } catch (parseError) {
        reject(parseError);
      }
    });

    child.stdout.on('data', (data) => {
      const progressMatch = data.toString().match(/Step\s+(\d+)/);
      if (progressMatch) {
        const currentTime = parseInt(progressMatch[1]);
        const totalTime = configData.simulationConfig.duration;
        
        websocketService.updateSimulationProgress(
          simulationId,
          websocketService.SimulationPhase.SIMULATION_RUNNING,
          { 
            currentTime, 
            totalTime,
            phaseProgress: currentTime / totalTime
          }
        );
      }
    });
  });
};

const parseSumoOutputsWithConverter = async (simulationPath, simulationId, configData, converter) => {
  const fcdOutputPath = path.join(simulationPath, 'fcd_output.xml');
  const tripinfoOutputPath = path.join(simulationPath, 'tripinfo_output.xml');
  const summaryOutputPath = path.join(simulationPath, 'summary_output.xml');
  const queueOutputPath = path.join(simulationPath, 'queue_output.xml');

  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

  if (await fs.pathExists(fcdOutputPath)) {
    const fcdContent = await fs.readFile(fcdOutputPath, 'utf-8');
    const fcdData = await parser.parseStringPromise(fcdContent);
    await processFCDDataWithConverter(fcdData, simulationPath, configData, converter);
  }

  if (await fs.pathExists(tripinfoOutputPath)) {
    const tripinfoContent = await fs.readFile(tripinfoOutputPath, 'utf-8');
    const tripinfoData = await parser.parseStringPromise(tripinfoContent);
    await processTripInfoData(tripinfoData, simulationPath);
  }

  if (await fs.pathExists(summaryOutputPath)) {
    const summaryContent = await fs.readFile(summaryOutputPath, 'utf-8');
    const summaryData = await parser.parseStringPromise(summaryContent);
    await processSummaryData(summaryData, simulationPath);
  }

  if (await fs.pathExists(queueOutputPath)) {
    const queueContent = await fs.readFile(queueOutputPath, 'utf-8');
    const queueData = await parser.parseStringPromise(queueContent);
    await processQueueDataWithConverter(queueData, simulationPath, configData, converter);
  }
};

const processFCDDataWithConverter = async (fcdData, simulationPath, configData, converter) => {
  const timesteps = fcdData.fcd-export?.timestep || [];
  const trajectories = [];
  const snapshots = [];
  
  const snapshotInterval = configData.simulationConfig.snapshotInterval || 1;
  let snapshotIndex = 0;

  for (const ts of timesteps) {
    const time = parseFloat(ts.time);
    const vehicles = Array.isArray(ts.vehicle) ? ts.vehicle : (ts.vehicle ? [ts.vehicle] : []);
    const convertedVehicles = [];
    
    for (const vehicle of vehicles) {
      const localX = parseFloat(vehicle.x);
      const localY = parseFloat(vehicle.y);
      
      const wgs84 = converter.localToWgs84(localX, localY);
      
      const trajectory = {
        time,
        vehicleId: vehicle.id,
        x: wgs84.x,
        y: wgs84.y,
        localX,
        localY,
        angle: parseFloat(vehicle.angle || 0),
        speed: parseFloat(vehicle.speed || 0),
        lane: vehicle.lane,
        pos: parseFloat(vehicle.pos || 0)
      };
      
      trajectories.push(trajectory);
      convertedVehicles.push({
        id: vehicle.id,
        x: wgs84.x,
        y: wgs84.y,
        angle: parseFloat(vehicle.angle || 0),
        speed: parseFloat(vehicle.speed || 0)
      });
    }

    if (time % snapshotInterval === 0 || time === 0) {
      snapshots.push({
        index: snapshotIndex,
        time,
        vehicles: convertedVehicles
      });
      
      await writeJsonFile(path.join(simulationPath, `snapshot_${snapshotIndex}.json`), {
        time,
        vehicles: convertedVehicles
      });
      
      snapshotIndex++;
    }
  }

  const startTime = timesteps.length > 0 ? parseFloat(timesteps[0].time) : 0;
  const endTime = timesteps.length > 0 ? parseFloat(timesteps[timesteps.length - 1].time) : 0;
  const uniqueVehicleIds = new Set(trajectories.map(t => t.vehicleId));

  await writeJsonFile(path.join(simulationPath, 'trajectories.json'), {
    startTime,
    endTime,
    totalVehicles: uniqueVehicleIds.size,
    timeStep: configData.simulationConfig.timeStep,
    coordinateSystem: 'WGS84',
    trajectories
  });

  await writeJsonFile(path.join(simulationPath, 'snapshot_metadata.json'), {
    totalSnapshots: snapshots.length,
    snapshotInterval,
    startTime,
    endTime,
    coordinateSystem: 'WGS84',
    snapshots: snapshots.map(s => ({ index: s.index, time: s.time }))
  });
};

const generateMockSimulationDataWithConverter = async (simulationId, simulationPath, configData, converter) => {
  const { network, simulationConfig } = configData;
  
  const duration = simulationConfig.duration;
  const timeStep = simulationConfig.timeStep;
  const snapshotInterval = simulationConfig.snapshotInterval;

  const convertedNetwork = converter.convertNetworkToLocal(network);
  const { edges, nodes } = convertedNetwork;

  const mockVehicles = generateMockVehicles(edges, nodes, duration);
  
  const trajectories = [];
  const snapshots = [];
  let snapshotIndex = 0;

  for (let time = 0; time <= duration; time += timeStep) {
    const vehiclesAtTime = [];

    for (const vehicle of mockVehicles) {
      if (time >= vehicle.departTime && time <= vehicle.arriveTime) {
        const progress = (time - vehicle.departTime) / (vehicle.arriveTime - vehicle.departTime);
        const currentEdgeIndex = Math.floor(progress * vehicle.route.length);
        const edgeProgress = (progress * vehicle.route.length) - currentEdgeIndex;
        
        const edge = vehicle.route[currentEdgeIndex] || vehicle.route[vehicle.route.length - 1];
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        
        if (fromNode && toNode) {
          const localX = fromNode.x + (toNode.x - fromNode.x) * edgeProgress;
          const localY = fromNode.y + (toNode.y - fromNode.y) * edgeProgress;
          const wgs84 = converter.localToWgs84(localX, localY);
          
          const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) * (180 / Math.PI);
          
          trajectories.push({
            time,
            vehicleId: vehicle.id,
            x: wgs84.x,
            y: wgs84.y,
            localX,
            localY,
            angle,
            speed: vehicle.speed,
            lane: `${edge.id}_0`,
            pos: edgeProgress * (edge.length || 100)
          });

          vehiclesAtTime.push({
            id: vehicle.id,
            x: wgs84.x,
            y: wgs84.y,
            angle,
            speed: vehicle.speed
          });
        }
      }
    }

    if (time % snapshotInterval === 0 || time === 0) {
      snapshots.push({
        index: snapshotIndex,
        time,
        vehicles: vehiclesAtTime
      });
      
      await writeJsonFile(path.join(simulationPath, `snapshot_${snapshotIndex}.json`), {
        time,
        vehicles: vehiclesAtTime
      });
      
      snapshotIndex++;
    }
  }

  const uniqueVehicleIds = new Set(mockVehicles.map(v => v.id));

  await writeJsonFile(path.join(simulationPath, 'trajectories.json'), {
    startTime: 0,
    endTime: duration,
    totalVehicles: uniqueVehicleIds.size,
    timeStep,
    coordinateSystem: 'WGS84',
    trajectories
  });

  await writeJsonFile(path.join(simulationPath, 'snapshot_metadata.json'), {
    totalSnapshots: snapshots.length,
    snapshotInterval,
    startTime: 0,
    endTime: duration,
    coordinateSystem: 'WGS84',
    snapshots: snapshots.map(s => ({ index: s.index, time: s.time }))
  });

  const statistics = generateMockStatistics(mockVehicles, duration);
  await writeJsonFile(path.join(simulationPath, 'statistics.json'), statistics);

  const heatmapData = await generateMockHeatmapDataWithConverter(edges, nodes, duration, timeStep, converter);
  await writeJsonFile(path.join(simulationPath, 'heatmap_data.json'), heatmapData);

  const result = {
    simulationId,
    status: 'completed',
    totalVehicles: mockVehicles.length,
    duration,
    statistics,
    coordinateSystem: 'WGS84',
    completedAt: new Date().toISOString()
  };

  await writeJsonFile(path.join(simulationPath, 'result.json'), result);
};

const generateMockVehicles = (edges, nodes, duration) => {
  const vehicles = [];
  const vehicleCount = Math.floor(Math.random() * 50) + 20;

  const routes = generateMockRoutes(edges, nodes);

  for (let i = 0; i < vehicleCount; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const totalLength = route.reduce((sum, edge) => sum + (edge.length || 100), 0);
    const speed = Math.random() * 10 + 8;
    const travelTime = totalLength / speed;
    
    const departTime = Math.random() * (duration - travelTime - 10);
    const arriveTime = departTime + travelTime;

    vehicles.push({
      id: `vehicle_${i}`,
      departTime,
      arriveTime,
      speed,
      route,
      type: 'car'
    });
  }

  return vehicles;
};

const generateMockRoutes = (edges, nodes) => {
  const routes = [];
  
  if (edges.length === 0) return routes;

  const adjacencyList = new Map();
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of edges) {
    if (adjacencyList.has(edge.from)) {
      adjacencyList.get(edge.from).push(edge);
    }
  }

  const findPaths = (start, end, maxLength = 5) => {
    const paths = [];
    const dfs = (current, path) => {
      if (path.length > maxLength) return;
      if (current === end && path.length > 0) {
        paths.push([...path]);
        return;
      }
      const outgoing = adjacencyList.get(current) || [];
      for (const edge of outgoing) {
        dfs(edge.to, [...path, edge]);
      }
    };
    dfs(start, []);
    return paths;
  };

  for (const startNode of nodes) {
    for (const endNode of nodes) {
      if (startNode.id === endNode.id) continue;
      const paths = findPaths(startNode.id, endNode.id, 3);
      for (const path of paths) {
        if (path.length > 0) {
          routes.push(path);
        }
      }
    }
  }

  if (routes.length === 0 && edges.length > 0) {
    routes.push([edges[0]]);
  }

  return routes;
};

const generateMockStatistics = (vehicles, duration) => {
  let totalTravelTime = 0;
  let totalDelay = 0;
  const trips = [];

  for (const vehicle of vehicles) {
    const travelTime = vehicle.arriveTime - vehicle.departTime;
    const delay = Math.random() * 10;

    totalTravelTime += travelTime;
    totalDelay += delay;

    trips.push({
      id: vehicle.id,
      duration: travelTime,
      departure: vehicle.departTime,
      arrival: vehicle.arriveTime,
      delay,
      waitingTime: Math.random() * 5,
      routeLength: vehicle.route.reduce((sum, e) => sum + (e.length || 100), 0),
      timeLoss: delay
    });
  }

  return {
    totalTrips: vehicles.length,
    averageTravelTime: vehicles.length > 0 ? totalTravelTime / vehicles.length : 0,
    averageDelay: vehicles.length > 0 ? totalDelay / vehicles.length : 0,
    averageSpeed: 10,
    totalDelay,
    trips
  };
};

const generateMockHeatmapDataWithConverter = async (edges, nodes, duration, timeStep, converter) => {
  const heatmapData = {
    startTime: 0,
    endTime: duration,
    edgeCount: edges.length,
    data: [],
    aggregated: {
      average: {},
      max: {}
    }
  };

  const edgeBaseCongestion = {};
  for (const edge of edges) {
    edgeBaseCongestion[edge.id] = Math.random() * 0.5 + 0.1;
  }

  for (let time = 0; time <= duration; time += timeStep * 10) {
    const timeData = {
      time,
      edges: {}
    };

    const rushHourFactor = (time >= 300 && time <= 900) || (time >= 1800 && time <= 2400) ? 2 : 1;

    for (const edge of edges) {
      const congestion = edgeBaseCongestion[edge.id] * rushHourFactor * (0.8 + Math.random() * 0.4);
      const queueVehicles = Math.floor(congestion * 10);
      const queueLength = queueVehicles * 5;

      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      let midpoint = null;
      if (fromNode && toNode) {
        const localMidX = (fromNode.x + toNode.x) / 2;
        const localMidY = (fromNode.y + toNode.y) / 2;
        const wgs84 = converter.localToWgs84(localMidX, localMidY);
        midpoint = { x: wgs84.x, y: wgs84.y };
      }

      timeData.edges[edge.id] = { 
        queueLength, 
        queueVehicles,
        midpoint
      };

      if (!heatmapData.aggregated.average[edge.id]) {
        heatmapData.aggregated.average[edge.id] = { queueLength: 0, queueVehicles: 0, midpoint };
        heatmapData.aggregated.max[edge.id] = { queueLength: 0, queueVehicles: 0, midpoint };
      }
      heatmapData.aggregated.average[edge.id].queueLength += queueLength;
      heatmapData.aggregated.average[edge.id].queueVehicles += queueVehicles;
      heatmapData.aggregated.max[edge.id].queueLength = Math.max(
        heatmapData.aggregated.max[edge.id].queueLength,
        queueLength
      );
      heatmapData.aggregated.max[edge.id].queueVehicles = Math.max(
        heatmapData.aggregated.max[edge.id].queueVehicles,
        queueVehicles
      );
    }

    heatmapData.data.push(timeData);
  }

  const timeSteps = heatmapData.data.length;
  if (timeSteps > 0) {
    for (const edgeId of Object.keys(heatmapData.aggregated.average)) {
      heatmapData.aggregated.average[edgeId].queueLength /= timeSteps;
      heatmapData.aggregated.average[edgeId].queueVehicles /= timeSteps;
    }
  }

  return heatmapData;
};

const processTripInfoData = async (tripinfoData, simulationPath) => {
  const tripinfos = tripinfoData.tripinfos?.tripinfo || [];
  
  const statistics = {
    totalTrips: tripinfos.length,
    averageTravelTime: 0,
    averageDelay: 0,
    averageSpeed: 0,
    totalDelay: 0,
    trips: []
  };

  let totalTravelTime = 0;
  let totalDelay = 0;
  let totalSpeed = 0;

  for (const trip of tripinfos) {
    const travelTime = parseFloat(trip.duration || 0);
    const delay = parseFloat(trip.departDelay || 0) + parseFloat(trip.waitingTime || 0);
    const avgSpeed = parseFloat(trip.routeLength || 0) / (travelTime || 1);

    totalTravelTime += travelTime;
    totalDelay += delay;
    totalSpeed += avgSpeed;

    statistics.trips.push({
      id: trip.id,
      duration: travelTime,
      departure: parseFloat(trip.depart || 0),
      arrival: parseFloat(trip.arrival || 0),
      delay,
      waitingTime: parseFloat(trip.waitingTime || 0),
      routeLength: parseFloat(trip.routeLength || 0),
      timeLoss: parseFloat(trip.timeLoss || 0)
    });
  }

  if (tripinfos.length > 0) {
    statistics.averageTravelTime = totalTravelTime / tripinfos.length;
    statistics.averageDelay = totalDelay / tripinfos.length;
    statistics.averageSpeed = totalSpeed / tripinfos.length;
    statistics.totalDelay = totalDelay;
  }

  await writeJsonFile(path.join(simulationPath, 'statistics.json'), statistics);
};

const processSummaryData = async (summaryData, simulationPath) => {
  const steps = summaryData.summary?.step || [];
  
  const summaryStats = {
    steps: steps.length,
    maxVehicles: 0,
    totalVehicleSteps: 0,
    data: []
  };

  for (const step of steps) {
    const running = parseInt(step.running || 0);
    const waiting = parseInt(step.waiting || 0);
    
    summaryStats.data.push({
      time: parseFloat(step.time),
      running,
      waiting,
      meanWaitingTime: parseFloat(step.meanWaitingTime || 0)
    });

    summaryStats.maxVehicles = Math.max(summaryStats.maxVehicles, running);
    summaryStats.totalVehicleSteps += running;
  }

  if (steps.length > 0) {
    summaryStats.averageVehicles = summaryStats.totalVehicleSteps / steps.length;
  }

  await writeJsonFile(path.join(simulationPath, 'summary_stats.json'), summaryStats);
};

const processQueueDataWithConverter = async (queueData, simulationPath, configData, converter) => {
  const data = queueData.queue-output?.data || [];
  
  const heatmapData = {
    startTime: 0,
    endTime: configData.simulationConfig.duration,
    edgeCount: 0,
    data: [],
    aggregated: {
      average: {},
      max: {}
    }
  };

  const edgeQueues = {};

  for (const d of data) {
    const time = parseFloat(d.time);
    const lanes = Array.isArray(d.lane) ? d.lane : (d.lane ? [d.lane] : []);
    
    const timeData = {
      time,
      edges: {}
    };

    for (const lane of lanes) {
      const edgeId = lane.id?.substring(0, lane.id.lastIndexOf('_')) || lane.id;
      const queueLength = parseFloat(lane.queueing_length || 0);
      const queueVehicles = parseInt(lane.queueing || 0);

      if (!edgeQueues[edgeId]) {
        edgeQueues[edgeId] = { lengths: [], counts: [] };
      }
      edgeQueues[edgeId].lengths.push(queueLength);
      edgeQueues[edgeId].counts.push(queueVehicles);

      if (!timeData.edges[edgeId]) {
        timeData.edges[edgeId] = { queueLength: 0, queueVehicles: 0 };
      }
      timeData.edges[edgeId].queueLength += queueLength;
      timeData.edges[edgeId].queueVehicles += queueVehicles;
    }

    heatmapData.data.push(timeData);
  }

  for (const [edgeId, data] of Object.entries(edgeQueues)) {
    if (data.lengths.length > 0) {
      heatmapData.aggregated.average[edgeId] = {
        queueLength: data.lengths.reduce((a, b) => a + b, 0) / data.lengths.length,
        queueVehicles: data.counts.reduce((a, b) => a + b, 0) / data.counts.length
      };
      heatmapData.aggregated.max[edgeId] = {
        queueLength: Math.max(...data.lengths),
        queueVehicles: Math.max(...data.counts)
      };
    }
  }

  heatmapData.edgeCount = Object.keys(edgeQueues).length;
  heatmapData.endTime = data.length > 0 ? parseFloat(data[data.length - 1].time) : 0;

  await writeJsonFile(path.join(simulationPath, 'heatmap_data.json'), heatmapData);
};

const completeSimulation = async (simulationId, runningPath) => {
  const completedPath = getSimulationPath(simulationId, 'completed');
  await fs.move(runningPath, completedPath);
  
  console.log(`[Worker] Simulation ${simulationId} moved to completed`);
};

const failSimulation = async (simulationId, runningPath, error) => {
  const failedPath = getSimulationPath(simulationId, 'failed');
  
  try {
    if (await fs.pathExists(runningPath)) {
      await fs.move(runningPath, failedPath);
    }
  } catch (e) {
    console.error('[Worker] Failed to move simulation to failed:', e);
  }
  
  await writeJsonFile(path.join(failedPath, 'error.json'), {
    error: error.message,
    stack: error.stack,
    failedAt: new Date().toISOString()
  });
};

module.exports = {
  processSimulationJob,
  checkSumoAvailability
};
