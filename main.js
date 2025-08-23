// 1. Import functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, push, remove, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 2. Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9ue-yvTSJxIroO1W9JG75aoNfdeBKRtk",
  authDomain: "mytracker-42568.firebaseapp.com",
  projectId: "mytracker-42568",
  storageBucket: "mytracker-42568.firebasestorage.app",
  messagingSenderId: "531031706672",
  appId: "1:531031706672:web:0020bb279ca6d0576831f5",
  measurementId: "G-2V0W49BLK4"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const transactionsRef = ref(database, 'transactions');
const targetsRef = ref(database, 'targets');

// --- Get DOM Elements ---
const balance = document.getElementById('balance');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const totalSavings = document.getElementById('total-savings');
const incomeList = document.getElementById('income-list');
const expenseList = document.getElementById('expense-list');
const savingList = document.getElementById('saving-list');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const monthFilter = document.getElementById('month-filter');
const monthlySummary = document.getElementById('monthly-summary');
const addIncomeBtn = document.getElementById('add-income-btn');
const addExpenseBtn = document.getElementById('add-expense-btn');
const addSavingBtn = document.getElementById('add-saving-btn');
const incomeTargetInput = document.getElementById('income-target');
const expenseTargetInput = document.getElementById('expense-target');
const savingTargetInput = document.getElementById('saving-target');
const setTargetBtn = document.getElementById('set-target-btn');
const incomeProgressBar = document.getElementById('income-progress-bar');
const expenseProgressBar = document.getElementById('expense-progress-bar');
const savingProgressBar = document.getElementById('saving-progress-bar');
const incomeProgressText = document.getElementById('income-progress-text');
const expenseProgressText = document.getElementById('expense-progress-text');
const savingProgressText = document.getElementById('saving-progress-text');

// --- Global State Variables ---
let allTransactions = [];
let allTargets = {};
let isInitialDataLoaded = false;

