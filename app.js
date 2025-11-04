const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other', 'Business Expenses', 'Gym', 'Travel', 'Shayna Day Care Fee'];
const currencies = { 'USD': '$', 'CAD': 'C$' };

let currentMonth = new Date().getMonth();
let currentYear = 2025;
let selectedCurrency = 'USD';
let monthlyIncome = 0;
let budgets = {};
let expenses = {};
let oneToOneClients = [];
let groupClients = [];
let investmentIncome = 0;
let otherIncome = 0;
let pieChart = null;
let barChart = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setDefaultDate();
    setupEventListeners();
    loadData();
    displayIncomeRows();
    updateAllDisplays();
}

function setDefaultDate() {
    const today = new Date();
    const dateString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('expense-date').value = dateString;
    document.getElementById('month-select').value = currentMonth;
    document.getElementById('year-select').value = currentYear;
}

function setupEventListeners() {
    document.getElementById('month-select').addEventListener('change', function(e) {
        currentMonth = parseInt(e.target.value);
        loadData();
        displayIncomeRows();
        updateAllDisplays();
    });

    document.getElementById('year-select').addEventListener('change', function(e) {
        currentYear = parseInt(e.target.value);
        loadData();
        displayIncomeRows();
        updateAllDisplays();
    });

    document.getElementById('currency-select').addEventListener('change', function(e) {
        selectedCurrency = e.target.value;
        localStorage.setItem('currency', selectedCurrency);
        updateAllDisplays();
    });

    document.getElementById('save-income-btn').addEventListener('click', saveMonthlyIncome);
    document.getElementById('save-budget-btn').addEventListener('click', saveBudget);
    document.getElementById('expense-form').addEventListener('submit', addExpense);
    document.getElementById('clear-form-btn').addEventListener('click', clearForm);
    document.getElementById('export-expenses-btn').addEventListener('click', exportExpenses);
    document.getElementById('export-report-btn').addEventListener('click', exportReport);
    document.getElementById('export-all-btn').addEventListener('click', exportAll);
    document.getElementById('clear-month-btn').addEventListener('click', clearMonth);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
    document.getElementById('add-one-to-one-btn').addEventListener('click', addOneToOneClient);
    document.getElementById('add-group-btn').addEventListener('click', addGroupClient);
    
    document.getElementById('investment-income').addEventListener('change', updateIncomeDisplay);
    document.getElementById('investment-income').addEventListener('input', updateIncomeDisplay);
    document.getElementById('other-income').addEventListener('change', updateIncomeDisplay);
    document.getElementById('other-income').addEventListener('input', updateIncomeDisplay);

    categories.forEach(function(cat) {
        const id = 'budget-' + cat.toLowerCase().replace(/\s+/g, '-');
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateBudgetTotal);
        }
    });
}

function loadData() {
    const currency = localStorage.getItem('currency');
    if (currency) selectedCurrency = currency;

    const budgetKey = 'budget-' + currentYear + '-' + currentMonth;
    const budgetData = localStorage.getItem(budgetKey);
    budgets = budgetData ? JSON.parse(budgetData) : {};
    loadBudgetInputs();

    const expenseKey = 'expense-' + currentYear + '-' + currentMonth;
    const expenseData = localStorage.getItem(expenseKey);
    expenses = expenseData ? JSON.parse(expenseData) : {};

    const incomeKey = 'income-' + currentYear + '-' + currentMonth;
    const incomeDataStr = localStorage.getItem(incomeKey);
    if (incomeDataStr) {
        const incomeData = JSON.parse(incomeDataStr);
        oneToOneClients = incomeData.oneToOne || [];
        groupClients = incomeData.group || [];
        investmentIncome = incomeData.investment || 0;
        otherIncome = incomeData.other || 0;
    } else {
        oneToOneClients = [];
        groupClients = [];
        investmentIncome = 0;
        otherIncome = 0;
    }

    const incomeKey2 = 'monthly-income-' + currentYear + '-' + currentMonth;
    const incomeVal = localStorage.getItem(incomeKey2);
    monthlyIncome = incomeVal ? parseFloat(incomeVal) : 0;
    document.getElementById('monthly-income').value = monthlyIncome || '';
    
    document.getElementById('investment-income').value = investmentIncome || '';
    document.getElementById('other-income').value = otherIncome || '';
}

