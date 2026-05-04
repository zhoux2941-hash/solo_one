import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import DeckGL from '@deck.gl/react';
import { LineLayer, ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { TripsLayer, HeatmapLayer } from '@deck.gl/geo-layers';
import useAppStore from '../store/appStore';


const DEFAULT_VIEW_STATE = {
  longitude: 116.3972,
  latitude: 39.9075,
  zoom: 12,
  pitch: 45,
  bearing: 0
};

function MapView() {
  const mapRef = useRef(null);
  const deckRef = useRef(null);
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  
  const {
    mode,
    activeLayers,
    network,
    trafficLights,
    visualization,
    results,
    setSelectedNode,
    setSelectedEdge,
    addNode,
    addEdge,
    setDrawingState,
    drawingState
  } = useAppStore();

  const handleMapClick = useCallback((event) => {
    if (mode !== 'drawing') return;

    const { lngLat } = event;
    const [x, y] = lngLat;

    if (!drawingState.startNode) {
      const existingNode = network.nodes.find(node => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 0.001;
      });

      if (existingNode) {
        setDrawingState({ startNode: existingNode, tempEdge: null });
      } else {
        const newNode = {
          id: `node_${Date.now()}`,
          x,
          y,
          type: 'priority'
        };
        addNode(newNode);
        setDrawingState({ startNode: newNode, tempEdge: null });
      }
    } else {
      const existingNode = network.nodes.find(node => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 0.001;
      });

      if (existingNode && existingNode.id !== drawingState.startNode.id) {
        const existingEdge = network.edges.find(
          e => (e.from === drawingState.startNode.id && e.to === existingNode.id)
        );

        if (!existingEdge) {
          const newEdge = {
            id: `edge_${Date.now()}`,
            from: drawingState.startNode.id,
            to: existingNode.id,
            lanes: 1,
            speed: 13.89,
            length: 100
          };
          addEdge(newEdge);
        }
      } else if (!existingNode) {
        const newNode = {
          id: `node_${Date.now()}`,
          x,
          y,
          type: 'priority'
        };
        addNode(newNode);

        const newEdge = {
          id: `edge_${Date.now()}`,
          from: drawingState.startNode.id,
          to: newNode.id,
          lanes: 1,
          speed: 13.89,
          length: 100
        };
        addEdge(newEdge);
      }

      setDrawingState({ startNode: null, tempEdge: null });
    }
  }, [mode, drawingState, network, addNode, addEdge, setDrawingState]);

  const handleMouseMove = useCallback((event) => {
    if (mode !== 'drawing' || !drawingState.startNode) return;

    const { lngLat } = event;
    const [x, y] = lngLat;

    setDrawingState({
      ...drawingState,
      tempEdge: {
        from: drawingState.startNode.x,
        fromY: drawingState.startNode.y,
        to: x,
        toY: y
      }
    });
  }, [mode, drawingState, setDrawingState]);

  const nodePositions = network.nodes.map(node => ({
    position: [node.x, node.y],
    id: node.id,
    type: node.type
  }));

  const edgePaths = network.edges.map(edge => {
    const fromNode = network.nodes.find(n => n.id === edge.from);
    const toNode = network.nodes.find(n => n.id === edge.to);
    return {
      path: fromNode && toNode 
        ? [[fromNode.x, fromNode.y], [toNode.x, toNode.y]]
        : [],
      id: edge.id,
      from: edge.from,
      to: edge.to,
      lanes: edge.lanes,
      speed: edge.speed
    };
  });

  const trafficLightPositions = trafficLights.map(tl => {
    const node = network.nodes.find(n => n.id === tl.intersectionId);
    return {
      position: node ? [node.x, node.y] : [0, 0],
      id: tl.intersectionId,
      phases: tl.phases
    };
  });

  const layers = [];

  if (activeLayers.roads) {
    layers.push(
      new LineLayer({
        id: 'roads-layer',
        data: edgePaths,
        getSourcePosition: d => d.path[0] || [0, 0],
        getTargetPosition: d => d.path[1] || [0, 0],
        getColor: [80, 80, 80],
        getWidth: d => (d.lanes || 1) * 5,
        widthUnits: 'meters',
        widthScale: 1,
        widthMinPixels: 2,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 165, 0]
      })
    );
  }

  if (activeLayers.nodes) {
    layers.push(
      new ScatterplotLayer({
        id: 'nodes-layer',
        data: nodePositions,
        getPosition: d => d.position,
        getRadius: 8,
        getFillColor: d => {
          const hasTrafficLight = trafficLights.some(tl => tl.intersectionId === d.id);
          return hasTrafficLight ? [255, 0, 0] : [0, 128, 255];
        },
        radiusUnits: 'meters',
        radiusScale: 1,
        radiusMinPixels: 5,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 0],
        onClick: (info) => {
          if (mode === 'view') {
            setSelectedNode(info.object);
          }
        }
      })
    );
  }

  if (activeLayers.trafficLights) {
    layers.push(
      new ScatterplotLayer({
        id: 'traffic-lights-layer',
        data: trafficLightPositions,
        getPosition: d => d.position,
        getRadius: 12,
        getFillColor: [255, 215, 0],
        radiusUnits: 'meters',
        radiusScale: 1,
        radiusMinPixels: 8,
        pickable: true
      })
    );
  }

  if (activeLayers.vehicles && results.snapshots.length > 0) {
    const currentSnapshot = results.snapshots.find(
      s => Math.abs(s.time - visualization.currentTime) < 1
    );

    if (currentSnapshot && currentSnapshot.vehicles) {
      layers.push(
        new ScatterplotLayer({
          id: 'vehicles-layer',
          data: currentSnapshot.vehicles,
          getPosition: d => [d.x, d.y],
          getRadius: 3,
          getFillColor: [0, 255, 128],
          radiusUnits: 'meters',
          radiusScale: 1,
          radiusMinPixels: 3
        })
      );
    }
  }

  if (activeLayers.heatmap && results.heatmapData) {
    const heatmapPoints = [];
    const aggregatedData = results.heatmapData.aggregated?.average || {};
    
    for (const [edgeId, data] of Object.entries(aggregatedData)) {
      const edge = network.edges.find(e => e.id === edgeId);
      if (edge) {
        const fromNode = network.nodes.find(n => n.id === edge.from);
        const toNode = network.nodes.find(n => n.id === edge.to);
        if (fromNode && toNode) {
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          heatmapPoints.push({
            coordinates: [midX, midY],
            weight: data.queueVehicles || 0
          });
        }
      }
    }

    layers.push(
      new HeatmapLayer({
        id: 'heatmap-layer',
        data: heatmapPoints,
        getPosition: d => d.coordinates,
        getWeight: d => d.weight,
        radiusPixels: 50,
        intensity: 1,
        threshold: 0.03,
        colorRange: [
          [0, 255, 0],
          [255, 255, 0],
          [255, 0, 0]
        ]
      })
    );
  }

  if (drawingState.tempEdge) {
    layers.push(
      new LineLayer({
        id: 'temp-edge-layer',
        data: [{
          sourcePosition: [drawingState.tempEdge.from, drawingState.tempEdge.fromY],
          targetPosition: [drawingState.tempEdge.to, drawingState.tempEdge.toY]
        }],
        getSourcePosition: d => d.sourcePosition,
        getTargetPosition: d => d.targetPosition,
        getColor: [0, 200, 255],
        getWidth: 3,
        widthUnits: 'meters',
        widthMinPixels: 2
      })
    );
  }

  return (
    <div className="map-container">
      <DeckGL
        ref={deckRef}
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        onClick={handleMapClick}
        onPointerMove={handleMouseMove}
        pickingRadius={10}
      >
        <mapboxgl.Map
          ref={mapRef}
          style="mapbox://styles/mapbox/light-v10"
          onLoad={(event) => {
            mapRef.current = event.target;
          }}
        />
      </DeckGL>
    </div>
  );
}

export default MapView;
