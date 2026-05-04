const proj4 = require('proj4');

proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs('EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs');

const getUTMZone = (longitude, latitude) => {
  const zoneNumber = Math.floor((longitude + 180) / 6) + 1;
  const hemisphere = latitude >= 0 ? 'north' : 'south';
  return { zoneNumber, hemisphere };
};

const getUTMProjectionString = (zoneNumber, hemisphere) => {
  const northSouth = hemisphere === 'north' ? '' : ' +south';
  return `+proj=utm +zone=${zoneNumber}${northSouth} +datum=WGS84 +units=m +no_defs`;
};

class CoordinateConverter {
  constructor() {
    this.projectionConfig = null;
    this.originWGS84 = null;
    this.originLocal = { x: 0, y: 0 };
    this.scaleFactor = 1;
  }

  initializeFromNetwork(nodes) {
    if (!nodes || nodes.length === 0) {
      this.projectionConfig = {
        type: 'simple',
        center: { x: 116.3972, y: 39.9075 }
      };
      this.originWGS84 = { x: 116.3972, y: 39.9075 };
      return;
    }

    const validNodes = nodes.filter(n => 
      n.x !== undefined && n.y !== undefined &&
      typeof n.x === 'number' && typeof n.y === 'number'
    );

    if (validNodes.length === 0) {
      this.initializeFromNetwork([]);
      return;
    }

    const centerX = validNodes.reduce((sum, n) => sum + n.x, 0) / validNodes.length;
    const centerY = validNodes.reduce((sum, n) => sum + n.y, 0) / validNodes.length;

    this.originWGS84 = { x: centerX, y: centerY };

    const { zoneNumber, hemisphere } = getUTMZone(centerX, centerY);
    const utmProjection = getUTMProjectionString(zoneNumber, hemisphere);

    try {
      proj4.defs('SUMO_UTM', utmProjection);
      this.projectionConfig = {
        type: 'utm',
        zoneNumber,
        hemisphere,
        center: { x: centerX, y: centerY },
        projectionString: utmProjection
      };
      
      const localOrigin = proj4('EPSG:4326', 'SUMO_UTM', [centerX, centerY]);
      this.originLocal = { x: localOrigin[0], y: localOrigin[1] };
      
      console.log(`Coordinate converter initialized with UTM Zone ${zoneNumber}${hemisphere === 'north' ? 'N' : 'S'}`);
    } catch (error) {
      console.warn('Failed to initialize UTM projection, using simple projection:', error.message);
      this.projectionConfig = {
        type: 'simple',
        center: { x: centerX, y: centerY }
      };
    }
  }

  wgs84ToLocal(longitude, latitude) {
    if (this.projectionConfig?.type === 'utm') {
      try {
        const utmCoords = proj4('EPSG:4326', 'SUMO_UTM', [longitude, latitude]);
        return {
          x: utmCoords[0] - this.originLocal.x,
          y: utmCoords[1] - this.originLocal.y
        };
      } catch (error) {
        console.warn('UTM conversion failed, using simple conversion:', error.message);
      }
    }

    return this.simpleWgs84ToLocal(longitude, latitude);
  }

  localToWgs84(x, y) {
    if (this.projectionConfig?.type === 'utm') {
      try {
        const utmCoords = [
          x + this.originLocal.x,
          y + this.originLocal.y
        ];
        const wgs84Coords = proj4('SUMO_UTM', 'EPSG:4326', utmCoords);
        return {
          x: wgs84Coords[0],
          y: wgs84Coords[1]
        };
      } catch (error) {
        console.warn('UTM reverse conversion failed, using simple conversion:', error.message);
      }
    }

    return this.simpleLocalToWgs84(x, y);
  }

  simpleWgs84ToLocal(longitude, latitude) {
    const center = this.projectionConfig?.center || this.originWGS84 || { x: 116.3972, y: 39.9075 };
    
    const earthRadius = 6371000;
    const latRad = latitude * Math.PI / 180;
    const centerLatRad = center.y * Math.PI / 180;
    
    const dx = (longitude - center.x) * Math.PI / 180 * earthRadius * Math.cos((latitude + center.y) / 2 * Math.PI / 180);
    const dy = (latitude - center.y) * Math.PI / 180 * earthRadius;
    
    return { x: dx, y: dy };
  }

