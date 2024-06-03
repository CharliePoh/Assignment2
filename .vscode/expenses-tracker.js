$(document).ready(function() {
    let currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    let usersData = JSON.parse(localStorage.getItem('usersData')) || {};
    if (!usersData[currentUser]) {
        usersData[currentUser] = { expenses: [] };
    }
    let expenses = usersData[currentUser].expenses || [];
    let editingIndex = null;
    let currentMonth = new Date().toISOString().slice(0, 7);
    let currentView = 'monthly';  // 'monthly' or 'yearly'

    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function updateLocalStorage() {
        usersData[currentUser].expenses = expenses;
        localStorage.setItem('usersData', JSON.stringify(usersData));
    }

    function renderExpenses() {
        $('#expenseList').empty();
        let totalExp = 0;
        const filteredExpenses = expenses.filter(expense => expense.date.startsWith(currentMonth));
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredExpenses.forEach((expense, index) => {
            totalExp += parseFloat(expense.amount);
            $('#expenseList').append(`
                <li class="list-group-item expense-item" data-index="${index}">
                    <div>${new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' })}</div>
                    <div class="amount">RM ${parseFloat(expense.amount).toFixed(2)}</div>
                    <div class="w-100"><strong>Category:</strong> ${expense.category}</div>
                    <div class="w-100">${expense.description}</div>
                </li>
            `);
        });

        $('#totalExp').text(`RM ${totalExp.toFixed(2)}`);
    }

    function showForm(isEdit = false) {
        $('#mainInterface').hide();
        $('#expenseForm').show();
        if (isEdit) {
            $('#formTitle').text('Edit Expense');
        } else {
            $('#formTitle').text('Add Expense');
        }
    }

    function hideForm() {
        $('#expenseForm').hide();
        $('#mainInterface').show();
        $('#saveMessage').hide();
        $('#editMessage').hide();
        $('#deleteMessage').hide();
    }

    function showSummary() {
        $('#mainInterface').hide();
        $('#summary').show();
        renderSummaryChart();
    }

    function updateExpensesAndRender() {
        updateLocalStorage();
        renderExpenses();
        renderSummaryChart();
    }

    function renderSummaryChart() {
        const ctx = $('#summaryChart');
        const categoryTotals = {};
        let totalExpense = 0;
    
        if (currentView === 'monthly') {
            const filteredExpenses = expenses.filter(expense => expense.date.startsWith(currentMonth));
            filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
            filteredExpenses.forEach(expense => {
                categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount);
                totalExpense += parseFloat(expense.amount);
            });
    
            const labels = Object.keys(categoryTotals);
            const data = Object.values(categoryTotals);
    
            if (ctx.data('chart')) {
                ctx.data('chart').destroy();
            }
    
            if (labels.length === 0) {
                ctx.empty();
                ctx.append('<div class="text-center" style="color: #ccc; font-size: 16px;">No data available</div>');
            } else {
                const newChart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Expense Summary',
                            data: data,
                            backgroundColor: [
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(255, 99, 132, 0.2)'
                            ],
                            borderColor: [
                                'rgba(75, 192, 192, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(255, 99, 132, 1)'
                            ],
                            borderWidth: 1
                        }]
                    }
                });
    
                $('#totalExpense').remove();
                const totalExpenseElement = document.createElement('div');
                totalExpenseElement.id = 'totalExpense';
                totalExpenseElement.textContent = 'Total Monthly Expense: RM ' + totalExpense.toFixed(2);
                totalExpenseElement.style.fontSize = '16px';
                totalExpenseElement.style.marginTop = '10px';
                totalExpenseElement.style.color = 'red';
                totalExpenseElement.style.backgroundColor = 'white';
                totalExpenseElement.style.padding = '5px';
                document.getElementById('summary').appendChild(totalExpenseElement);
    
                const backButton = document.getElementById('backBtn');
                document.getElementById('summary').appendChild(backButton);
    
                ctx.data('chart', newChart);
            }
        } else if (currentView === 'yearly') {
            const currentYear = new Date().getFullYear();
            const filteredExpenses = expenses.filter(expense => new Date(expense.date).getFullYear() === currentYear);
        
            filteredExpenses.forEach(expense => {
                const month = new Date(expense.date).toLocaleString('default', { month: 'long' });
                categoryTotals[month] = (categoryTotals[month] || 0) + parseFloat(expense.amount);
                totalExpense += parseFloat(expense.amount);
            });
        
            const labels = Object.keys(categoryTotals);
            const data = Object.values(categoryTotals);
        
            if (ctx.data('chart')) {
                ctx.data('chart').destroy();
            }
        
            if (labels.length === 0) {
                ctx.empty();
                ctx.append('<div class="text-center" style="color: #ccc; font-size: 16px;">No data available</div>');
            } else {
                // Determine device pixel ratio dynamically
                const devicePixelRatio = window.devicePixelRatio || 1;
        
                const newChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Monthly Expense Summary',
                            data: data,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                            fill: false,
                            tension: 0.1
                        }]
                    },
                    options: {
                        devicePixelRatio: devicePixelRatio // Set the device pixel ratio
                    }
                });
        
                $('#totalExpense').remove();
                const totalExpenseElement = document.createElement('div');
                totalExpenseElement.id = 'totalExpense';
                totalExpenseElement.textContent = 'Total Annual Expense: RM ' + totalExpense.toFixed(2);
                totalExpenseElement.style.fontSize = '16px';
                totalExpenseElement.style.marginTop = '10px';
                totalExpenseElement.style.color = 'red';
                totalExpenseElement.style.backgroundColor = 'white';
                totalExpenseElement.style.padding = '5px';
                document.getElementById('summary').appendChild(totalExpenseElement);
        
                const backButton = document.getElementById('backBtn');
                document.getElementById('summary').appendChild(backButton);
        
                ctx.data('chart', newChart);
            }
        }
        
    }    

    function hideSummary() {
        $('#summary').hide();
        $('#mainInterface').show();
    }

    function updateMonthDisplay() {
        const [year, month] = currentMonth.split('-');
        $('#monthDisplay').text(new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }));
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${year}-${month}-${day}`;
    }

    $('#addExpenseBtn').click(function() {
        editingIndex = null;
        $('#expenseAmount').val('');
        $('#expenseDate').val(getCurrentDate());
        $('#expenseCategory').val('');
        $('#expenseDescription').val('');
        $('#deleteBtn').hide();
        showForm(false);
    });

    $('#cancelBtn').click(function() {
        hideForm();
    });

    $('#backBtn').click(function() {
        hideSummary();
    });

    $('#expenseForm form').submit(function(event) {
        event.preventDefault();
        const amount = $('#expenseAmount').val();
        const date = $('#expenseDate').val();
        const category = $('#expenseCategory').val();
        const description = $('#expenseDescription').val();

        if (editingIndex === null) {
            expenses.push({ amount, date, category, description });
            $('#saveMessage').show();
        } else {
            expenses[editingIndex] = { amount, date, category, description };
            $('#editMessage').show();
        }

        updateExpensesAndRender();
        editingIndex = null;

        setTimeout(() => {
            hideForm();
        }, 1000);
    });

    $('#expenseList').on('click', '.expense-item', function() {
        editingIndex = $(this).data('index');
        const expense = expenses[editingIndex];
        $('#expenseAmount').val(expense.amount);
        $('#expenseDate').val(formatDate(expense.date));
        $('#expenseCategory').val(expense.category);
        $('#expenseDescription').val(expense.description);
        $('#deleteBtn').show();
        showForm(true);
    });

    $('#deleteBtn').click(function() {
        if (editingIndex !== null) {
            expenses.splice(editingIndex, 1);
            $('#deleteMessage').show();
            updateExpensesAndRender();
            setTimeout(() => {
                hideForm();
            }, 1000);
        }
    });

    $('#viewSummaryBtn').click(function() {
        showSummary();
    });

    $('#monthlyViewBtn').click(function() {
        currentView = 'monthly';
        $('#monthlyViewBtn').removeClass('btn-secondary').addClass('btn-primary');
        $('#yearlyViewBtn').removeClass('btn-primary').addClass('btn-secondary');
        renderSummaryChart();
    });

    $('#yearlyViewBtn').click(function() {
        currentView = 'yearly';
        $('#monthlyViewBtn').removeClass('btn-primary').addClass('btn-secondary');
        $('#yearlyViewBtn').removeClass('btn-secondary').addClass('btn-primary');
        renderSummaryChart();
    });

    $('#prevMonthBtn').click(function() {
        const [year, month] = currentMonth.split('-');
        const prevMonth = new Date(year, month - 1, 0);
        currentMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        updateMonthDisplay();
        renderExpenses();
    });

    $('#nextMonthBtn').click(function() {
        const [year, month] = currentMonth.split('-');
        const nextMonth = new Date(year, parseInt(month), 1);
        currentMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
        updateMonthDisplay();
        renderExpenses();
    });

    updateMonthDisplay();
    renderExpenses();
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    window.location.href = 'index.html';
});
