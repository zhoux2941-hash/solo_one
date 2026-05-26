(() => {
  const NEW_BOOK_DISCOUNT = 0.5;

  const STORAGE_KEYS = {
    books: 'textbook_books',
    orders: 'textbook_orders',
    wanted: 'textbook_wanted',
  };

  const state = {
    books: loadBooks(),
    orders: loadOrders(),
    wanted: loadWanted(),
    purchaseTargetId: null,
  };

  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  /* ================= Data Layer ================= */
  function loadBooks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.books);
      if (raw) {
        const books = JSON.parse(raw);
        return books.map(b => ({ ...b, version: b.version || 1 }));
      }
    } catch (e) {}
    return seedBooks();
  }

  function loadOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.orders);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveBooks() {
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(state.books));
  }

  function saveOrders() {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(state.orders));
  }

  function seedBooks() {
    const now = Date.now();
    const sample = [
      { id: genId(), isbn: '9787040396638', title: '高等数学（上册）', condition: 8, originalPrice: 45.00, stock: 3, createdAt: now - 86400000, version: 1 },
      { id: genId(), isbn: '9787302275022', title: 'C++ Primer（第5版）', condition: 7, originalPrice: 128.00, stock: 2, createdAt: now - 172800000, version: 1 },
      { id: genId(), isbn: '9787111407010', title: '深入理解计算机系统', condition: 9, originalPrice: 139.00, stock: 1, createdAt: now - 259200000, version: 1 },
      { id: genId(), isbn: '9787115279460', title: 'JavaScript 高级程序设计', condition: 6, originalPrice: 99.00, stock: 4, createdAt: now - 345600000, version: 1 },
    ];
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(sample));
    return sample;
  }

  function loadWanted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.wanted);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return seedWanted();
  }

  function saveWanted() {
    localStorage.setItem(STORAGE_KEYS.wanted, JSON.stringify(state.wanted));
  }

  function seedWanted() {
    const now = Date.now();
    const sample = [
      { id: genId(), title: '线性代数及其应用', isbn: '', price: 25.00, contact: '微信: stu_zhang', remark: '求第5版，品相8成新以上', createdAt: now - 3600000, status: 'open' },
      { id: genId(), title: '算法导论', isbn: '9787111407010', price: 60.00, contact: 'QQ: 12345678', remark: '急需，最好有笔记', createdAt: now - 7200000, status: 'open' },
    ];
    localStorage.setItem(STORAGE_KEYS.wanted, JSON.stringify(sample));
    return sample;
  }

  function genId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function calcPrice(originalPrice, condition) {
    return +(originalPrice * NEW_BOOK_DISCOUNT * (condition / 10)).toFixed(2);
  }

  function conditionLabel(c) {
    if (c >= 9) return '几乎全新';
    if (c >= 7) return '品相良好';
    if (c >= 5) return '有使用痕迹';
    if (c >= 3) return '有磨损';
    return '较旧';
  }

  /* ================= UI: Tabs ================= */
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('#' + btn.dataset.tab).classList.add('active');
    });
  });

  /* ================= UI: Discount Rate (sync display with const) ================= */
  function updateDiscountDisplay() {
    const discountRateDisplay = $('#discountRate');
    const formulaText = $('#formulaText');
    const calcFormulaText = $('#calcFormulaText');
    const ratePercent = Math.round(NEW_BOOK_DISCOUNT * 100);

    if (discountRateDisplay) discountRateDisplay.textContent = ratePercent + '%';
    if (formulaText) formulaText.textContent = `公式：原价 × ${NEW_BOOK_DISCOUNT} × (新旧程度/10)`;
    if (calcFormulaText) calcFormulaText.textContent = `公式：原价 × ${NEW_BOOK_DISCOUNT} × (新旧程度/10)`;
  }

  /* ================= UI: Submit Form ================= */
  const fIsbn = $('#f_isbn');
  const fTitle = $('#f_title');
  const fCondition = $('#f_condition');
  const fPrice = $('#f_price');
  const fSeller = $('#f_seller');
  const conditionValue = $('#conditionValue');
  const liveEstimate = $('#liveEstimate');

  function updateLiveEstimate() {
    const price = parseFloat(fPrice.value) || 0;
    const cond = parseInt(fCondition.value) || 0;
    liveEstimate.textContent = calcPrice(price, cond).toFixed(2);
  }

  fCondition.addEventListener('input', () => {
    conditionValue.textContent = fCondition.value;
    updateLiveEstimate();
  });
  fPrice.addEventListener('input', updateLiveEstimate);

  $('#submitForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const isbn = fIsbn.value.trim();
    const title = fTitle.value.trim();
    const condition = parseInt(fCondition.value);
    const originalPrice = parseFloat(fPrice.value);
    const seller = fSeller.value.trim();

    if (!/^\d{10}(\d{3})?$/.test(isbn)) {
      toast('请输入 10 或 13 位数字的 ISBN', 'error');
      return;
    }
    if (originalPrice <= 0) {
      toast('请输入有效的原价', 'error');
      return;
    }

    const estimated = calcPrice(originalPrice, condition);

    const existing = state.books.find(b => b.isbn === isbn && b.title === title);
    let book;
    if (existing) {
      existing.stock += 1;
      existing.version = (existing.version || 1) + 1;
      if (condition > existing.condition) existing.condition = condition;
      book = existing;
    } else {
      book = {
        id: genId(),
        isbn,
        title,
        condition,
        originalPrice,
        stock: 1,
        createdAt: Date.now(),
        version: 1,
      };
      state.books.push(book);
    }
    saveBooks();

    const order = {
      id: 'R' + Date.now().toString(36).toUpperCase(),
      type: 'recycle',
      bookId: book.id,
      isbn,
      title,
      condition,
      originalPrice,
      estimatedPrice: estimated,
      seller,
      buyer: '',
      status: 'completed',
      createdAt: Date.now(),
    };
    state.orders.unshift(order);
    saveOrders();

    toast(`回收成功！订单号 ${order.id}，估价 ¥${estimated.toFixed(2)}`, 'success');
    e.target.reset();
    fCondition.value = 8;
    conditionValue.textContent = '8';
    liveEstimate.textContent = '0.00';

    renderBooks();
    renderOrders();
  });

  $('#submitForm').addEventListener('reset', () => {
    setTimeout(() => {
      fCondition.value = 8;
      conditionValue.textContent = '8';
      liveEstimate.textContent = '0.00';
    }, 0);
  });

  /* ================= UI: Calculator ================= */
  const calcPriceIn = $('#calc_price');
  const calcCond = $('#calc_condition');
  const calcCondVal = $('#calcCondValue');
  const calcResult = $('#calcResult');

  function updateCalc() {
    const p = parseFloat(calcPriceIn.value) || 0;
    const c = parseInt(calcCond.value) || 0;
    calcResult.textContent = calcPrice(p, c).toFixed(2);
  }
  calcPriceIn.addEventListener('input', updateCalc);
  calcCond.addEventListener('input', () => {
    calcCondVal.textContent = calcCond.value;
    updateCalc();
  });

  /* ================= UI: Book List ================= */
  function renderBooks(filter = '') {
    const grid = $('#bookList');
    const empty = $('#emptyHint');
    const kw = filter.trim().toLowerCase();

    let list = state.books.filter(b => b.stock > 0);
    if (kw) {
      list = list.filter(b =>
        b.title.toLowerCase().includes(kw) ||
        b.isbn.toLowerCase().includes(kw)
      );
    }
    list.sort((a, b) => b.createdAt - a.createdAt);

    grid.innerHTML = '';
    if (list.length === 0) {
      empty.style.display = 'block';
      empty.textContent = kw ? '未找到匹配的教材' : '暂无库存教材，欢迎提交回收！';
      return;
    }
    empty.style.display = 'none';

    list.forEach(b => {
      const price = calcPrice(b.originalPrice, b.condition);
      const card = document.createElement('div');
      card.className = 'book-card';
      card.innerHTML = `
        <h3 class="book-title">${escapeHtml(b.title)}</h3>
        <div class="book-isbn">ISBN: ${escapeHtml(b.isbn)}</div>
        <div class="book-meta">
          <span class="tag tag-condition">${b.condition}/10 · ${conditionLabel(b.condition)}</span>
          <span class="tag tag-original">原价 ¥${b.originalPrice.toFixed(2)}</span>
          <span class="tag tag-stock">库存 ${b.stock}</span>
        </div>
        <div class="book-price">¥${price.toFixed(2)} <small>回收价</small></div>
        <button class="btn btn-primary buy-btn" data-id="${b.id}">购买</button>
      `;
      grid.appendChild(card);
    });

    $$('.buy-btn', grid).forEach(btn => {
      btn.addEventListener('click', () => openPurchaseModal(btn.dataset.id));
    });
  }

  $('#searchBtn').addEventListener('click', () => {
    renderBooks($('#searchInput').value);
  });
  $('#searchInput').addEventListener('input', (e) => {
    renderBooks(e.target.value);
  });
  $('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') renderBooks(e.target.value);
  });

  /* ================= UI: Purchase Modal ================= */
  const modal = $('#purchaseModal');
  const purchaseDetails = $('#purchaseDetails');
  const buyerNameIn = $('#buyerName');

  function openPurchaseModal(bookId) {
    const book = state.books.find(b => b.id === bookId);
    if (!book || book.stock <= 0) {
      toast('库存不足', 'error');
      return;
    }
    state.purchaseTargetId = bookId;
    state.purchaseTargetVersion = book.version || 1;
    const price = calcPrice(book.originalPrice, book.condition);
    purchaseDetails.innerHTML = `
      <p><strong>${escapeHtml(book.title)}</strong></p>
      <p>ISBN: ${escapeHtml(book.isbn)}</p>
      <p>品相: ${book.condition}/10 · ${conditionLabel(book.condition)}</p>
      <p>原价: ¥${book.originalPrice.toFixed(2)}</p>
      <p style="font-size:18px;color:var(--danger);font-weight:700;">实付: ¥${price.toFixed(2)}</p>
    `;
    buyerNameIn.value = '';
    modal.hidden = false;
  }

  function closePurchaseModal() {
    modal.hidden = true;
    state.purchaseTargetId = null;
    state.purchaseTargetVersion = null;
  }

  $('#cancelPurchase').addEventListener('click', closePurchaseModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePurchaseModal();
  });

  $('#confirmPurchase').addEventListener('click', async () => {
    const bookId = state.purchaseTargetId;
    const expectedVersion = state.purchaseTargetVersion;
    if (!bookId || expectedVersion == null) return;

    const buyer = buyerNameIn.value.trim();
    if (!buyer) {
      toast('请输入买家姓名', 'error');
      return;
    }

    let result;
    let attempts = 0;
    const maxAttempts = 3;
    let currentVersion = expectedVersion;

    while (attempts < maxAttempts) {
      attempts++;
      result = decreaseStockWithOptimisticLock(bookId, currentVersion);

      if (result.success) break;
      if (!result.needRetry) break;

      const latestBook = state.books.find(b => b.id === bookId);
      if (!latestBook || latestBook.stock <= 0) {
        result = { success: false, reason: '库存不足' };
        break;
      }
      currentVersion = latestBook.version || 1;

      if (attempts < maxAttempts) {
        toast(`数据冲突，第 ${attempts} 次重试中...`, '');
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!result.success) {
      toast(result.reason || '购买失败', 'error');
      closePurchaseModal();
      renderBooks($('#searchInput').value);
      return;
    }

    const book = result.book;
    const price = calcPrice(book.originalPrice, book.condition);
    const order = {
      id: 'P' + Date.now().toString(36).toUpperCase(),
      type: 'purchase',
      bookId: book.id,
      isbn: book.isbn,
      title: book.title,
      condition: book.condition,
      originalPrice: book.originalPrice,
      estimatedPrice: price,
      seller: '',
      buyer,
      status: 'completed',
      createdAt: Date.now(),
      versionUsed: currentVersion,
      versionAfter: book.version,
    };
    state.orders.unshift(order);
    saveOrders();

    closePurchaseModal();
    toast(`购买成功！订单号 ${order.id}`, 'success');
    renderBooks($('#searchInput').value);
    renderOrders();
  });

  /* ================= UI: Orders ================= */
  const orderList = $('#orderList');
  const orderEmpty = $('#orderEmptyHint');
  const orderTypeFilter = $('#orderTypeFilter');

  function renderOrders() {
    const type = orderTypeFilter.value;
    let list = state.orders.slice();
    if (type !== 'all') list = list.filter(o => o.type === type);
    list.sort((a, b) => b.createdAt - a.createdAt);

    orderList.innerHTML = '';
    if (list.length === 0) {
      orderEmpty.style.display = 'block';
      return;
    }
    orderEmpty.style.display = 'none';

    list.forEach(o => {
      const isRecycle = o.type === 'recycle';
      const card = document.createElement('div');
      card.className = 'order-card';
      const person = isRecycle
        ? `卖家: ${escapeHtml(o.seller || '-')}`
        : `买家: ${escapeHtml(o.buyer || '-')}`;
      const typeName = isRecycle ? '回收' : '购买';
      const amountClass = isRecycle ? 'income' : 'expense';
      const amountPrefix = isRecycle ? '+' : '-';
      card.innerHTML = `
        <div class="order-info">
          <p class="order-title">
            <span class="order-type ${o.type}">${typeName}</span>
            ${escapeHtml(o.title)}
          </p>
          <div class="order-meta">
            订单号: ${o.id} · ISBN: ${escapeHtml(o.isbn)} · ${person} ·
            ${new Date(o.createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
        <div class="order-amount ${amountClass}">${amountPrefix}¥${o.estimatedPrice.toFixed(2)}</div>
        <div class="status ${o.status}">${statusLabel(o.status)}</div>
      `;
      orderList.appendChild(card);
    });
  }

  orderTypeFilter.addEventListener('change', renderOrders);

  function statusLabel(s) {
    return { pending: '待处理', completed: '已完成', cancelled: '已取消' }[s] || s;
  }

  function wantedStatusLabel(s) {
    return { open: '求购中', fulfilled: '已成交', closed: '已关闭' }[s] || s;
  }

  /* ================= UI: Wanted (求购) ================= */
  const wantedFormContainer = $('#wantedFormContainer');
  const wantedForm = $('#wantedForm');
  const wantedList = $('#wantedList');
  const wantedEmptyHint = $('#wantedEmptyHint');
  const showWantedFormBtn = $('#showWantedFormBtn');
  const cancelWantedBtn = $('#cancelWantedBtn');

  showWantedFormBtn.addEventListener('click', () => {
    wantedFormContainer.style.display = 'block';
    wantedForm.reset();
  });
  cancelWantedBtn.addEventListener('click', () => {
    wantedFormContainer.style.display = 'none';
    wantedForm.reset();
  });

  wantedForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#w_title').value.trim();
    const isbn = $('#w_isbn').value.trim();
    const price = parseFloat($('#w_price').value);
    const contact = $('#w_contact').value.trim();
    const remark = $('#w_remark').value.trim();

    if (!title) {
      toast('请输入教材名称', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast('请输入有效的价格', 'error');
      return;
    }
    if (!contact) {
      toast('请输入联系方式', 'error');
      return;
    }

    const item = {
      id: genId(),
      title,
      isbn,
      price: +price.toFixed(2),
      contact,
      remark,
      createdAt: Date.now(),
      status: 'open',
    };
    state.wanted.unshift(item);
    saveWanted();

    toast('求购信息发布成功！', 'success');
    wantedForm.reset();
    wantedFormContainer.style.display = 'none';
    renderWanted();
  });

  function renderWanted() {
    wantedList.innerHTML = '';
    const list = state.wanted.filter(w => w.status === 'open');
    list.sort((a, b) => b.createdAt - a.createdAt);

    if (list.length === 0) {
      wantedEmptyHint.style.display = 'block';
      wantedEmptyHint.textContent = '暂无求购信息，快来发布第一条吧！';
      return;
    }
    wantedEmptyHint.style.display = 'none';

    list.forEach(w => {
      const card = document.createElement('div');
      card.className = 'wanted-card';
      const timeAgo = getTimeAgo(w.createdAt);
      const isbnTag = w.isbn ? `<span class="tag tag-wanted">ISBN: ${escapeHtml(w.isbn)}</span>` : '';
      const remarkHtml = w.remark ? `<div class="wanted-remark">📝 ${escapeHtml(w.remark)}</div>` : '';
      card.innerHTML = `
        <div class="wanted-card-header">
          <h3 class="wanted-title">${escapeHtml(w.title)}</h3>
          <span class="wanted-price">¥${w.price.toFixed(2)}</span>
        </div>
        <div class="wanted-meta">
          <span class="tag tag-wanted">求购中</span>
          ${isbnTag}
        </div>
        ${remarkHtml}
        <div class="wanted-footer">
          <span>📅 ${timeAgo}</span>
          <button class="btn btn-primary contact-btn" data-id="${w.id}">查看联系方式</button>
        </div>
      `;
      wantedList.appendChild(card);
    });

    $$('.contact-btn', wantedList).forEach(btn => {
      btn.addEventListener('click', () => {
        const item = state.wanted.find(w => w.id === btn.dataset.id);
        if (item) {
          toast(`联系方式：${item.contact}`, 'success');
        }
      });
    });
  }

  function getTimeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} 天前`;
    return new Date(ts).toLocaleDateString('zh-CN');
  }

  /* ================= 乐观锁库存扣减 ================= */
  function decreaseStockWithOptimisticLock(bookId, expectedVersion) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return { success: false, reason: '图书不存在' };
    if (book.stock <= 0) return { success: false, reason: '库存不足' };

    const currentVersion = book.version || 1;
    if (currentVersion !== expectedVersion) {
      return { success: false, reason: '数据已被修改，请重试', needRetry: true };
    }

    book.stock -= 1;
    book.version = currentVersion + 1;
    saveBooks();

    return { success: true, book: { ...book } };
  }

  /* ================= Utils ================= */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function toast(msg, type = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      t.className = 'toast';
    }, 2400);
  }

  /* ================= Init ================= */
  updateDiscountDisplay();
  renderBooks();
  renderOrders();
  renderWanted();
})();
