const Sequelize = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database/pulp_mill.db'),
  logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.PulpBatch = require('./pulpBatch')(sequelize, Sequelize);
db.FlowMeterReading = require('./flowMeterReading')(sequelize, Sequelize);
db.DowntimeRemark = require('./downtimeRemark')(sequelize, Sequelize);
db.LossSegment = require('./lossSegment')(sequelize, Sequelize);
db.LossSnapshot = require('./lossSnapshot')(sequelize, Sequelize);
db.StageCalculation = require('./stageCalculation')(sequelize, Sequelize);

db.PulpBatch.hasMany(db.FlowMeterReading, { foreignKey: 'batchId' });
db.PulpBatch.hasMany(db.DowntimeRemark, { foreignKey: 'batchId' });
db.PulpBatch.hasMany(db.LossSegment, { foreignKey: 'batchId' });
db.PulpBatch.hasMany(db.LossSnapshot, { foreignKey: 'batchId' });
db.PulpBatch.hasMany(db.StageCalculation, { foreignKey: 'batchId' });

db.LossSegment.hasMany(db.StageCalculation, { foreignKey: 'segmentId' });

module.exports = db;