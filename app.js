let currentMonth = 0;
let currentYear = 2025;
let selectedCurrency = 'USD';

document.addEventListener('DOMContentLoaded', init);

function init() {
    setUpDateSelectors();
    attachEventListeners();
    loadData();
    renderAll();
}

function setUpDateSelectors() {
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('expense-date').value = dateStr;
    document.getElementById('month-select').value = currentMonth;
    document.getElementById('year-select').value = currentYear;
}

function attachEventListeners() {
    document.getElementById('month-select').addEventListener('change', onMonthChange);
    document.getElementById('year-select').addEventListener('change', onYearChange);
    document.getElementById('currency-select').addEventListener('change', onCurrencyChange);
    
    document.getElementById('save-income-btn').addEventListener('click', saveMonthlyIncome);
    document.getElementById('save-budget-btn').addEventListener('click', saveBudget);
    document.getElementById('expense-form').addEventListener('submit', addExpense);
    document.getElementById('clear-form-btn').addEventListener('click', clearExpenseForm);
    document.getElementById('export-expenses-btn').addEventListener('click', exportExpenses);
    document.getElementById('export-report-btn').addEventListener('click', exportReport);
    document.getElementById('clear-month-btn').addEventListener('click', clearMonth);
    document.getElementById('clear-all-btn').addEventListener('click', clearAll);
    
    document.getElementById('add-one-to-one-btn').addEventListener('click', function() {
        addClientRow('one-to-one');
    });
    document.getElementById('add-group-btn').addEventListener('click', function() {
        addClientRow('group');
    });
    
    document.getElementById('investment-income').addEventListener('input', updateIncomeTotals);
    document.getElementById('other-income').addEventListener('input', updateIncomeTotals);
}

function onMonthChange(e) {
    currentMonth = parseInt(e.target.value);
    loadData();
    renderAll();
}

function onYearChange(e) {
    currentYear = parseInt(e.target.value);
    loadData();
    renderAll();
}

function onCurrencyChange(e) {
    selectedCurrency = e.target.value;
    localStorage.setItem('globalCurrency', selectedCurrency);
    renderAll();
}

function getStorageKey(base) {
    return base + '-' + currentYear + '-' + currentMonth;
}

function loadData() {
    const stored = localStorage.getItem('globalCurrency');
    if (stored) selectedCurrency = stored;
}

function renderAll() {
    renderIncomeRows();
    updateIncomeTotals();
    renderExpenses();
    updateDashboard();
}

function addClientRow(type) {
    const containerId = type === 'one-to-one' ? 'one-to-one-list' : 'group-list';
    const container = document.getElementById(containerId);
    
    const row = document.createElement('div');
    row.className = 'client-row';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Client Name';
    nameInput.addEventListener('input', updateIncomeTotals);
    
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.placeholder = 'Amount';
    amountInput.min = '0';
    amountInput.step = '0.01';
    amountInput.addEventListener('input', updateIncomeTotals);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-client-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', function(evt) {
        evt.preventDefault();
        row.remove();
        updateIncomeTotals();
    });
    
    row.appendChild(nameInput);
    row.appendChild(amountInput);
    row.appendChild(deleteBtn);
    container.appendChild(row);
}

function renderIncomeRows() {
    const oneContainer = document.getElementById('one-to-one-list');
    const groupContainer = document.getElementById('group-list');
    
    oneContainer.innerHTML = '';
    groupContainer.innerHTML = '';
    
    addClientRow('one-to-one');
    addClientRow('group');
}

function updateIncomeTotals() {
    const oneToOneInputs = document.querySelectorAll('#one-to-one-list .client-row input[type="number"]');
    const groupInputs = document.querySelectorAll('#group-list .client-row input[type="number"]');
    
    let oneToOneTotal = 0;
    oneToOneInputs.forEach(function(input) {
        oneToOneTotal += parseFloat(input.value) || 0;
    });
    
    let groupTotal = 0;
    groupInputs.forEach(function(input) {
        groupTotal += parseFloat(input.value) || 0;
    });
    
    const investment = parseFloat(document.getElementById('investment-income').value) || 0;
    const other = parseFloat(document.getElementById('other-income').value) || 0;
    
    document.getElementById('one-to-one-total').textContent = formatCurrency(oneToOneTotal);
    document.getElementById('group-total').textContent = formatCurrency(groupTotal);
    document.getElementById('grand-total-income').textContent = formatCurrency(oneToOneTotal + groupTotal + investment + other);
    
    updateDashboard();
}

