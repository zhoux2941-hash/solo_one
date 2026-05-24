module.exports = (sequelize, Sequelize) => {
  const LossSegment = sequelize.define('LossSegment', {
    batchId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '批次ID'
    },
    segmentName: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '分段名称'
    },
    segmentType: {
      type: Sequelize.ENUM('preparation', 'switching', 'stabilization', 'completion', 'downtime'),
      allowNull: false,
      comment: '分段类型'
    },
    startTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: '开始时间'
    },
    endTime: {
      type: Sequelize.DATE,
      comment: '结束时间'
    },
    duration: {
      type: Sequelize.INTEGER,
      comment: '持续时间(秒)'
    },
    sortOrder: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    remark: {
      type: Sequelize.TEXT,
      comment: '备注'
    },
    linkedRemarkId: {
      type: Sequelize.INTEGER,
      comment: '关联备注ID'
    },
    isOverlapping: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: '是否与主分段重叠'
    }
  }, {
    tableName: 'loss_segments',
    timestamps: true,
    indexes: [
      { fields: ['batchId'] },
      { fields: ['segmentType'] },
      { fields: ['startTime'] }
    ]
  });

  return LossSegment;
};