const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const defaultData = {
    regions: [
        { id: 1, name: '东城区', code: 'DC001', level: 1, created_at: new Date().toISOString() },
        { id: 2, name: '西城区', code: 'XC001', level: 1, created_at: new Date().toISOString() },
        { id: 3, name: '南村镇', code: 'NC001', level: 2, created_at: new Date().toISOString() },
        { id: 4, name: '北港镇', code: 'BG001', level: 2, created_at: new Date().toISOString() },
        { id: 5, name: '东湖村', code: 'DH001', level: 3, parent_id: 1, created_at: new Date().toISOString() },
        { id: 6, name: '西湖村', code: 'XH001', level: 3, parent_id: 2, created_at: new Date().toISOString() }
    ],
    devices: [
        { id: 1, name: '东城区村部广播', code: 'DC-001', type: 'village', region_id: 1, line: '东线', status: 'online', created_at: new Date().toISOString() },
        { id: 2, name: '东城区一组广播', code: 'DC-002', type: 'village', region_id: 1, line: '东线', status: 'online', created_at: new Date().toISOString() },
        { id: 3, name: '西城区村部广播', code: 'XC-001', type: 'village', region_id: 2, line: '西线', status: 'offline', created_at: new Date().toISOString() },
        { id: 4, name: '南村镇巡堤广播1号', code: 'NC-XD-001', type: 'patrol', region_id: 3, line: '南线', status: 'online', created_at: new Date().toISOString() },
        { id: 5, name: '南村镇巡堤广播2号', code: 'NC-XD-002', type: 'patrol', region_id: 3, line: '南线', status: 'online', created_at: new Date().toISOString() },
        { id: 6, name: '北港镇撤离广播', code: 'BG-CL-001', type: 'evacuation', region_id: 4, line: '北线', status: 'online', created_at: new Date().toISOString() },
        { id: 7, name: '东湖村广播', code: 'DH-001', type: 'village', region_id: 5, line: '东线', status: 'online', created_at: new Date().toISOString() },
        { id: 8, name: '西湖村广播', code: 'XH-001', type: 'village', region_id: 6, line: '西线', status: 'offline', created_at: new Date().toISOString() },
        { id: 9, name: '东城区二组广播', code: 'DC-003', type: 'village', region_id: 1, line: '东线', status: 'online', created_at: new Date().toISOString() },
        { id: 10, name: '南村镇巡堤广播3号', code: 'NC-XD-003', type: 'patrol', region_id: 3, line: '南线', status: 'offline', created_at: new Date().toISOString() }
    ],
    deviceGroups: [
        { id: 1, name: '东城区广播组', description: '东城区所有广播设备', created_at: new Date().toISOString(), deviceIds: [1, 2, 9] },
        { id: 2, name: '巡堤专用组', description: '用于巡堤通知的设备组', created_at: new Date().toISOString(), deviceIds: [4, 5, 10] },
        { id: 3, name: '应急撤离组', description: '紧急撤离时使用的设备组', created_at: new Date().toISOString(), deviceIds: [6] },
        { id: 4, name: '东线设备组', description: '东线所有设备', created_at: new Date().toISOString(), deviceIds: [1, 2, 7, 9] },
        { id: 5, name: '西线设备组', description: '西线所有设备', created_at: new Date().toISOString(), deviceIds: [3, 8] }
    ],
    broadcastTemplates: [
        { id: 1, name: '村组早间播报', type: 'village', content: '各位村民早上好，今天是汛期，请关注天气变化，注意安全。', duration: 30, created_at: new Date().toISOString() },
        { id: 2, name: '巡堤通知', type: 'patrol', content: '巡堤人员请注意，当前水位正常，请加强巡查频次，发现异常及时报告。', duration: 45, created_at: new Date().toISOString() },
        { id: 3, name: '临时撤离警示', type: 'evacuation', content: '紧急通知！请所有村民立即撤离到安全地带，携带好贵重物品，听从指挥有序撤离。', duration: 60, created_at: new Date().toISOString() },
        { id: 4, name: '水位预警', type: 'warning', content: '水位预警通知：当前水位已达到警戒水位，请相关区域人员做好撤离准备。', duration: 50, created_at: new Date().toISOString() }
    ],
    broadcastBatches: [],
    publishRecords: [],
    playbackRecords: []
};

