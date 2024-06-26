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

    function getIconPath(category) {
        switch (category) {
            case 'Shops':
                return 'Icons/online-shopping.png';
            case 'Food and Drink':
                return 'Icons/food.png';
            case 'Bills':
                return 'Icons/bill.png';
            case 'Others':
                return 'Icons/other.png';
            default:
                return 'Icons/other.png';
        }
    }

    function renderExpenses() {
        $('#expenseList').empty();
        let totalExp = 0;
        const filteredExpenses = expenses.filter(expense => expense.date.startsWith(currentMonth));
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        filteredExpenses.forEach((expense, index) => {
            const iconPath = getIconPath(expense.category);
            totalExp += parseFloat(expense.amount);
            const expenseIndex = expenses.indexOf(expense);  // Get the original index of the expense
            $('#expenseList').append(`
                <li class="list-group-item expense-item d-flex align-items-center" data-id="${expenseIndex}">
                    <div>
                        <img src="${iconPath}" alt="${expense.category}" style="width: 35px; height: 35px; margin-right: 10px; float: left; position: absolute;">
                        <div style="margin-left: 50px;">
                            <div>${new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' })}</div>
                            <div class="w-100"><strong>${expense.description}</strong> (<strong>${expense.category}</strong>)</div>
                        </div>
                    </div>
                    <div>
                        <div class="amount">RM ${parseFloat(expense.amount).toFixed(2)}</div>      
                    </div>
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
        renderSummaryChart(); // Update the summary chart after any change in expenses
    }

    function renderSummaryChart() {
        const ctx = $('#summaryChart');
        const chartType = ctx.data('chartType') || 'monthly';

        if (chartType === 'monthly') {
            renderMonthlySummaryChart(ctx);
        } else if (chartType === 'yearly') {
            renderYearlySummaryChart(ctx);
        }
    }

    function renderMonthlySummaryChart(ctx) {
        const categoryTotals = {};
        let totalExpense = 0;
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
                            'rgba(75, 192, 192, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(255, 99, 132, 1)'
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

            ctx.data('chart', newChart);
        }

        $('#totalExpense').remove();
        ctx.after(`<div id="totalExpense" style="font-size: 16px; margin-top: 10px; color: red; background-color: white; padding: 5px;">Total Monthly Expense: RM ${totalExpense.toFixed(2)}</div>`);
    }

    function renderYearlySummaryChart(ctx) {
        const monthlyTotals = {};
        const currentYear = currentMonth.split('-')[0];
        let totalExpense = 0;

        expenses.forEach(expense => {
            const expenseYear = expense.date.split('-')[0];
            if (expenseYear === currentYear) {
                const month = expense.date.split('-')[1];
                monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(expense.amount);
                totalExpense += parseFloat(expense.amount);
            }
        });

        const labels = Object.keys(monthlyTotals).sort();
        const data = labels.map(month => monthlyTotals[month]);

        if (ctx.data('chart')) {
            ctx.data('chart').destroy();
        }

        if (labels.length === 0) {
            ctx.empty();
            ctx.append('<div class="text-center" style="color: #ccc; font-size: 16px;">No data available</div>');
        } else {
            const newChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels.map(month => new Date(currentYear, month - 1).toLocaleString('default', { month: 'long' })),
                    datasets: [{
                        label: 'Monthly Expenses',
                        data: data,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 1,
                        fill: true
                    }]
                }
            });

            ctx.data('chart', newChart);
        }

        $('#totalExpense').remove();
        ctx.after(`<div id="totalExpense" style="font-size: 16px; margin-top: 10px; color: red; background-color: white; padding: 5px;">Total Yearly Expense: RM ${totalExpense.toFixed(2)}</div>`);
    }

    function updateButtonColors(selectedButtonId) {
        const buttons = ['#viewMonthlySummaryBtn', '#viewYearlySummaryBtn'];
        buttons.forEach(buttonId => {
            if (buttonId === selectedButtonId) {
                $(buttonId).css('background-color', 'greenyellow');
                $(buttonId).css('color', 'black');
            } else {
                $(buttonId).css('background-color', '');
                $(buttonId).css('color', '');
            }
        });
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

    //add function
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

    //submit form
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
            hideForm();  // Hide the form and confirmation message after 700 milliseconds
        }, 700); 

        renderSummaryChart();
    });

    $('#expenseList').on('click', '.expense-item', function() {
        const expenseIndex = $(this).data('id');
        const expense = expenses[expenseIndex];
        editingIndex = expenseIndex;
    
        $('#expenseAmount').val(expense.amount);
        $('#expenseDate').val(formatDate(expense.date));
        $('#expenseCategory').val(expense.category);
        $('#expenseDescription').val(expense.description);
        $('#deleteBtn').show();
        showForm(true);
    });    

    // delete function
    $('#deleteBtn').click(function() {
        if (editingIndex !== null) {
            expenses.splice(editingIndex, 1);
            updateExpensesAndRender();
            editingIndex = null;
            $('#deleteMessage').show();
            setTimeout(() => {
                hideForm();
            }, 700); // Hide the form and confirmation message after 700 milliseconds
            renderSummaryChart();
        }
    });

    $('#viewMonthlySummaryBtn').click(function() {
        $('#totalExpense').remove();
        $('#summaryChart').data('chartType', 'monthly');
        updateButtonColors('#viewMonthlySummaryBtn');
        renderSummaryChart();
    });

    $('#viewYearlySummaryBtn').click(function() {
        $('#totalExpense').remove();
        $('#summaryChart').data('chartType', 'yearly');
        updateButtonColors('#viewYearlySummaryBtn');
        renderSummaryChart();
    });

    $('#viewSummaryBtn').click(function() {
        $('#totalExpense').remove(); // Clear the previous total expense display
        $('#summaryChart').data('chartType', 'monthly');
        updateButtonColors('#viewMonthlySummaryBtn');
        showSummary();
    });

    $('#prevMonthBtn').click(function() {
        currentMonth = new Date(new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() - 1)).toISOString().slice(0, 7);
        updateMonthDisplay();
        renderExpenses();
        renderSummaryChart();
    });

    $('#nextMonthBtn').click(function() {
        currentMonth = new Date(new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() + 1)).toISOString().slice(0, 7);
        updateMonthDisplay();
        renderExpenses();
        renderSummaryChart();
    });

    updateMonthDisplay();
    renderExpenses();
});

    document.getElementById('logoutBtn').addEventListener('click', function() {
    window.location.href = 'index.html';
});
