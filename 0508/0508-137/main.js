const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

let mainWindow;
let db;

function parseDMS(input) {
    if (input == null || input === '') return null;
    
    if (typeof input === 'number') {
        return input;
    }
    
    const str = String(input).trim();
    
    if (!isNaN(parseFloat(str)) && !/[°'"\u00b0\u2019\u201dNSWE]/.test(str)) {
        const num = parseFloat(str);
        if (!isNaN(num)) return num;
    }
    
    let degrees = 0, minutes = 0, seconds = 0;
    let sign = 1;
    
    const normalized = str
        .replace(/\u00b0/g, '°')
        .replace(/[\u2019\u2032]/g, "'")
        .replace(/[\u201d\u2033]/g, '"')
        .replace(/\s+/g, '');
    
    if (/[SW]/.test(normalized)) {
        sign = -1;
    }
    
    const dmsMatch = normalized.match(/(\d+(?:\.\d+)?)\s*°\s*(?:(\d+(?:\.\d+)?)\s*['’′]\s*(?:(\d+(?:\.\d+)?)\s*[""”″]\s*)?)?([NSWE])?/i);
    
    if (dmsMatch) {
        degrees = parseFloat(dmsMatch[1]) || 0;
        minutes = parseFloat(dmsMatch[2]) || 0;
        seconds = parseFloat(dmsMatch[3]) || 0;
    } else {
        const dmMatch = normalized.match(/(\d+(?:\.\d+)?)\s*°?\s*(\d+(?:\.\d+)?)?\s*['’′]?\s*([NSWE])?/i);
        if (dmMatch) {
            degrees = parseFloat(dmMatch[1]) || 0;
            minutes = parseFloat(dmMatch[2]) || 0;
        } else {
            const plainMatch = normalized.match(/^(-?\d+(?:\.\d+)?)/);
            if (plainMatch) {
                return parseFloat(plainMatch[1]);
            }
            return null;
        }
    }
    
    const decimal = degrees + minutes / 60 + seconds / 3600;
    return decimal * sign;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();
}

function initDatabase() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'specimens.db');
    db = new Database(dbPath);

    db.exec(`
        CREATE TABLE IF NOT EXISTS specimens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection_loc TEXT,
            lat REAL,
            lon REAL,
            elevation REAL,
            collector TEXT,
            date TEXT,
            identifier TEXT,
            scientific_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            config TEXT
        )
    `);

    const defaultTemplate = db.prepare('SELECT * FROM templates WHERE name = ?').get('default');
    if (!defaultTemplate) {
        const defaultConfig = {
            labelsPerPage: 8,
            labelWidth: 90,
            labelHeight: 50,
            pageMargins: { top: 10, bottom: 10, left: 15, right: 15 },
            labelMargins: { top: 2, bottom: 2, left: 3, right: 3 },
            fields: [
                { key: 'scientific_name', label: '学名', x: 5, y: 5, width: 80, height: 10, fontSize: 12, visible: true },
                { key: 'collection_loc', label: '采集地', x: 5, y: 17, width: 80, height: 8, fontSize: 9, visible: true },
                { key: 'coord_elevation', label: '经纬度/海拔', x: 5, y: 27, width: 80, height: 8, fontSize: 8, visible: true },
                { key: 'collector_date', label: '采集人/日期', x: 5, y: 37, width: 80, height: 8, fontSize: 8, visible: true },
                { key: 'identifier', label: '鉴定人', x: 5, y: 45, width: 80, height: 5, fontSize: 8, visible: true },
                { key: 'qr', label: '二维码', x: 70, y: 5, width: 18, height: 18, visible: true }
            ]
        };
        db.prepare('INSERT INTO templates (name, config) VALUES (?, ?)').run('default', JSON.stringify(defaultConfig));
    }
}

app.whenReady().then(() => {
    initDatabase();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('add-specimen', async (event, specimen) => {
    const stmt = db.prepare(`
        INSERT INTO specimens (collection_loc, lat, lon, elevation, collector, date, identifier, scientific_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
        specimen.collection_loc,
        specimen.lat,
        specimen.lon,
        specimen.elevation,
        specimen.collector,
        specimen.date,
        specimen.identifier,
        specimen.scientific_name
    );
    return info.lastInsertRowid;
});

ipcMain.handle('update-specimen', async (event, specimen) => {
    const stmt = db.prepare(`
        UPDATE specimens 
        SET collection_loc=?, lat=?, lon=?, elevation=?, collector=?, date=?, identifier=?, scientific_name=?
        WHERE id=?
    `);
    stmt.run(
        specimen.collection_loc,
        specimen.lat,
        specimen.lon,
        specimen.elevation,
        specimen.collector,
        specimen.date,
        specimen.identifier,
        specimen.scientific_name,
        specimen.id
    );
    return true;
});

ipcMain.handle('delete-specimen', async (event, id) => {
    db.prepare('DELETE FROM specimens WHERE id=?').run(id);
    return true;
});

ipcMain.handle('search-specimens', async (event, { keyword, type }) => {
    let query = 'SELECT * FROM specimens WHERE 1=1';
    const params = [];

    if (keyword) {
        if (type === 'location') {
            query += ' AND collection_loc LIKE ?';
            params.push(`%${keyword}%`);
        } else if (type === 'name') {
            query += ' AND scientific_name LIKE ?';
            params.push(`%${keyword}%`);
        } else {
            query += ' AND (collection_loc LIKE ? OR scientific_name LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
    }

    query += ' ORDER BY created_at DESC';
    return db.prepare(query).all(...params);
});

ipcMain.handle('get-all-specimens', async () => {
    return db.prepare('SELECT * FROM specimens ORDER BY created_at DESC').all();
});

ipcMain.handle('get-specimen', async (event, id) => {
    return db.prepare('SELECT * FROM specimens WHERE id=?').get(id);
});

ipcMain.handle('import-excel', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { success: false, count: 0 };
    }

    const filePath = result.filePaths[0];
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    const headers = [];
    const data = [];
    let count = 0;

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            row.eachCell((cell) => {
                headers.push(cell.value);
            });
        } else {
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                rowData[headers[colNumber - 1]] = cell.value;
            });
            data.push(rowData);
        }
    });

    const stmt = db.prepare(`
        INSERT INTO specimens (collection_loc, lat, lon, elevation, collector, date, identifier, scientific_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of data) {
        stmt.run(
            item.采集地 || '',
            parseDMS(item.纬度),
            parseDMS(item.经度),
            parseFloat(item.海拔) || null,
            item.采集人 || '',
            item.日期 || '',
            item.鉴定人 || '',
            item.学名 || ''
        );
        count++;
    }

    return { success: true, count };
});

ipcMain.handle('get-template', async (event, name) => {
    const result = db.prepare('SELECT * FROM templates WHERE name=?').get(name || 'default');
    return result ? JSON.parse(result.config) : null;
});

ipcMain.handle('save-template', async (event, { name, config }) => {
    const existing = db.prepare('SELECT * FROM templates WHERE name=?').get(name);
    if (existing) {
        db.prepare('UPDATE templates SET config=? WHERE name=?').run(JSON.stringify(config), name);
    } else {
        db.prepare('INSERT INTO templates (name, config) VALUES (?, ?)').run(name, JSON.stringify(config));
    }
    return true;
});

ipcMain.handle('generate-qr', async (event, data) => {
    return QRCode.toDataURL(JSON.stringify(data), { width: 128 });
});

ipcMain.handle('generate-pdf', async (event, { specimens, template }) => {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const labelsPerPage = template.labelsPerPage;
    const labelWidth = template.labelWidth * 2.83465;
    const labelHeight = template.labelHeight * 2.83465;
    const pageMargins = {
        top: (template.pageMargins?.top || 10) * 2.83465,
        bottom: (template.pageMargins?.bottom || 10) * 2.83465,
        left: (template.pageMargins?.left || 15) * 2.83465,
        right: (template.pageMargins?.right || 15) * 2.83465
    };

    const cols = Math.floor((pageWidth - pageMargins.left - pageMargins.right) / labelWidth);
    const rows = Math.ceil(labelsPerPage / cols);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let labelIndex = 0;

    for (const specimen of specimens) {
        const col = labelIndex % cols;
        const row = Math.floor(labelIndex / cols);
        const pageLabelIndex = labelIndex % labelsPerPage;
        const pageCol = pageLabelIndex % cols;
        const pageRow = Math.floor(pageLabelIndex / cols);

        if (pageLabelIndex === 0 && labelIndex > 0) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
        }

        const labelX = pageMargins.left + pageCol * labelWidth;
        const labelY = pageHeight - pageMargins.top - (pageRow + 1) * labelHeight;

        for (const field of template.fields) {
            if (!field.visible) continue;

            const fx = labelX + (field.x * 2.83465);
            const fy = labelY + labelHeight - (field.y * 2.83465) - (field.height * 2.83465);
            const fWidth = field.width * 2.83465;
            const fHeight = field.height * 2.83465;

            let text = '';
            switch (field.key) {
                case 'scientific_name':
                    text = specimen.scientific_name || '';
                    break;
                case 'collection_loc':
                    text = specimen.collection_loc || '';
                    break;
                case 'coord_elevation':
                    const coord = [specimen.lat, specimen.lon].filter(v => v != null).join(', ') || '';
                    const elev = specimen.elevation ? `${specimen.elevation}m` : '';
                    text = [coord, elev].filter(Boolean).join(' | ');
                    break;
                case 'collector_date':
                    text = [specimen.collector, specimen.date].filter(Boolean).join(' | ');
                    break;
                case 'identifier':
                    text = specimen.identifier ? `鉴定: ${specimen.identifier}` : '';
                    break;
            }

            if (field.key === 'qr') {
                try {
                    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
                        id: specimen.id,
                        scientific_name: specimen.scientific_name,
                        collection_loc: specimen.collection_loc,
                        lat: specimen.lat,
                        lon: specimen.lon,
                        elevation: specimen.elevation,
                        collector: specimen.collector,
                        date: specimen.date,
                        identifier: specimen.identifier
                    }), { width: 128 });
                    const qrBase64 = qrDataUrl.split(',')[1];
                    const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
                    page.drawImage(qrImage, {
                        x: fx,
                        y: fy,
                        width: fWidth,
                        height: fHeight
                    });
                } catch (err) {
                    console.error('QR error:', err);
                }
            } else {
                const fontSize = field.fontSize || 10;
                let finalText = text;
                const charWidth = timesRomanFont.widthOfTextAtSize('A', fontSize);
                const maxChars = Math.max(1, Math.floor((fWidth - charWidth * 3) / charWidth));
                
                if (text.length > maxChars) {
                    finalText = text.substring(0, maxChars) + '...';
                }
                
                page.drawText(finalText, {
                    x: fx,
                    y: fy + fHeight * 0.3,
                    size: fontSize,
                    font: timesRomanFont,
                    color: rgb(0, 0, 0)
                });
            }
        }

        labelIndex++;
    }

    const pdfBytes = await pdfDoc.save();

    const saveResult = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'labels.pdf',
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (!saveResult.canceled) {
        fs.writeFileSync(saveResult.filePath, pdfBytes);
        return { success: true, path: saveResult.filePath };
    }

    return { success: false, canceled: true };
});