function saveMonthlyIncome() {
    const amount = parseFloat(document.getElementById('monthly-income').value) || 0;
    if (amount < 0) {
        showAlert('Invalid amount', 'error');
        return;
    }
    const key = getStorageKey('monthlyIncome');
    localStorage.setItem(key, amount.toString());
    document.getElementById('income-display').textContent = formatCurrency(amount);
    showAlert('Income saved', 'success');
    updateDashboard();
}

function saveBudget() {
    const categories = ['food', 'transportation', 'entertainment', 'shopping', 'bills', 'other', 'business', 'gym', 'travel', 'daycare'];
    const budgets = {};
    let hasData = false;
    
    categories.forEach(function(cat) {
        const val = parseFloat(document.getElementById('budget-' + cat).value) || 0;
        if (val > 0) {
            budgets[cat] = val;
            hasData = true;
        }
    });
    
    if (!hasData) {
        showAlert('Enter at least one budget', 'error');
        return;
    }
    
    const key = getStorageKey('budgets');
    localStorage.setItem(key, JSON.stringify(budgets));
    document.getElementById('budget-success-msg').classList.add('show');
    setTimeout(function() {
        document.getElementById('budget-success-msg').classList.remove('show');
    }, 2000);
    showAlert('Budget saved', 'success');
    updateDashboard();
}

function addExpense(e) {
    e.preventDefault();
    
    const date = document.getElementById('expense-date').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const desc = document.getElementById('expense-description').value;
    
    if (!date || !amount || !category) {
        showAlert('Fill required fields', 'error');
        return;
    }
    
    const key = getStorageKey('expenses');
    const stored = localStorage.getItem(key) || '[]';
    const expenses = JSON.parse(stored);
    
    expenses.push({
        id: Date.now(),
        date: date,
        amount: amount,
        category: category,
        desc: desc
    });
    
    localStorage.setItem(key, JSON.stringify(expenses));
    clearExpenseForm();
    renderAll();
    showAlert('Expense added', 'success');
}

function clearExpenseForm() {
    document.getElementById('expense-form').reset();
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('expense-date').value = dateStr;
}

function renderExpenses() {
    const key = getStorageKey('expenses');
    const stored = localStorage.getItem(key) || '[]';
    const expenses = JSON.parse(stored);
    
    const container = document.getElementById('expenses-list');
    if (expenses.length === 0) {
        container.innerHTML = '<p class="empty-state">No expenses</p>';
        return;
    }
    
    expenses.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });
    
    container.innerHTML = expenses.map(function(exp) {
        return '<div class="expense-item">' +
            '<div><div class="expense-category">' + exp.category + '</div>' +
            (exp.desc ? '<div class="expense-description">' + exp.desc + '</div>' : '') +
            '<div class="expense-date">' + exp.date + '</div></div>' +
            '<div class="expense-amount">' + formatCurrency(exp.amount) + '</div>' +
            '<button class="delete-btn" type="button" onclick="deleteExpense(' + exp.id + ')">Delete</button>' +
            '</div>';
    }).join('');
}

function deleteExpense(id) {
    const key = getStorageKey('expenses');
    const stored = localStorage.getItem(key) || '[]';
    const expenses = JSON.parse(stored);
    const filtered = expenses.filter(function(e) { return e.id !== id; });
    localStorage.setItem(key, JSON.stringify(filtered));
    renderAll();
}

