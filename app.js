// Categories configuration
const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Business Expenses', 'Gym', 'Travel', 'Shayna Day Care Fee', 'Other'];

const categoryEmojis = {
    'Food': 'ðŸ”', 'Transportation': 'ðŸš—', 'Entertainment': 'ðŸŽ¬', 'Shopping': 'ðŸ›ï¸', 'Bills': 'ðŸ’¡',
    'Business Expenses': 'ðŸ’¼', 'Gym': 'ðŸ‹ï¸', 'Travel': 'âœˆï¸', 'Shayna Day Care Fee': 'ðŸŽ“', 'Other': 'ðŸ“¦'
};

const categoryColors = {
    'Food': '#ef4444', 'Transportation': '#f59e0b', 'Entertainment': '#8b5cf6', 'Shopping': '#ec4899', 'Bills': '#3b82f6',
    'Business Expenses': '#6366f1', 'Gym': '#10b981', 'Travel': '#06b6d4', 'Shayna Day Care Fee': '#14b8a6', 'Other': '#6b7280'
};

const currencies = { 'USD': { symbol: '$', name: 'US Dollar' }, 'CAD': { symbol: 'C$', name: 'Canadian Dollar' } };

// Global state
let currentMonth = new Date().getMonth();
let currentYear = 2025;
let selectedCurrency = 'USD';
let monthlyIncome = 0;
let budgets = {};
let expenses = {};
let incomeData = {};
let pieChart = null;
let barChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadData();
    updateUI();
});

function initializeApp() {
    document.getElementById('month-select').value = currentMonth;
    document.getElementById('year-select').value = currentYear;
    document.getElementById('currency-select').value = selectedCurrency;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
}

function setupEventListeners() {
    document.getElementById('month-select').addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        loadData();
        updateUI();
    });
    
    document.getElementById('year-select').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        loadData();
        updateUI();
    });
    
    document.getElementById('currency-select').addEventListener('change', (e) => {
        selectedCurrency = e.target.value;
        localStorage.setItem('selected-currency', selectedCurrency);
        updateUI();
    });
    
    document.getElementById('save-income-btn').addEventListener('click', saveIncome);
    document.getElementById('save-budget-btn').addEventListener('click', saveBudget);
    
    categories.forEach(category => {
        const inputId = `budget-${category.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`;
        const input = document.getElementById(inputId);
        if (input) input.addEventListener('input', calculateBudgetTotal);
    });
    
    document.getElementById('investment-income').addEventListener('change', () => updateIncomeDisplay());
    document.getElementById('other-income').addEventListener('change', () => updateIncomeDisplay());
    
    document.getElementById('expense-form').addEventListener('submit', addExpense);
    document.getElementById('clear-form-btn').addEventListener('click', clearExpenseForm);
    document.getElementById('export-expenses-btn').addEventListener('click', exportExpensesCSV);
    document.getElementById('export-report-btn').addEventListener('click', exportMonthlyReport);
    document.getElementById('export-all-btn').addEventListener('click', exportAllData);
    document.getElementById('clear-month-btn').addEventListener('click', clearMonthData);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
}

function loadData() {
    const saved = localStorage.getItem('selected-currency');
    if (saved) selectedCurrency = saved;
    
    const budgetKey = `budget-${currentYear}-${currentMonth}`;
    const savedBudget = localStorage.getItem(budgetKey);
    budgets = savedBudget ? JSON.parse(savedBudget) : {};
    if (Object.keys(budgets).length > 0) loadBudgetInputs();
    
    const expenseKey = `expenses-${currentYear}-${currentMonth}`;
    expenses = JSON.parse(localStorage.getItem(expenseKey) || '{}');
    
    const incomeKey = `income-${currentYear}-${currentMonth}`;
    const savedIncome = localStorage.getItem(incomeKey);
    incomeData = savedIncome ? JSON.parse(savedIncome) : { '1v1': [], 'group': [], 'investment': 0, 'other': 0 };
    
    const incomeSaved = localStorage.getItem(`monthly-income-${currentYear}-${currentMonth}`);
    monthlyIncome = incomeSaved ? parseFloat(incomeSaved) : 0;
    
    loadIncomeData();
}

