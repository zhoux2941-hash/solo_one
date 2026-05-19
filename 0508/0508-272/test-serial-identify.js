const { SerialPort } = require('serialport');

async function testSerialIdentification() {
    console.log('========================================');
    console.log('  串口设备识别测试');
    console.log('========================================\n');
    
    try {
        const ports = await SerialPort.list();
        
        if (ports.length === 0) {
            console.log('❌ 未检测到串口设备');
            console.log('\n请检查:');
            console.log('  1. USB 线是否连接');
            console.log('  2. 设备是否已上电');
            console.log('  3. 驱动程序是否正确安装');
            return;
        }
        
        console.log(`✅ 检测到 ${ports.length} 个串口设备:\n`);
        
        ports.forEach((port, index) => {
            console.log(`[${index + 1}] 端口: ${port.path}`);
            console.log(`    制造商: ${port.manufacturer || '未知'}`);
            console.log(`    序列号: ${port.serialNumber || '无'}`);
            console.log(`    PNP ID: ${port.pnpId || '无'}`);
            console.log(`    厂商 ID: ${port.vendorId || '无'}`);
            console.log(`    产品 ID: ${port.productId || '无'}`);
            console.log();
        });
        
        console.log('========================================');
        console.log('  设备识别策略');
        console.log('========================================');
        console.log('');
        console.log('1. 优先使用 serialNumber (唯一)');
        console.log('2. 其次使用 pnpId (Windows 特有)');
        console.log('3. 再次使用 vendorId + productId 组合');
        console.log('4. 最后使用端口名称作为回退');
        console.log('');
        
        const identifiable = ports.filter(p => p.serialNumber || p.pnpId).length;
        console.log(`可唯一识别设备: ${identifiable}/${ports.length}`);
        
        if (ports.length > 1) {
            console.log('\n⚠️  多设备同时连接时:');
            console.log('   - 有 serialNumber 的设备可以准确定位');
            console.log('   - 无 serialNumber 的设备可能需要手动确认');
        }
        
    } catch (error) {
        console.error('❌ 扫描串口失败:', error.message);
    }
}

testSerialIdentification();
