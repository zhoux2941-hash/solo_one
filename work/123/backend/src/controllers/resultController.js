const path = require('path');
const { readJsonFile, getSimulationPath } = require('../utils/fileUtils');

const getTrajectoryData = async (req, res) => {
  const { simulationId } = req.params;
  const { startTime, endTime, vehicleIds } = req.query;

  try {
    const completedPath = getSimulationPath(simulationId, 'completed');
    
    let trajectoryData;
    try {
      trajectoryData = await readJsonFile(`${completedPath}/trajectories.json`);
    } catch (e) {
      return res.status(404).json({
        error: 'Trajectory data not found. Simulation may not be completed.'
      });
    }

    let filteredTrajectories = trajectoryData.trajectories || [];

    if (startTime !== undefined) {
      const start = parseFloat(startTime);
      filteredTrajectories = filteredTrajectories.filter(t => t.time >= start);
    }

    if (endTime !== undefined) {
      const end = parseFloat(endTime);
      filteredTrajectories = filteredTrajectories.filter(t => t.time <= end);
    }

    if (vehicleIds) {
      const vehicleIdList = vehicleIds.split(',').map(id => id.trim());
      filteredTrajectories = filteredTrajectories.filter(t => 
        vehicleIdList.includes(t.vehicleId)
      );
    }

    res.json({
      simulationId,
      metadata: {
        startTime: trajectoryData.startTime,
        endTime: trajectoryData.endTime,
        totalVehicles: trajectoryData.totalVehicles,
        timeStep: trajectoryData.timeStep
      },
      trajectories: filteredTrajectories,
      count: filteredTrajectories.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get trajectory data',
      message: error.message
    });
  }
};

const getTrajectoryAtTime = async (req, res) => {
  const { simulationId, time } = req.params;

  try {
    const completedPath = getSimulationPath(simulationId, 'completed');
    
    let trajectoryData;
    try {
      trajectoryData = await readJsonFile(`${completedPath}/trajectories.json`);
    } catch (e) {
      return res.status(404).json({
        error: 'Trajectory data not found. Simulation may not be completed.'
      });
    }

    const targetTime = parseFloat(time);
    const trajectoriesAtTime = trajectoryData.trajectories.filter(t => 
      Math.abs(t.time - targetTime) < 0.01
    );

    if (trajectoriesAtTime.length === 0) {
      const nearestTrajectory = trajectoryData.trajectories.reduce((nearest, current) => {
        const currentDiff = Math.abs(current.time - targetTime);
        const nearestDiff = Math.abs(nearest.time - targetTime);
        return currentDiff < nearestDiff ? current : nearest;
      }, trajectoryData.trajectories[0]);

      if (nearestTrajectory) {
        return res.json({
          simulationId,
          requestedTime: targetTime,
          actualTime: nearestTrajectory.time,
          vehicles: [nearestTrajectory]
        });
      }

      return res.status(404).json({
        error: 'No trajectory data found at the specified time'
      });
    }

    res.json({
      simulationId,
      time: targetTime,
      vehicles: trajectoriesAtTime
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get trajectory data at time',
      message: error.message
    });
  }
};

const getSnapshotList = async (req, res) => {
  const { simulationId } = req.params;

  try {
    const completedPath = getSimulationPath(simulationId, 'completed');
    
    let metadata;
    try {
      metadata = await readJsonFile(`${completedPath}/snapshot_metadata.json`);
    } catch (e) {
      return res.status(404).json({
        error: 'Snapshot metadata not found. Simulation may not be completed.'
      });
    }

    res.json({
      simulationId,
      totalSnapshots: metadata.totalSnapshots,
      snapshotInterval: metadata.snapshotInterval,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      snapshots: metadata.snapshots
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get snapshot list',
      message: error.message
    });
  }
};

const getSnapshot = async (req, res) => {
  const { simulationId, index } = req.params;

  try {
    const completedPath = getSimulationPath(simulationId, 'completed');
    const snapshotIndex = parseInt(index);

    let snapshot;
    try {
      snapshot = await readJsonFile(`${completedPath}/snapshot_${snapshotIndex}.json`);
    } catch (e) {
      return res.status(404).json({
        error: `Snapshot ${index} not found`
      });
    }

    res.json({
      simulationId,
      snapshotIndex: snapshotIndex,
      time: snapshot.time,
      vehicles: snapshot.vehicles,
      trafficLights: snapshot.trafficLights
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get snapshot',
      message: error.message
    });
  }
};

const getHeatmapData = async (req, res) => {
  const { simulationId } = req.params;
  const { time, aggregation = 'average' } = req.query;

  try {
    const completedPath = getSimulationPath(simulationId, 'completed');
    
    let heatmapData;
    try {
      heatmapData = await readJsonFile(`${completedPath}/heatmap_data.json`);
    } catch (e) {
      return res.status(404).json({
        error: 'Heatmap data not found. Simulation may not be completed.'
      });
    }

    let result;
    if (time !== undefined) {
      const targetTime = parseFloat(time);
      result = heatmapData.data.find(d => Math.abs(d.time - targetTime) < 0.01);
      
      if (!result) {
        return res.status(404).json({
          error: `Heatmap data not found for time ${time}`
        });
      }
    } else {
      result = {
        aggregation,
        aggregatedData: aggregation === 'average' 
          ? heatmapData.aggregated.average
          : heatmapData.aggregated.max
      };
    }

    res.json({
      simulationId,
      metadata: {
        startTime: heatmapData.startTime,
        endTime: heatmapData.endTime,
        edgeCount: heatmapData.edgeCount
      },
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get heatmap data',
      message: error.message
    });
  }
};

const getStatistics = async (req, res) => {
  const { simulationId } = req.params;

  try {
    const completedPath = getSimulationPath(simulationId, 'completed');
    
    let stats;
    try {
      stats = await readJsonFile(`${completedPath}/statistics.json`);
    } catch (e) {
      return res.status(404).json({
        error: 'Statistics not found. Simulation may not be completed.'
      });
    }

    res.json({
      simulationId,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
};

module.exports = {
  getTrajectoryData,
  getTrajectoryAtTime,
  getSnapshotList,
  getSnapshot,
  getHeatmapData,
  getStatistics
};
