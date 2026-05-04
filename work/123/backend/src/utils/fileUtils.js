const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const ensureDirectories = async () => {
  const dirs = [
    config.paths.dataDir,
    config.paths.simulationDir,
    path.join(config.paths.simulationDir, 'pending'),
    path.join(config.paths.simulationDir, 'running'),
    path.join(config.paths.simulationDir, 'completed'),
    path.join(config.paths.simulationDir, 'failed')
  ];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

const generateSimulationId = () => {
  return uuidv4();
};

const getSimulationPath = (simulationId, status = 'pending') => {
  return path.join(config.paths.simulationDir, status, simulationId);
};

const readJsonFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON file: ${error.message}`);
  }
};

const writeJsonFile = async (filePath, data) => {
  try {
    await fs.writeJson(filePath, data, { spaces: 2 });
  } catch (error) {
    throw new Error(`Failed to write JSON file: ${error.message}`);
  }
};

const deleteDirectory = async (dirPath) => {
  try {
    await fs.remove(dirPath);
  } catch (error) {
    throw new Error(`Failed to delete directory: ${error.message}`);
  }
};

const listSimulations = async (status = 'completed') => {
  const dirPath = path.join(config.paths.simulationDir, status);
  try {
    const items = await fs.readdir(dirPath);
    return items;
  } catch (error) {
    return [];
  }
};

module.exports = {
  ensureDirectories,
  generateSimulationId,
  getSimulationPath,
  readJsonFile,
  writeJsonFile,
  deleteDirectory,
  listSimulations
};
