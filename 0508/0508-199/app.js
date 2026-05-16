class CinemaSystem {
    constructor() {
        this.movies = [
            { id: 1, title: '流浪地球3', poster: '🌍', director: '郭帆', duration: 173, price: 50 },
            { id: 2, title: '哪吒之魔童闹海', poster: '🐲', director: '饺子', duration: 110, price: 45 },
            { id: 3, title: '复仇者联盟5', poster: '🦸', director: '漫威', duration: 150, price: 55 },
            { id: 4, title: '速度与激情11', poster: '🚗', director: '林诣彬', duration: 140, price: 50 },
            { id: 5, title: '阿凡达3', poster: '🎬', director: '卡梅隆', duration: 180, price: 60 },
            { id: 6, title: '唐人街探案4', poster: '🔍', director: '陈思诚', duration: 130, price: 45 }
        ];

        this.schedules = this.generateSchedules();
        this.seatsData = this.loadFromStorage('seatsData') || this.initializeSeats();
        this.members = this.loadFromStorage('members') || {};
        this.exchanges = this.loadFromStorage('exchanges') || [];
        this.orders = this.loadFromStorage('orders') || [];
        this.snacks = [
            { id: 1, name: '大份爆米花', icon: '🍿', points: 500 },
            { id: 2, name: '中份爆米花', icon: '🍿', points: 300 },
            { id: 3, name: '大杯可乐', icon: '🥤', points: 200 },
            { id: 4, name: '中杯可乐', icon: '🥤', points: 150 },
            { id: 5, name: '爆米花+可乐套餐', icon: '🍿🥤', points: 600 },
            { id: 6, name: '热狗', icon: '🌭', points: 250 }
        ];

        this.selectedMovie = null;
        this.selectedSchedule = null;
        this.selectedSeats = [];
        this.lockTimer = null;
        this.lockEndTime = null;
        this.currentMember = null;
        this.scheduleRefreshTimer = null;
        this.isExchanging = false;
        this.exchangeLockKey = 'exchange_lock';

        this.init();
    }

    generateSchedules() {
        const schedules = [];
        const today = new Date();
        const times = ['10:00', '13:30', '16:00', '19:30', '22:00'];
        const halls = ['1号厅', '2号厅', '3号厅', 'IMAX厅'];

        this.movies.forEach(movie => {
            for (let day = 0; day < 3; day++) {
                const date = new Date(today);
                date.setDate(date.getDate() + day);
                const dateStr = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
                
                times.slice(0, 3 + Math.floor(Math.random() * 3)).forEach((time, idx) => {
                    const [hours, minutes] = time.split(':').map(Number);
                    const scheduleDateTime = new Date(date);
                    scheduleDateTime.setHours(hours, minutes, 0, 0);
                    
                    schedules.push({
                        id: `${movie.id}-${day}-${idx}`,
                        movieId: movie.id,
                        date: dateStr,
                        time: time,
                        dateTime: scheduleDateTime,
                        hall: halls[idx % halls.length],
                        price: movie.price
                    });
                });
            }
        });
        return schedules;
    }

    initializeSeats() {
        const seats = {};
        this.schedules.forEach(schedule => {
            seats[schedule.id] = this.createSeatMatrix();
        });
        return seats;
    }

    createSeatMatrix() {
        const rows = 8;
        const cols = 12;
        const matrix = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                const occupied = Math.random() < 0.3;
                row.push({
                    row: String.fromCharCode(65 + r),
                    col: c + 1,
                    status: occupied ? 'occupied' : 'available',
                    lockedUntil: null
                });
            }
            matrix.push(row);
        }
        return matrix;
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    init() {
        this.renderMovies();
        this.bindEvents();
        this.checkLockedSeats();
        setInterval(() => this.checkLockedSeats(), 1000);
    }

    bindEvents() {
        document.getElementById('backToMovies').addEventListener('click', () => this.showSection('movieSection'));
        document.getElementById('backToSchedule').addEventListener('click', () => this.backToSchedule());
        document.getElementById('submitOrder').addEventListener('click', () => this.submitOrder());
        document.getElementById('cancelPayment').addEventListener('click', () => this.cancelPayment());
        document.getElementById('confirmPayment').addEventListener('click', () => this.confirmPayment());
        document.getElementById('memberBtn').addEventListener('click', () => this.showMemberSection());
        document.getElementById('loginBtn').addEventListener('click', () => this.memberLogin());
        document.getElementById('backFromMember').addEventListener('click', () => this.showSection('movieSection'));
        document.getElementById('reportBtn').addEventListener('click', () => this.showReportSection());
        document.getElementById('backFromReport').addEventListener('click', () => this.showSection('movieSection'));
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
        document.getElementById(sectionId).classList.remove('hidden');
        
        if (sectionId !== 'scheduleSection' && this.scheduleRefreshTimer) {
            clearInterval(this.scheduleRefreshTimer);
            this.scheduleRefreshTimer = null;
        }
    }

    renderMovies() {
        const container = document.getElementById('movieList');
        container.innerHTML = this.movies.map(movie => `
            <div class="movie-card" data-movie-id="${movie.id}">
                <div class="movie-poster">${movie.poster}</div>
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-detail">导演：${movie.director}</div>
                    <div class="movie-detail">时长：${movie.duration}分钟</div>
                    <div class="movie-detail">票价：${movie.price}元</div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const movieId = parseInt(card.dataset.movieId);
                this.selectMovie(movieId);
            });
        });
    }

    selectMovie(movieId) {
        this.selectedMovie = this.movies.find(m => m.id === movieId);
        this.renderSchedules();
        this.showSection('scheduleSection');
        
        if (this.scheduleRefreshTimer) {
            clearInterval(this.scheduleRefreshTimer);
        }
        this.scheduleRefreshTimer = setInterval(() => {
            this.renderSchedules();
        }, 60000);
        
        document.getElementById('selectedMovieInfo').innerHTML = `
            <h3>${this.selectedMovie.poster} ${this.selectedMovie.title}</h3>
            <p>导演：${this.selectedMovie.director} | 时长：${this.selectedMovie.duration}分钟</p>
        `;
    }

    renderSchedules() {
        const movieSchedules = this.schedules.filter(s => s.movieId === this.selectedMovie.id);
        const container = document.getElementById('scheduleList');
        const now = new Date();
        
        const grouped = {};
        movieSchedules.forEach(s => {
            if (!grouped[s.date]) grouped[s.date] = [];
            grouped[s.date].push(s);
        });

        container.innerHTML = Object.entries(grouped).map(([date, schedules]) => `
            <div style="width: 100%; margin-bottom: 15px;">
                <h4 style="color: #666; margin-bottom: 10px;">${date}</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    ${schedules.map(s => {
                        const isExpired = new Date(s.dateTime) < now;
                        return `
                            <div class="schedule-item ${isExpired ? 'expired' : ''}" 
                                 data-schedule-id="${s.id}"
                                 ${isExpired ? 'title="该场次已结束，不可选择"' : ''}>
                                <div class="schedule-time">${s.time}</div>
                                <div class="schedule-hall">${s.hall}</div>
                                <div style="${isExpired ? 'color: #999;' : 'color: #667eea;'} font-weight: 600; margin-top: 5px;">
                                    ${isExpired ? '已结束' : s.price + '元'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.schedule-item:not(.expired)').forEach(item => {
            item.addEventListener('click', () => {
                const scheduleId = item.dataset.scheduleId;
                this.selectSchedule(scheduleId);
            });
        });
    }

    selectSchedule(scheduleId) {
        if (this.selectedSchedule && this.selectedSeats.length > 0) {
            this.releaseAllSelectedSeats();
        }
        this.stopLockTimer();
        this.selectedSchedule = this.schedules.find(s => s.id === scheduleId);
        this.selectedSeats = [];
        this.renderSeats();
        this.showSection('seatSection');
        
        document.getElementById('selectedScheduleInfo').innerHTML = `
            <p><strong>${this.selectedMovie.poster} ${this.selectedMovie.title}</strong></p>
            <p>${this.selectedSchedule.date} ${this.selectedSchedule.time} | ${this.selectedSchedule.hall}</p>
        `;
    }

    renderSeats() {
        this.checkLockedSeats();
        
        const container = document.getElementById('seatMap');
        const seats = this.seatsData[this.selectedSchedule.id];
        const now = new Date();
        
        container.innerHTML = seats.map((row, rowIdx) => `
            <div class="seat-row">
                <span class="row-label">${row[0].row}</span>
                ${row.map((seat, colIdx) => {
                    const isSelected = this.selectedSeats.some(s => s.row === seat.row && s.col === seat.col);
                    let displayStatus = seat.status;
                    
                    if (seat.status === 'locked' && seat.lockedUntil && new Date(seat.lockedUntil) <= now) {
                        displayStatus = 'available';
                    }
                    
                    let title = '';
                    if (displayStatus === 'occupied') title = '已售出';
                    else if (displayStatus === 'locked' && !isSelected) title = '已被锁定';
                    
                    return `
                        <div class="seat ${isSelected ? 'selected' : displayStatus}" 
                             data-row="${seat.row}" 
                             data-col="${seat.col}"
                             ${title ? `title="${title}"` : ''}>
                            ${seat.col}
                        </div>
                    `;
                }).join('')}
                <span class="row-label">${row[0].row}</span>
            </div>
        `).join('');

        container.querySelectorAll('.seat.available, .seat.selected').forEach(seat => {
            seat.addEventListener('click', () => this.toggleSeat(seat));
        });

        this.updateOrderSummary();
    }

    toggleSeat(seatElement) {
        const row = seatElement.dataset.row;
        const col = parseInt(seatElement.dataset.col);
        const seats = this.seatsData[this.selectedSchedule.id];
        
        const idx = this.selectedSeats.findIndex(s => s.row === row && s.col === col);
        if (idx >= 0) {
            this.selectedSeats.splice(idx, 1);
            this.setSeatStatus(seats, row, col, 'available');
        } else {
            if (this.selectedSeats.length >= 6) {
                this.showToast('最多只能选择6个座位', 'warning');
                return;
            }
            
            const seat = this.getSeat(seats, row, col);
            if (seat.status !== 'available') {
                this.showToast('该座位已被他人锁定或售出', 'error');
                this.renderSeats();
                return;
            }
            
            this.selectedSeats.push({ row, col });
            this.setSeatStatus(seats, row, col, 'locked');
        }
        
        this.saveSeatsData();
        this.renderSeats();
        
        if (this.selectedSeats.length > 0 && !this.lockTimer) {
            this.startLockTimer();
        } else if (this.selectedSeats.length === 0 && this.lockTimer) {
            this.stopLockTimer();
        }
    }

    getSeat(seats, row, col) {
        const rowIdx = row.charCodeAt(0) - 65;
        const colIdx = col - 1;
        return seats[rowIdx][colIdx];
    }

    setSeatStatus(seats, row, col, status) {
        const rowIdx = row.charCodeAt(0) - 65;
        const colIdx = col - 1;
        seats[rowIdx][colIdx].status = status;
        if (status === 'locked') {
            seats[rowIdx][colIdx].lockedUntil = this.lockEndTime ? this.lockEndTime.toISOString() : null;
        } else {
            seats[rowIdx][colIdx].lockedUntil = null;
        }
    }

    saveSeatsData() {
        localStorage.setItem('seatsData', JSON.stringify(this.seatsData));
    }

    startLockTimer() {
        this.lockEndTime = new Date(Date.now() + 10 * 60 * 1000);
        const seats = this.seatsData[this.selectedSchedule.id];
        this.selectedSeats.forEach(s => {
            this.setSeatStatus(seats, s.row, s.col, 'locked');
        });
        this.saveSeatsData();
        
        document.querySelector('.timer').classList.remove('hidden');
        this.updateTimerDisplay();
        
        this.lockTimer = setInterval(() => {
            if (new Date() >= this.lockEndTime) {
                this.releaseAllSelectedSeats();
                this.stopLockTimer();
                this.selectedSeats = [];
                this.renderSeats();
                this.showToast('座位锁定超时，已自动释放', 'error');
                return;
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    releaseAllSelectedSeats() {
        const seats = this.seatsData[this.selectedSchedule.id];
        this.selectedSeats.forEach(s => {
            this.setSeatStatus(seats, s.row, s.col, 'available');
        });
        this.saveSeatsData();
    }

    stopLockTimer() {
        if (this.lockTimer) {
            clearInterval(this.lockTimer);
            this.lockTimer = null;
        }
        this.lockEndTime = null;
        document.querySelector('.timer').classList.add('hidden');
    }

    updateTimerDisplay() {
        const remaining = Math.max(0, this.lockEndTime - new Date());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('lockTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateOrderSummary() {
        const count = this.selectedSeats.length;
        const price = this.selectedSchedule ? this.selectedSchedule.price : 0;
        const total = count * price;
        const points = total * 10;

        document.getElementById('selectedSeats').textContent = 
            count > 0 ? this.selectedSeats.map(s => `${s.row}排${s.col}座`).join('、') : '无';
        document.getElementById('ticketPrice').textContent = price;
        document.getElementById('ticketCount').textContent = count;
        document.getElementById('totalPrice').textContent = total;
        document.getElementById('earnPoints').textContent = points;
        document.getElementById('submitOrder').disabled = count === 0;
    }

    checkLockedSeats() {
        const now = new Date();
        let hasExpired = false;
        
        Object.keys(this.seatsData).forEach(scheduleId => {
            this.seatsData[scheduleId].forEach(row => {
                row.forEach(seat => {
                    if (seat.status === 'locked' && seat.lockedUntil && new Date(seat.lockedUntil) <= now) {
                        seat.status = 'available';
                        seat.lockedUntil = null;
                        hasExpired = true;
                    }
                });
            });
        });
        
        if (hasExpired) {
            this.saveSeatsData();
        }
    }

    submitOrder() {
        const seats = this.seatsData[this.selectedSchedule.id];
        
        for (const selected of this.selectedSeats) {
            const seat = this.getSeat(seats, selected.row, selected.col);
            if (seat.status !== 'locked') {
                this.showToast(`${selected.row}排${selected.col}座状态已变更，请重新选择`, 'error');
                this.selectedSeats = [];
                this.renderSeats();
                return;
            }
        }

        document.getElementById('orderMovie').textContent = this.selectedMovie.title;
        document.getElementById('orderSchedule').textContent = 
            `${this.selectedSchedule.date} ${this.selectedSchedule.time} ${this.selectedSchedule.hall}`;
        document.getElementById('orderSeats').textContent = 
            this.selectedSeats.map(s => `${s.row}排${s.col}座`).join('、');
        document.getElementById('orderTotal').textContent = 
            this.selectedSeats.length * this.selectedSchedule.price;

        this.showSection('paymentSection');
    }

    cancelPayment() {
        this.releaseAllSelectedSeats();
        this.backToSchedule();
    }

    backToSchedule() {
        if (this.selectedSeats.length > 0) {
            this.releaseAllSelectedSeats();
        }
        this.stopLockTimer();
        this.selectedSeats = [];
        this.showSection('scheduleSection');
    }

    confirmPayment() {
        const phone = document.getElementById('memberPhone').value.trim();
        const totalPrice = this.selectedSeats.length * this.selectedSchedule.price;
        const points = totalPrice * 10;

        if (phone && !this.isValidPhone(phone)) {
            this.showToast('请输入有效的手机号', 'error');
            return;
        }

        const seats = this.seatsData[this.selectedSchedule.id];
        this.selectedSeats.forEach(selected => {
            this.setSeatStatus(seats, selected.row, selected.col, 'occupied');
        });
        this.saveSeatsData();

        if (phone) {
            if (!this.members[phone]) {
                this.members[phone] = { phone, points: 0, history: [] };
            }
            this.members[phone].points += points;
            this.members[phone].history.unshift({
                type: 'purchase',
                movie: this.selectedMovie.title,
                schedule: `${this.selectedSchedule.date} ${this.selectedSchedule.time}`,
                seats: this.selectedSeats.map(s => `${s.row}排${s.col}座`).join('、'),
                price: totalPrice,
                points: points,
                time: new Date().toLocaleString('zh-CN')
            });
            this.saveToStorage('members', this.members);
        }

        this.orders.push({
            movie: this.selectedMovie.title,
            movieId: this.selectedMovie.id,
            schedule: `${this.selectedSchedule.date} ${this.selectedSchedule.time}`,
            seats: this.selectedSeats.length,
            totalSeats: 96,
            price: totalPrice,
            time: new Date().toISOString()
        });
        this.saveToStorage('orders', this.orders);

        this.stopLockTimer();
        this.selectedSeats = [];
        document.getElementById('memberPhone').value = '';

        this.showToast(`支付成功！${phone ? `获得${points}积分` : ''}`, 'success');
        this.showSection('movieSection');
    }

    showMemberSection() {
        this.showSection('memberSection');
        if (this.currentMember) {
            this.renderMemberInfo();
        }
    }

    memberLogin() {
        const phone = document.getElementById('loginPhone').value.trim();
        if (!phone || !this.isValidPhone(phone)) {
            this.showToast('请输入有效的手机号', 'error');
            return;
        }

        if (!this.members[phone]) {
            this.members[phone] = { phone, points: 0, history: [] };
            this.saveToStorage('members', this.members);
        }

        this.currentMember = phone;
        this.renderMemberInfo();
        this.showToast('登录成功！', 'success');
    }

    renderMemberInfo() {
        const member = this.members[this.currentMember];
        document.getElementById('memberPhoneDisplay').textContent = member.phone;
        document.getElementById('memberPoints').textContent = member.points;
        document.getElementById('memberInfo').classList.remove('hidden');

        this.renderSnacks();
        this.renderMemberHistory();
    }

    renderSnacks() {
        const member = this.members[this.currentMember];
        const container = document.getElementById('snackGrid');
        
        container.innerHTML = this.snacks.map(snack => {
            const canExchange = member.points >= snack.points && !this.isExchanging;
            return `
            <div class="snack-card">
                <div class="snack-icon">${snack.icon}</div>
                <div class="snack-name">${snack.name}</div>
                <div class="snack-points">${snack.points} 积分</div>
                <button class="btn ${canExchange ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="cinema.exchangeSnack(${snack.id})"
                        ${!canExchange ? 'disabled' : ''}>
                    ${this.isExchanging ? '处理中...' : (member.points >= snack.points ? '兑换' : '积分不足')}
                </button>
            </div>
        `}).join('');
    }

    exchangeSnack(snackId) {
        const snack = this.snacks.find(s => s.id === snackId);
        
        if (this.isExchanging) {
            this.showToast('正在处理上一个兑换请求，请稍后...', 'warning');
            return;
        }

        const lockAcquired = this.acquireExchangeLock();
        if (!lockAcquired) {
            this.showToast('系统繁忙，请稍后重试', 'warning');
            return;
        }

        try {
            this.isExchanging = true;
            this.renderSnacks();
            
            this.members = this.loadFromStorage('members') || {};
            const member = this.members[this.currentMember];
            
            if (!member) {
                this.showToast('会员信息异常，请重新登录', 'error');
                this.isExchanging = false;
                this.releaseExchangeLock();
                this.renderSnacks();
                return;
            }

            if (member.points < snack.points) {
                this.showToast('积分不足', 'error');
                this.isExchanging = false;
                this.releaseExchangeLock();
                this.renderSnacks();
                return;
            }

            const originalPoints = member.points;
            member.points -= snack.points;
            member.history.unshift({
                type: 'exchange',
                snack: snack.name,
                points: snack.points,
                time: new Date().toLocaleString('zh-CN')
            });

            this.exchanges = this.loadFromStorage('exchanges') || [];
            this.exchanges.push({
                snack: snack.name,
                snackId: snack.id,
                points: snack.points,
                phone: this.currentMember,
                time: new Date().toISOString()
            });

            this.saveToStorage('members', this.members);
            this.saveToStorage('exchanges', this.exchanges);
            
            this.members[this.currentMember] = member;

            this.renderMemberInfo();
            this.showToast(`兑换成功！获得${snack.name}`, 'success');
        } catch (error) {
            console.error('兑换失败:', error);
            this.showToast('兑换失败，请重试', 'error');
        } finally {
            this.isExchanging = false;
            this.releaseExchangeLock();
            this.renderSnacks();
        }
    }

    acquireExchangeLock() {
        const now = Date.now();
        const lockTimeout = 5000;
        
        const existingLock = this.loadFromStorage(this.exchangeLockKey);
        if (existingLock && now - existingLock.timestamp < lockTimeout) {
            return false;
        }
        
        this.saveToStorage(this.exchangeLockKey, {
            timestamp: now,
            phone: this.currentMember
        });
        return true;
    }

    releaseExchangeLock() {
        localStorage.removeItem(this.exchangeLockKey);
    }

    renderMemberHistory() {
        const member = this.members[this.currentMember];
        const exchanges = member.history.filter(h => h.type === 'exchange');
        const purchases = member.history.filter(h => h.type === 'purchase');

        document.getElementById('exchangeHistory').innerHTML = exchanges.length > 0 
            ? exchanges.map(h => `
                <div class="history-item">
                    <div class="history-time">${h.time}</div>
                    <div class="history-detail">兑换：${h.snack}，消耗${h.points}积分</div>
                </div>
            `).join('')
            : '<p style="color: #999; text-align: center; padding: 20px;">暂无兑换记录</p>';

        document.getElementById('ticketHistory').innerHTML = purchases.length > 0 
            ? purchases.map(h => `
                <div class="history-item">
                    <div class="history-time">${h.time}</div>
                    <div class="history-detail">观看：${h.movie}，${h.schedule}，座位：${h.seats}，获得${h.points}积分</div>
                </div>
            `).join('')
            : '<p style="color: #999; text-align: center; padding: 20px;">暂无购票记录</p>';
    }

    showReportSection() {
        this.showSection('reportSection');
        this.renderReports();
    }

    renderReports() {
        const occupancyData = this.calculateOccupancy();
        const snackData = this.calculateSnackRanking();

        document.getElementById('occupancyReport').innerHTML = `
            <div class="report-row header">
                <div>电影名称</div>
                <div>总场次</div>
                <div>售出票数</div>
                <div>上座率</div>
            </div>
            ${occupancyData.map(item => `
                <div class="report-row">
                    <div>${item.title}</div>
                    <div>${item.totalSchedules}</div>
                    <div>${item.soldSeats}</div>
                    <div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${item.rate}%"></div>
                        </div>
                        <div style="text-align: center; margin-top: 5px;">${item.rate.toFixed(1)}%</div>
                    </div>
                </div>
            `).join('')}
        `;

        document.getElementById('snackReport').innerHTML = `
            <div class="report-row header">
                <div>小食名称</div>
                <div>兑换次数</div>
                <div>消耗总积分</div>
                <div>排名</div>
            </div>
            ${snackData.map((item, idx) => `
                <div class="report-row">
                    <div>${item.name}</div>
                    <div>${item.count}</div>
                    <div>${item.totalPoints}</div>
                    <div>${idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}</div>
                </div>
            `).join('')}
        `;
    }

    calculateOccupancy() {
        const movieStats = {};
        this.movies.forEach(m => {
            movieStats[m.id] = { title: m.title, schedules: 0, soldSeats: 0, totalSeats: 0 };
        });

        Object.entries(this.seatsData).forEach(([scheduleId, seats]) => {
            const movieId = parseInt(scheduleId.split('-')[0]);
            if (movieStats[movieId]) {
                movieStats[movieId].schedules++;
                seats.forEach(row => {
                    row.forEach(seat => {
                        movieStats[movieId].totalSeats++;
                        if (seat.status === 'occupied') {
                            movieStats[movieId].soldSeats++;
                        }
                    });
                });
            }
        });

        this.orders.forEach(order => {
            if (movieStats[order.movieId]) {
                movieStats[order.movieId].soldSeats += order.seats;
            }
        });

        return Object.values(movieStats).map(stat => ({
            title: stat.title,
            totalSchedules: stat.schedules,
            soldSeats: stat.soldSeats,
            rate: stat.totalSeats > 0 ? (stat.soldSeats / stat.totalSeats) * 100 : 0
        })).sort((a, b) => b.rate - a.rate);
    }

    calculateSnackRanking() {
        const snackStats = {};
        this.snacks.forEach(s => {
            snackStats[s.id] = { name: s.name, count: 0, totalPoints: 0 };
        });

        this.exchanges.forEach(ex => {
            if (snackStats[ex.snackId]) {
                snackStats[ex.snackId].count++;
                snackStats[ex.snackId].totalPoints += ex.points;
            }
        });

        return Object.values(snackStats)
            .filter(s => s.count > 0)
            .sort((a, b) => b.count - a.count);
    }

    isValidPhone(phone) {
        return /^1[3-9]\d{9}$/.test(phone);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

const cinema = new CinemaSystem();