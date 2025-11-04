// ==================== STATE MANAGEMENT ====================
let appState = {
  currentYear: 2025,
  currentMonth: 0,
  currency: 'USD',
  monthlyIncome: 0,
  oneToOneClients: [],
  groupClients: [],
  investmentIncome: 0,
  otherIncome: 0,
  budgets: {},
  expenses: [],
  chartInstances: {}
};

// Budget categories
const BUDGET_CATEGORIES = [
  'Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 
  'Other', 'Business Expenses', 'Gym', 'Travel', 'Shayna Day Care'
];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setUpEventListeners();
  loadDataFromStorage();
  updateAllDisplays();
});

function initializeApp() {
  const today = new Date();
  document.getElementById('month-select').value = today.getMonth();
  appState.currentMonth = today.getMonth();
  
  BUDGET_CATEGORIES.forEach(category => {
    appState.budgets[category] = 0;
  });
  
  // Render empty client rows
  renderOneToOneClients();
  renderGroupClients();
}

// ==================== EVENT LISTENERS ====================
function setUpEventListeners() {
  // Selectors
  document.getElementById('currency-select').addEventListener('change', (e) => {
    appState.currency = e.target.value;
    updateAllDisplays();
  });
  
  document.getElementById('year-select').addEventListener('change', (e) => {
    appState.currentYear = parseInt(e.target.value);
    loadDataFromStorage();
    updateAllDisplays();
  });
  
  document.getElementById('month-select').addEventListener('change', (e) => {
    appState.currentMonth = parseInt(e.target.value);
    loadDataFromStorage();
    updateAllDisplays();
  });
  
  // Income inputs - real-time updates
  document.getElementById('monthly-income').addEventListener('input', updateIncomeDisplay);
  document.getElementById('save-income-btn').addEventListener('click', saveIncome);
  
  document.getElementById('investment-income').addEventListener('input', updateTotalIncome);
  document.getElementById('other-income').addEventListener('input', updateTotalIncome);
  
  // Income breakdown buttons
  document.getElementById('add-one-to-one-btn').addEventListener('click', addOneToOneRow);
  document.getElementById('add-group-btn').addEventListener('click', addGroupRow);
  
  // Budget inputs - real-time calculation
  BUDGET_CATEGORIES.forEach(category => {
    const inputId = `budget-${category.toLowerCase().replace(/\s+/g, '-')}`;
    const element = document.getElementById(inputId);
    if (element) {
      element.addEventListener('input', updateBudgetTotal);
    }
  });
  
  document.getElementById('save-budget-btn').addEventListener('click', saveBudget);
  
  // Expenses
  document.getElementById('expense-form').addEventListener('submit', addExpense);
  document.getElementById('clear-form-btn').addEventListener('click', clearForm);
  document.getElementById('clear-month-btn').addEventListener('click', clearMonthData);
  document.getElementById('export-expenses-btn').addEventListener('click', exportExpenses);
  
  // Export & Clear
  document.getElementById('export-report-btn').addEventListener('click', exportReport);
  document.getElementById('export-json-btn').addEventListener('click', exportJSON);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
}

// ==================== 1:1 CLIENTS MANAGEMENT ====================
function addOneToOneRow() {
  appState.oneToOneClients.push({ name: '', amount: 0 });
  renderOneToOneClients();
  updateTotalIncome();
}

function deleteOneToOneRow(index) {
  appState.oneToOneClients.splice(index, 1);
  renderOneToOneClients();
  updateTotalIncome();
}

