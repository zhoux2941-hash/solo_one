module.exports = (sequelize, Sequelize) => {
  const FlowMeterReading = sequelize.define('FlowMeterReading', {
    batchId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '批次ID'
    },
    readingTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: '读数时间'
    },
    flowRate: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      comment: '瞬时流量(L/min)'
    },
    totalFlow: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      comment: '累计流量(L)'
    },
    concentration: {
      type: Sequelize.DECIMAL(5, 2),
      comment: '浓度(%)'
    },
    temperature: {
      type: Sequelize.DECIMAL(5, 1),
      comment: '温度(°C)'
    },
    meterId: {
      type: Sequelize.STRING,
      comment: '流量计编号'
    }
  }, {
    tableName: 'flow_meter_readings',
    timestamps: true,
    indexes: [
      { fields: ['batchId'] },
      { fields: ['readingTime'] },
      { fields: ['meterId'] }
    ]
  });

  return FlowMeterReading;
};