module.exports = (sequelize, Sequelize) => {
  const StageCalculation = sequelize.define('StageCalculation', {
    batchId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '批次ID'
    },
    segmentId: {
      type: Sequelize.INTEGER,
      comment: '分段ID'
    },
    stageName: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '阶段名称'
    },
    startTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: '开始时间'
    },
    endTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: '结束时间'
    },
    duration: {
      type: Sequelize.INTEGER,
      comment: '持续时间(秒)'
    },
    startFlow: {
      type: Sequelize.DECIMAL(12, 2),
      comment: '起始累计流量(L)'
    },
    endFlow: {
      type: Sequelize.DECIMAL(12, 2),
      comment: '结束累计流量(L)'
    },
    flowDifference: {
      type: Sequelize.DECIMAL(10, 2),
      comment: '流量差(L)'
    },
    avgConcentration: {
      type: Sequelize.DECIMAL(5, 2),
      comment: '平均浓度(%)'
    },
    lossAmount: {
      type: Sequelize.DECIMAL(10, 2),
      comment: '损耗量(kg)'
    },
    lossRate: {
      type: Sequelize.DECIMAL(5, 2),
      comment: '损耗率(%)'
    },
    theoreticalOutput: {
      type: Sequelize.DECIMAL(10, 2),
      comment: '理论产出(kg)'
    },
    actualOutput: {
      type: Sequelize.DECIMAL(10, 2),
      comment: '实际产出(kg)'
    },
    remark: {
      type: Sequelize.TEXT,
      comment: '计算备注'
    },
    linkedRemarkId: {
      type: Sequelize.INTEGER,
      comment: '关联人工备注ID'
    },
    readingCount: {
      type: Sequelize.INTEGER,
      comment: '参与计算的读数数量'
    }
  }, {
    tableName: 'stage_calculations',
    timestamps: true,
    indexes: [
      { fields: ['batchId'] },
      { fields: ['segmentId'] },
      { fields: ['startTime'] }
    ]
  });

  return StageCalculation;
};