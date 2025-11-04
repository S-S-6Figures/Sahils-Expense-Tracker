// Categories
const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other', 'Business Expenses', 'Gym', 'Travel', 'Shayna Day Care Fee'];

const categoryEmojis = {
    'Food': 'ðŸ”', 'Transportation': 'ðŸš—', 'Entertainment': 'ðŸŽ¬', 'Shopping': 'ðŸ›ï¸', 'Bills': 'ðŸ’¡',
    'Other': 'ðŸ“¦', 'Business Expenses': 'ðŸ’¼', 'Gym': 'ðŸ‹ï¸', 'Travel': 'âœˆï¸', 'Shayna Day Care Fee': 'ðŸŽ“'
};

const categoryColors = {
    'Food': '#ef4444', 'Transportation': '#f59e0b', 'Entertainment': '#8b5cf6', 'Shopping': '#ec4899', 'Bills': '#3b82f6',
    'Other': '#6b7280', 'Business Expenses': '#6366f1', 'Gym': '#10b981', 'Travel': '#06b6d4', 'Shayna Day Care Fee': '#14b8a6'
};

const currencies = { 'USD': '$', 'CAD': 'C$' };

// State
let currentMonth = new Date().getMonth();
let currentYear = 2025;
let selectedCurrency = 'USD';
let monthlyIncome = 0;
let budgets = {};
let expenses = {};
let incomeData = { oneToOne: [], group: [], investment: 0, other: 0 };
let pieChart = null;
let barChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadData();
    updateAllDisplays();
});

function initializeApp() {
    document.getElementById('month-select').value = currentMonth;
    document.getElementById('year-select').value = currentYear;
    document.getElementById('currency-select').value = selectedCurrency;
    document.getElementById('expense-date').valueAsDate = new Date();
}

function setupEventListeners() {
    document.getElementById('month-select').addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        loadData();
        updateAllDisplays();
    });
    
    document.getElementById('year-select').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        loadData();
        updateAllDisplays();
    });
    
    document.getElementById('currency-select').addEventListener('change', (e) => {
        selectedCurrency = e.target.value;
        localStorage.setItem('currency', selectedCurrency);
        updateAllDisplays();
    });
    
    document.getElementById('save-income-btn').addEventListener('click', saveMonthlyIncome);
    document.getElementById('save-budget-btn').addEventListener('click', saveBudget);
    document.getElementById('expense-form').addEventListener('submit', addExpense);
    document.getElementById('clear-form-btn').addEventListener('click', clearForm);
    document.getElementById('export-expenses-btn').addEventListener('click', () => exportExpenses());
    document.getElementById('export-report-btn').addEventListener('click', () => exportReport());
    document.getElementById('export-all-btn').addEventListener('click', () => exportAll());
    document.getElementById('clear-month-btn').addEventListener('click', () => clearMonth());
    document.getElementById('clear-all-btn').addEventListener('click', () => clearAllData());
    
    document.getElementById('add-one-to-one-btn').addEventListener('click', addOneToOneRow);
    document.getElementById('add-group-btn').addEventListener('click', addGroupRow);
    
    document.getElementById('investment-income').addEventListener('change', updateIncomeDisplay);
    document.getElementById('other-income').addEventListener('change', updateIncomeDisplay);
    
    categories.forEach(cat => {
        const id = `budget-${cat.toLowerCase().replace(/\s+/g, '-')}`;
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', updateBudgetTotal);
    });
}

function loadData() {
    const currency = localStorage.getItem('currency');
    if (currency) selectedCurrency = currency;
    
    const budgetKey = `budget-${currentYear}-${currentMonth}`;
    budgets = JSON.parse(localStorage.getItem(budgetKey) || '{}');
    loadBudgetInputs();
    
    const expenseKey = `expense-${currentYear}-${currentMonth}`;
    expenses = JSON.parse(localStorage.getItem(expenseKey) || '{}');
    
    const incomeKey = `income-${currentYear}-${currentMonth}`;
    incomeData = JSON.parse(localStorage.getItem(incomeKey) || '{"oneToOne":[],"group":[],"investment":0,"other":0}');
    
    monthlyIncome = parseFloat(localStorage.getItem(`monthly-income-${currentYear}-${currentMonth}`) || '0');
    document.getElementById('monthly-income').value = monthlyIncome || '';
    
    // Render income rows
    renderIncomeRows();
    updateIncomeDisplay();
}

function saveData() {
    localStorage.setItem(`budget-${currentYear}-${currentMonth}`, JSON.stringify(budgets));
    localStorage.setItem(`expense-${currentYear}-${currentMonth}`, JSON.stringify(expenses));
    localStorage.setItem(`income-${currentYear}-${currentMonth}`, JSON.stringify(incomeData));
    localStorage.setItem(`monthly-income-${currentYear}-${currentMonth}`, monthlyIncome);
}

function loadBudgetInputs() {
    categories.forEach(cat => {
        const id = `budget-${cat.toLowerCase().replace(/\s+/g, '-')}`;
        const input = document.getElementById(id);
        if (input && budgets[cat]) input.value = budgets[cat];
    });
    updateBudgetTotal();
}