function saveData() {
    localStorage.setItem(`budget-${currentYear}-${currentMonth}`, JSON.stringify(budgets));
    localStorage.setItem(`expenses-${currentYear}-${currentMonth}`, JSON.stringify(expenses));
    localStorage.setItem(`income-${currentYear}-${currentMonth}`, JSON.stringify(incomeData));
    localStorage.setItem(`monthly-income-${currentYear}-${currentMonth}`, monthlyIncome);
    localStorage.setItem('selected-currency', selectedCurrency);
}

function loadBudgetInputs() {
    categories.forEach(category => {
        const inputId = `budget-${category.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`;
        const input = document.getElementById(inputId);
        if (input && budgets[category]) input.value = budgets[category];
    });
    calculateBudgetTotal();
}

function loadIncomeData() {
    const slots1v1 = document.getElementById('1v1-clients-slots');
    slots1v1.innerHTML = '';
    if (incomeData['1v1']?.length > 0) {
        incomeData['1v1'].forEach(client => addIncomeSlot('1v1', client.name, client.amount));
    } else {
        addIncomeSlot('1v1');
    }
    
    const slotsGroup = document.getElementById('group-clients-slots');
    slotsGroup.innerHTML = '';
    if (incomeData['group']?.length > 0) {
        incomeData['group'].forEach(client => addIncomeSlot('group', client.name, client.amount));
    } else {
        addIncomeSlot('group');
    }
    
    document.getElementById('investment-income').value = incomeData['investment'] || 0;
    document.getElementById('other-income').value = incomeData['other'] || 0;
    updateIncomeDisplay();
}

// Income management
function addIncomeSlot(type, name = '', amount = '') {
    const containerId = type === '1v1' ? '1v1-clients-slots' : 'group-clients-slots';
    const slot = document.createElement('div');
    slot.className = 'income-slot';
    slot.innerHTML = `
        <input type="text" placeholder="Client Name" class="income-client-name" value="${name}">
        <div class="currency-input-wrapper"><input type="number" placeholder="Amount" class="income-amount currency-input" min="0" step="0.01" value="${amount}"></div>
        <button class="btn btn-sm btn-danger-outline delete-income-btn" onclick="deleteIncomeSlot(this, '${type}')">Delete</button>
    `;
    
    const inputs = slot.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', updateIncomeDisplay);
        input.addEventListener('change', saveIncomeData);
    });
    
    document.getElementById(containerId).appendChild(slot);
}

function deleteIncomeSlot(button, type) {
    button.closest('.income-slot').remove();
    updateIncomeDisplay();
}

function saveIncomeData() {
    const slots1v1 = document.querySelectorAll('#1v1-clients-slots .income-slot');
    incomeData['1v1'] = Array.from(slots1v1).map(slot => ({
        name: slot.querySelector('.income-client-name').value,
        amount: parseFloat(slot.querySelector('.income-amount').value) || 0
    }));
    
    const slotsGroup = document.querySelectorAll('#group-clients-slots .income-slot');
    incomeData['group'] = Array.from(slotsGroup).map(slot => ({
        name: slot.querySelector('.income-client-name').value,
        amount: parseFloat(slot.querySelector('.income-amount').value) || 0
    }));
    
    incomeData['investment'] = parseFloat(document.getElementById('investment-income').value) || 0;
    incomeData['other'] = parseFloat(document.getElementById('other-income').value) || 0;
    saveData();
}

function updateIncomeDisplay() {
    saveIncomeData();
    document.getElementById('total-1v1').textContent = formatCurrency(incomeData['1v1'].reduce((s, c) => s + c.amount, 0));
    document.getElementById('total-group').textContent = formatCurrency(incomeData['group'].reduce((s, c) => s + c.amount, 0));
    document.getElementById('total-investment').textContent = formatCurrency(incomeData['investment']);
    document.getElementById('total-other').textContent = formatCurrency(incomeData['other']);
    
    const grandTotal = incomeData['1v1'].reduce((s, c) => s + c.amount, 0) + incomeData['group'].reduce((s, c) => s + c.amount, 0) + incomeData['investment'] + incomeData['other'];
    document.getElementById('grand-total-income').textContent = `Total Monthly Income: ${formatCurrency(grandTotal)}`;
    updateUI();
}