function saveData() {
    const budgetKey = 'budget-' + currentYear + '-' + currentMonth;
    localStorage.setItem(budgetKey, JSON.stringify(budgets));

    const expenseKey = 'expense-' + currentYear + '-' + currentMonth;
    localStorage.setItem(expenseKey, JSON.stringify(expenses));

    const incomeKey = 'income-' + currentYear + '-' + currentMonth;
    const incomeData = {
        oneToOne: oneToOneClients,
        group: groupClients,
        investment: investmentIncome,
        other: otherIncome
    };
    localStorage.setItem(incomeKey, JSON.stringify(incomeData));

    const incomeKey2 = 'monthly-income-' + currentYear + '-' + currentMonth;
    localStorage.setItem(incomeKey2, monthlyIncome.toString());
}

function loadBudgetInputs() {
    categories.forEach(function(cat) {
        const id = 'budget-' + cat.toLowerCase().replace(/\s+/g, '-');
        const input = document.getElementById(id);
        if (input && budgets[cat]) {
            input.value = budgets[cat];
        }
    });
    updateBudgetTotal();
}

function displayIncomeRows() {
    const oneToOneContainer = document.getElementById('one-to-one-list');
    oneToOneContainer.innerHTML = '';
    
    if (oneToOneClients.length === 0) {
        addOneToOneClient();
    } else {
        oneToOneClients.forEach(function(client, index) {
            createOneToOneRow(client.name, client.amount, index);
        });
    }

    const groupContainer = document.getElementById('group-list');
    groupContainer.innerHTML = '';
    
    if (groupClients.length === 0) {
        addGroupClient();
    } else {
        groupClients.forEach(function(client, index) {
            createGroupRow(client.name, client.amount, index);
        });
    }
}

function addOneToOneClient() {
    oneToOneClients.push({ name: '', amount: 0 });
    createOneToOneRow('', 0, oneToOneClients.length - 1);
}

function addGroupClient() {
    groupClients.push({ name: '', amount: 0 });
    createGroupRow('', 0, groupClients.length - 1);
}

function createOneToOneRow(name, amount, index) {
    const container = document.getElementById('one-to-one-list');
    const row = document.createElement('div');
    row.className = 'client-row';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Client Name';
    nameInput.value = name;
    nameInput.addEventListener('change', function() {
        oneToOneClients[index].name = this.value;
        saveData();
    });
    
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.placeholder = 'Amount';
    amountInput.min = '0';
    amountInput.step = '0.01';
    amountInput.value = amount || '';
    amountInput.addEventListener('change', function() {
        oneToOneClients[index].amount = parseFloat(this.value) || 0;
        updateIncomeDisplay();
    });
    amountInput.addEventListener('input', function() {
        oneToOneClients[index].amount = parseFloat(this.value) || 0;
        updateIncomeDisplay();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-client-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        oneToOneClients.splice(index, 1);
        saveData();
        displayIncomeRows();
        updateIncomeDisplay();
    });
    
    row.appendChild(nameInput);
    row.appendChild(amountInput);
    row.appendChild(deleteBtn);
    container.appendChild(row);
}

function createGroupRow(name, amount, index) {
    const container = document.getElementById('group-list');
    const row = document.createElement('div');
    row.className = 'client-row';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Client Name';
    nameInput.value = name;
    nameInput.addEventListener('change', function() {
        groupClients[index].name = this.value;
        saveData();
    });
    
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.placeholder = 'Amount';
    amountInput.min = '0';
    amountInput.step = '0.01';
    amountInput.value = amount || '';
    amountInput.addEventListener('change', function() {
        groupClients[index].amount = parseFloat(this.value) || 0;
        updateIncomeDisplay();
    });
    amountInput.addEventListener('input', function() {
        groupClients[index].amount = parseFloat(this.value) || 0;
        updateIncomeDisplay();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-client-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        groupClients.splice(index, 1);
        saveData();
        displayIncomeRows();
        updateIncomeDisplay();
    });
    
    row.appendChild(nameInput);
    row.appendChild(amountInput);
    row.appendChild(deleteBtn);
    container.appendChild(row);
}