function updateDashboard() {
    const key = getStorageKey('expenses');
    const stored = localStorage.getItem(key) || '[]';
    const expenses = JSON.parse(stored);
    
    const oneToOneInputs = document.querySelectorAll('#one-to-one-list .client-row input[type="number"]');
    const groupInputs = document.querySelectorAll('#group-list .client-row input[type="number"]');
    
    let income = parseFloat(document.getElementById('monthly-income').value) || 0;
    let oneToOne = 0;
    oneToOneInputs.forEach(function(input) {
        oneToOne += parseFloat(input.value) || 0;
    });
    let groupTotal = 0;
    groupInputs.forEach(function(input) {
        groupTotal += parseFloat(input.value) || 0;
    });
    const investment = parseFloat(document.getElementById('investment-income').value) || 0;
    const other = parseFloat(document.getElementById('other-income').value) || 0;
    
    const totalIncome = income + oneToOne + groupTotal + investment + other;
    const totalExpenses = expenses.reduce(function(sum, e) { return sum + e.amount; }, 0);
    
    document.getElementById('total-cash-inflow').textContent = formatCurrency(totalIncome);
    document.getElementById('total-cash-outflow').textContent = formatCurrency(totalExpenses);
    document.getElementById('total-spent').textContent = formatCurrency(totalExpenses);
    
    const budKey = getStorageKey('budgets');
    const budStored = localStorage.getItem(budKey) || '{}';
    const budgets = JSON.parse(budStored);
    const totalBudget = Object.keys(budgets).reduce(function(sum, key) {
        return sum + budgets[key];
    }, 0);
    
    document.getElementById('remaining-budget').textContent = formatCurrency(totalBudget - totalExpenses);
    
    updateCategoryTable(expenses, budgets);
}

function updateCategoryTable(expenses, budgets) {
    const categories = ['food', 'transportation', 'entertainment', 'shopping', 'bills', 'other', 'business', 'gym', 'travel', 'daycare'];
    const tbody = document.getElementById('breakdown-tbody');
    
    tbody.innerHTML = categories.map(function(cat) {
        const budget = budgets[cat] || 0;
        let spent = 0;
        
        expenses.forEach(function(exp) {
            if (exp.category.toLowerCase() === cat.replace(/\s+/g, '').toLowerCase() || 
                (cat === 'daycare' && exp.category === 'Shayna Day Care') ||
                (cat === 'business' && exp.category === 'Business Expenses')) {
                spent += exp.amount;
            }
        });
        
        const remaining = budget - spent;
        return '<tr><td>' + cat + '</td><td>' + formatCurrency(budget) + '</td><td>' + formatCurrency(spent) + '</td><td>' + formatCurrency(remaining) + '</td></tr>';
    }).join('');
}

function clearMonth() {
    if (confirm('Clear this month?')) {
        const key = getStorageKey('expenses');
        localStorage.removeItem(key);
        renderAll();
        showAlert('Month cleared', 'success');
    }
}

function clearAll() {
    if (confirm('Clear ALL data?')) {
        localStorage.clear();
        location.reload();
    }
}

function exportExpenses() {
    const key = getStorageKey('expenses');
    const stored = localStorage.getItem(key) || '[]';
    const expenses = JSON.parse(stored);
    
    if (expenses.length === 0) {
        showAlert('No expenses', 'error');
        return;
    }
    
    const csv = 'Date,Category,Amount,Description\n' + expenses.map(function(e) {
        return e.date + ',' + e.category + ',' + e.amount + ',"' + (e.desc || '') + '"';
    }).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
}

function exportReport() {
    const key = getStorageKey('expenses');
    const budKey = getStorageKey('budgets');
    
    const stored = localStorage.getItem(key) || '[]';
    const budStored = localStorage.getItem(budKey) || '{}';
    
    const expenses = JSON.parse(stored);
    const budgets = JSON.parse(budStored);
    
    const blob = new Blob([JSON.stringify({ expenses: expenses, budgets: budgets }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.json';
    a.click();
}

function formatCurrency(amount) {
    const symbol = selectedCurrency === 'USD' ? '$' : 'C$';
    return symbol + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function showAlert(msg, type) {
    const container = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = 'alert alert-' + type;
    alert.textContent = msg;
    container.appendChild(alert);
    setTimeout(function() {
        alert.remove();
    }, 3000);
}

