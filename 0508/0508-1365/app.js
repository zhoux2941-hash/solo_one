const SAMPLE_EMAIL = `From: "John Doe" <john.doe@example.com>
To: "Jane Smith" <jane.smith@company.com>
Subject: Important Meeting - Q4 Planning
Date: Wed, 15 Nov 2023 14:30:00 +0000
Message-ID: <abc123xyz@mail.example.com>
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 7bit
Received: from mail.company.com (mail.company.com [192.168.1.100])
	by mx.google.com with ESMTPS id abc123
	for <jane.smith@company.com>;
	Wed, 15 Nov 2023 14:32:15 +0000 (UTC)
Received: from relay.example.org (relay.example.org [203.0.113.45])
	by mail.company.com with ESMTP id def456;
	Wed, 15 Nov 2023 14:31:00 +0000
Received: from [10.0.0.50] (unknown [198.51.100.23])
	by relay.example.org with SMTP id ghi789;
	Wed, 15 Nov 2023 14:30:30 +0000
Received-SPF: pass (google.com: domain of john.doe@example.com designates 198.51.100.23 as permitted sender)
Authentication-Results: mx.google.com;
	spf=pass (google.com: domain of john.doe@example.com designates 198.51.100.23 as permitted sender) smtp.mailfrom=john.doe@example.com;
	dkim=pass header.i=@example.com header.s=202301 header.b=abc123;
	dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=example.com

Dear Jane,

Please find attached the Q4 planning document...
`;

class EmailHeaderAnalyzer {
    constructor() {
        this.emailData = null;
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyze());
        document.getElementById('sampleBtn').addEventListener('click', () => this.loadSample());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    loadSample() {
        document.getElementById('emailInput').value = SAMPLE_EMAIL;
    }

