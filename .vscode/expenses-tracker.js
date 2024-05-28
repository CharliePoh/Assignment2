$(document).ready(function() {
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
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
        localStorage.setItem('expenses', JSON.stringify(expenses));
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
        renderSummaryChart(); // Update the summary chart after any change in expenses
    }

    function renderSummaryChart() {
        const ctx = $('#summaryChart');
        const categoryTotals = {};
        let totalExpense = 0; // Initialize totalExpense variable
        const currentUser = localStorage.getItem('currentUser');
        const filteredExpenses = expenses.filter(expense => expense.username === currentUser && expense.date.startsWith(currentMonth));
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
        // Calculate total expense and category totals
        filteredExpenses.forEach(expense => {
            categoryTotals[expense.description] = (categoryTotals[expense.description] || 0) + parseFloat(expense.amount);
            totalExpense += parseFloat(expense.amount);
        });
    
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
    
        // Destroy previous chart instance if exists
        if (ctx.data('chart')) {
            ctx.data('chart').destroy();
        }
    
        if (labels.length === 0) {
            // If there is no data, display an empty frame
            ctx.empty();
            ctx.append('<div class="text-center" style="color: #ccc; font-size: 16px;">No data available</div>');
        } else {
            // If there is data, render the pie chart
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
    
            // Remove any existing total expense element before adding a new one
            $('#totalExpense').remove();
    
            const totalExpenseElement = document.createElement('div');
            totalExpenseElement.id = 'totalExpense'; // Add an ID for easier reference
            totalExpenseElement.textContent = 'Total Expense: RM ' + totalExpense.toFixed(2);
            totalExpenseElement.style.fontSize = '16px';
            totalExpenseElement.style.marginTop = '10px';
            totalExpenseElement.style.color = 'red'; // Set text color to red
            totalExpenseElement.style.backgroundColor = 'white'; // Add border with red color
            totalExpenseElement.style.padding = '5px'; // Add some padding for better appearance
            document.getElementById('summary').appendChild(totalExpenseElement);
    
            const backButton = document.getElementById('backBtn');
            document.getElementById('summary').appendChild(backButton);
    
            ctx.data('chart', newChart); // Save the new chart instance
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
        const description = $('#expenseDescription').val();
        const currentUser = localStorage.getItem('currentUser');

        if (editingIndex === null) {
            expenses.push({ amount, date, description });
            $('#saveMessage').show();
        } else {
            expenses[editingIndex] = { amount, date, description };
            $('#editMessage').show();
        }

        updateExpensesAndRender();
        editingIndex = null;

        setTimeout(() => {
            hideForm();  // Hide the form and confirmation message after 2 seconds
        }, 700);  // Adjust the delay as needed

        renderSummaryChart();
    });

    $('#expenseList').on('click', '.expense-item', function() {
        const listIndex = $(this).data('index');
        const filteredExpenses = expenses.filter(expense => expense.date.startsWith(currentMonth));
        const expense = filteredExpenses[listIndex];
        editingIndex = expenses.findIndex(e => e === expense);
        
        $('#expenseAmount').val(expense.amount);
        $('#expenseDate').val(formatDate(expense.date));
        $('#expenseDescription').val(expense.description);
        $('#deleteBtn').show();
        showForm(true);
    });

    $('#deleteBtn').click(function() {
        if (editingIndex !== null) {
            expenses.splice(editingIndex, 1);
            updateExpensesAndRender();
            editingIndex = null;
            $('#deleteMessage').show();
            setTimeout(() => {
                hideForm();
            }, 700); // Hide the form and confirmation message after 2 seconds
            renderSummaryChart();
        }
    });

    $('#viewSummaryBtn').click(function() {
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