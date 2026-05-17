const Common = {
    formatDate: function(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    showToast: function(message, type = 'success', duration = 2000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    showConfirm: function(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-message">${message}</div>
                <div class="confirm-actions">
                    <button class="btn btn-cancel">取消</button>
                    <button class="btn btn-primary">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-cancel').onclick = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            if (onCancel) onCancel();
        };

        modal.querySelector('.btn-primary').onclick = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            if (onConfirm) onConfirm();
        };
    },

    getFormData: function(formId) {
        const form = document.getElementById(formId);
        const formData = {};
        if (!form) return formData;
        
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value;
            }
        });
        return formData;
    },

    setFormData: function(formId, data) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        for (const key in data) {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key] || '';
            }
        }
    },

    clearForm: function(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
        Validator.clearAllErrors();
    },

    renderSelect: function(selectId, options, valueField = 'id', labelField = 'name') {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">请选择</option>';
        if (!options || !options.length) return;
        
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option[valueField];
            opt.textContent = option[labelField];
            select.appendChild(opt);
        });
    },

    renderTable: function(tableId, data, columns) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columns.length}" class="no-data">暂无数据</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(row => `
            <tr>
                ${columns.map(col => `<td>${col.render ? col.render(row) : (row[col.field] !== undefined ? row[col.field] : '')}</td>`).join('')}
            </tr>
        `).join('');
    },

    renderPagination: function(pageId, page, totalPages, onPageChange) {
        const pagination = document.getElementById(pageId);
        if (!pagination) return;
        
        if (!totalPages || totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '<span>共 ' + totalPages + ' 页</span>';
        html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="${onPageChange}(${page - 1})">上一页</button>`;

        for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
            html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
        }

        html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="${onPageChange}(${page + 1})">下一页</button>`;
        pagination.innerHTML = html;
    }
};