    clear() {
        document.getElementById('emailInput').value = '';
        document.getElementById('resultsSection').classList.add('hidden');
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabName);
        });
    }

    analyze() {
        const rawEmail = document.getElementById('emailInput').value.trim();
        if (!rawEmail) {
            alert('请输入邮件原始内容');
            return;
        }

        this.emailData = this.parseEmail(rawEmail);
        this.renderResults();
        document.getElementById('resultsSection').classList.remove('hidden');
    }

    parseEmail(rawEmail) {
        const lines = rawEmail.split('\n');
        const headers = {};
        let currentHeader = null;
        let bodyStartIndex = lines.length;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.trim() === '') {
                bodyStartIndex = i + 1;
                break;
            }

            const headerMatch = line.match(/^([A-Za-z-]+):\s*(.*)$/);
            if (headerMatch) {
                currentHeader = headerMatch[1].toLowerCase();
                headers[currentHeader] = headerMatch[2];
            } else if (currentHeader && (line.startsWith(' ') || line.startsWith('\t'))) {
                headers[currentHeader] += ' ' + line.trim();
            }
        }

        const received = this.parseReceivedHeaders(headers);
        const securityResults = this.analyzeSecurity(headers, received);

        return {
            basic: this.extractBasicInfo(headers),
            received: received,
            security: securityResults,
            timeline: this.buildTimeline(headers, received)
        };
    }

    extractBasicInfo(headers) {
        return {
            from: headers['from'] || 'N/A',
            to: headers['to'] || 'N/A',
            subject: headers['subject'] || 'N/A',
            date: headers['date'] || 'N/A',
            messageId: headers['message-id'] || 'N/A',
            mimeVersion: headers['mime-version'] || 'N/A',
            contentType: headers['content-type'] || 'N/A'
        };
    }

    parseReceivedHeaders(headers) {
        const received = [];
        const receivedHeaders = [];
        
        for (const key in headers) {
            if (key === 'received') {
                receivedHeaders.push(headers[key]);
            }
        }

        const rawText = Object.entries(headers)
            .filter(([k]) => k === 'received' || k.startsWith('received-'))
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');

        const receivedPattern = /received:\s*(.*?)(?=\nreceived:|$)/gis;
        let match;
        while ((match = receivedPattern.exec(`received: ${rawText}`)) !== null) {
            receivedHeaders.push(match[1]);
        }

        for (let i = 0; i < receivedHeaders.length; i++) {
            const parsed = this.parseSingleReceived(receivedHeaders[i], i);
            if (parsed) {
                received.push(parsed);
            }
        }

        received.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.getTime() - b.date.getTime();
        });

        received.forEach((rec, idx) => {
            rec.index = idx + 1;
        });

        return received;
    }

    parseSingleReceived(headerText, index) {
        const result = {
            index: index + 1,
            raw: headerText,
            fromIp: 'N/A',
            fromHostname: 'N/A',
            helo: 'N/A',
            by: 'N/A',
            date: null,
            dateString: 'N/A',
            proto: 'N/A'
        };

        const ipPattern = /\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/;
        const ipMatch = headerText.match(ipPattern);
        if (ipMatch) {
            result.fromIp = ipMatch[1];
        }

        const heloPattern = /from\s+(\S+)\s+\(/i;
        const heloMatch = headerText.match(heloPattern);
        if (heloMatch) {
            result.helo = heloMatch[1];
        }

        const hostnamePattern = /from\s+\S+\s+\(([^)]+)\)/i;
        const hostnameMatch = headerText.match(hostnamePattern);
        if (hostnameMatch) {
            result.fromHostname = hostnameMatch[1];
        }

        const byPattern = /by\s+(\S+)/i;
        const byMatch = headerText.match(byPattern);
        if (byMatch) {
            result.by = byMatch[1];
        }

        const protoPattern = /with\s+(\S+)/i;
        const protoMatch = headerText.match(protoPattern);
        if (protoMatch) {
            result.proto = protoMatch[1];
        }

        const datePattern = /(?:;|\n)\s*((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+[+-]\d{4}(?:\s*\([A-Z]+\))?)/i;
        const dateMatch = headerText.match(datePattern);
        if (dateMatch) {
            result.dateString = dateMatch[1].trim();
            result.date = new Date(result.dateString);
        }

        return result;
    }

    analyzeSecurity(headers, received) {
        const results = {
            spf: { status: 'neutral', details: '未找到SPF记录' },
            dkim: { status: 'neutral', details: '未找到DKIM签名' },
            dmarc: { status: 'neutral', details: '未找到DMARC结果' },
            forgery: []
        };

        const authResults = headers['authentication-results'] || '';
        const receivedSpf = headers['received-spf'] || '';
        const dkimSignature = headers['dkim-signature'] || '';

        const fromMatch = headers['from'] ? headers['from'].match(/@([^>\s]+)/) : null;
        const fromDomain = fromMatch ? fromMatch[1].toLowerCase().trim() : '';

        const spfSimResult = this.simulateSpfCheck(headers, received, fromDomain);
        if (authResults.toLowerCase().includes('spf=pass') || 
            receivedSpf.toLowerCase().includes('pass')) {
            results.spf = { status: 'pass', details: 'SPF验证通过（邮件头确认）' };
        } else if (authResults.toLowerCase().includes('spf=fail') || 
                   receivedSpf.toLowerCase().includes('fail')) {
            results.spf = { status: 'fail', details: 'SPF验证失败（邮件头确认）' };
            results.forgery.push({
                type: 'danger',
                title: 'SPF验证失败',
                desc: '发送服务器IP未在域名SPF记录中授权，邮件可能被伪造'
            });
        } else {
            results.spf = { 
                status: spfSimResult.status, 
                details: spfSimResult.details + '（模拟检测）' 
            };
            if (spfSimResult.status === 'fail') {
                results.forgery.push({
                    type: 'warning',
                    title: 'SPF模拟检测异常',
                    desc: spfSimResult.details
                });
            }
        }

        const dkimSimResult = this.simulateDkimCheck(headers, received, fromDomain, dkimSignature);
        if (authResults.toLowerCase().includes('dkim=pass')) {
            results.dkim = { status: 'pass', details: 'DKIM签名验证通过（邮件头确认）' };
        } else if (authResults.toLowerCase().includes('dkim=fail')) {
            results.dkim = { status: 'fail', details: 'DKIM签名验证失败（邮件头确认）' };
            results.forgery.push({
                type: 'danger',
                title: 'DKIM验证失败',
                desc: '邮件签名验证失败，内容可能被篡改'
            });
        } else {
            results.dkim = { 
                status: dkimSimResult.status, 
                details: dkimSimResult.details + '（模拟检测）' 
            };
            if (dkimSimResult.status === 'fail') {
                results.forgery.push({
                    type: 'warning',
                    title: 'DKIM模拟检测异常',
                    desc: dkimSimResult.details
                });
            }
        }

        if (authResults.toLowerCase().includes('dmarc=pass')) {
            results.dmarc = { status: 'pass', details: 'DMARC策略检查通过' };
        } else if (authResults.toLowerCase().includes('dmarc=fail')) {
            results.dmarc = { status: 'fail', details: 'DMARC策略检查失败' };
            results.forgery.push({
                type: 'danger',
                title: 'DMARC验证失败',
                desc: '邮件未通过DMARC策略检查，可能是伪造邮件'
            });
        } else if (results.spf.status === 'pass' || results.dkim.status === 'pass') {
            results.dmarc = { status: 'neutral', details: 'DMARC未检测，建议域名配置DMARC策略' };
        }

        this.checkDomainConsistency(headers, received, fromDomain, results);

        return results;
    }

    simulateSpfCheck(headers, received, fromDomain) {
        if (!fromDomain || received.length === 0) {
            return { status: 'neutral', details: '数据不足，无法进行SPF模拟检测' };
        }

        const firstReceived = received[0];
        const sendingServer = firstReceived.helo !== 'N/A' ? firstReceived.helo : firstReceived.by;

        if (!sendingServer || sendingServer === 'N/A') {
            return { status: 'neutral', details: '无法获取发送服务器信息' };
        }

        const serverDomain = this.extractBaseDomain(sendingServer.toLowerCase());
        const baseFromDomain = this.extractBaseDomain(fromDomain);

        if (serverDomain === baseFromDomain) {
            return { status: 'pass', details: `发送服务器域(${serverDomain})与发件人域匹配` };
        }

        const commonEmailProviders = {
            'gmail.com': ['google.com', 'googlemail.com'],
            'yahoo.com': ['yahoodns.net', 'yahoo.co'],
            'outlook.com': ['hotmail.com', 'outlook.com', 'microsoft.com'],
            'hotmail.com': ['hotmail.com', 'outlook.com', 'microsoft.com'],
            '163.com': ['163.com', 'netease.com'],
            'qq.com': ['qq.com', 'tencent.com']
        };

        for (const provider in commonEmailProviders) {
            if (baseFromDomain.includes(provider)) {
                const providerServers = commonEmailProviders[provider];
                if (providerServers.some(s => serverDomain.includes(s))) {
                    return { status: 'pass', details: `发送服务器(${serverDomain})属于${provider}邮件服务商` };
                }
            }
        }

        const knownRelays = ['mx', 'mail', 'smtp', 'relay', 'send'];
        for (const relay of knownRelays) {
            if (sendingServer.toLowerCase().includes(relay) && serverDomain === baseFromDomain) {
                return { status: 'pass', details: `邮件中继服务器(${sendingServer})属于发件人域` };
            }
        }

        return { 
            status: 'fail', 
            details: `发送服务器域(${serverDomain})与发件人域(${baseFromDomain})不匹配，可能是第三方中继或伪造` 
        };
    }

    simulateDkimCheck(headers, received, fromDomain, dkimSignature) {
        if (dkimSignature) {
            const dkimDomainMatch = dkimSignature.match(/d=([^;]+)/i);
            if (dkimDomainMatch) {
                const dkimDomain = dkimDomainMatch[1].toLowerCase().trim();
                const baseDkimDomain = this.extractBaseDomain(dkimDomain);
                const baseFromDomain = this.extractBaseDomain(fromDomain);

                if (baseDkimDomain === baseFromDomain) {
                    return { status: 'pass', details: `DKIM签名域(${dkimDomain})与发件人域匹配` };
                } else {
                    return { status: 'neutral', details: `DKIM签名域(${dkimDomain})存在，待实际验证` };
                }
            }
            return { status: 'neutral', details: '存在DKIM签名头，建议通过邮件服务商验证' };
        }

        if (!fromDomain || received.length === 0) {
            return { status: 'neutral', details: '数据不足，无法进行DKIM模拟检测' };
        }

        const freeEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', '163.com', 'qq.com', '126.com', 'sina.com'];
        const baseFromDomain = this.extractBaseDomain(fromDomain);

        if (freeEmailDomains.includes(baseFromDomain)) {
            return { status: 'neutral', details: `${baseFromDomain}通常支持DKIM签名，建议检查原始邮件` };
        }

        const firstReceived = received[0];
        const sendingServer = firstReceived.helo !== 'N/A' ? firstReceived.helo : firstReceived.by;

        if (sendingServer && sendingServer !== 'N/A') {
            const serverDomain = this.extractBaseDomain(sendingServer.toLowerCase());
            if (serverDomain === baseFromDomain) {
                return { status: 'neutral', details: '自有域名邮件，建议配置DKIM签名增强可信度' };
            }
        }

        return { status: 'neutral', details: '未检测到DKIM签名头，建议邮件域名配置DKIM' };
    }

    checkDomainConsistency(headers, received, fromDomain, results) {
        if (!fromDomain || received.length === 0) return;

        const baseFromDomain = this.extractBaseDomain(fromDomain);

        const firstReceived = received[0];
        if (firstReceived.helo !== 'N/A') {
            const heloDomain = this.extractBaseDomain(firstReceived.helo.toLowerCase());
            if (heloDomain !== baseFromDomain) {
                results.forgery.push({
                    type: 'warning',
                    title: '发件人域与HELO不一致',
                    desc: `发件人域(${baseFromDomain})与HELO主机域(${heloDomain})不匹配`
                });
            }
        }

        if (received.length > 1) {
            const domains = new Set();
            received.forEach(r => {
                if (r.by && r.by !== 'N/A') {
                    domains.add(this.extractBaseDomain(r.by.toLowerCase()));
                }
            });

            if (domains.size > 3) {
                results.forgery.push({
                    type: 'info',
                    title: '邮件经过多个不同域名的服务器',
                    desc: `邮件经过${domains.size}个不同域名服务器转发：${Array.from(domains).join(', ')}`
                });
            }
        }

        const lastReceived = received[received.length - 1];
        if (lastReceived.fromIp && lastReceived.fromIp !== 'N/A') {
            const privateIpRanges = [
                /^10\./,
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
                /^192\.168\./,
                /^127\./
            ];

            const isPrivateIp = privateIpRanges.some(regex => regex.test(lastReceived.fromIp));
            if (isPrivateIp && received.length > 1) {
                results.forgery.push({
                    type: 'info',
                    title: '始发服务器使用内网IP',
                    desc: `最早的Received记录显示IP为内网地址(${lastReceived.fromIp})，可能来自企业内网`
                });
            }
        }
    }

    extractBaseDomain(domain) {
        if (!domain) return '';
        
        domain = domain.replace(/^\[|\]$/g, '').trim();
        
        const ipMatch = domain.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        if (ipMatch) {
            return ipMatch[1];
        }

        domain = domain.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        
        const parts = domain.split('.');
        if (parts.length >= 2) {
            const tlds = ['co', 'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'ac', 'go'];
            if (parts.length > 2 && tlds.includes(parts[parts.length - 2])) {
                return parts.slice(-3).join('.');
            }
            return parts.slice(-2).join('.');
        }
        return domain;
    }

    buildTimeline(headers, received) {
        const timeline = {
            sentDate: null,
            sentDateString: headers['date'] || 'N/A',
            receivedDates: [],
            totalDelay: 0,
            delays: []
        };

        if (headers['date']) {
            timeline.sentDate = new Date(headers['date']);
        }

        for (let i = 0; i < received.length; i++) {
            const rec = received[i];
            if (rec.date) {
                timeline.receivedDates.push({
                    hop: i + 1,
                    date: rec.date,
                    by: rec.by
                });
            }
        }

        if (timeline.sentDate && timeline.receivedDates.length > 0) {
            const firstReceived = timeline.receivedDates[0].date;
            timeline.totalDelay = (firstReceived.getTime() - timeline.sentDate.getTime()) / 1000;
        }

        for (let i = 1; i < timeline.receivedDates.length; i++) {
            const delay = (timeline.receivedDates[i].date.getTime() - 
                          timeline.receivedDates[i-1].date.getTime()) / 1000;
            timeline.delays.push({
                from: timeline.receivedDates[i-1].by,
                to: timeline.receivedDates[i].by,
                delay: delay
            });
        }

        return timeline;
    }

    renderResults() {
        this.renderBasicInfo();
        this.renderReceivedTable();
        this.renderTopology();
        this.renderSecurity();
        this.renderTimeline();
    }

    renderBasicInfo() {
        const basic = this.emailData.basic;
        const items = [
            { label: '发件人 (From)', value: basic.from },
            { label: '收件人 (To)', value: basic.to },
            { label: '主题 (Subject)', value: basic.subject },
            { label: '日期 (Date)', value: basic.date },
            { label: '邮件ID (Message-ID)', value: basic.messageId },
            { label: 'MIME版本', value: basic.mimeVersion },
            { label: '内容类型', value: basic.contentType }
        ];

        const html = items.map(item => `
            <div class="info-item">
                <div class="info-label">${item.label}</div>
                <div class="info-value">${this.escapeHtml(item.value)}</div>
            </div>
        `).join('');

        document.getElementById('basicInfoGrid').innerHTML = html;
    }

    renderReceivedTable() {
        const received = this.emailData.received;
        const tbody = document.getElementById('receivedTableBody');
        
        const rows = received.map((rec, idx) => {
            const delayBadge = this.getDelayBadge(idx, received);
            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${this.formatDate(rec.date)}</td>
                    <td>${rec.fromIp}</td>
                    <td>${this.escapeHtml(rec.helo)}</td>
                    <td>${this.escapeHtml(rec.by)}</td>
                    <td>${delayBadge}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    getDelayBadge(idx, received) {
        if (idx === 0) return '-';
        
        const prevDate = received[idx - 1].date;
        const currDate = received[idx].date;
        
        if (!prevDate || !currDate) return 'N/A';
        
        const delay = (currDate.getTime() - prevDate.getTime()) / 1000;
        const delayText = this.formatDelay(delay);
        
        let className = 'delay-fast';
        if (delay > 60) className = 'delay-medium';
        if (delay > 300) className = 'delay-slow';
        
        return `<span class="delay-badge ${className}">${delayText}</span>`;
    }

    formatDelay(seconds) {
        if (seconds < 60) return `${Math.round(seconds)}秒`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
        return `${(seconds / 3600).toFixed(1)}小时`;
    }

    formatDate(date) {
        if (!date) return 'N/A';
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    renderTopology() {
        const received = this.emailData.received;
        const container = document.getElementById('topologyContainer');
        
        if (received.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">未找到Received记录</p>';
            return;
        }

        const nodes = [];
        
        if (received.length > 0) {
            const firstRec = received[0];
            nodes.push({
                name: '发件人',
                label: firstRec.fromIp !== 'N/A' ? firstRec.fromIp : 'Client',
                type: 'sender'
            });
        }

        for (let i = 0; i < received.length; i++) {
            const rec = received[i];
            nodes.push({
                name: rec.by,
                label: rec.by,
                type: 'server',
                ip: rec.fromIp
            });
        }

        nodes.push({
            name: '收件箱',
            label: 'Recipient',
            type: 'recipient'
        });

        const svgWidth = 800;
        const nodeCount = nodes.length;
        const nodeSpacing = svgWidth / (nodeCount + 1);
        const centerY = 100;

        let svg = `<svg class="topology-svg" viewBox="0 0 ${svgWidth} 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" class="topology-arrow"/>
                </marker>
            </defs>`;

        for (let i = 0; i < nodes.length - 1; i++) {
            const x1 = (i + 1) * nodeSpacing;
            const x2 = (i + 2) * nodeSpacing;
            svg += `<line x1="${x1 + 30}" y1="${centerY}" x2="${x2 - 30}" y2="${centerY}" 
                    class="topology-line" marker-end="url(#arrowhead)"/>`;
        }

        const colors = {
            sender: '#22c55e',
            server: '#3b82f6',
            recipient: '#f59e0b'
        };

        nodes.forEach((node, i) => {
            const x = (i + 1) * nodeSpacing;
            const color = colors[node.type] || colors.server;
            const shortName = node.label.length > 20 ? node.label.substring(0, 17) + '...' : node.label;
            
            svg += `<g class="topology-node" transform="translate(${x}, ${centerY})">
                <circle class="node-circle" cx="0" cy="0" r="25" fill="${color}"/>
                <text x="0" y="5" class="node-text" fill="white" font-weight="bold">${node.type === 'sender' ? '📤' : node.type === 'recipient' ? '📥' : '📧'}</text>
                <text x="0" y="45" class="node-text">${this.escapeHtml(shortName)}</text>
                <text x="0" y="60" class="node-label">${node.type === 'sender' ? '发件人' : node.type === 'recipient' ? '收件人' : `Hop ${i}`}</text>
            </g>`;
        });

        svg += '</svg>';
        container.innerHTML = svg;
    }

    renderSecurity() {
        const security = this.emailData.security;
        
        const cards = [
            { name: 'SPF', result: security.spf, icon: '✉️' },
            { name: 'DKIM', result: security.dkim, icon: '🔐' },
            { name: 'DMARC', result: security.dmarc, icon: '🛡️' }
        ];

        const cardsHtml = cards.map(card => `
            <div class="security-card ${card.result.status}">
                <div class="security-icon">${card.icon}</div>
                <div class="security-name">${card.name}</div>
                <div class="security-status">${this.getStatusText(card.result.status)}</div>
            </div>
        `).join('');

        document.getElementById('securityCards').innerHTML = cardsHtml;

        const alertsHtml = security.forgery.map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="alert-icon">${alert.type === 'danger' ? '⚠️' : alert.type === 'warning' ? '⚡' : 'ℹ️'}</div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-desc">${alert.desc}</div>
                </div>
            </div>
        `).join('');

        const container = document.getElementById('forgeryAlerts');
        if (security.forgery.length === 0) {
            container.innerHTML = `
                <div class="alert-item info">
                    <div class="alert-icon">✅</div>
                    <div class="alert-content">
                        <div class="alert-title">未检测到明显的伪造特征</div>
                        <div class="alert-desc">邮件通过了基本的安全检查，但仍需保持警惕</div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = alertsHtml;
        }
    }

    getStatusText(status) {
        const texts = {
            'pass': '通过',
            'fail': '失败',
            'neutral': '未检测'
        };
        return texts[status] || status;
    }

    renderTimeline() {
        const timeline = this.emailData.timeline;
        const chartContainer = document.getElementById('timelineChart');

        if (timeline.receivedDates.length === 0) {
            chartContainer.innerHTML = '<p style="color: var(--text-secondary);">时间线数据不足</p>';
            return;
        }

        const allDates = [];
        if (timeline.sentDate) {
            allDates.push({ name: '发送时间', date: timeline.sentDate, isSent: true });
        }
        timeline.receivedDates.forEach((r, i) => {
            allDates.push({ name: `Hop ${i + 1}`, date: r.date, by: r.by });
        });

        const minTime = Math.min(...allDates.map(d => d.date.getTime()));
        const maxTime = Math.max(...allDates.map(d => d.date.getTime()));
        const timeRange = maxTime - minTime || 1;

        const svgWidth = Math.max(600, allDates.length * 80);
        const svgHeight = 200;
        const chartPadding = 60;
        const chartWidth = svgWidth - chartPadding * 2;

        let svg = `<svg class="timeline-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

        svg += `<line x1="${chartPadding}" y1="120" x2="${svgWidth - chartPadding}" y2="120" stroke="#cbd5e1" stroke-width="2"/>`;

        allDates.forEach((item, i) => {
            const x = chartPadding + (chartWidth * (item.date.getTime() - minTime) / timeRange);
            const color = item.isSent ? '#10b981' : '#3b82f6';
            
            svg += `<rect x="${x - 20}" y="70" width="40" height="50" class="timeline-bar" fill="${color}"/>`;
            svg += `<text x="${x}" y="60" class="timeline-value">${item.name}</text>`;
            svg += `<text x="${x}" y="145" class="timeline-label">${this.formatShortDate(item.date)}</text>`;
        });

        svg += '</svg>';
        chartContainer.innerHTML = svg;

        const totalDelayText = timeline.totalDelay > 0 ? this.formatDelay(timeline.totalDelay) : 'N/A';
        const hopCount = timeline.receivedDates.length;
        
        document.getElementById('timeDiffInfo').innerHTML = `
            <div class="time-card">
                <div class="time-card-label">发送到首次接收延迟</div>
                <div class="time-card-value">${totalDelayText}</div>
                <div class="time-card-sub">从发件人发送到第一台服务器接收</div>
            </div>
            <div class="time-card">
                <div class="time-card-label">中继节点数量</div>
                <div class="time-card-value">${hopCount}</div>
                <div class="time-card-sub">邮件经过的服务器数量</div>
            </div>
            <div class="time-card">
                <div class="time-card-label">总传输时间</div>
                <div class="time-card-value">${this.calculateTotalTime(timeline)}</div>
                <div class="time-card-sub">从发送到最后一次接收</div>
            </div>
        `;
    }

    formatShortDate(date) {
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    calculateTotalTime(timeline) {
        if (!timeline.sentDate || timeline.receivedDates.length === 0) return 'N/A';
        const lastReceived = timeline.receivedDates[timeline.receivedDates.length - 1].date;
        const total = (lastReceived.getTime() - timeline.sentDate.getTime()) / 1000;
        return this.formatDelay(total);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EmailHeaderAnalyzer();
});
