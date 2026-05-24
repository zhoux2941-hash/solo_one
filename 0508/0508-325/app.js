class POSPrinter {
    constructor() {
        this.device = null;
        this.interfaceNumber = null;
        this.endpointIn = null;
        this.endpointOut = null;
        this.isConnected = false;
        this.products = [];
        this.printing = false;
        this.statusCache = { paper: true, temp: true, cover: true };
        this.logoData = null;
        this.logoImage = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDefaultProducts();
        this.updatePreview();
    }

    bindEvents() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('addProductBtn').addEventListener('click', () => this.addProduct());
        document.getElementById('printBtn').addEventListener('click', () => this.printReceipt());
        document.getElementById('testPrintBtn').addEventListener('click', () => this.testPrint());
        document.getElementById('templateSelect').addEventListener('change', () => this.updatePreview());
        document.getElementById('logoInput').addEventListener('change', (e) => this.handleLogoUpload(e));
        document.getElementById('removeLogoBtn').addEventListener('click', () => this.removeLogo());
        document.getElementById('logoSize').addEventListener('change', () => this.updatePreview());
        
        ['shopName', 'shopAddress', 'shopPhone', 'paymentMethod', 'qrCodeData', 'printCopies'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updatePreview());
        });

        document.getElementById('productName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addProduct();
        });
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.logoImage = img;
                this.logoData = e.target.result;
                
                const preview = document.getElementById('logoPreview');
                const logoImg = document.getElementById('logoImage');
                const uploadBtn = document.getElementById('logoUploadBtn');
                
                logoImg.src = this.logoData;
                preview.style.display = 'flex';
                uploadBtn.style.display = 'none';
                
                this.updatePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeLogo() {
        this.logoImage = null;
        this.logoData = null;
        
        const preview = document.getElementById('logoPreview');
        const uploadBtn = document.getElementById('logoUploadBtn');
        const logoInput = document.getElementById('logoInput');
        
        preview.style.display = 'none';
        uploadBtn.style.display = 'inline-flex';
        logoInput.value = '';
        
        this.updatePreview();
    }

    loadDefaultProducts() {
        this.products = [
            { name: '可口可乐', price: 3.50, qty: 2 },
            { name: '乐事薯片', price: 8.00, qty: 1 },
            { name: '康师傅方便面', price: 4.50, qty: 3 }
        ];
        this.renderProductList();
    }

    async connect() {
        try {
            if (!navigator.usb) {
                throw new Error('您的浏览器不支持WebUSB，请使用Chrome或Edge浏览器');
            }

            this.device = await navigator.usb.requestDevice({
                filters: [
                    { vendorId: 0x04b8 },
                    { vendorId: 0x0416 },
                    { vendorId: 0x20d1 },
                    { vendorId: 0x1fc9 },
                    { vendorId: 0x067b },
                    { vendorId: 0x1234 },
                    { classCode: 0x07 }
                ]
            });

            await this.device.open();
            
            if (!this.device.configuration) {
                await this.device.selectConfiguration(1);
            }

            for (const iface of this.device.configuration.interfaces) {
                for (const alt of iface.alternates) {
                    if (alt.interfaceClass === 0x07 || alt.interfaceSubclass === 0x01) {
                        this.interfaceNumber = iface.interfaceNumber;
                        
                        try {
                            await this.device.claimInterface(this.interfaceNumber);
                        } catch (e) {
                            console.log('接口已被占用，尝试继续:', e);
                        }
                        
                        for (const endpoint of alt.endpoints) {
                            if (endpoint.direction === 'out') {
                                this.endpointOut = endpoint.endpointNumber;
                            } else if (endpoint.direction === 'in') {
                                this.endpointIn = endpoint.endpointNumber;
                            }
                        }
                        break;
                    }
                }
            }

            if (!this.endpointOut) {
                for (const iface of this.device.configuration.interfaces) {
                    for (const alt of iface.alternates) {
                        for (const endpoint of alt.endpoints) {
                            if (endpoint.direction === 'out') {
                                this.interfaceNumber = iface.interfaceNumber;
                                this.endpointOut = endpoint.endpointNumber;
                                try {
                                    await this.device.claimInterface(this.interfaceNumber);
                                } catch (e) {}
                                break;
                            }
                        }
                        if (this.endpointOut) break;
                    }
                    if (this.endpointOut) break;
                }
            }

            if (!this.endpointOut) {
                throw new Error('未找到打印输出端点');
            }

            this.isConnected = true;
            this.updatePrinterStatus(true);
            
            await this.initializePrinter();
            await this.checkPrinterStatus();
            this.startStatusMonitor();
            
            console.log('打印机连接成功:', this.device.productName);
        } catch (error) {
            console.error('连接打印机失败:', error);
            alert('连接打印机失败: ' + error.message);
        }
    }

    async disconnect() {
        if (this.device && this.isConnected) {
            try {
                if (this.interfaceNumber !== null) {
                    await this.device.releaseInterface(this.interfaceNumber);
                }
                await this.device.close();
            } catch (error) {
                console.error('断开连接时出错:', error);
            }
            
            this.device = null;
            this.interfaceNumber = null;
            this.endpointIn = null;
            this.endpointOut = null;
            this.isConnected = false;
            this.updatePrinterStatus(false);
            
            if (this.statusInterval) {
                clearInterval(this.statusInterval);
            }
        }
    }

    updatePrinterStatus(connected) {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const printBtn = document.getElementById('printBtn');
        const testPrintBtn = document.getElementById('testPrintBtn');
        const printerInfo = document.getElementById('printerInfo');

        if (connected) {
            indicator.className = 'status-indicator connected';
            statusText.textContent = '已连接';
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            printBtn.disabled = false;
            testPrintBtn.disabled = false;
            printerInfo.style.display = 'block';
            document.getElementById('printerName').textContent = this.device.productName || '热敏打印机';
            document.getElementById('printerState').textContent = '就绪';
        } else {
            indicator.className = 'status-indicator disconnected';
            statusText.textContent = '未连接打印机';
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
            printBtn.disabled = true;
            testPrintBtn.disabled = true;
            printerInfo.style.display = 'none';
        }
    }

    startStatusMonitor() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
        this.statusInterval = setInterval(async () => {
            if (this.isConnected && !this.printing) {
                await this.checkPrinterStatus();
            }
        }, 2000);
    }

    async checkPrinterStatus() {
        if (!this.isConnected || !this.endpointIn) return;
        
        try {
            const statuses = [];
            
            await this.sendCommand([0x10, 0x04, 0x01]);
            await this.delay(100);
            
            try {
                const result1 = await this.device.transferIn(this.endpointIn, 8);
                if (result1.data && result1.data.byteLength > 0) {
                    statuses.push(result1.data.getUint8(0));
                }
            } catch (e) {}

            await this.sendCommand([0x1D, 0x72, 0x01]);
            await this.delay(100);
            
            try {
                const result2 = await this.device.transferIn(this.endpointIn, 8);
                if (result2.data && result2.data.byteLength > 0) {
                    statuses.push(result2.data.getUint8(0));
                }
            } catch (e) {}

            if (statuses.length > 0) {
                this.parsePrinterStatus(statuses);
            }
        } catch (error) {
            console.debug('状态查询:', error.message);
        }
    }

    parsePrinterStatus(statuses) {
        let paperOK = true;
        let tempOK = true;
        let coverOK = true;

        for (const status of statuses) {
            if (status & 0x04) coverOK = false;
            if (status & 0x20) paperOK = false;
            if (status & 0x40) tempOK = false;
            if (status & 0x08) paperOK = false;
            if (status & 0x10) coverOK = false;
        }

        this.statusCache = { paper: paperOK, temp: tempOK, cover: coverOK };
        this.updateStatusIndicators(paperOK, tempOK, coverOK);
    }

    updateStatusIndicators(paperOK, tempOK, coverOK) {
        const paperIcon = document.getElementById('paperIcon');
        const tempIcon = document.getElementById('tempIcon');
        const coverIcon = document.getElementById('coverIcon');

        paperIcon.className = 'status-icon ' + (paperOK ? 'ok' : 'error');
        tempIcon.className = 'status-icon ' + (tempOK ? 'ok' : 'error');
        coverIcon.className = 'status-icon ' + (coverOK ? 'ok' : 'error');

        const printerState = document.getElementById('printerState');
        const indicator = document.getElementById('statusIndicator');
        
        if (!paperOK) {
            printerState.textContent = '缺纸';
            printerState.style.color = '#dc3545';
            indicator.className = 'status-indicator warning';
        } else if (!tempOK) {
            printerState.textContent = '过热';
            printerState.style.color = '#ffc107';
            indicator.className = 'status-indicator warning';
        } else if (!coverOK) {
            printerState.textContent = '开盖';
            printerState.style.color = '#dc3545';
            indicator.className = 'status-indicator warning';
        } else {
            printerState.textContent = '就绪';
            printerState.style.color = '#28a745';
            indicator.className = 'status-indicator connected';
        }
    }

    async sendCommand(data) {
        if (!this.isConnected || !this.endpointOut) return;
        
        try {
            await this.device.transferOut(this.endpointOut, new Uint8Array(data));
        } catch (error) {
            console.error('发送命令失败:', error);
            throw error;
        }
    }

    async sendText(text) {
        const encoder = new TextEncoder('gb18030');
        const data = encoder.encode(text);
        
        const chunkSize = 512;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await this.sendCommand(chunk);
            await this.delay(5);
        }
    }

    async sendLine(text = '') {
        await this.sendText(text + '\n');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initializePrinter() {
        await this.sendCommand([0x1B, 0x40]);
        await this.delay(50);
        
        await this.sendCommand([0x1B, 0x52, 0x0F]);
        await this.delay(20);
        
        await this.sendCommand([0x1B, 0x4D, 0x00]);
        await this.delay(20);
        
        await this.sendCommand([0x1B, 0x33, 0x1E]);
        await this.delay(20);
        
        await this.sendCommand([0x1B, 0x61, 0x00]);
        await this.delay(20);
        
        await this.sendCommand([0x1B, 0x45, 0x00]);
        await this.delay(20);
    }

    async setAlignment(align) {
        const alignCode = align === 'center' ? 1 : align === 'right' ? 2 : 0;
        await this.sendCommand([0x1B, 0x61, alignCode]);
        await this.delay(5);
    }

    async setFontSize(width, height) {
        const size = (width - 1) | ((height - 1) << 4);
        await this.sendCommand([0x1D, 0x21, size]);
        await this.delay(5);
    }

    async setBold(enable) {
        await this.sendCommand([0x1B, 0x45, enable ? 1 : 0]);
        await this.delay(5);
    }

    async setUnderline(enable) {
        await this.sendCommand([0x1B, 0x2D, enable ? 1 : 0]);
        await this.delay(5);
    }

    async feedLines(lines = 1) {
        for (let i = 0; i < lines; i++) {
            await this.sendCommand([0x1B, 0x64, 0x01]);
            await this.delay(10);
        }
    }

    async cutPaper(fullCut = true) {
        await this.feedLines(3);
        await this.delay(50);
        
        if (fullCut) {
            await this.sendCommand([0x1D, 0x56, 0x41, 0x00]);
        } else {
            await this.sendCommand([0x1D, 0x56, 0x42, 0x00]);
        }
        await this.delay(100);
    }

    getLogoSize() {
        const size = document.getElementById('logoSize').value;
        const sizes = {
            small: 128,
            medium: 256,
            large: 384
        };
        return sizes[size] || 256;
    }

    imageToBitmap(image, maxWidth) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = image.width;
        let height = image.height;
        
        if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
        }
        
        width = Math.ceil(width / 8) * 8;
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        const bytesPerRow = width / 8;
        const bitmapData = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < bytesPerRow; x++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const px = x * 8 + bit;
                    const idx = (y * width + px) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    const gray = (r + g + b) / 3;
                    if (gray < 128) {
                        byte |= (1 << (7 - bit));
                    }
                }
                bitmapData.push(byte);
            }
        }
        
        return {
            data: bitmapData,
            width: width,
            height: height
        };
    }

    async printLogo() {
        if (!this.logoImage) return;
        
        const maxWidth = this.getLogoSize();
        const bitmap = this.imageToBitmap(this.logoImage, maxWidth);
        
        await this.setAlignment('center');
        await this.delay(5);
        
        const bytesPerLine = bitmap.width / 8;
        const height = bitmap.height;
        
        const xL = bytesPerLine & 0xFF;
        const xH = (bytesPerLine >> 8) & 0xFF;
        const yL = height & 0xFF;
        const yH = (height >> 8) & 0xFF;
        
        await this.sendCommand([0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
        await this.delay(10);
        
        const chunkSize = 512;
        for (let i = 0; i < bitmap.data.length; i += chunkSize) {
            const chunk = bitmap.data.slice(i, i + chunkSize);
            await this.sendCommand(chunk);
            await this.delay(20);
        }
        
        await this.feedLines(1);
        await this.delay(10);
    }

    async printQRCode(data) {
        try {
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(data);
            const dataLength = dataBytes.length;
            
            if (dataLength > 700) {
                console.warn('二维码数据过长，可能无法打印');
            }

            const pL = dataLength & 0xFF;
            const pH = (dataLength >> 8) & 0xFF;

            await this.sendCommand([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
            await this.delay(10);
            
            await this.sendCommand([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x08]);
            await this.delay(10);
            
            await this.sendCommand([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30]);
            await this.delay(10);
            
            await this.sendCommand([0x1D, 0x28, 0x6B, pL + 3, pH, 0x31, 0x50, 0x30, ...dataBytes]);
            await this.delay(50);
            
            await this.sendCommand([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);
            await this.delay(100);
        } catch (e) {
            console.error('二维码打印失败:', e);
            await this.sendLine('[二维码]');
        }
    }

    addProduct() {
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value) || 0;
        const qty = parseInt(document.getElementById('productQty').value) || 1;

        if (!name || price <= 0) {
            alert('请输入有效的商品名称和价格');
            return;
        }

        this.products.push({ name, price, qty });
        this.renderProductList();
        this.updatePreview();

        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productQty').value = '1';
    }

    removeProduct(index) {
        this.products.splice(index, 1);
        this.renderProductList();
        this.updatePreview();
    }

    renderProductList() {
        const container = document.getElementById('productList');
        
        if (this.products.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">暂无商品</div>';
            return;
        }

        container.innerHTML = this.products.map((product, index) => `
            <div class="product-item">
                <span class="name">${product.name}</span>
                <span class="price">¥${product.price.toFixed(2)}</span>
                <span class="qty">x${product.qty}</span>
                <span class="subtotal">¥${(product.price * product.qty).toFixed(2)}</span>
                <button class="btn btn-danger" onclick="printer.removeProduct(${index})">删除</button>
            </div>
        `).join('');
    }

    calculateTotal() {
        return this.products.reduce((sum, p) => sum + p.price * p.qty, 0);
    }

    formatProductLine(name, qty, price, width = 32) {
        const priceStr = `¥${price.toFixed(2)}`;
        const qtyStr = `x${qty}`;
        const nameWidth = width - qtyStr.length - priceStr.length - 2;
        
        let displayName = name;
        if (displayName.length > nameWidth) {
            displayName = displayName.substring(0, nameWidth - 1) + '~';
        }
        
        const padding = ' '.repeat(Math.max(0, width - displayName.length - qtyStr.length - priceStr.length));
        return `${displayName}${padding}${qtyStr} ${priceStr}`;
    }

    async updatePreview() {
        const preview = document.getElementById('receiptPreview');
        const template = document.getElementById('templateSelect').value;
        const shopName = document.getElementById('shopName').value;
        const shopAddress = document.getElementById('shopAddress').value;
        const shopPhone = document.getElementById('shopPhone').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const qrCodeData = document.getElementById('qrCodeData').value;

        const paymentNames = {
            cash: '现金',
            wechat: '微信支付',
            alipay: '支付宝',
            card: '银行卡'
        };

        const templateTitles = {
            receipt: '销售小票',
            refund: '退款单',
            test: '测试打印单'
        };

        let html = '';
        
        if (this.logoData) {
            html += `<div class="receipt-logo"><img src="${this.logoData}" alt="LOGO"></div>`;
        }
        
        html += `
            <div class="receipt-header">
                <div class="shop-name">${shopName}</div>
                <div class="shop-info">${shopAddress}</div>
                <div class="shop-info">电话: ${shopPhone}</div>
                <div class="shop-info">${new Date().toLocaleString('zh-CN')}</div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-title">${templateTitles[template]}</div>
            <div class="receipt-divider"></div>
        `;

        if (template === 'test') {
            html += `
                <div class="receipt-items">
                    <div class="receipt-item"><span>字符测试:</span><span>ABCDEFGabcdefg</span></div>
                    <div class="receipt-item"><span>数字测试:</span><span>0123456789</span></div>
                    <div class="receipt-item"><span>中文测试:</span><span>热敏打印测试</span></div>
                </div>
                <div class="receipt-divider"></div>
                <div style="text-align: center; margin: 10px 0;">
                    <strong>打印质量测试</strong>
                </div>
                <div style="height: 20px; background: linear-gradient(90deg, #fff 0%, #000 100%); margin: 10px 0;"></div>
            `;
        } else {
            html += '<div class="receipt-items">';
            this.products.forEach(product => {
                const subtotal = product.price * product.qty;
                html += `
                    <div class="receipt-item">
                        <span class="item-name">${product.name}</span>
                        <span class="item-qty">${product.qty}</span>
                        <span class="item-price">¥${subtotal.toFixed(2)}</span>
                    </div>
                `;
            });
            html += '</div>';
            html += '<div class="receipt-divider"></div>';
            html += `<div class="receipt-total">总计: ¥${this.calculateTotal().toFixed(2)}</div>`;
            html += '<div class="receipt-divider"></div>';
            html += `<div class="receipt-payment">支付方式: ${paymentNames[paymentMethod]}</div>`;
            
            html += `<div class="receipt-qr" id="qrCodeContainer"></div>`;
            
            setTimeout(() => {
                const qrContainer = document.getElementById('qrCodeContainer');
                if (qrContainer && qrCodeData) {
                    QRCode.toCanvas(qrCodeData, { width: 120, margin: 2, errorCorrectionLevel: 'L' }, (error, canvas) => {
                        if (!error && qrContainer) {
                            qrContainer.innerHTML = '';
                            qrContainer.appendChild(canvas);
                        }
                    });
                }
            }, 100);
        }

        html += `
            <div class="receipt-divider"></div>
            <div class="receipt-footer">
                <p>谢谢惠顾，欢迎下次光临！</p>
                <p>如有问题，请凭此小票退换</p>
            </div>
        `;

        preview.innerHTML = html;
    }

    async printReceipt() {
        if (!this.isConnected) {
            alert('请先连接打印机');
            return;
        }

        if (!this.statusCache.paper) {
            alert('打印机缺纸，请先装纸！');
            return;
        }

        if (!this.statusCache.cover) {
            alert('打印机开盖，请关闭纸舱盖！');
            return;
        }

        const copies = parseInt(document.getElementById('printCopies').value) || 1;

        this.printing = true;
        const printBtn = document.getElementById('printBtn');
        printBtn.disabled = true;
        printBtn.textContent = '打印中...';

        try {
            for (let i = 0; i < copies; i++) {
                await this.printSingleReceipt();
                if (i < copies - 1) {
                    await this.delay(300);
                }
            }
            await this.checkPrinterStatus();
        } catch (error) {
            console.error('打印失败:', error);
            alert('打印失败: ' + error.message);
        } finally {
            this.printing = false;
            printBtn.disabled = false;
            printBtn.textContent = '打印收据';
        }
    }

    async printSingleReceipt() {
        const template = document.getElementById('templateSelect').value;
        const shopName = document.getElementById('shopName').value;
        const shopAddress = document.getElementById('shopAddress').value;
        const shopPhone = document.getElementById('shopPhone').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const qrCodeData = document.getElementById('qrCodeData').value;

        const paymentNames = {
            cash: '现金',
            wechat: '微信支付',
            alipay: '支付宝',
            card: '银行卡'
        };

        const templateTitles = {
            receipt: '销售小票',
            refund: '退款单',
            test: '测试打印单'
        };

        await this.initializePrinter();
        
        await this.printLogo();
        
        const divider = '--------------------------------';
        
        await this.setAlignment('center');
        await this.setFontSize(2, 2);
        await this.setBold(true);
        await this.sendLine(shopName);
        await this.setFontSize(1, 1);
        await this.setBold(false);
        await this.delay(10);
        
        await this.sendLine(shopAddress);
        await this.sendLine('电话: ' + shopPhone);
        await this.sendLine(new Date().toLocaleString('zh-CN'));
        await this.delay(10);
        
        await this.sendLine(divider);
        await this.delay(10);
        
        await this.setBold(true);
        await this.sendLine(templateTitles[template]);
        await this.setBold(false);
        await this.delay(10);
        
        await this.sendLine(divider);
        await this.delay(10);

        if (template === 'test') {
            await this.setAlignment('left');
            await this.sendLine('字符测试: ABCDEFGabcdefg');
            await this.sendLine('数字测试: 0123456789');
            await this.sendLine('中文测试: 热敏打印测试');
            await this.delay(10);
            
            await this.sendLine(divider);
            await this.delay(10);
            
            await this.setAlignment('center');
            await this.setBold(true);
            await this.sendLine('打印质量测试');
            await this.setBold(false);
            await this.delay(10);
        } else {
            await this.setAlignment('left');
            
            for (const product of this.products) {
                const subtotal = product.price * product.qty;
                const line = this.formatProductLine(product.name, product.qty, subtotal);
                await this.sendLine(line);
                await this.delay(5);
            }
            
            await this.delay(10);
            await this.sendLine(divider);
            await this.delay(10);
            
            await this.setAlignment('right');
            await this.setBold(true);
            await this.setFontSize(2, 1);
            await this.sendLine(`总计: ¥${this.calculateTotal().toFixed(2)}`);
            await this.setFontSize(1, 1);
            await this.setBold(false);
            await this.delay(10);
            
            await this.setAlignment('left');
            await this.sendLine(divider);
            await this.delay(10);
            
            await this.setAlignment('center');
            await this.sendLine(`支付方式: ${paymentNames[paymentMethod]}`);
            await this.delay(10);
            
            if (qrCodeData) {
                await this.feedLines(1);
                await this.printQRCode(qrCodeData);
            }
        }

        await this.setAlignment('center');
        await this.delay(10);
        await this.sendLine(divider);
        await this.sendLine('谢谢惠顾，欢迎下次光临！');
        await this.sendLine('如有问题，请凭此小票退换');
        await this.delay(20);
        
        await this.cutPaper(true);
        await this.delay(100);
    }

    async testPrint() {
        if (!this.isConnected) {
            alert('请先连接打印机');
            return;
        }

        if (!this.statusCache.paper) {
            alert('打印机缺纸，请先装纸！');
            return;
        }

        this.printing = true;
        const testBtn = document.getElementById('testPrintBtn');
        testBtn.disabled = true;
        testBtn.textContent = '打印中...';

        try {
            await this.initializePrinter();
            
            await this.printLogo();
            
            await this.setAlignment('center');
            await this.setFontSize(2, 2);
            await this.setBold(true);
            await this.sendLine('测试打印');
            await this.setFontSize(1, 1);
            await this.setBold(false);
            await this.delay(10);
            
            const divider = '--------------------------------';
            await this.sendLine(divider);
            await this.delay(10);
            
            await this.setAlignment('left');
            await this.sendLine('打印机状态测试:');
            await this.sendLine(`- 连接: ${this.isConnected ? '正常' : '失败'}`);
            await this.sendLine(`- 纸张: ${this.statusCache.paper ? '有纸' : '缺纸'}`);
            await this.sendLine(`- 温度: ${this.statusCache.temp ? '正常' : '过热'}`);
            await this.sendLine(`- 纸盖: ${this.statusCache.cover ? '关闭' : '开盖'}`);
            await this.delay(10);
            
            await this.sendLine(divider);
            await this.delay(10);
            
            await this.setAlignment('center');
            await this.sendLine('字符集测试');
            await this.sendLine('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            await this.sendLine('abcdefghijklmnopqrstuvwxyz');
            await this.sendLine('0123456789');
            await this.sendLine('中文字符测试');
            await this.delay(10);
            
            await this.cutPaper(true);
            
            await this.checkPrinterStatus();
        } catch (error) {
            console.error('测试打印失败:', error);
            alert('测试打印失败: ' + error.message);
        } finally {
            this.printing = false;
            testBtn.disabled = false;
            testBtn.textContent = '测试打印';
        }
    }
}

const printer = new POSPrinter();