const dbFile = path.join(dbDir, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

async function initDB() {
    await db.read();
    if (!db.data) {
        db.data = defaultData;
    } else {
        for (const key of Object.keys(defaultData)) {
            if (!db.data[key]) {
                db.data[key] = defaultData[key];
            }
        }
    }
    await db.write();
    console.log('数据库初始化完成');
}

initDB();

function getNextId(array) {
    if (array.length === 0) return 1;
    return Math.max(...array.map(item => item.id)) + 1;
}

app.get('/api/regions', async (req, res) => {
    await db.read();
    res.json(db.data.regions.sort((a, b) => a.level - b.level || a.id - b.id));
});

app.get('/api/devices', async (req, res) => {
    await db.read();
    const { region_id, status } = req.query;
    let devices = db.data.devices;
    
    if (region_id) {
        devices = devices.filter(d => d.region_id == region_id);
    }
    if (status) {
        devices = devices.filter(d => d.status === status);
    }
    
    devices = devices.map(d => ({
        ...d,
        region_name: db.data.regions.find(r => r.id === d.region_id)?.name
    }));
    
    res.json(devices.sort((a, b) => a.id - b.id));
});

app.put('/api/devices/:id/status', async (req, res) => {
    await db.read();
    const { status } = req.body;
    const device = db.data.devices.find(d => d.id == req.params.id);
    if (device) {
        device.status = status;
        device.last_online = new Date().toISOString();
        await db.write();
    }
    res.json({ success: true });
});

app.get('/api/device-groups', async (req, res) => {
    await db.read();
    const groups = db.data.deviceGroups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        created_at: g.created_at,
        devices: db.data.devices.filter(d => g.deviceIds.includes(d.id))
    }));
    res.json(groups.sort((a, b) => a.id - b.id));
});

app.get('/api/broadcast-templates', async (req, res) => {
    await db.read();
    res.json(db.data.broadcastTemplates.sort((a, b) => a.id - b.id));
});

app.get('/api/broadcast-batches', async (req, res) => {
    await db.read();
    const { status } = req.query;
    let batches = db.data.broadcastBatches;
    
    if (status) {
        batches = batches.filter(b => b.status === status);
    }
    
    batches = batches.map(b => {
        const template = db.data.broadcastTemplates.find(t => t.id === b.template_id);
        return {
            ...b,
            template_name: template?.name,
            content: template?.content,
            duration: template?.duration,
            template_type: template?.type
        };
    });
    
    batches.sort((a, b) => a.sort_order - b.sort_order || b.priority - a.priority || b.id - a.id);
    
    res.json(batches);
});

app.post('/api/broadcast-batches', async (req, res) => {
    await db.read();
    const { name, template_id, priority, scheduled_time, end_time, region_ids, device_ids, group_ids } = req.body;
    
    const maxOrder = db.data.broadcastBatches.length > 0 
        ? Math.max(...db.data.broadcastBatches.map(b => b.sort_order)) 
        : 0;
    
    const newBatch = {
        id: getNextId(db.data.broadcastBatches),
        name,
        template_id,
        priority: priority || 5,
        status: 'pending',
        scheduled_time: scheduled_time || null,
        end_time: end_time || null,
        region_ids: JSON.stringify(region_ids || []),
        device_ids: JSON.stringify(device_ids || []),
        group_ids: JSON.stringify(group_ids || []),
        sort_order: maxOrder + 1,
        created_at: new Date().toISOString()
    };
    
    db.data.broadcastBatches.push(newBatch);
    await db.write();
    
    res.json({ id: newBatch.id, success: true });
});

app.put('/api/broadcast-batches/:id', async (req, res) => {
    await db.read();
    const { name, template_id, priority, scheduled_time, end_time, region_ids, device_ids, group_ids, status } = req.body;
    
    const batch = db.data.broadcastBatches.find(b => b.id == req.params.id);
    if (batch) {
        batch.name = name;
        batch.template_id = template_id;
        batch.priority = priority;
        batch.scheduled_time = scheduled_time || null;
        batch.end_time = end_time || null;
        batch.region_ids = JSON.stringify(region_ids || []);
        batch.device_ids = JSON.stringify(device_ids || []);
        batch.group_ids = JSON.stringify(group_ids || []);
        batch.status = status || 'pending';
        await db.write();
    }
    
    res.json({ success: true });
});

