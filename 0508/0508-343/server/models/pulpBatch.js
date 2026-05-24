module.exports = (sequelize, Sequelize) => {
  const PulpBatch = sequelize.define('PulpBatch', {
    batchNo: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: '批次号'
    },
    machineId: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '机台编号'
    },
    oldPulpType: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '原浆类型'
    },
    newPulpType: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '新浆类型'
    },
    startTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: '换浆开始时间'
    },
    endTime: {
      type: Sequelize.DATE,
      comment: '换浆结束时间'
    },
    status: {
      type: Sequelize.ENUM('pending', 'processing', 'completed', 'reviewed'),
      defaultValue: 'pending',
      comment: '状态'
    },
    operator: {
      type: Sequelize.STRING,
      comment: '操作员'
    },
    totalLoss: {
      type: Sequelize.DECIMAL(10, 2),
      comment: '总损耗量(kg)'
    },
    totalLossRate: {
      type: Sequelize.DECIMAL(5, 2),
      comment: '总损耗率(%)'
    },
    reviewRemark: {
      type: Sequelize.TEXT,
      comment: '复盘备注'
    },
    reviewedBy: {
      type: Sequelize.STRING,
      comment: '复盘人'
    },
    reviewedAt: {
      type: Sequelize.DATE,
      comment: '复盘时间'
    }
  }, {
    tableName: 'pulp_batches',
    timestamps: true,
    indexes: [
      { fields: ['batchNo'] },
      { fields: ['machineId'] },
      { fields: ['startTime'] },
      { fields: ['status'] }
    ]
  });

  return PulpBatch;
};