// --- Firebase Data Listeners ---
onValue(transactionsRef, (snapshot) => {
    allTransactions = [];
    snapshot.forEach((childSnapshot) => {
        allTransactions.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    if (isInitialDataLoaded) {
        populateMonthFilter();
        updateUI();
    }
});

onValue(targetsRef, (snapshot) => {
    allTargets = snapshot.val() || {};
    if (isInitialDataLoaded) {
        populateMonthFilter();
        updateUI();
    }
});

// --- Main UI Update Function ---
function updateUI() {
    const selectedMonth = monthFilter.value;
    if (!selectedMonth) return;

    const monthlyTransactions = selectedMonth === 'all'
        ? allTransactions
        : allTransactions.filter(t => t.date && t.date.substring(0, 7) === selectedMonth);

    updateSummaryValues();
    updateTransactionLists(monthlyTransactions);
    updateMonthlyAnalysis(monthlyTransactions);
    updateTargetProgress(monthlyTransactions, selectedMonth);
}

// --- Data Manipulation Functions ---
function processTransaction(type) {
    if (!descriptionInput.value.trim() || !amountInput.value.trim() || !dateInput.value.trim()) {
        alert('Please fill all transaction fields: Description, Amount, and Date.');
        return;
    }
    const newTransaction = {
        description: descriptionInput.value,
        amount: Math.abs(+amountInput.value),
        date: dateInput.value,
        type: type
    };
    
    push(transactionsRef, newTransaction);
    
    descriptionInput.value = '';
    amountInput.value = '';
}

window.removeTransaction = function(id) {
    remove(ref(database, 'transactions/' + id));
}

function setTargets() {
    const selectedMonth = monthFilter.value;
    if (!selectedMonth || selectedMonth === 'all') {
        alert('Please select a specific month from the dropdown at the top first.');
        return;
    }
    const targetData = {
        income: +incomeTargetInput.value || 0,
        expense: +expenseTargetInput.value || 0,
        saving: +savingTargetInput.value || 0,
    };
    set(ref(database, `targets/${selectedMonth}`), targetData);
    alert(`Targets for ${monthFilter.options[monthFilter.selectedIndex].text} have been set!`);
}

// (The rest of the functions like updateSummaryValues, updateTransactionLists, etc. are below and have no changes)

function updateSummaryValues() {
    const income = allTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = allTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const savings = allTransactions.filter(t => t.type === 'saving').reduce((acc, t) => acc + t.amount, 0);
    balance.innerText = `Rs ${(income - expenses - savings).toFixed(2)}`;
    totalIncome.innerText = `Rs ${income.toFixed(2)}`;
    totalExpenses.innerText = `Rs ${expenses.toFixed(2)}`;
    totalSavings.innerText = `Rs ${savings.toFixed(2)}`;
}

function updateTransactionLists(transactionsToDisplay) {
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    savingList.innerHTML = '';
    const sortedTransactions = [...transactionsToDisplay].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedTransactions.forEach(transaction => {
        const item = document.createElement('li');
        item.classList.add(transaction.type);
        item.innerHTML = `
            ${transaction.description} <span>Rs ${transaction.amount.toFixed(2)}</span>
            <button class="delete-btn" onclick="removeTransaction('${transaction.id}')">x</button>
        `;
        if (transaction.type === 'income') incomeList.appendChild(item);
        else if (transaction.type === 'expense') expenseList.appendChild(item);
        else savingList.appendChild(item);
    });
}

function updateMonthlyAnalysis(monthlyTransactions) {
    if (monthFilter.value === 'all') {
        monthlySummary.innerHTML = '<p>Select a specific month to see its analysis.</p>';
        return;
    }
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const savings = monthlyTransactions.filter(t => t.type === 'saving').reduce((acc, t) => acc + t.amount, 0);
    monthlySummary.innerHTML = `
        <p><span>Income:</span> <span class="income-amount">Rs ${income.toFixed(2)}</span></p>
        <p><span>Expenses:</span> <span class="expense-amount">Rs ${expense.toFixed(2)}</span></p>
        <p><span>Savings:</span> <span class="saving-amount">Rs ${savings.toFixed(2)}</span></p>
        <p><strong><span>Net for month:</span> <span>Rs ${(income - expense - savings).toFixed(2)}</span></strong></p>
    `;
}

function updateTargetProgress(monthlyTransactions, selectedMonth) {
    const targets = allTargets[selectedMonth];
    incomeTargetInput.value = targets?.income || '';
    expenseTargetInput.value = targets?.expense || '';
    savingTargetInput.value = targets?.saving || '';
    if (selectedMonth === 'all' || !targets) {
        incomeProgressBar.style.width = '0%';
        expenseProgressBar.style.width = '0%';
        savingProgressBar.style.width = '0%';
        incomeProgressText.innerText = 'Select a month to see progress.';
        expenseProgressText.innerText = 'Select a month to see progress.';
        savingProgressText.innerText = 'Select a month to see progress.';
        return;
    }
    const currentIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const currentExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const currentSaving = monthlyTransactions.filter(t => t.type === 'saving').reduce((acc, t) => acc + t.amount, 0);
    const incomePercent = targets.income > 0 ? (currentIncome / targets.income) * 100 : 0;
    incomeProgressBar.style.width = `${Math.min(incomePercent, 100)}%`;
    incomeProgressText.innerText = `Rs ${currentIncome.toFixed(2)} / Rs ${targets.income.toFixed(2)}`;
    const expensePercent = targets.expense > 0 ? (currentExpense / targets.expense) * 100 : 0;
    expenseProgressBar.style.width = `${Math.min(expensePercent, 100)}%`;
    expenseProgressText.innerText = `Rs ${currentExpense.toFixed(2)} / Rs ${targets.expense.toFixed(2)}`;
    const savingPercent = targets.saving > 0 ? (currentSaving / targets.saving) * 100 : 0;
    savingProgressBar.style.width = `${Math.min(savingPercent, 100)}%`;
    savingProgressText.innerText = `Rs ${currentSaving.toFixed(2)} / Rs ${targets.saving.toFixed(2)}`;
}

function populateMonthFilter() {
    const currentSelected = monthFilter.value;
    const transactionMonths = allTransactions.map(t => t.date.substring(0, 7));
    const targetMonths = Object.keys(allTargets);
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const allMonthStrings = [...new Set([...transactionMonths, ...targetMonths, currentMonthStr])];
    allMonthStrings.sort().reverse();
    monthFilter.innerHTML = '<option value="all">All Time Summary</option>';
    allMonthStrings.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });
        monthFilter.appendChild(option);
    });
    if (currentSelected && allMonthStrings.includes(currentSelected)) {
        monthFilter.value = currentSelected;
    } else {
        monthFilter.value = currentMonthStr;
    }
}

// --- Event Listeners ---
addIncomeBtn.addEventListener('click', (e) => { e.preventDefault(); processTransaction('income'); });
addExpenseBtn.addEventListener('click', (e) => { e.preventDefault(); processTransaction('expense'); });
addSavingBtn.addEventListener('click', (e) => { e.preventDefault(); processTransaction('saving'); });
setTargetBtn.addEventListener('click', (event) => {
    event.preventDefault();
    setTargets();
});
monthFilter.addEventListener('change', updateUI);

// --- Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    dateInput.value = new Date().toISOString().slice(0, 10);
    populateMonthFilter();
    updateUI();
    isInitialDataLoaded = true;
});