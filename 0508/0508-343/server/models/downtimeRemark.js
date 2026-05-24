module.exports = (sequelize, Sequelize) => {
  const DowntimeRemark = sequelize.define('DowntimeRemark', {
    batchId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '批次ID'
    },
    eventTime: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: '事件时间'
    },
    eventType: {
      type: Sequelize.ENUM('start', 'pause', 'resume', 'stop', 'note'),
      allowNull: false,
      comment: '事件类型'
    },
    remark: {
      type: Sequelize.TEXT,
      comment: '备注内容'
    },
    operator: {
      type: Sequelize.STRING,
      comment: '记录人'
    },
    duration: {
      type: Sequelize.INTEGER,
      comment: '持续时间(秒)'
    }
  }, {
    tableName: 'downtime_remarks',
    timestamps: true,
    indexes: [
      { fields: ['batchId'] },
      { fields: ['eventTime'] },
      { fields: ['eventType'] }
    ]
  });

  return DowntimeRemark;
};