// Income (legacy)
function saveIncome() {
    const value = parseFloat(document.getElementById('monthly-income').value);
    if (isNaN(value) || value < 0) {
        showAlert('Please enter a valid income amount', 'error');
        return;
    }
    monthlyIncome = value;
    saveData();
    updateUI();
    showAlert('Income saved successfully!', 'success');
}

// Budget
function calculateBudgetTotal() {
    let total = 0;
    categories.forEach(category => {
        const inputId = `budget-${category.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`;
        const input = document.getElementById(inputId);
        if (input?.value) total += parseFloat(input.value) || 0;
    });
    document.getElementById('total-budget').textContent = formatCurrency(total);
}

function saveBudget() {
    budgets = {};
    let hasValue = false;
    categories.forEach(category => {
        const inputId = `budget-${category.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`;
        const input = document.getElementById(inputId);
        if (input?.value) {
            budgets[category] = parseFloat(input.value) || 0;
            hasValue = true;
        }
    });
    
    if (!hasValue) {
        showAlert('Please enter at least one budget amount', 'error');
        return;
    }
    
    saveData();
    updateUI();
    const msg = document.getElementById('budget-success-msg');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 3000);
    showAlert('Budget saved successfully!', 'success');
}

// Expenses
function addExpense(e) {
    e.preventDefault();
    const date = document.getElementById('expense-date').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value;
    
    if (!date || !amount || !category) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    if (!expenses[category]) expenses[category] = [];
    expenses[category].push({ id: Date.now(), date, amount, category, description });
    saveData();
    updateUI();
    clearExpenseForm();
    showAlert('Expense added successfully!', 'success');
}

function deleteExpense(category, expenseId) {
    if (confirm('Delete this expense?')) {
        expenses[category] = expenses[category].filter(exp => exp.id !== expenseId);
        if (expenses[category].length === 0) delete expenses[category];
        saveData();
        updateUI();
        showAlert('Expense deleted!', 'success');
    }
}

function clearExpenseForm() {
    document.getElementById('expense-form').reset();
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
}

// UI Updates
function updateUI() {
    updateOverview();
    updateExpensesList();
    updateDashboard();
    updateCharts();
}

function getTotalIncome() {
    return (incomeData['1v1']?.reduce((s, c) => s + c.amount, 0) || 0) + 
           (incomeData['group']?.reduce((s, c) => s + c.amount, 0) || 0) + 
           (incomeData['investment'] || 0) + (incomeData['other'] || 0) + monthlyIncome;
}

function getTotalExpenses() {
    let total = 0;
    Object.values(expenses).forEach(cats => cats.forEach(exp => total += exp.amount));
    return total;
}

