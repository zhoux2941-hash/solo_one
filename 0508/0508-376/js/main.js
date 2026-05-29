import { validateAndBalance } from './utils/equationBalancer.js';
import { getElementInfo, searchElements, getPeriodicTable, equationTemplates } from './data/elements.js';
import { getBalanceMatrix } from './utils/equationParser.js';

let currentSteps = [];

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupBalancer();
    setupPeriodicTable();
    setupTemplates();
});

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            if (targetTab === 'matrix' && currentSteps.length > 0) {
                displayMatrixSteps(currentSteps);
            }
        });
    });
}

function setupBalancer() {
    const input = document.getElementById('equation-input');
    const balanceBtn = document.getElementById('balance-btn');
    
    balanceBtn.addEventListener('click', () => {
        const equation = input.value.trim();
        
        if (!equation) {
            alert('请输入化学方程式');
            return;
        }
        
        const result = validateAndBalance(equation);
        
        if (!result.success) {
            alert(result.error);
            return;
        }
        
        document.getElementById('original-equation').textContent = '原始方程式: ' + equation;
        document.getElementById('balanced-equation').textContent = '配平结果: ' + result.balancedEquation;
        
        displayBalanceSteps(result);
        currentSteps = result.steps;
    });
}

function displayBalanceSteps(result) {
    const stepsDiv = document.getElementById('balance-steps');
    const reactionType = result.reactionType || { name: '未知', description: '' };
    
    stepsDiv.innerHTML = `
        <h4>配平步骤</h4>
        <div class="steps-list">
            <li><strong>系数:</strong> ${result.coefficients.join(', ')}</li>
            <li><strong>验证:</strong> ${result.verified ? '✓ 配平正确' : '✗ 配平失败'}</li>
            <li><strong>反应类型:</strong> ${reactionType.name}${reactionType.description ? ' - ' + reactionType.description : ''}</li>
        </div>
        <h4>元素守恒验证</h4>
        <div class="steps-list">
            ${Object.entries(result.elementCounts).map(([element, counts]) => 
                `<li><strong>${element}:</strong> 左边=${counts.left}, 右边=${counts.right} ${counts.balanced ? '✓' : '✗'}</li>`
            ).join('')}
        </div>
    `;
}

function displayMatrixSteps(steps) {
    const matrixDiv = document.getElementById('augmented-matrix');
    const stepsDiv = document.getElementById('row-operations');
    const solutionDiv = document.getElementById('final-solution');
    
    if (steps.length === 0) {
        matrixDiv.innerHTML = '<p>请先配平一个方程式</p>';
        stepsDiv.innerHTML = '';
        solutionDiv.innerHTML = '';
        return;
    }
    
    const firstStep = steps[0];
    matrixDiv.innerHTML = `
        <h4>增广矩阵</h4>
        ${renderMatrix(firstStep.matrix)}
    `;
    
    stepsDiv.innerHTML = `
        <h4>行变换步骤</h4>
        <ol class="steps-list">
            ${steps.slice(1).map((step, i) => 
                `<li><strong>步骤 ${i + 1}:</strong> ${step.description}</li>`
            ).join('')}
        </ol>
    `;
    
    solutionDiv.innerHTML = `
        <h4>最终解</h4>
        <p>行阶梯形矩阵:</p>
        ${renderMatrix(steps[steps.length - 1].matrix)}
    `;
}

function renderMatrix(matrix) {
    return `
        <table class="matrix-table">
            ${matrix.map(row => `
                <tr>${row.map(cell => `<td>${cell.toFixed(2)}</td>`).join('')}</tr>
            `).join('')}
        </table>
    `;
}

function setupPeriodicTable() {
    const searchInput = document.getElementById('element-search');
    const searchBtn = document.getElementById('search-btn');
    const elementInfo = document.getElementById('element-info');
    const periodicTable = document.getElementById('periodic-table');
    
    const table = getPeriodicTable();
    periodicTable.innerHTML = table.map(element => 
        `<div class="element-cell ${element.category}" data-symbol="${element.symbol}">
            <div>${element.symbol}</div>
            <div style="font-size: 0.6rem;">${element.atomicNumber}</div>
        </div>`
    ).join('');
    
    document.querySelectorAll('.element-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const symbol = cell.dataset.symbol;
            const info = getElementInfo(symbol);
            displayElementInfo(info);
        });
    });
    
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (!query) return;
        
        const results = searchElements(query);
        
        if (results.length === 0) {
            elementInfo.innerHTML = '<p>未找到匹配的元素</p>';
            elementInfo.classList.add('visible');
            return;
        }
        
        displayElementInfo(results[0]);
    });
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}

function displayElementInfo(info) {
    const elementInfo = document.getElementById('element-info');
    
    if (!info) {
        elementInfo.innerHTML = '<p>未找到元素信息</p>';
        elementInfo.classList.add('visible');
        return;
    }
    
    elementInfo.innerHTML = `
        <h3>${info.symbol} - ${info.name}</h3>
        <p><strong>原子序数:</strong> ${info.atomicNumber}</p>
        <p><strong>原子量:</strong> ${info.atomicWeight}</p>
        <p><strong>类别:</strong> ${getCategoryName(info.category)}</p>
    `;
    elementInfo.classList.add('visible');
}

function getCategoryName(category) {
    const names = {
        h: '氢元素',
        alkali: '碱金属',
        alkaline: '碱土金属',
        transition: '过渡金属',
        lanthanide: '镧系元素',
        actinide: '锕系元素',
        metalloid: '类金属',
        nonmetal: '非金属',
        halogen: '卤素',
        noble: '稀有气体'
    };
    return names[category] || category;
}

function setupTemplates() {
    const catButtons = document.querySelectorAll('.cat-btn');
    const templateList = document.getElementById('template-list');
    const templatePreview = document.getElementById('template-preview');
    
    let currentCategory = 'combustion';
    renderTemplates(currentCategory);
    
    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            currentCategory = category;
            
            catButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            renderTemplates(category);
        });
    });
    
    function renderTemplates(category) {
        const templates = equationTemplates[category];
        
        templateList.innerHTML = templates.map((template, index) => `
            <div class="template-item" data-index="${index}">
                <strong>${template.name}</strong>
                <p style="font-size: 0.9rem; color: #666;">${template.description}</p>
            </div>
        `).join('');
        
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                const template = templates[index];
                
                templatePreview.innerHTML = `
                    <h4>${template.name}</h4>
                    <p><strong>方程式:</strong> ${template.equation}</p>
                    <p><strong>描述:</strong> ${template.description}</p>
                `;
                
                document.getElementById('equation-input').value = template.equation;
            });
        });
    }
}