function updateIncomeDisplay() {
    investmentIncome = parseFloat(document.getElementById('investment-income').value) || 0;
    otherIncome = parseFloat(document.getElementById('other-income').value) || 0;
    
    const oneToOneTotal = oneToOneClients.reduce(function(sum, client) {
        return sum + (client.amount || 0);
    }, 0);
    document.getElementById('one-to-one-total').textContent = formatCurrency(oneToOneTotal);
    
    const groupTotal = groupClients.reduce(function(sum, client) {
        return sum + (client.amount || 0);
    }, 0);
    document.getElementById('group-total').textContent = formatCurrency(groupTotal);
    
    const grandTotal = oneToOneTotal + groupTotal + investmentIncome + otherIncome;
    document.getElementById('grand-total-income').textContent = formatCurrency(grandTotal);
    
    saveData();
    updateAllDisplays();
}

function saveMonthlyIncome() {
    monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 0;
    if (monthlyIncome < 0) {
        showAlert('Invalid amount', 'error');
        return;
    }
    saveData();
    updateAllDisplays();
    showAlert('Monthly income saved', 'success');
}

function updateBudgetTotal() {
    let total = 0;
    categories.forEach(function(cat) {
        const id = 'budget-' + cat.toLowerCase().replace(/\s+/g, '-');
        const input = document.getElementById(id);
        if (input && input.value) {
            total += parseFloat(input.value) || 0;
        }
    });
    document.getElementById('total-budget').textContent = formatCurrency(total);
}

function saveBudget() {
    budgets = {};
    categories.forEach(function(cat) {
        const id = 'budget-' + cat.toLowerCase().replace(/\s+/g, '-');
        const input = document.getElementById(id);
        if (input && input.value) {
            budgets[cat] = parseFloat(input.value) || 0;
        }
    });
    
    if (Object.keys(budgets).length === 0) {
        showAlert('Enter at least one budget', 'error');
        return;
    }
    
    saveData();
    updateAllDisplays();
    document.getElementById('budget-success-msg').classList.add('show');
    setTimeout(function() {
        document.getElementById('budget-success-msg').classList.remove('show');
    }, 2000);
    showAlert('Budget saved', 'success');
}

function addExpense(e) {
    e.preventDefault();
    
    const date = document.getElementById('expense-date').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value;
    
    if (!date || !amount || !category) {
        showAlert('Fill all required fields', 'error');
        return;
    }
    
    if (!expenses[category]) {
        expenses[category] = [];
    }
    
    expenses[category].push({
        id: Date.now(),
        date: date,
        amount: amount,
        description: description
    });
    
    saveData();
    updateAllDisplays();
    clearForm();
    showAlert('Expense added', 'success');
}

function clearForm() {
    document.getElementById('expense-form').reset();
    const today = new Date();
    const dateString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('expense-date').value = dateString;
}

function updateAllDisplays() {
    updateOverviewCards();
    updateExpensesList();
    updateDashboard();
    updateCharts();
}

function getTotalIncome() {
    const oneToOneTotal = oneToOneClients.reduce(function(sum, client) {
        return sum + (client.amount || 0);
    }, 0);
    const groupTotal = groupClients.reduce(function(sum, client) {
        return sum + (client.amount || 0);
    }, 0);
    return monthlyIncome + oneToOneTotal + groupTotal + investmentIncome + otherIncome;
}

function getTotalExpenses() {
    let total = 0;
    for (let cat in expenses) {
        expenses[cat].forEach(function(exp) {
            total += exp.amount;
        });
    }
    return total;
}