// Income Functions
function renderIncomeRows() {
    // Render 1:1 Clients
    const oneToOneContainer = document.getElementById('one-to-one-list');
    oneToOneContainer.innerHTML = '';
    
    if (incomeData.oneToOne.length === 0) {
        addOneToOneRow();
    } else {
        incomeData.oneToOne.forEach(client => {
            addOneToOneRow(client.name, client.amount);
        });
    }
    
    // Render Group Clients
    const groupContainer = document.getElementById('group-list');
    groupContainer.innerHTML = '';
    
    if (incomeData.group.length === 0) {
        addGroupRow();
    } else {
        incomeData.group.forEach(client => {
            addGroupRow(client.name, client.amount);
        });
    }
}

function addOneToOneRow(name = '', amount = '') {
    const container = document.getElementById('one-to-one-list');
    const row = document.createElement('div');
    row.className = 'client-row';
    row.innerHTML = `
        <input type="text" placeholder="Client Name" class="one-to-one-name" value="${name}">
        <input type="number" placeholder="Amount" class="one-to-one-amount currency-input" min="0" step="0.01" value="${amount}">
        <button type="button" class="delete-client-btn" onclick="removeRow(this)">Delete</button>
    `;
    row.querySelectorAll('input').forEach(inp => inp.addEventListener('change', updateIncomeDisplay));
    container.appendChild(row);
}

function addGroupRow(name = '', amount = '') {
    const container = document.getElementById('group-list');
    const row = document.createElement('div');
    row.className = 'client-row';
    row.innerHTML = `
        <input type="text" placeholder="Client Name" class="group-name" value="${name}">
        <input type="number" placeholder="Amount" class="group-amount currency-input" min="0" step="0.01" value="${amount}">
        <button type="button" class="delete-client-btn" onclick="removeRow(this)">Delete</button>
    `;
    row.querySelectorAll('input').forEach(inp => inp.addEventListener('change', updateIncomeDisplay));
    container.appendChild(row);
}

function removeRow(btn) {
    btn.closest('.client-row').remove();
    updateIncomeDisplay();
}

function updateIncomeDisplay() {
    // 1:1 Clients
    const oneToOneInputs = document.querySelectorAll('#one-to-one-list .client-row');
    incomeData.oneToOne = Array.from(oneToOneInputs).map(row => ({
        name: row.querySelector('.one-to-one-name').value,
        amount: parseFloat(row.querySelector('.one-to-one-amount').value) || 0
    }));
    const oneToOneTotal = incomeData.oneToOne.reduce((sum, item) => sum + item.amount, 0);
    document.getElementById('one-to-one-total').textContent = formatCurrency(oneToOneTotal);
    
    // Group Clients
    const groupInputs = document.querySelectorAll('#group-list .client-row');
    incomeData.group = Array.from(groupInputs).map(row => ({
        name: row.querySelector('.group-name').value,
        amount: parseFloat(row.querySelector('.group-amount').value) || 0
    }));
    const groupTotal = incomeData.group.reduce((sum, item) => sum + item.amount, 0);
    document.getElementById('group-total').textContent = formatCurrency(groupTotal);
    
    // Investment & Other
    incomeData.investment = parseFloat(document.getElementById('investment-income').value) || 0;
    incomeData.other = parseFloat(document.getElementById('other-income').value) || 0;
    
    // Grand Total
    const grandTotal = oneToOneTotal + groupTotal + incomeData.investment + incomeData.other;
    document.getElementById('grand-total-income').innerHTML = `<span>ðŸ’° GRAND TOTAL INCOME</span><span>${formatCurrency(grandTotal)}</span>`;
    
    saveData();
    updateAllDisplays();
}

function saveMonthlyIncome() {
    monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 0;
    if (monthlyIncome < 0) {
        showAlert('Please enter a valid amount', 'error');
        return;
    }
    saveData();
    updateAllDisplays();
    showAlert('Monthly income saved!', 'success');
}

function updateBudgetTotal() {
    let total = 0;
    categories.forEach(cat => {
        const id = `budget-${cat.toLowerCase().replace(/\s+/g, '-')}`;
        const input = document.getElementById(id);
        if (input?.value) total += parseFloat(input.value) || 0;
    });
    document.getElementById('total-budget').textContent = formatCurrency(total);
}

function saveBudget() {
    budgets = {};
    categories.forEach(cat => {
        const id = `budget-${cat.toLowerCase().replace(/\s+/g, '-')}`;
        const input = document.getElementById(id);
        if (input?.value) budgets[cat] = parseFloat(input.value) || 0;
    });
    if (Object.keys(budgets).length === 0) {
        showAlert('Please enter at least one budget', 'error');
        return;
    }
    saveData();
    updateAllDisplays();
    document.getElementById('budget-success-msg').classList.add('show');
    setTimeout(() => document.getElementById('budget-success-msg').classList.remove('show'), 3000);
    showAlert('Budget saved!', 'success');
}