function updateOverview() {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const netCashflow = totalIncome - totalExpenses;
    const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
    
    document.getElementById('overview-total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('net-cashflow').textContent = formatCurrency(netCashflow);
    
    const status = document.getElementById('cashflow-status');
    if (netCashflow > 0) status.textContent = 'âœ“ Positive';
    else if (netCashflow < 0) status.textContent = 'âš  Negative';
    else status.textContent = 'âˆ’ Break even';
    
    if (totalBudget > 0) {
        const pct = Math.round((totalExpenses / totalBudget) * 100);
        document.getElementById('budget-overview-percentage').textContent = `${pct}%`;
        const card = document.getElementById('budget-overview-card');
        card.style.background = pct > 100 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 
                                pct > 80 ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' : 
                                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    }
}

function updateExpensesList() {
    const list = document.getElementById('expenses-list');
    const all = [];
    Object.keys(expenses).forEach(cat => {
        expenses[cat].forEach(exp => all.push({ ...exp, category: cat }));
    });
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = all.length ? all.map(exp => `
        <div class="expense-item">
            <div class="expense-details">
                <div class="expense-category">${categoryEmojis[exp.category]} ${exp.category}</div>
                ${exp.description ? `<div class="expense-description">${exp.description}</div>` : ''}
                <div class="expense-date">${new Date(exp.date).toLocaleDateString()}</div>
            </div>
            <div class="expense-amount">${formatCurrency(exp.amount)}</div>
            <button class="delete-btn" onclick="deleteExpense('${exp.category}', ${exp.id})">Delete</button>
        </div>
    `).join('') : '<p class="empty-state">No expenses yet!</p>';
}

function updateDashboard() {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
    const remaining = totalBudget - totalExpenses;
    
    document.getElementById('total-inflow').textContent = formatCurrency(totalIncome);
    document.getElementById('total-outflow').textContent = formatCurrency(totalExpenses);
    document.getElementById('total-spent').textContent = formatCurrency(totalExpenses);
    document.getElementById('remaining-budget').textContent = formatCurrency(remaining);
    
    const card = document.getElementById('budget-status-card');
    const icon = document.getElementById('status-icon');
    const status = document.getElementById('budget-status');
    const pct = document.getElementById('budget-percentage');
    
    if (totalBudget === 0) {
        status.textContent = 'Not Set';
        pct.textContent = '0%';
        icon.textContent = 'âˆ’';
        card.className = 'summary-card status-card';
    } else {
        const p = Math.round((totalExpenses / totalBudget) * 100);
        pct.textContent = `${p}%`;
        if (p > 100) {
            status.textContent = 'Over';
            icon.textContent = 'âš ';
            card.className = 'summary-card status-card over-budget';
        } else if (p > 80) {
            status.textContent = 'Warning';
            icon.textContent = '!';
            card.className = 'summary-card status-card';
            card.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
        } else {
            status.textContent = 'On Track';
            icon.textContent = 'âœ“';
            card.className = 'summary-card status-card on-track';
        }
    }
    
    updateCategoryBreakdown();
    updateProgressBars();
}

function updateCategoryBreakdown() {
    const tbody = document.getElementById('breakdown-tbody');
    const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
    
    if (totalBudget === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Set budget to see breakdown</td></tr>';
        return;
    }
    
    tbody.innerHTML = categories.map(cat => {
        const budget = budgets[cat] || 0;
        const spent = (expenses[cat] || []).reduce((s, e) => s + e.amount, 0);
        const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        let statusClass = 'on-track', statusText = 'On Track';
        if (pct > 100) { statusClass = 'over'; statusText = 'Over'; }
        else if (pct > 80) { statusClass = 'warning'; statusText = 'Warning'; }
        
        return `<tr>
            <td>${categoryEmojis[cat]} ${cat}</td>
            <td>${formatCurrency(budget)}</td>
            <td>${formatCurrency(spent)}</td>
            <td>${formatCurrency(budget - spent)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        </tr>`;
    }).join('');
}

function updateProgressBars() {
    const bars = document.getElementById('progress-bars');
    const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
    
    if (totalBudget === 0) {
        bars.innerHTML = '<p class="empty-state">Set budget to see progress</p>';
        return;
    }
    
    bars.innerHTML = categories.map(cat => {
        const budget = budgets[cat] || 0;
        const spent = (expenses[cat] || []).reduce((s, e) => s + e.amount, 0);
        const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
        let cls = 'on-track';
        if (spent > budget) cls = 'over';
        else if (pct > 80) cls = 'warning';
        
        return `<div class="progress-item">
            <div class="progress-header">
                <span class="progress-label">${categoryEmojis[cat]} ${cat}</span>
                <span class="progress-value">${formatCurrency(spent)} / ${formatCurrency(budget)}</span>
            </div>
            <div class="progress-bar-container"><div class="progress-bar ${cls}" style="width: ${pct}%"></div></div>
        </div>`;
    }).join('');
}

function updateCharts() {
    updatePieChart();
    updateBarChart();
}

function updatePieChart() {
    const ctx = document.getElementById('pie-chart').getContext('2d');
    const data = categories.map(c => (expenses[c] || []).reduce((s, e) => s + e.amount, 0)).filter(v => v > 0);
    const labels = categories.filter(c => (expenses[c] || []).reduce((s, e) => s + e.amount, 0) > 0);
    const colors = labels.map(l => categoryColors[l]);
    
    if (pieChart) pieChart.destroy();
    if (data.length === 0) return;
    
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.map(l => `${categoryEmojis[l]} ${l}`),
            datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: c => c.label + ': ' + formatCurrency(c.parsed) } }
            }
        }
    });
}

