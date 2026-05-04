import React from 'react';
import { Checkbox, Space, Typography } from 'antd';
import useAppStore from '../store/appStore';

const { Text } = Typography;

function LayerToggle() {
  const {
    activeLayers,
    toggleLayer,
    results
  } = useAppStore();

  const hasResults = results.snapshots.length > 0 || results.heatmapData;

  return (
    <div className="layer-toggle">
      <Space direction="vertical" size="small">
        <Text strong>图层控制</Text>
        
        <Checkbox
          checked={activeLayers.roads}
          onChange={() => toggleLayer('roads')}
        >
          道路网络
        </Checkbox>

        <Checkbox
          checked={activeLayers.nodes}
          onChange={() => toggleLayer('nodes')}
        >
          道路节点
        </Checkbox>

        <Checkbox
          checked={activeLayers.trafficLights}
          onChange={() => toggleLayer('trafficLights')}
        >
          信号灯
        </Checkbox>

        <Checkbox
          checked={activeLayers.vehicles}
          onChange={() => toggleLayer('vehicles')}
          disabled={!hasResults}
        >
          车辆轨迹
        </Checkbox>

        <Checkbox
          checked={activeLayers.heatmap}
          onChange={() => toggleLayer('heatmap')}
          disabled={!hasResults}
        >
          拥堵热力图
        </Checkbox>
      </Space>

      {activeLayers.heatmap && (
        <div className="heatmap-legend" style={{ marginTop: 8 }}>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>拥堵程度</Text>
          <div className="heatmap-gradient"></div>
          <div className="heatmap-labels">
            <span>畅通</span>
            <span>拥堵</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayerToggle;
