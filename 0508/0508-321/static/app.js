const ROWS = 100;
const COLS = 26;
const MAX_HISTORY = 50;

class SpreadsheetApp {
    constructor() {
        this.cells = {};
        this.columnWidths = {};
        this.rowHeights = {};
        this.selectedCell = null;
        this.editingCell = null;
        this.undoStack = [];
        this.redoStack = [];
        this.webTransport = null;
        this.clientId = this.generateClientId();
        this.pendingOps = [];
        this.cellDependencies = {};
        this.dependentsMap = {};
        this.filterEnabled = {};
        this.filterValues = {};
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.rowOrder = [];
        
        this.init();
    }

    generateClientId() {
        return 'client-' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        for (let r = 0; r < ROWS; r++) {
            this.rowOrder[r] = r;
        }
        this.renderSpreadsheet();
        this.setupEventListeners();
        this.connectWebTransport();
    }

    renderSpreadsheet() {
        const container = document.getElementById('spreadsheet');
        container.innerHTML = '';

        const headerRow = document.createElement('div');
        headerRow.className = 'header-row';
        
        const corner = document.createElement('div');
        corner.className = 'corner-header';
        headerRow.appendChild(corner);

        for (let c = 0; c < COLS; c++) {
            const colHeader = document.createElement('div');
            colHeader.className = 'col-header';
            colHeader.dataset.col = c;
            colHeader.style.width = (this.columnWidths[c] || 100) + 'px';
            colHeader.style.position = 'relative';
            colHeader.style.justifyContent = 'space-between';
            colHeader.style.cursor = 'pointer';
            
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'col-header-content';
            
            const label = document.createElement('span');
            label.textContent = String.fromCharCode(65 + c);
            contentWrapper.appendChild(label);
            
            if (this.sortColumn === c) {
                const indicator = document.createElement('span');
                indicator.className = 'sort-indicator';
                indicator.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
                contentWrapper.appendChild(indicator);
            }
            
            colHeader.appendChild(contentWrapper);
            
            const filterBtn = document.createElement('button');
            filterBtn.className = 'filter-btn';
            if (this.filterEnabled[c]) {
                filterBtn.classList.add('active');
            }
            filterBtn.innerHTML = '▼';
            filterBtn.dataset.col = c;
            filterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFilterDropdown(c, filterBtn);
            });
            colHeader.appendChild(filterBtn);
            
            const handle = document.createElement('div');
            handle.className = 'resize-handle-col';
            handle.dataset.col = c;
            colHeader.appendChild(handle);
            
            colHeader.addEventListener('click', (e) => {
                if (!e.target.closest('.filter-btn') && !e.target.closest('.resize-handle-col')) {
                    this.sortByColumn(c);
                }
            });
            
