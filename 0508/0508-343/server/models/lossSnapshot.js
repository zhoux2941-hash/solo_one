module.exports = (sequelize, Sequelize) => {
  const LossSnapshot = sequelize.define('LossSnapshot', {
    batchId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '批次ID'
    },
    segmentId: {
      type: Sequelize.INTEGER,
      comment: '分段ID'
    },
    snapshotTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: '快照时间'
    },
    snapshotType: {
      type: Sequelize.ENUM('start', 'interval', 'end'),
      allowNull: false,
      comment: '快照类型'
    },
    flowRate: {
      type: Sequelize.DECIMAL(10, 2),
      comment: '瞬时流量(L/min)'
    },
    totalFlow: {
      type: Sequelize.DECIMAL(12, 2),
      comment: '累计流量(L)'
    },
    concentration: {
      type: Sequelize.DECIMAL(5, 2),
      comment: '浓度(%)'
    },
    accumulatedLoss: {
      type: Sequelize.DECIMAL(10, 2),
      comment: '累计损耗(kg)'
    },
    pulpComposition: {
      type: Sequelize.JSON,
      comment: '浆种组成比例'
    }
  }, {
    tableName: 'loss_snapshots',
    timestamps: true,
    indexes: [
      { fields: ['batchId'] },
      { fields: ['segmentId'] },
      { fields: ['snapshotTime'] }
    ]
  });

  return LossSnapshot;
};