app.delete('/api/broadcast-batches/:id', async (req, res) => {
    await db.read();
    db.data.broadcastBatches = db.data.broadcastBatches.filter(b => b.id != req.params.id);
    await db.write();
    res.json({ success: true });
});

app.post('/api/broadcast-batches/reorder', async (req, res) => {
    await db.read();
    const { orders } = req.body;
    
    for (const item of orders) {
        const batch = db.data.broadcastBatches.find(b => b.id === item.id);
        if (batch) {
            batch.sort_order = item.sort_order;
        }
    }
    
    await db.write();
    res.json({ success: true });
});

app.post('/api/broadcast-batches/:id/publish', async (req, res) => {
    await db.read();
    const batchId = parseInt(req.params.id);
    const batch = db.data.broadcastBatches.find(b => b.id === batchId);
    
    if (!batch) {
        return res.status(404).json({ error: '批次不存在' });
    }
    
    let deviceIds = [];
    
    if (batch.device_ids) {
        deviceIds = deviceIds.concat(JSON.parse(batch.device_ids));
    }
    
    if (batch.group_ids) {
        const groupIds = JSON.parse(batch.group_ids);
        for (const gid of groupIds) {
            const group = db.data.deviceGroups.find(g => g.id === gid);
            if (group) {
                deviceIds = deviceIds.concat(group.deviceIds);
            }
        }
    }
    
    if (batch.region_ids) {
        const regionIds = JSON.parse(batch.region_ids);
        for (const rid of regionIds) {
            const regionDevices = db.data.devices.filter(d => d.region_id === rid).map(d => d.id);
            deviceIds = deviceIds.concat(regionDevices);
        }
    }
    
    deviceIds = [...new Set(deviceIds)];
    
    let newRecordCount = 0;
    for (const did of deviceIds) {
        const existingRecord = db.data.publishRecords.find(
            pr => pr.batch_id === batchId && pr.device_id === did
        );
        
        if (!existingRecord) {
            const newRecord = {
                id: getNextId(db.data.publishRecords),
                batch_id: batchId,
                device_id: did,
                status: 'published',
                published_at: new Date().toISOString(),
                playback_count: 0
            };
            db.data.publishRecords.push(newRecord);
            newRecordCount++;
        }
    }
    
    batch.status = 'published';
    await db.write();
    
    res.json({ success: true, device_count: newRecordCount, total_devices: deviceIds.length });
});

app.get('/api/publish-records', async (req, res) => {
    await db.read();
    const { batch_id } = req.query;
    let records = db.data.publishRecords;
    
    if (batch_id) {
        records = records.filter(r => r.batch_id == batch_id);
    }
    
    records = records.map(r => ({
        ...r,
        batch_name: db.data.broadcastBatches.find(b => b.id === r.batch_id)?.name,
        device_name: db.data.devices.find(d => d.id === r.device_id)?.name
    }));
    
    records.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    
    res.json(records);
});

app.get('/api/playback-records', async (req, res) => {
    await db.read();
    const { publish_record_id } = req.query;
    let records = db.data.playbackRecords;
    
    if (publish_record_id) {
        records = records.filter(r => r.publish_record_id == publish_record_id);
    }
    
    records = records.map(r => {
        const publishRecord = db.data.publishRecords.find(pr => pr.id === r.publish_record_id);
        return {
            ...r,
            batch_id: publishRecord?.batch_id,
            batch_name: db.data.broadcastBatches.find(b => b.id === publishRecord?.batch_id)?.name,
            device_name: db.data.devices.find(d => d.id === publishRecord?.device_id)?.name
        };
    });
    
    records.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    
    res.json(records);
});