function updateOverviewCards() {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const netCashflow = totalIncome - totalExpenses;
    const totalBudget = Object.keys(budgets).reduce(function(sum, key) {
        return sum + (budgets[key] || 0);
    }, 0);
    
    document.getElementById('income-display').textContent = formatCurrency(totalIncome);
    document.getElementById('overview-total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('net-cashflow').textContent = formatCurrency(netCashflow);
    
    const statusEl = document.getElementById('cashflow-status');
    if (netCashflow > 0) {
        statusEl.textContent = 'Positive';
    } else if (netCashflow < 0) {
        statusEl.textContent = 'Negative';
    } else {
        statusEl.textContent = 'Break Even';
    }
    
    if (totalBudget > 0) {
        const pct = Math.round((totalExpenses / totalBudget) * 100);
        document.getElementById('budget-overview-percentage').textContent = pct + '%';
    }
}

function updateExpensesList() {
    const list = document.getElementById('expenses-list');
    const allExpenses = [];
    
    for (let cat in expenses) {
        expenses[cat].forEach(function(item) {
            allExpenses.push({ category: cat, ...item });
        });
    }
    
    allExpenses.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });
    
    if (allExpenses.length === 0) {
        list.innerHTML = '<p class="empty-state">No expenses logged yet</p>';
        return;
    }
    
    list.innerHTML = allExpenses.map(function(exp) {
        return '<div class="expense-item">' +
            '<div><div class="expense-category">' + exp.category + '</div>' +
            (exp.description ? '<div class="expense-description">' + exp.description + '</div>' : '') +
            '<div class="expense-date">' + exp.date + '</div></div>' +
            '<div class="expense-amount">' + formatCurrency(exp.amount) + '</div>' +
            '<button class="delete-btn" onclick="deleteExpense(\'' + exp.category + '\', ' + exp.id + ')">Delete</button>' +
            '</div>';
    }).join('');
}

function deleteExpense(cat, id) {
    expenses[cat] = expenses[cat].filter(function(e) {
        return e.id !== id;
    });
    if (expenses[cat].length === 0) {
        delete expenses[cat];
    }
    saveData();
    updateAllDisplays();
}

function updateDashboard() {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const totalBudget = Object.keys(budgets).reduce(function(sum, key) {
        return sum + (budgets[key] || 0);
    }, 0);
    
    document.getElementById('total-cash-inflow').textContent = formatCurrency(totalIncome);
    document.getElementById('total-cash-outflow').textContent = formatCurrency(totalExpenses);
    document.getElementById('total-spent').textContent = formatCurrency(totalExpenses);
    document.getElementById('remaining-budget').textContent = formatCurrency(totalBudget - totalExpenses);
    
    const card = document.querySelector('.status-card');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('budget-status');
    const statusPct = document.getElementById('budget-percentage');
    
    if (totalBudget === 0) {
        statusText.textContent = 'Not Set';
        statusPct.textContent = '0%';
        statusIcon.textContent = '';
        card.className = 'summary-card status-card';
    } else {
        const pct = Math.round((totalExpenses / totalBudget) * 100);
        statusPct.textContent = pct + '%';
        if (pct > 100) {
            statusText.textContent = 'Over Budget';
            statusIcon.textContent = '';
            card.className = 'summary-card status-card';
        } else if (pct > 80) {
            statusText.textContent = 'Warning';
            statusIcon.textContent = '';
        } else {
            statusText.textContent = 'On Track';
            statusIcon.textContent = '';
        }
    }
    
    updateCategoryBreakdown();
    updateProgressBars();
}

function updateCategoryBreakdown() {
    const tbody = document.getElementById('breakdown-tbody');
    const totalBudget = Object.keys(budgets).reduce(function(sum, key) {
        return sum + (budgets[key] || 0);
    }, 0);
    
    if (totalBudget === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Set budget to see breakdown</td></tr>';
        return;
    }
    
    tbody.innerHTML = categories.map(function(cat) {
        const budget = budgets[cat] || 0;
        const spent = expenses[cat] ? expenses[cat].reduce(function(sum, e) { return sum + e.amount; }, 0) : 0;
        const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        let statusClass = 'on-track', statusText = 'On Track';
        if (pct > 100) { statusClass = 'over'; statusText = 'Over'; }
        else if (pct > 80) { statusClass = 'warning'; statusText = 'Warning'; }
        
        return '<tr><td>' + cat + '</td><td>' + formatCurrency(budget) + '</td><td>' + formatCurrency(spent) + '</td><td>' + formatCurrency(budget - spent) + '</td><td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td></tr>';
    }).join('');
}