function updateBarChart() {
    const ctx = document.getElementById('bar-chart').getContext('2d');
    const budgetData = categories.map(c => budgets[c] || 0);
    const spentData = categories.map(c => (expenses[c] || []).reduce((s, e) => s + e.amount, 0));
    
    if (barChart) barChart.destroy();
    
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.map(c => `${categoryEmojis[c]} ${c}`),
            datasets: [
                { label: 'Budget', data: budgetData, backgroundColor: 'rgba(99, 102, 241, 0.7)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 2 },
                { label: 'Spent', data: spentData, backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 2 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: v => formatCurrencySymbol() + v.toLocaleString() } } },
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: c => c.dataset.label + ': ' + formatCurrency(c.parsed.y) } }
            }
        }
    });
}

// Export
function exportExpensesCSV() {
    const all = [];
    Object.keys(expenses).forEach(cat => expenses[cat].forEach(exp => all.push({ Date: exp.date, Category: cat, Amount: exp.amount, Description: exp.description || '', Currency: selectedCurrency })));
    if (all.length === 0) {
        showAlert('No expenses to export', 'warning');
        return;
    }
    downloadCSV(convertToCSV(all), `expenses_${currentYear}_${currentMonth}.csv`);
    showAlert('Exported!', 'success');
}

function exportMonthlyReport() {
    const data = categories.map(cat => {
        const budget = budgets[cat] || 0;
        const spent = (expenses[cat] || []).reduce((s, e) => s + e.amount, 0);
        return { Category: cat, Budget: budget, Spent: spent, Remaining: budget - spent, Status: spent > budget ? 'Over' : 'OK', Currency: selectedCurrency };
    });
    downloadCSV(convertToCSV(data), `report_${currentYear}_${currentMonth}.csv`);
    showAlert('Report exported!', 'success');
}

function exportAllData() {
    const data = { income: incomeData, budgets: {}, expenses: {}, currency: selectedCurrency };
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('budget-')) data.budgets[key] = JSON.parse(localStorage.getItem(key));
        if (key.startsWith('expenses-')) data.expenses[key] = JSON.parse(localStorage.getItem(key));
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showAlert('Backup downloaded!', 'success');
}

// Clear
function clearMonthData() {
    if (confirm('Clear month data?')) {
        expenses = {};
        saveData();
        updateUI();
        showAlert('Month cleared!', 'success');
    }
}

function clearAllData() {
    if (confirm('Clear ALL data?') && confirm('Are you absolutely sure?')) {
        localStorage.clear();
        expenses = budgets = incomeData = {};
        monthlyIncome = 0;
        categories.forEach(cat => {
            const id = `budget-${cat.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`;
            const inp = document.getElementById(id);
            if (inp) inp.value = '';
        });
        updateUI();
        showAlert('All data cleared!', 'success');
    }
}

// Utilities
function formatCurrencySymbol() {
    return currencies[selectedCurrency].symbol;
}

function formatCurrency(amount) {
    return formatCurrencySymbol() + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function showAlert(msg, type = 'info') {
    const cont = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = msg;
    cont.appendChild(alert);
    setTimeout(() => { alert.style.opacity = '0'; setTimeout(() => alert.remove(), 300); }, 3000);
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];
    data.forEach(row => {
        const vals = headers.map(h => typeof row[h] === 'string' ? `"${row[h]}"` : row[h]);
        rows.push(vals.join(','));
    });
    return rows.join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