            headerRow.appendChild(colHeader);
        }
        container.appendChild(headerRow);

        for (let r = 0; r < ROWS; r++) {
            const actualRow = this.rowOrder[r];
            const row = document.createElement('div');
            row.className = 'row';
            row.dataset.row = actualRow;
            row.style.height = (this.rowHeights[actualRow] || 25) + 'px';
            
            const shouldHide = this.shouldHideRow(actualRow);
            if (shouldHide) {
                row.classList.add('hidden');
            }
            
            const rowHeader = document.createElement('div');
            rowHeader.className = 'row-header';
            rowHeader.textContent = actualRow + 1;
            rowHeader.dataset.row = actualRow;
            
            const rowHandle = document.createElement('div');
            rowHandle.className = 'resize-handle-row';
            rowHandle.dataset.row = actualRow;
            rowHeader.appendChild(rowHandle);
            
            row.appendChild(rowHeader);

            for (let c = 0; c < COLS; c++) {
                const cellId = this.getCellId(actualRow, c);
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.cellId = cellId;
                cell.dataset.row = actualRow;
                cell.dataset.col = c;
                cell.style.width = (this.columnWidths[c] || 100) + 'px';
                cell.style.minHeight = (this.rowHeights[actualRow] || 25) + 'px';
                
                cell.addEventListener('click', () => this.selectCell(cellId));
                cell.addEventListener('dblclick', () => this.startEditing(cellId));
                
                row.appendChild(cell);
            }
            container.appendChild(row);
        }
        
        for (let r = 0; r < ROWS; r++) {
            const actualRow = this.rowOrder[r];
            for (let c = 0; c < COLS; c++) {
                const cellId = this.getCellId(actualRow, c);
                this.renderCell(cellId);
            }
        }
    }

    getCellId(row, col) {
        return String.fromCharCode(65 + col) + (row + 1);
    }

    parseCellId(cellId) {
        const match = cellId.match(/([A-Z])(\d+)/);
        if (match) {
            return {
                col: match[1].charCodeAt(0) - 65,
                row: parseInt(match[2]) - 1
            };
        }
        return null;
    }

    selectCell(cellId) {
        if (this.editingCell) {
            this.finishEditing();
        }

        document.querySelectorAll('.cell.selected').forEach(el => {
            el.classList.remove('selected');
        });

        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        if (cell) {
            cell.classList.add('selected');
            this.selectedCell = cellId;
            document.getElementById('cellLabel').textContent = cellId;
            
            const cellData = this.cells[cellId] || {};
            document.getElementById('formulaInput').value = cellData.value || '';
            
            this.updateToolbarState();
        }
    }

    startEditing(cellId) {
        this.selectCell(cellId);
        this.editingCell = cellId;

        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        cell.classList.add('editing');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cell-input';
        input.value = this.cells[cellId]?.value || '';
        
        input.addEventListener('blur', () => this.finishEditing());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.finishEditing();
                const pos = this.parseCellId(cellId);
                if (pos && pos.row < ROWS - 1) {
                    setTimeout(() => this.startEditing(this.getCellId(pos.row + 1, pos.col)), 10);
                }
            } else if (e.key === 'Escape') {
                this.finishEditing(true);
            }
        });

        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
        input.select();
    }

    finishEditing(cancel = false) {
        if (!this.editingCell) return;

        const cellId = this.editingCell;
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        const input = cell.querySelector('.cell-input');
        const newValue = cancel ? (this.cells[cellId]?.value || '') : input.value;

        cell.classList.remove('editing');
        
        if (!cancel && newValue !== (this.cells[cellId]?.value || '')) {
            this.pushUndo([{
                type: 'set_value',
                cellId: cellId,
                oldValue: this.cells[cellId]?.value || '',
                newValue: newValue
            }]);
            this.setCellValue(cellId, newValue);
        }

        this.renderCell(cellId);
        this.editingCell = null;
    }

    setCellValue(cellId, value, send = true) {
        if (!this.cells[cellId]) {
            this.cells[cellId] = {};
        }
        
        const oldValue = this.cells[cellId].value;
        this.cells[cellId].value = value;
        this.calculateCell(cellId);

        if (send && oldValue !== value) {
            this.sendOperation({
                type: 'set_value',
                cell_id: cellId,
                value: value
            });
        }

        this.recalculateDependents(cellId);
        
        const pos = this.parseCellId(cellId);
        if (pos && this.sortColumn === pos.col && oldValue !== value) {
            this.sortByColumn(this.sortColumn, this.sortDirection);
        }
        
        if (pos && this.filterEnabled[pos.col] && oldValue !== value) {
            this.applyAllFilters();
        }
        
        this.renderCell(cellId);
    }

    calculateCell(cellId) {
        const cellData = this.cells[cellId];
        if (!cellData || !cellData.value) {
            if (cellData) {
                cellData.displayValue = '';
            }
            this.removeCellDependencies(cellId);
            return;
        }

        const value = cellData.value.toString().trim();
        if (value.startsWith('=')) {
            const formula = value.substring(1);
            const dependencies = this.extractCellReferences(formula);
            this.updateCellDependencies(cellId, dependencies);
            cellData.displayValue = this.evaluateFormula(formula);
        } else {
            this.removeCellDependencies(cellId);
            cellData.displayValue = value;
        }
    }

    extractCellReferences(formula) {
        const references = new Set();
        const cellRegex = /[A-Z]+\d+/g;
        let match;
        
        while ((match = cellRegex.exec(formula.toUpperCase())) !== null) {
            references.add(match[0]);
        }
        
        const rangeRegex = /[A-Z]+\d+:[A-Z]+\d+/g;
        while ((match = rangeRegex.exec(formula.toUpperCase())) !== null) {
            const [start, end] = match[0].split(':');
            const startPos = this.parseCellId(start);
            const endPos = this.parseCellId(end);
            if (startPos && endPos) {
                for (let r = Math.min(startPos.row, endPos.row); r <= Math.max(startPos.row, endPos.row); r++) {
                    for (let c = Math.min(startPos.col, endPos.col); c <= Math.max(startPos.col, endPos.col); c++) {
                        references.add(this.getCellId(r, c));
                    }
                }
            }
        }
        
        return Array.from(references);
    }

    updateCellDependencies(formulaCellId, dependencies) {
        this.removeCellDependencies(formulaCellId);
        
        this.cellDependencies[formulaCellId] = dependencies;
        
        dependencies.forEach(depCellId => {
            if (!this.dependentsMap[depCellId]) {
                this.dependentsMap[depCellId] = new Set();
            }
            this.dependentsMap[depCellId].add(formulaCellId);
        });
    }

    removeCellDependencies(formulaCellId) {
        const oldDeps = this.cellDependencies[formulaCellId] || [];
        oldDeps.forEach(depCellId => {
            if (this.dependentsMap[depCellId]) {
                this.dependentsMap[depCellId].delete(formulaCellId);
                if (this.dependentsMap[depCellId].size === 0) {
                    delete this.dependentsMap[depCellId];
                }
            }
        });
        delete this.cellDependencies[formulaCellId];
    }

    recalculateDependents(changedCellId, visited = new Set()) {
        if (visited.has(changedCellId)) {
            return;
        }
        visited.add(changedCellId);
        
        const dependents = this.dependentsMap[changedCellId];
        if (!dependents) return;
        
        dependents.forEach(depCellId => {
            const cellData = this.cells[depCellId];
            if (cellData && cellData.value && cellData.value.toString().trim().startsWith('=')) {
                const formula = cellData.value.toString().trim().substring(1);
                const newValue = this.evaluateFormula(formula);
                if (cellData.displayValue !== newValue) {
                    cellData.displayValue = newValue;
                    this.renderCell(depCellId);
                    this.recalculateDependents(depCellId, visited);
                }
            }
        });
    }

    evaluateFormula(formula) {
        formula = formula.toUpperCase();
        
        const functionMatch = formula.match(/(SUM|AVERAGE|MAX|MIN)\(([A-Z]+\d+):([A-Z]+\d+)\)/);
        if (functionMatch) {
            const func = functionMatch[1];
            const startCell = functionMatch[2];
            const endCell = functionMatch[3];
            const values = this.getRangeValues(startCell, endCell);
            
            switch (func) {
                case 'SUM':
                    return values.reduce((a, b) => a + b, 0);
                case 'AVERAGE':
                    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                case 'MAX':
                    return values.length ? Math.max(...values) : 0;
                case 'MIN':
                    return values.length ? Math.min(...values) : 0;
            }
        }

        try {
            return eval(formula.replace(/[A-Z]+\d+/g, (match) => {
                const val = this.cells[match]?.value;
                return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
            }));
        } catch (e) {
            return '#ERROR';
        }
    }

    sortByColumn(colIndex, direction = null) {
        if (direction) {
            this.sortDirection = direction;
        } else if (this.sortColumn === colIndex) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = colIndex;
            this.sortDirection = 'asc';
        }
        
        const rows = [];
        for (let r = 0; r < ROWS; r++) {
            const cellId = this.getCellId(r, colIndex);
            const value = this.cells[cellId]?.displayValue || this.cells[cellId]?.value || '';
            rows.push({ originalIndex: r, value: value });
        }
        
        rows.sort((a, b) => {
            const valA = a.value;
            const valB = b.value;
            
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            const areNumbers = !isNaN(numA) && !isNaN(numB);
            
            let comparison;
            if (areNumbers) {
                comparison = numA - numB;
            } else {
                comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
            }
            
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
        
        this.rowOrder = rows.map(r => r.originalIndex);
        this.renderSpreadsheet();
    }

    clearSort() {
        this.sortColumn = null;
        for (let r = 0; r < ROWS; r++) {
            this.rowOrder[r] = r;
        }
        this.renderSpreadsheet();
    }

    getUniqueValuesInColumn(colIndex) {
        const values = new Set();
        for (let r = 0; r < ROWS; r++) {
            const cellId = this.getCellId(r, colIndex);
            const value = this.cells[cellId]?.displayValue || this.cells[cellId]?.value || '';
            if (value !== '') {
                values.add(String(value));
            }
        }
        return Array.from(values).sort();
    }

    toggleFilterDropdown(colIndex, button) {
        this.closeAllFilterDropdowns();
        
        const existingDropdown = document.querySelector(`.filter-dropdown[data-col="${colIndex}"]`);
        if (existingDropdown) {
            existingDropdown.classList.toggle('show');
            return;
        }
        
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown show';
        dropdown.dataset.col = colIndex;
        
        const header = document.createElement('div');
        header.className = 'filter-header';
        header.textContent = `列 ${String.fromCharCode(65 + colIndex)} 筛选`;
        dropdown.appendChild(header);
        
        const actions = document.createElement('div');
        actions.className = 'filter-actions';
        
        const sortAscBtn = document.createElement('button');
        sortAscBtn.className = 'filter-action-btn';
        sortAscBtn.textContent = '升序 ↑';
        sortAscBtn.addEventListener('click', () => {
            this.sortByColumn(colIndex, 'asc');
            this.closeAllFilterDropdowns();
        });
        actions.appendChild(sortAscBtn);
        
        const sortDescBtn = document.createElement('button');
        sortDescBtn.className = 'filter-action-btn';
        sortDescBtn.textContent = '降序 ↓';
        actions.appendChild(sortDescBtn);
        sortDescBtn.addEventListener('click', () => {
            this.sortByColumn(colIndex, 'desc');
            this.closeAllFilterDropdowns();
        });
        dropdown.appendChild(actions);
        
        const filterActions = document.createElement('div');
        filterActions.className = 'filter-actions';
        
        const selectAllBtn = document.createElement('button');
        selectAllBtn.className = 'filter-action-btn';
        selectAllBtn.textContent = '全选';
        selectAllBtn.addEventListener('click', () => {
            dropdown.querySelectorAll('.filter-item input').forEach(checkbox => {
                checkbox.checked = true;
            });
        });
        filterActions.appendChild(selectAllBtn);
        
        const clearBtn = document.createElement('button');
        clearBtn.className = 'filter-action-btn';
        clearBtn.textContent = '清空';
        clearBtn.addEventListener('click', () => {
            dropdown.querySelectorAll('.filter-item input').forEach(checkbox => {
                checkbox.checked = false;
            });
        });
        filterActions.appendChild(clearBtn);
        
        const applyBtn = document.createElement('button');
        applyBtn.className = 'filter-action-btn primary';
        applyBtn.textContent = '应用';
        applyBtn.addEventListener('click', () => this.applyFilter(colIndex, dropdown));
        filterActions.appendChild(applyBtn);
        dropdown.appendChild(filterActions);
        
        const uniqueValues = this.getUniqueValuesInColumn(colIndex);
        const currentFilterValues = this.filterValues[colIndex] || new Set(uniqueValues);
        
        uniqueValues.forEach(value => {
            const item = document.createElement('div');
            item.className = 'filter-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = value;
            checkbox.checked = currentFilterValues.has(value);
            
            const label = document.createElement('span');
            label.textContent = value || '(空白)';
            
            item.appendChild(checkbox);
            item.appendChild(label);
            item.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
            });
            
            dropdown.appendChild(item);
        });
        
        document.body.appendChild(dropdown);
        
        const rect = button.getBoundingClientRect();
        dropdown.style.left = rect.left + 'px';
        dropdown.style.top = (rect.bottom + 4) + 'px';
        
        setTimeout(() => {
            document.addEventListener('click', this.closeFilterDropdownHandler = (e) => {
                if (!dropdown.contains(e.target) && e.target !== button) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', this.closeFilterDropdownHandler);
                }
            });
        }, 0);
    }

    closeAllFilterDropdowns() {
        document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        if (this.closeFilterDropdownHandler) {
            document.removeEventListener('click', this.closeFilterDropdownHandler);
            this.closeFilterDropdownHandler = null;
        }
    }

    applyFilter(colIndex, dropdown) {
        const checkedValues = new Set();
        dropdown.querySelectorAll('.filter-item input:checked').forEach(checkbox => {
            checkedValues.add(checkbox.value);
        });
        
        this.filterValues[colIndex] = checkedValues;
        this.filterEnabled[colIndex] = checkedValues.size < this.getUniqueValuesInColumn(colIndex).length || 
                                      (checkedValues.size > 0 && checkedValues.size < ROWS);
        
        this.applyAllFilters();
        this.closeAllFilterDropdowns();
        this.renderSpreadsheet();
    }

    applyAllFilters() {
        const rows = document.querySelectorAll('.row');
        rows.forEach(row => {
            const rowIndex = parseInt(row.dataset.row);
            const shouldHide = this.shouldHideRow(rowIndex);
            row.classList.toggle('hidden', shouldHide);
        });
    }

    shouldHideRow(rowIndex) {
        for (let c = 0; c < COLS; c++) {
            if (this.filterEnabled[c] && this.filterValues[c]) {
                const cellId = this.getCellId(rowIndex, c);
                const value = String(this.cells[cellId]?.displayValue || this.cells[cellId]?.value || '');
                if (!this.filterValues[c].has(value)) {
                    return true;
                }
            }
        }
        return false;
    }

    clearAllFilters() {
        this.filterEnabled = {};
        this.filterValues = {};
        this.applyAllFilters();
        this.renderSpreadsheet();
    }

    getRangeValues(startCell, endCell) {
        const start = this.parseCellId(startCell);
        const end = this.parseCellId(endCell);
        const values = [];

        for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
            for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
                const cellId = this.getCellId(r, c);
                const val = parseFloat(this.cells[cellId]?.value);
                if (!isNaN(val)) {
                    values.push(val);
                }
            }
        }
        return values;
    }

    renderCell(cellId) {
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        if (!cell || this.editingCell === cellId) return;

        const cellData = this.cells[cellId] || {};
        cell.textContent = cellData.displayValue || cellData.value || '';
        this.applyCellFormat(cellId);
    }

    applyCellFormat(cellId) {
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        if (!cell) return;

        const format = this.cells[cellId]?.format || {};
        cell.style.fontWeight = format.bold ? 'bold' : 'normal';
        cell.style.fontStyle = format.italic ? 'italic' : 'normal';
        cell.style.backgroundColor = format.bgColor || '';
    }

    setCellFormat(property, value) {
        if (!this.selectedCell) return;

        const cellId = this.selectedCell;
        if (!this.cells[cellId]) {
            this.cells[cellId] = {};
        }
        if (!this.cells[cellId].format) {
            this.cells[cellId].format = {};
        }

        const oldFormat = { ...this.cells[cellId].format };
        this.cells[cellId].format[property] = value;
        
        this.pushUndo([{
            type: 'set_format',
            cellId: cellId,
            oldFormat: oldFormat,
            newFormat: { ...this.cells[cellId].format }
        }]);

        this.applyCellFormat(cellId);
        this.updateToolbarState();

        this.sendOperation({
            type: 'set_format',
            cell_id: cellId,
            format: this.cells[cellId].format
        });
    }

    updateToolbarState() {
        const format = this.cells[this.selectedCell]?.format || {};
        document.getElementById('boldBtn').classList.toggle('active', format.bold);
        document.getElementById('italicBtn').classList.toggle('active', format.italic);
    }

    pushUndo(operations) {
        if (this.undoStack.length >= MAX_HISTORY) {
            this.undoStack.shift();
        }
        this.undoStack.push(operations);
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        
        const operations = this.undoStack.pop();
        this.redoStack.push(operations);

        const changedCells = [];
        operations.forEach(op => {
            if (op.type === 'set_value') {
                this.setCellValue(op.cellId, op.oldValue, false);
                changedCells.push(op.cellId);
            } else if (op.type === 'set_format') {
                if (!this.cells[op.cellId]) this.cells[op.cellId] = {};
                this.cells[op.cellId].format = op.oldFormat;
                this.applyCellFormat(op.cellId);
            }
        });
        
        changedCells.forEach(cellId => {
            this.recalculateDependents(cellId);
        });
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const operations = this.redoStack.pop();
        this.undoStack.push(operations);

        const changedCells = [];
        operations.forEach(op => {
            if (op.type === 'set_value') {
                this.setCellValue(op.cellId, op.newValue, false);
                changedCells.push(op.cellId);
            } else if (op.type === 'set_format') {
                if (!this.cells[op.cellId]) this.cells[op.cellId] = {};
                this.cells[op.cellId].format = op.newFormat;
                this.applyCellFormat(op.cellId);
            }
        });
        
        changedCells.forEach(cellId => {
            this.recalculateDependents(cellId);
        });
    }

    setupEventListeners() {
        document.getElementById('boldBtn').addEventListener('click', () => {
            const current = this.cells[this.selectedCell]?.format?.bold || false;
            this.setCellFormat('bold', !current);
        });

        document.getElementById('italicBtn').addEventListener('click', () => {
            const current = this.cells[this.selectedCell]?.format?.italic || false;
            this.setCellFormat('italic', !current);
        });

        document.getElementById('bgColorPicker').addEventListener('input', (e) => {
            this.setCellFormat('bgColor', e.target.value);
        });

        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());

        document.getElementById('sortAscBtn').addEventListener('click', () => {
            if (this.selectedCell) {
                const pos = this.parseCellId(this.selectedCell);
                if (pos) {
                    this.sortByColumn(pos.col, 'asc');
                }
            }
        });

        document.getElementById('sortDescBtn').addEventListener('click', () => {
            if (this.selectedCell) {
                const pos = this.parseCellId(this.selectedCell);
                if (pos) {
                    this.sortByColumn(pos.col, 'desc');
                }
            }
        });

        document.getElementById('clearSortBtn').addEventListener('click', () => {
            this.clearSort();
        });

        document.getElementById('clearFilterBtn').addEventListener('click', () => {
            this.clearAllFilters();
        });

        document.getElementById('formulaInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.selectedCell) {
                this.pushUndo([{
                    type: 'set_value',
                    cellId: this.selectedCell,
                    oldValue: this.cells[this.selectedCell]?.value || '',
                    newValue: e.target.value
                }]);
                this.setCellValue(this.selectedCell, e.target.value);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    const current = this.cells[this.selectedCell]?.format?.bold || false;
                    this.setCellFormat('bold', !current);
                } else if (e.key === 'i' || e.key === 'I') {
                    e.preventDefault();
                    const current = this.cells[this.selectedCell]?.format?.italic || false;
                    this.setCellFormat('italic', !current);
                } else if (e.key === 'z') {
                    e.preventDefault();
                    this.undo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });

        this.setupResizeHandlers();
    }

    setupResizeHandlers() {
        let isResizing = false;
        let resizeType = null;
        let resizeIndex = null;
        let startPos = 0;
        let startSize = 0;

        document.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle-col')) {
                isResizing = true;
                resizeType = 'col';
                resizeIndex = parseInt(e.target.dataset.col);
                startPos = e.clientX;
                startSize = this.columnWidths[resizeIndex] || 100;
            } else if (e.target.classList.contains('resize-handle-row')) {
                isResizing = true;
                resizeType = 'row';
                resizeIndex = parseInt(e.target.dataset.row);
                startPos = e.clientY;
                startSize = this.rowHeights[resizeIndex] || 25;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const diff = resizeType === 'col' ? e.clientX - startPos : e.clientY - startPos;
            const newSize = Math.max(30, startSize + diff);

            if (resizeType === 'col') {
                this.columnWidths[resizeIndex] = newSize;
                document.querySelectorAll(`[data-col="${resizeIndex}"]`).forEach(el => {
                    if (el.classList.contains('col-header') || el.classList.contains('cell')) {
                        el.style.width = newSize + 'px';
                    }
                });
            } else {
                this.rowHeights[resizeIndex] = newSize;
                const cells = document.querySelectorAll(`[data-row="${resizeIndex}"]`);
                cells.forEach(el => {
                    if (el.classList.contains('cell')) {
                        el.style.minHeight = newSize + 'px';
                    }
                });
                const row = cells[0]?.closest('.row');
                if (row) row.style.height = newSize + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                this.sendOperation({
                    type: resizeType === 'col' ? 'set_column_width' : 'set_row_height',
                    cell_id: resizeIndex.toString(),
                    value: resizeType === 'col' ? this.columnWidths[resizeIndex] : this.rowHeights[resizeIndex]
                });
            }
            isResizing = false;
        });
    }

    connectWebTransport() {
        const protocol = location.protocol === 'https:' ? 'https' : 'http';
        const url = `${protocol}://${location.host}/webtransport?room=default&client=${this.clientId}`;

        try {
            this.webTransport = new WebTransport(url);
            
            this.webTransport.ready.then(() => {
                this.updateConnectionStatus(true);
                this.startReceiving();
            }).catch((err) => {
                console.error('WebTransport connection failed:', err);
                this.updateConnectionStatus(false);
                setTimeout(() => this.connectWebTransport(), 3000);
            });

            this.webTransport.closed.then(() => {
                this.updateConnectionStatus(false);
                setTimeout(() => this.connectWebTransport(), 3000);
            }).catch(() => {});

        } catch (e) {
            console.error('WebTransport not supported:', e);
            this.updateConnectionStatus(false);
        }
    }

    async startReceiving() {
        const reader = this.webTransport.incomingUnidirectionalStreams.getReader();
        
        try {
            while (true) {
                const { done, value: stream } = await reader.read();
                if (done) break;

                this.handleIncomingStream(stream);
            }
        } catch (e) {
            console.error('Receive error:', e);
        }
    }

    async handleIncomingStream(stream) {
        const reader = stream.getReader();
        const chunks = [];

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            const data = new Blob(chunks);
            const text = await data.text();
            const message = JSON.parse(text);

            if (message.type === 'full_state') {
                this.applyFullState(message.state);
            } else {
                this.applyRemoteOperation(message);
            }
        } catch (e) {
            console.error('Stream handling error:', e);
        }
    }

    applyFullState(state) {
        this.cellDependencies = {};
        this.dependentsMap = {};
        
        if (state.cells) {
            for (const cellId in state.cells) {
                this.cells[cellId] = state.cells[cellId];
            }
            for (const cellId in state.cells) {
                this.calculateCell(cellId);
            }
        }
        if (state.column_widths) {
            this.columnWidths = state.column_widths;
        }
        if (state.row_heights) {
            this.rowHeights = state.row_heights;
        }
        this.renderSpreadsheet();
        for (const cellId in this.cells) {
            this.renderCell(cellId);
        }
    }

    applyRemoteOperation(op) {
        if (op.client_id === this.clientId) return;

        switch (op.type) {
            case 'set_value':
                this.cells[op.cell_id] = this.cells[op.cell_id] || {};
                const oldValue = this.cells[op.cell_id].value;
                this.cells[op.cell_id].value = op.value;
                this.calculateCell(op.cell_id);
                this.recalculateDependents(op.cell_id);
                
                const pos = this.parseCellId(op.cell_id);
                if (pos && this.sortColumn === pos.col && oldValue !== op.value) {
                    this.sortByColumn(this.sortColumn, this.sortDirection);
                }
                
                if (pos && this.filterEnabled[pos.col] && oldValue !== op.value) {
                    this.applyAllFilters();
                }
                
                this.renderCell(op.cell_id);
                break;
            case 'set_format':
                this.cells[op.cell_id] = this.cells[op.cell_id] || {};
                this.cells[op.cell_id].format = op.format;
                this.applyCellFormat(op.cell_id);
                break;
            case 'set_column_width':
                this.columnWidths[op.cell_id] = op.value;
                break;
            case 'set_row_height':
                this.rowHeights[op.cell_id] = op.value;
                break;
        }
    }

    async sendOperation(op) {
        if (!this.webTransport || !this.webTransport.ready) {
            this.pendingOps.push(op);
            return;
        }

        try {
            const stream = await this.webTransport.createBidirectionalStream();
            const writer = stream.writable.getWriter();
            
            op.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            op.client_id = this.clientId;
            op.timestamp = Date.now();

            await writer.write(new TextEncoder().encode(JSON.stringify(op)));
            await writer.close();
        } catch (e) {
            console.error('Send operation failed:', e);
            this.pendingOps.push(op);
        }
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.textContent = connected ? '已连接' : '未连接';
        statusEl.className = 'status ' + (connected ? 'connected' : 'disconnected');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new SpreadsheetApp();
});