function updateProgressBars() {
    const bars = document.getElementById('progress-bars');
    const totalBudget = Object.keys(budgets).reduce(function(sum, key) {
        return sum + (budgets[key] || 0);
    }, 0);
    
    if (totalBudget === 0) {
        bars.innerHTML = '<p class="empty-state">Set budget to see progress</p>';
        return;
    }
    
    bars.innerHTML = categories.map(function(cat) {
        const budget = budgets[cat] || 0;
        const spent = expenses[cat] ? expenses[cat].reduce(function(sum, e) { return sum + e.amount; }, 0) : 0;
        const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
        let cls = 'on-track';
        if (spent > budget) cls = 'over';
        else if (pct > 80) cls = 'warning';
        
        return '<div class="progress-item"><div class="progress-header"><span class="progress-label">' + cat + '</span><span class="progress-value">' + formatCurrency(spent) + ' / ' + formatCurrency(budget) + '</span></div><div class="progress-bar-container"><div class="progress-bar ' + cls + '" style="width: ' + pct + '%"></div></div></div>';
    }).join('');
}

function updateCharts() {
    const ctx1 = document.getElementById('pie-chart');
    const ctx2 = document.getElementById('bar-chart');
    
    if (!ctx1 || !ctx2) return;
    
    const data = categories.map(function(c) {
        return expenses[c] ? expenses[c].reduce(function(sum, e) { return sum + e.amount; }, 0) : 0;
    });
    
    const labels = categories.filter(function(c, i) { return data[i] > 0; });
    const chartData = data.filter(function(d) { return d > 0; });
    
    if (pieChart) pieChart.destroy();
    if (chartData.length > 0) {
        const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#6b7280', '#6366f1', '#10b981', '#06b6d4', '#14b8a6'];
        pieChart = new Chart(ctx1, {
            type: 'pie',
            data: { labels: labels, datasets: [{ data: chartData, backgroundColor: colors }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    if (barChart) barChart.destroy();
    const budgetData = categories.map(function(c) { return budgets[c] || 0; });
    const spentData = categories.map(function(c) { return expenses[c] ? expenses[c].reduce(function(sum, e) { return sum + e.amount; }, 0) : 0; });
    
    barChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                { label: 'Budget', data: budgetData, backgroundColor: 'rgba(99,102,241,0.7)' },
                { label: 'Spent', data: spentData, backgroundColor: 'rgba(239,68,68,0.7)' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
}

function exportExpenses() {
    const all = [];
    for (let cat in expenses) {
        expenses[cat].forEach(function(item) {
            all.push({ Date: item.date, Category: cat, Amount: item.amount, Description: item.description || '' });
        });
    }
    if (all.length === 0) { showAlert('No expenses to export', 'warning'); return; }
    downloadCSV(convertToCSV(all), 'expenses_' + currentYear + '_' + currentMonth + '.csv');
}

function exportReport() {
    const data = categories.map(function(cat) {
        const spent = expenses[cat] ? expenses[cat].reduce(function(sum, e) { return sum + e.amount; }, 0) : 0;
        return { Category: cat, Budget: budgets[cat] || 0, Spent: spent, Remaining: (budgets[cat] || 0) - spent };
    });
    downloadCSV(convertToCSV(data), 'report_' + currentYear + '_' + currentMonth + '.csv');
}

function exportAll() {
    const data = { income: { oneToOne: oneToOneClients, group: groupClients, investment: investmentIncome, other: otherIncome }, budgets: budgets, expenses: expenses };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
}

function clearMonth() {
    if (confirm('Clear this month data?')) {
        expenses = {};
        saveData();
        updateAllDisplays();
        showAlert('Month cleared', 'success');
    }
}

function clearAllData() {
    if (confirm('Clear ALL data?')) {
        localStorage.clear();
        location.reload();
    }
}

function formatCurrency(amount) {
    const symbol = currencies[selectedCurrency];
    return symbol + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function showAlert(msg, type) {
    const cont = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = 'alert alert-' + type;
    alert.textContent = msg;
    cont.appendChild(alert);
    setTimeout(function() {
        alert.style.opacity = '0';
        setTimeout(function() { alert.remove(); }, 300);
    }, 2500);
}

function convertToCSV(data) {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];
    data.forEach(function(row) {
        const vals = headers.map(function(h) { return typeof row[h] === 'string' ? '"' + row[h] + '"' : row[h]; });
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