app.post('/api/playback-records', async (req, res) => {
    await db.read();
    const { publish_record_id, start_time, end_time, duration, status } = req.body;
    
    const newRecord = {
        id: getNextId(db.data.playbackRecords),
        publish_record_id,
        start_time: start_time || new Date().toISOString(),
        end_time: end_time || new Date().toISOString(),
        duration
    };
    
    db.data.playbackRecords.push(newRecord);
    
    const publishRecord = db.data.publishRecords.find(pr => pr.id === publish_record_id);
    if (publishRecord) {
        publishRecord.playback_count = (publishRecord.playback_count || 0) + 1;
        publishRecord.completed_at = new Date().toISOString();
        if (status === 'completed' || !publishRecord.status || publishRecord.status === 'published') {
            publishRecord.status = 'completed';
        }
    }
    
    await db.write();
    
    res.json({ id: newRecord.id, success: true });
});

app.get('/api/dashboard/summary', async (req, res) => {
    await db.read();
    
    const deviceStats = {};
    db.data.devices.forEach(d => {
        deviceStats[d.status] = (deviceStats[d.status] || 0) + 1;
    });
    
    const batchStats = {};
    db.data.broadcastBatches.forEach(b => {
        batchStats[b.status] = (batchStats[b.status] || 0) + 1;
    });
    
    const today = new Date().toISOString().split('T')[0];
    const todayPlaybacks = db.data.playbackRecords.filter(r => 
        r.start_time && r.start_time.startsWith(today)
    ).length;
    
    res.json({
        devices: Object.entries(deviceStats).map(([status, count]) => ({ status, count })),
        batches: Object.entries(batchStats).map(([status, count]) => ({ status, count })),
        today_playbacks: todayPlaybacks
    });
});