  simpleLocalToWgs84(x, y) {
    const center = this.projectionConfig?.center || this.originWGS84 || { x: 116.3972, y: 39.9075 };
    
    const earthRadius = 6371000;
    const centerLatRad = center.y * Math.PI / 180;
    
    const dLon = x / (earthRadius * Math.cos(centerLatRad)) * 180 / Math.PI;
    const dLat = y / earthRadius * 180 / Math.PI;
    
    return {
      x: center.x + dLon,
      y: center.y + dLat
    };
  }

  convertNetworkToLocal(network) {
    const { nodes, edges } = network;
    const convertedNodes = [];
    const nodeMapping = new Map();

    this.initializeFromNetwork(nodes);

    for (const node of nodes) {
      const localCoords = this.wgs84ToLocal(node.x, node.y);
      const convertedNode = {
        ...node,
        x: localCoords.x,
        y: localCoords.y,
        originalX: node.x,
        originalY: node.y
      };
      convertedNodes.push(convertedNode);
      nodeMapping.set(node.id, {
        original: { x: node.x, y: node.y },
        local: localCoords
      });
    }

    return {
      nodes: convertedNodes,
      edges,
      nodeMapping
    };
  }

  getOriginalWGS84(nodeId) {
    if (!this.nodeMapping) return null;
    const mapping = this.nodeMapping.get(nodeId);
    return mapping ? mapping.original : null;
  }

  convertVehiclesToWGS84(vehicles) {
    return vehicles.map(vehicle => {
      const wgs84 = this.localToWgs84(vehicle.x, vehicle.y);
      return {
        ...vehicle,
        x: wgs84.x,
        y: wgs84.y
      };
    });
  }

  convertTrajectoryToWGS84(trajectories) {
    return trajectories.map(trajectory => {
      const wgs84 = this.localToWgs84(trajectory.x, trajectory.y);
      return {
        ...trajectory,
        x: wgs84.x,
        y: wgs84.y
      };
    });
  }

  convertHeatmapToWGS84(heatmapData, network) {
    if (!heatmapData || !heatmapData.aggregated) {
      return heatmapData;
    }

    const convertedData = {
      ...heatmapData,
      aggregated: {
        average: {},
        max: {}
      }
    };

    const edges = network?.edges || [];
    const nodes = network?.nodes || [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const edge of edges) {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      
      if (fromNode && toNode && heatmapData.aggregated.average[edge.id]) {
        const fromWGS84 = this.localToWgs84(fromNode.x, fromNode.y);
        const toWGS84 = this.localToWgs84(toNode.x, toNode.y);
        
        const midX = (fromWGS84.x + toWGS84.x) / 2;
        const midY = (fromWGS84.y + toWGS84.y) / 2;

        convertedData.aggregated.average[edge.id] = {
          ...heatmapData.aggregated.average[edge.id],
          midpoint: { x: midX, y: midY }
        };

        if (heatmapData.aggregated.max[edge.id]) {
          convertedData.aggregated.max[edge.id] = {
            ...heatmapData.aggregated.max[edge.id],
            midpoint: { x: midX, y: midY }
          };
        }
      }
    }

    return convertedData;
  }

  getConfig() {
    return {
      projectionConfig: this.projectionConfig,
      originWGS84: this.originWGS84,
      originLocal: this.originLocal
    };
  }
}

const createCoordinateConverter = (network) => {
  const converter = new CoordinateConverter();
  if (network) {
    converter.initializeFromNetwork(network.nodes);
  }
  return converter;
};

const wgs84ToLocalSimple = (longitude, latitude, centerLongitude, centerLatitude) => {
  const earthRadius = 6371000;
  
  const dx = (longitude - centerLongitude) * Math.PI / 180 * earthRadius * Math.cos((latitude + centerLatitude) / 2 * Math.PI / 180);
  const dy = (latitude - centerLatitude) * Math.PI / 180 * earthRadius;
  
  return { x: dx, y: dy };
};

const localToWgs84Simple = (x, y, centerLongitude, centerLatitude) => {
  const earthRadius = 6371000;
  const centerLatRad = centerLatitude * Math.PI / 180;
  
  const dLon = x / (earthRadius * Math.cos(centerLatRad)) * 180 / Math.PI;
  const dLat = y / earthRadius * 180 / Math.PI;
  
  return {
    x: centerLongitude + dLon,
    y: centerLatitude + dLat
  };
};

module.exports = {
  CoordinateConverter,
  createCoordinateConverter,
  getUTMZone,
  getUTMProjectionString,
  wgs84ToLocalSimple,
  localToWgs84Simple
};
