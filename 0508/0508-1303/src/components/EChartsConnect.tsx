import React, { useEffect } from 'react';
import * as echarts from 'echarts';

const CONNECT_GROUP = 'seismic-waveform-sync';

export const connectCharts = (chartIds: string[]) => {
  echarts.connect(CONNECT_GROUP);
};

export const disconnectCharts = (chartIds: string[]) => {
  echarts.disconnect(CONNECT_GROUP);
};

const EChartsConnect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    echarts.connect(CONNECT_GROUP);
    return () => {
      echarts.disconnect(CONNECT_GROUP);
    };
  }, []);

  return <>{children}</>;
};

export default EChartsConnect;
export { CONNECT_GROUP };
