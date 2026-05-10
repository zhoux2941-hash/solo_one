const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const db = require('./db');

function registerIpcHandlers() {
    ipcMain.handle('get-projects', () => {
        return db.getProjects();
    });

    ipcMain.handle('get-project-by-id', (event, id) => {
        return db.getProjectById(id);
    });

    ipcMain.handle('add-project', (event, project) => {
        return db.addProject(project.name, project.budget, project.hourlyRate);
    });

    ipcMain.handle('update-project', (event, project) => {
        return db.updateProject(project.id, project.name, project.budget, project.hourlyRate);
    });

    ipcMain.handle('delete-project', (event, id) => {
        return db.deleteProject(id);
    });

    ipcMain.handle('add-work-record', (event, record) => {
        return db.addWorkRecord(
            record.projectId,
            record.date,
            record.startTime,
            record.endTime,
            record.durationMinutes,
            record.notes
        );
    });

    ipcMain.handle('update-work-record', (event, record) => {
        return db.updateWorkRecord(
            record.id,
            record.projectId,
            record.date,
            record.startTime,
            record.endTime,
            record.durationMinutes,
            record.notes
        );
    });

    ipcMain.handle('delete-work-record', (event, id) => {
        return db.deleteWorkRecord(id);
    });

    ipcMain.handle('get-work-records-by-date', (event, date) => {
        return db.getWorkRecordsByDate(date);
    });

    ipcMain.handle('get-daily-total-minutes', (event, date) => {
        return db.getDailyTotalMinutes(date);
    });

    ipcMain.handle('get-work-records-by-range', (event, startDate, endDate) => {
        return db.getWorkRecordsByDateRange(startDate, endDate);
    });

    ipcMain.handle('get-project-summary', (event, startDate, endDate) => {
        return db.getProjectSummary(startDate, endDate);
    });

    ipcMain.handle('export-csv', async (event, data, type) => {
        const today = new Date().toISOString().split('T')[0];
        const defaultFilename = type === 'weekly' ? `weekly-report-${today}.csv` : 
                                type === 'monthly' ? `monthly-report-${today}.csv` : 
                                `daily-${today}.csv`;

        const result = await dialog.showSaveDialog({
            title: '导出 CSV',
            defaultPath: defaultFilename,
            filters: [
                { name: 'CSV 文件', extensions: ['csv'] }
            ]
        });

        if (result.canceled || !result.filePath) {
            return null;
        }

        fs.writeFileSync(result.filePath, data, 'utf8');
        return result.filePath;
    });
}

module.exports = {
    registerIpcHandlers
};