function renderOneToOneClients() {
  const container = document.getElementById('one-to-one-list');
  
  if (appState.oneToOneClients.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = appState.oneToOneClients.map((client, index) => `
    <div class="client-row">
      <input type="text" placeholder="Client name" value="${client.name}" 
        onchange="appState.oneToOneClients[${index}].name = this.value; updateTotalIncome();">
      <div class="currency-input-wrapper" style="margin: 0;">
        <input type="number" min="0" step="0.01" placeholder="0.00" value="${client.amount}" 
          onchange="appState.oneToOneClients[${index}].amount = parseFloat(this.value) || 0; updateTotalIncome();" 
          class="currency-input" style="padding-left: 28px;">
      </div>
      <button type="button" class="delete-client-btn" onclick="deleteOneToOneRow(${index})">Delete</button>
    </div>
  `).join('');
}

// ==================== GROUP CLIENTS MANAGEMENT ====================
function addGroupRow() {
  appState.groupClients.push({ name: '', amount: 0 });
  renderGroupClients();
  updateTotalIncome();
}

function deleteGroupRow(index) {
  appState.groupClients.splice(index, 1);
  renderGroupClients();
  updateTotalIncome();
}

function renderGroupClients() {
  const container = document.getElementById('group-list');
  
  if (appState.groupClients.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = appState.groupClients.map((group, index) => `
    <div class="client-row">
      <input type="text" placeholder="Group name" value="${group.name}" 
        onchange="appState.groupClients[${index}].name = this.value; updateTotalIncome();">
      <div class="currency-input-wrapper" style="margin: 0;">
        <input type="number" min="0" step="0.01" placeholder="0.00" value="${group.amount}" 
          onchange="appState.groupClients[${index}].amount = parseFloat(this.value) || 0; updateTotalIncome();" 
          class="currency-input" style="padding-left: 28px;">
      </div>
      <button type="button" class="delete-client-btn" onclick="deleteGroupRow(${index})">Delete</button>
    </div>
  `).join('');
}

// ==================== INCOME CALCULATIONS ====================
function getOneToOneTotal() {
  return appState.oneToOneClients.reduce((sum, client) => sum + (client.amount || 0), 0);
}

function getGroupTotal() {
  return appState.groupClients.reduce((sum, group) => sum + (group.amount || 0), 0);
}

function getInvestmentIncome() {
  return parseFloat(document.getElementById('investment-income').value) || 0;
}

function getOtherIncome() {
  return parseFloat(document.getElementById('other-income').value) || 0;
}

function getTotalIncomeFromBreakdown() {
  return getOneToOneTotal() + getGroupTotal() + getInvestmentIncome() + getOtherIncome();
}

function updateIncomeDisplay() {
  const income = parseFloat(document.getElementById('monthly-income').value) || 0;
  document.getElementById('income-display').textContent = formatCurrency(income);
  updateDashboard();
}

function updateTotalIncome() {
  // Update subtotals
  document.getElementById('one-to-one-total').textContent = formatCurrency(getOneToOneTotal());
  document.getElementById('group-total').textContent = formatCurrency(getGroupTotal());
  
  // Update grand total (all income sources combined)
  const grandTotal = getTotalIncomeFromBreakdown();
  document.getElementById('grand-total-income').textContent = formatCurrency(grandTotal);
  
  saveDataToStorage();
  updateDashboard();
}

function saveIncome() {
  const income = parseFloat(document.getElementById('monthly-income').value) || 0;
  appState.monthlyIncome = income;
  saveDataToStorage();
  alert('âœ“ Income saved successfully');
  updateAllDisplays();
}

// ==================== BUDGET FUNCTIONS ====================
function updateBudgetTotal() {
  let total = 0;
  BUDGET_CATEGORIES.forEach(category => {
    const inputId = `budget-${category.toLowerCase().replace(/\s+/g, '-')}`;
    const value = parseFloat(document.getElementById(inputId).value) || 0;
    appState.budgets[category] = value;
    total += value;
  });
  
  document.getElementById('total-budget').textContent = formatCurrency(total);
  updateDashboard();
}

function saveBudget() {
  updateBudgetTotal();
  saveDataToStorage();
  const msg = document.getElementById('budget-success-msg');
  msg.classList.add('show');
  setTimeout(() => {
    msg.classList.remove('show');
  }, 3000);
}

// ==================== EXPENSE FUNCTIONS ====================
function addExpense(e) {
  e.preventDefault();
  
  const date = document.getElementById('expense-date').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const description = document.getElementById('expense-description').value;
  
  if (!date || !amount || !category) {
    alert('Please fill in all required fields');
    return;
  }
  
  const expense = {
    id: Date.now(),
    date,
    amount,
    category,
    description,
    year: appState.currentYear,
    month: appState.currentMonth
  };
  
  appState.expenses.push(expense);
  saveDataToStorage();
  clearForm();
  updateAllDisplays();
}

function deleteExpense(id) {
  appState.expenses = appState.expenses.filter(exp => exp.id !== id);
  saveDataToStorage();
  updateAllDisplays();
}

function clearForm() {
  document.getElementById('expense-form').reset();
  document.getElementById('expense-date').valueAsDate = new Date();
}

// ==================== CALCULATIONS ====================
function getCurrentMonthData() {
  return appState.expenses.filter(exp => 
    exp.year === appState.currentYear && 
    exp.month === appState.currentMonth
  );
}

function getTotalExpenses() {
  return getCurrentMonthData().reduce((sum, exp) => sum + exp.amount, 0);
}

function getTotalBudget() {
  return Object.values(appState.budgets).reduce((sum, val) => sum + val, 0);
}

function getCategoryExpense(category) {
  return getCurrentMonthData()
    .filter(exp => exp.category === category)
    .reduce((sum, exp) => sum + exp.amount, 0);
}

function getCategoryBudget(category) {
  return appState.budgets[category] || 0;
}

// ==================== DASHBOARD UPDATE ====================
function updateDashboard() {
  // Use breakdown total for all calculations
  const totalIncome = getTotalIncomeFromBreakdown();
  const totalExpenses = getTotalExpenses();
  const totalBudget = getTotalBudget();
  const netCashFlow = totalIncome - totalExpenses;
  const remainingBudget = totalBudget - totalExpenses;
  
  // Update Overview Cards (Top section)
  document.getElementById('income-display').textContent = formatCurrency(totalIncome);
  document.getElementById('overview-total-expenses').textContent = formatCurrency(totalExpenses);
  document.getElementById('net-cashflow').textContent = formatCurrency(netCashFlow);
  
  // Update Dashboard Cards (ACCURATE CALCULATIONS)
  // Total Income = All income sources combined
  document.getElementById('total-cash-inflow').textContent = formatCurrency(totalIncome);
  
  // Total Budget = Sum of all category budgets
  document.getElementById('total-cash-outflow').textContent = formatCurrency(totalBudget);
  
  // Total Spent = Sum of all expenses
  document.getElementById('total-spent').textContent = formatCurrency(totalExpenses);
  
  // Remaining Budget = Total Budget - Total Spent
  document.getElementById('remaining-budget').textContent = formatCurrency(remainingBudget);
  
  updateCategoryBreakdown();
  updateCharts();
}

function updateCategoryBreakdown() {
  const tbody = document.getElementById('breakdown-tbody');
  tbody.innerHTML = '';
  
  BUDGET_CATEGORIES.forEach(category => {
    const budgeted = getCategoryBudget(category);
    const spent = getCategoryExpense(category);
    const remaining = budgeted - spent;
    
    let status = 'on-track';
    if (spent > budgeted) {
      status = 'over';
    } else if (spent >= budgeted * 0.8) {
      status = 'warning';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${category}</strong></td>
      <td>${formatCurrency(budgeted)}</td>
      <td>${formatCurrency(spent)}</td>
      <td>${formatCurrency(remaining)}</td>
      <td><span class="status-badge status-${status}">${status === 'on-track' ? 'On Track' : status === 'warning' ? 'Warning' : 'Over Budget'}</span></td>
    `;
    tbody.appendChild(row);
  });
}

function updateExpensesList() {
  const expensesList = document.getElementById('expenses-list');
  const monthExpenses = getCurrentMonthData().sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (monthExpenses.length === 0) {
    expensesList.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: var(--spacing-lg);">No expenses recorded yet</p>';
    return;
  }
  
  expensesList.innerHTML = monthExpenses.map(exp => `
    <div class="expense-item">
      <div>
        <strong>${exp.category}</strong><br>
        <small style="color: var(--text-gray);">${new Date(exp.date).toLocaleDateString()}</small>
        ${exp.description ? `<br><small>${exp.description}</small>` : ''}
      </div>
      <div>${exp.date}</div>
      <div class="expense-item-amount">${formatCurrency(exp.amount)}</div>
      <button class="delete-btn" onclick="deleteExpense(${exp.id})">Delete</button>
    </div>
  `).join('');
}

// ==================== CHARTS ====================
function updateCharts() {
  const monthExpenses = getCurrentMonthData();
  
  if (monthExpenses.length === 0) {
    // Clear all charts if no data
    Object.values(appState.chartInstances).forEach(chart => {
      if (chart) chart.destroy();
    });
    return;
  }
  
  updatePieChart(monthExpenses);
  updateBarChart();
  updateLineChart();
  updateDoughnutChart();
}

function updatePieChart(expenses) {
  const ctx = document.getElementById('pie-chart').getContext('2d');
  
  const categoryData = {};
  BUDGET_CATEGORIES.forEach(cat => {
    categoryData[cat] = getCategoryExpense(cat);
  });
  
  const labels = Object.keys(categoryData).filter(cat => categoryData[cat] > 0);
  const data = Object.values(categoryData).filter(val => val > 0);
  
  if (appState.chartInstances.pie) {
    appState.chartInstances.pie.destroy();
  }
  
  appState.chartInstances.pie = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 12, weight: 500 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed);
            }
          }
        }
      }
    }
  });
}

function updateBarChart() {
  const ctx = document.getElementById('bar-chart').getContext('2d');
  
  const labels = BUDGET_CATEGORIES;
  const budgetData = labels.map(cat => getCategoryBudget(cat));
  const spentData = labels.map(cat => getCategoryExpense(cat));
  
  if (appState.chartInstances.bar) {
    appState.chartInstances.bar.destroy();
  }
  
  appState.chartInstances.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Budgeted',
          data: budgetData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: '#3b82f6',
          borderWidth: 1
        },
        {
          label: 'Spent',
          data: spentData,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: '#ef4444',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: {
          labels: {
            font: { size: 12, weight: 500 },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.parsed.x);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      }
    }
  });
}

function updateLineChart() {
  const ctx = document.getElementById('line-chart').getContext('2d');
  
  const dailyData = {};
  const daysInMonth = new Date(appState.currentYear, appState.currentMonth + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    dailyData[day] = 0;
  }
  
  getCurrentMonthData().forEach(exp => {
    const day = new Date(exp.date).getDate();
    dailyData[day] = (dailyData[day] || 0) + exp.amount;
  });
  
  const labels = Object.keys(dailyData);
  const data = Object.values(dailyData);
  
  if (appState.chartInstances.line) {
    appState.chartInstances.line.destroy();
  }
  
  appState.chartInstances.line = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.map(day => `Day ${day}`),
      datasets: [{
        label: 'Daily Expenses',
        data: data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            font: { size: 12, weight: 500 },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'Expenses: ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      }
    }
  });
}

function updateDoughnutChart() {
  const ctx = document.getElementById('doughnut-chart').getContext('2d');
  
  const totalBudget = getTotalBudget();
  const totalSpent = getTotalExpenses();
  const remaining = totalBudget - totalSpent;
  
  if (appState.chartInstances.doughnut) {
    appState.chartInstances.doughnut.destroy();
  }
  
  appState.chartInstances.doughnut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Spent', 'Remaining'],
      datasets: [{
        data: [totalSpent, Math.max(remaining, 0)],
        backgroundColor: [
          '#ef4444',
          '#10b981'
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 12, weight: 500 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed);
            }
          }
        }
      }
    }
  });
}

// ==================== UTILITY FUNCTIONS ====================
function formatCurrency(amount) {
  const symbol = appState.currency === 'USD' ? '$' : 'C$';
  return symbol + parseFloat(amount || 0).toFixed(2);
}

function updateAllDisplays() {
  updateDashboard();
  updateExpensesList();
  updateTotalIncome();
}

// ==================== DATA PERSISTENCE ====================
function saveDataToStorage() {
  const key = `expense-tracker-${appState.currentYear}-${appState.currentMonth}`;
  const data = {
    monthlyIncome: appState.monthlyIncome,
    oneToOneClients: appState.oneToOneClients,
    groupClients: appState.groupClients,
    investmentIncome: getInvestmentIncome(),
    otherIncome: getOtherIncome(),
    budgets: appState.budgets,
    expenses: appState.expenses.filter(exp => 
      exp.year === appState.currentYear && 
      exp.month === appState.currentMonth
    )
  };
  localStorage.setItem(key, JSON.stringify(data));
}

function loadDataFromStorage() {
  const key = `expense-tracker-${appState.currentYear}-${appState.currentMonth}`;
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  
  if (data.monthlyIncome !== undefined) {
    appState.monthlyIncome = data.monthlyIncome;
    document.getElementById('monthly-income').value = data.monthlyIncome;
  }
  
  if (data.oneToOneClients) {
    appState.oneToOneClients = data.oneToOneClients;
    renderOneToOneClients();
  }
  
  if (data.groupClients) {
    appState.groupClients = data.groupClients;
    renderGroupClients();
  }
  
  if (data.investmentIncome !== undefined) {
    document.getElementById('investment-income').value = data.investmentIncome;
  }
  
  if (data.otherIncome !== undefined) {
    document.getElementById('other-income').value = data.otherIncome;
  }
  
  if (data.budgets) {
    appState.budgets = data.budgets;
    BUDGET_CATEGORIES.forEach(category => {
      const inputId = `budget-${category.toLowerCase().replace(/\s+/g, '-')}`;
      const element = document.getElementById(inputId);
      if (element) {
        element.value = appState.budgets[category] || 0;
      }
    });
  }
  
  if (data.expenses) {
    appState.expenses = [
      ...appState.expenses.filter(exp => !(exp.year === appState.currentYear && exp.month === appState.currentMonth)),
      ...data.expenses
    ];
  }
  
  updateBudgetTotal();
}

// ==================== EXPORT FUNCTIONS ====================
function exportExpenses() {
  const monthExpenses = getCurrentMonthData();
  if (monthExpenses.length === 0) {
    alert('No expenses to export');
    return;
  }
  
  let csv = 'Date,Category,Amount,Description\n';
  monthExpenses.forEach(exp => {
    csv += `${exp.date},${exp.category},${exp.amount},"${exp.description || ''}"\n`;
  });
  
  downloadCSV(csv, `expenses-${appState.currentYear}-${appState.currentMonth + 1}.csv`);
}

function exportReport() {
  const totalIncome = getTotalIncomeFromBreakdown();
  const totalBudget = getTotalBudget();
  const totalSpent = getTotalExpenses();
  const remaining = totalBudget - totalSpent;
  
  let csv = 'Sahil\'s Expense Tracker - Monthly Report\n';
  csv += `Year: ${appState.currentYear}, Month: ${new Date(appState.currentYear, appState.currentMonth).toLocaleDateString('en-US', { month: 'long' })}\n\n`;
  csv += 'SUMMARY\n';
  csv += `Total Income,${totalIncome}\n`;
  csv += `Total Budget,${totalBudget}\n`;
  csv += `Total Spent,${totalSpent}\n`;
  csv += `Remaining,${remaining}\n\n`;
  csv += 'CATEGORY BREAKDOWN\n';
  csv += 'Category,Budget,Spent,Remaining\n';
  
  BUDGET_CATEGORIES.forEach(cat => {
    const budgeted = getCategoryBudget(cat);
    const spent = getCategoryExpense(cat);
    const rem = budgeted - spent;
    csv += `${cat},${budgeted},${spent},${rem}\n`;
  });
  
  downloadCSV(csv, `report-${appState.currentYear}-${appState.currentMonth + 1}.csv`);
}

function exportJSON() {
  const data = {
    year: appState.currentYear,
    month: appState.currentMonth,
    monthlyIncome: appState.monthlyIncome,
    oneToOneClients: appState.oneToOneClients,
    groupClients: appState.groupClients,
    investmentIncome: getInvestmentIncome(),
    otherIncome: getOtherIncome(),
    budgets: appState.budgets,
    expenses: getCurrentMonthData(),
    summary: {
      totalIncome: getTotalIncomeFromBreakdown(),
      totalBudget: getTotalBudget(),
      totalSpent: getTotalExpenses(),
      remainingBudget: getTotalBudget() - getTotalExpenses()
    }
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${appState.currentYear}-${appState.currentMonth + 1}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== CLEAR FUNCTIONS ====================
function clearMonthData() {
  if (confirm('Are you sure you want to clear all expenses for this month?')) {
    appState.expenses = appState.expenses.filter(exp => 
      !(exp.year === appState.currentYear && exp.month === appState.currentMonth)
    );
    saveDataToStorage();
    updateAllDisplays();
  }
}

function clearAllData() {
  if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
    appState.monthlyIncome = 0;
    appState.oneToOneClients = [];
    appState.groupClients = [];
    appState.budgets = {};
    appState.expenses = [];
    
    BUDGET_CATEGORIES.forEach(category => {
      appState.budgets[category] = 0;
    });
    
    document.getElementById('monthly-income').value = '';
    document.getElementById('investment-income').value = '';
    document.getElementById('other-income').value = '';
    
    BUDGET_CATEGORIES.forEach(category => {
      const inputId = `budget-${category.toLowerCase().replace(/\s+/g, '-')}`;
      document.getElementById(inputId).value = '';
    });
    
    renderOneToOneClients();
    renderGroupClients();
    
    localStorage.clear();
    updateAllDisplays();
  }
}