// Expenses
function addExpense(e) {
    e.preventDefault();
    const date = document.getElementById('expense-date').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value;
    
    if (!date || !amount || !category) {
        showAlert('Please fill all required fields', 'error');
        return;
    }
    
    if (!expenses[category]) expenses[category] = [];
    expenses[category].push({ id: Date.now(), date, amount, description });
    saveData();
    updateAllDisplays();
    clearForm();
    showAlert('Expense added!', 'success');
}

function clearForm() {
    document.getElementById('expense-form').reset();
    document.getElementById('expense-date').valueAsDate = new Date();
}

// Display Functions
function updateAllDisplays() {
    updateOverviewCards();
    updateExpensesList();
    updateDashboard();
    updateCharts();
}

function getTotalIncome() {
    const oneToOne = document.querySelectorAll('#one-to-one-list .one-to-one-amount');
    const group = document.querySelectorAll('#group-list .group-amount');
    const oneToOneSum = Array.from(oneToOne).reduce((sum, inp) => sum + (parseFloat(inp.value) || 0), 0);
    const groupSum = Array.from(group).reduce((sum, inp) => sum + (parseFloat(inp.value) || 0), 0);
    const investment = parseFloat(document.getElementById('investment-income').value) || 0;
    const other = parseFloat(document.getElementById('other-income').value) || 0;
    return monthlyIncome + oneToOneSum + groupSum + investment + other;
}

function getTotalExpenses() {
    let total = 0;
    Object.values(expenses).forEach(cats => cats.forEach(exp => total += exp.amount));
    return total;
}

function updateOverviewCards() {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const netCashflow = totalIncome - totalExpenses;
    const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
    
    document.getElementById('income-display').textContent = formatCurrency(totalIncome);
    document.getElementById('overview-total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('net-cashflow').textContent = formatCurrency(netCashflow);
    
    const status = document.getElementById('cashflow-status');
    if (netCashflow > 0) status.textContent = 'âœ“ Positive';
    else if (netCashflow < 0) status.textContent = 'âš  Negative';
    else status.textContent = '= Break Even';
    
    if (totalBudget > 0) {
        const pct = Math.round((totalExpenses / totalBudget) * 100);
        document.getElementById('budget-overview-percentage').textContent = `${pct}%`;
    }
}

function updateExpensesList() {
    const list = document.getElementById('expenses-list');
    const allExpenses = [];
    Object.entries(expenses).forEach(([cat, items]) => {
        items.forEach(item => allExpenses.push({ ...item, category: cat }));
    });
    allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = allExpenses.length ? allExpenses.map(exp => `
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

function deleteExpense(cat, id) {
    expenses[cat] = expenses[cat].filter(e => e.id !== id);
    if (expenses[cat].length === 0) delete expenses[cat];
    saveData();
    updateAllDisplays();
}

function updateDashboard() {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
    const remaining = totalBudget - totalExpenses;
    
    document.getElementById('total-cash-inflow').textContent = formatCurrency(totalIncome);
    document.getElementById('total-cash-outflow').textContent = formatCurrency(totalExpenses);
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
            scales: { y: { beginAtZero: true } },
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: c => c.dataset.label + ': ' + formatCurrency(c.parsed.y) } }
            }
        }
    });
}

// Export & Clear
function exportExpenses() {
    const all = [];
    Object.entries(expenses).forEach(([cat, items]) => {
        items.forEach(item => all.push({ Date: item.date, Category: cat, Amount: item.amount, Description: item.description || '' }));
    });
    if (all.length === 0) { showAlert('No expenses to export', 'warning'); return; }
    downloadCSV(convertToCSV(all), `expenses_${currentYear}_${currentMonth}.csv`);
}

function exportReport() {
    const data = categories.map(cat => ({
        Category: cat,
        Budget: budgets[cat] || 0,
        Spent: (expenses[cat] || []).reduce((s, e) => s + e.amount, 0),
        Remaining: (budgets[cat] || 0) - ((expenses[cat] || []).reduce((s, e) => s + e.amount, 0))
    }));
    downloadCSV(convertToCSV(data), `report_${currentYear}_${currentMonth}.csv`);
}

function exportAll() {
    const data = { income: incomeData, budgets, expenses, currency: selectedCurrency };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function clearMonth() {
    if (confirm('Clear this month data?')) {
        expenses = {};
        saveData();
        updateAllDisplays();
        showAlert('Month cleared!', 'success');
    }
}

function clearAllData() {
    if (confirm('Clear ALL data?') && confirm('Are you sure?')) {
        localStorage.clear();
        expenses = budgets = incomeData = {};
        monthlyIncome = 0;
        location.reload();
    }
}

// Utilities
function formatCurrency(amount) {
    const symbol = currencies[selectedCurrency];
    return symbol + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function showAlert(msg, type) {
    const cont = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = msg;
    cont.appendChild(alert);
    setTimeout(() => { alert.style.opacity = '0'; setTimeout(() => alert.remove(), 300); }, 3000);
}

function convertToCSV(data) {
    if (!data.length) return '';
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