app.get('/api/playback-records/by-town', async (req, res) => {
    await db.read();
    const { days = 7 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const result = {};
    db.data.regions.filter(r => r.level >= 2).forEach(region => {
        result[region.id] = {
            region_id: region.id,
            region_name: region.name,
            total: 0,
            success: 0,
            failed: 0,
            devices: []
        };
    });
    
    db.data.playbackRecords.forEach(pr => {
        if (new Date(pr.start_time) >= cutoffDate) {
            const publishRecord = db.data.publishRecords.find(pbr => pbr.id === pr.publish_record_id);
            if (publishRecord) {
                const device = db.data.devices.find(d => d.id === publishRecord.device_id);
                if (device) {
                    const region = db.data.regions.find(r => r.id === device.region_id && r.level >= 2) ||
                                  db.data.regions.find(r => r.id === device.region_id);
                    if (region && result[region.id]) {
                        result[region.id].total++;
                        if (pr.duration && pr.duration > 0) {
                            result[region.id].success++;
                        } else {
                            result[region.id].failed++;
                        }
                        if (!result[region.id].devices.find(d => d.id === device.id)) {
                            result[region.id].devices.push({
                                id: device.id,
                                name: device.name,
                                line: device.line
                            });
                        }
                    }
                }
            }
        }
    });
    
    res.json(Object.values(result).sort((a, b) => b.failed - a.failed));
});

app.get('/api/playback-records/by-line', async (req, res) => {
    await db.read();
    const { days = 7 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const result = {};
    const lines = [...new Set(db.data.devices.map(d => d.line).filter(Boolean))];
    lines.forEach(line => {
        result[line] = {
            line: line,
            total: 0,
            success: 0,
            failed: 0,
            devices: []
        };
    });
    
    db.data.playbackRecords.forEach(pr => {
        if (new Date(pr.start_time) >= cutoffDate) {
            const publishRecord = db.data.publishRecords.find(pbr => pbr.id === pr.publish_record_id);
            if (publishRecord) {
                const device = db.data.devices.find(d => d.id === publishRecord.device_id);
                if (device && device.line && result[device.line]) {
                    result[device.line].total++;
                    if (pr.duration && pr.duration > 0) {
                        result[device.line].success++;
                    } else {
                        result[device.line].failed++;
                    }
                    if (!result[device.line].devices.find(d => d.id === device.id)) {
                        const region = db.data.regions.find(r => r.id === device.region_id);
                        result[device.line].devices.push({
                            id: device.id,
                            name: device.name,
                            region_name: region?.name
                        });
                    }
                }
            }
        }
    });
    
    res.json(Object.values(result).sort((a, b) => b.failed - a.failed));
});

app.get('/api/failed-retry/summary', async (req, res) => {
    await db.read();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1);
    
    const failedRecords = [];
    
    db.data.publishRecords.forEach(pr => {
        const playbacks = db.data.playbackRecords.filter(pbr => pbr.publish_record_id === pr.id);
        const successfulPlaybacks = playbacks.filter(pbr => pbr.duration && pbr.duration > 0);
        
        const batch = db.data.broadcastBatches.find(b => b.id === pr.batch_id);
        const device = db.data.devices.find(d => d.id === pr.device_id);
        const region = device ? db.data.regions.find(r => r.id === device.region_id) : null;
        
        const recentAttempts = playbacks.filter(pbr => new Date(pbr.start_time) >= cutoffDate);
        const recentFailures = recentAttempts.filter(pbr => !pbr.duration || pbr.duration <= 0).length;
        
        if (recentFailures > 0 || (pr.status !== 'completed' && new Date(pr.published_at) >= cutoffDate)) {
            failedRecords.push({
                id: pr.id,
                batch_id: pr.batch_id,
                batch_name: batch?.name,
                device_id: pr.device_id,
                device_name: device?.name,
                device_line: device?.line,
                region_name: region?.name,
                status: pr.status,
                published_at: pr.published_at,
                playback_count: pr.playback_count || 0,
                retry_count: recentAttempts.length,
                failed_count: recentFailures,
                success_count: successfulPlaybacks.length,
                last_attempt: recentAttempts.length > 0 ? recentAttempts[recentAttempts.length - 1].start_time : null,
                error_message: pr.error_message || (recentFailures > 0 ? '播放失败，需要重试' : null)
            });
        }
    });
    
    const lineSummary = {};
    failedRecords.forEach(fr => {
        if (fr.device_line) {
            if (!lineSummary[fr.device_line]) {
                lineSummary[fr.device_line] = {
                    line: fr.device_line,
                    failed_count: 0,
                    retry_count: 0,
                    affected_devices: []
                };
            }
            lineSummary[fr.device_line].failed_count += fr.failed_count;
            lineSummary[fr.device_line].retry_count += fr.retry_count;
            if (!lineSummary[fr.device_line].affected_devices.includes(fr.device_id)) {
                lineSummary[fr.device_line].affected_devices.push(fr.device_id);
            }
        }
    });
    
    const regionSummary = {};
    failedRecords.forEach(fr => {
        if (fr.region_name) {
            if (!regionSummary[fr.region_name]) {
                regionSummary[fr.region_name] = {
                    region: fr.region_name,
                    failed_count: 0,
                    retry_count: 0,
                    affected_devices: []
                };
            }
            regionSummary[fr.region_name].failed_count += fr.failed_count;
            regionSummary[fr.region_name].retry_count += fr.retry_count;
            if (!regionSummary[fr.region_name].affected_devices.includes(fr.device_id)) {
                regionSummary[fr.region_name].affected_devices.push(fr.device_id);
            }
        }
    });
    
    res.json({
        total_failed: failedRecords.filter(fr => fr.failed_count > 0).length,
        total_retry: failedRecords.reduce((sum, fr) => sum + fr.retry_count, 0),
        records: failedRecords.sort((a, b) => b.failed_count - a.failed_count),
        by_line: Object.values(lineSummary).sort((a, b) => b.failed_count - a.failed_count),
        by_region: Object.values(regionSummary).sort((a, b) => b.failed_count - a.failed_count)
    });
});

app.post('/api/publish-records/:id/retry', async (req, res) => {
    await db.read();
    const recordId = parseInt(req.params.id);
    const publishRecord = db.data.publishRecords.find(pr => pr.id === recordId);
    
    if (!publishRecord) {
        return res.status(404).json({ error: '发布记录不存在' });
    }
    
    publishRecord.status = 'published';
    publishRecord.published_at = new Date().toISOString();
    publishRecord.retry_count = (publishRecord.retry_count || 0) + 1;
    
    await db.write();
    res.json({ success: true, message: '已标记为重发，等待播放' });
});

app.listen(PORT, () => {
    console.log(`防汛广播编排台系统运行在 http://localhost:${PORT}`);
});
