document.addEventListener('DOMContentLoaded', function() {
    const BASE_URL = 'http://127.0.0.1:5000/api'; // Your Flask backend URL

    // --- Authentication Check (Apply to all pages except auth.html) ---
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'auth.html') {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            window.location.href = 'auth.html'; // Redirect to login if not authenticated
            return; // Stop further script execution
        }
        // Display username in header
        const usernameDisplay = document.querySelector('.user-profile span');
        if (usernameDisplay) {
            usernameDisplay.textContent = localStorage.getItem('username') || 'User';
        }
    }

    // --- Dynamic Year in Footer ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Common Form Logic (for both invoice and purchase forms) ---
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            input.value = `${year}-${month}-${day}`;
        }
    });

    // --- Invoice Form Specific Logic ---
    const invoiceItemsContainer = document.getElementById('invoice-items-container');
    const addItemBtn = document.querySelector('.add-item-btn');
    const subtotalSpan = document.getElementById('subtotal');
    const taxRateInput = document.getElementById('taxRate');
    const totalTaxSpan = document.getElementById('totalTax');
    const grandTotalSpan = document.getElementById('grandTotal');
    const saveInvoiceBtn = document.getElementById('save-invoice-btn');
    const resetInvoiceBtn = document.getElementById('reset-invoice-btn');
    const customerSuggestionsDatalist = document.getElementById('customer-suggestions');
    const productSuggestionsDatalist = document.getElementById('product-suggestions');

    // Mock Data for Suggestions (Ideally, these would come from backend APIs /api/customers, /api/products)
    const mockCustomers = [
        { name: 'ABC Auto Services', id: 'C001' },
        { name: 'Quick Fix Garage', id: 'C002' },
        { name: 'Speedy Repairs Ltd.', id: 'C003' },
        { name: 'City Auto Parts', id: 'C004' }
    ];

    const mockProducts = [
        { name: 'Oil Filter (Premium)', price: 1500.00 },
        { name: 'Spark Plugs (Set of 4)', price: 2500.00 },
        { name: 'Brake Pads (Front)', price: 4000.00 },
        { name: 'Car Battery (12V)', price: 7500.00 },
        { name: 'Engine Oil (5L Synthetic)', price: 3000.00 },
        { name: 'Air Filter', price: 800.00 }
    ];

    function populateDatalists() {
        if (customerSuggestionsDatalist) {
            mockCustomers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.name;
                customerSuggestionsDatalist.appendChild(option);
            });
        }
        if (productSuggestionsDatalist) {
            mockProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.name;
                productSuggestionsDatalist.appendChild(option);
            });
        }
    }

    function setDueDate() {
        const invoiceDateInput = document.getElementById('invoiceDate');
        const dueDateInput = document.getElementById('dueDate');
        if (invoiceDateInput && dueDateInput && invoiceDateInput.value) {
            const invoiceDate = new Date(invoiceDateInput.value);
            invoiceDate.setDate(invoiceDate.getDate() + 30);
            const year = invoiceDate.getFullYear();
            const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
            const day = String(invoiceDate.getDate()).padStart(2, '0');
            dueDateInput.value = `${year}-${month}-${day}`;
        }
    }

    function initializeInvoiceForm() {
        if (!invoiceItemsContainer) return;

        invoiceItemsContainer.innerHTML = '';
        itemCounter = 0;
        addInvoiceItemRow();

        if (subtotalSpan) subtotalSpan.textContent = '0.00';
        if (taxRateInput) taxRateInput.value = '0';
        if (totalTaxSpan) totalTaxSpan.textContent = '0.00';
        if (grandTotalSpan) grandTotalSpan.textContent = '0.00 KES';

        const invoiceDateInput = document.getElementById('invoiceDate');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        if (invoiceDateInput) invoiceDateInput.value = `${year}-${month}-${day}`;
        setDueDate();
    }

    let itemCounter = 0;

    function calculateTotals() {
        if (!invoiceItemsContainer) return;

        let subtotal = 0;
        document.querySelectorAll('.item-row').forEach(row => {
            const qtyInput = row.querySelector('[id^="itemQty-"]');
            const priceInput = row.querySelector('[id^="itemPrice-"]');
            const itemDescInput = row.querySelector('[id^="itemDesc-"]');

            const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
            let price = parseFloat(priceInput ? priceInput.value : 0) || 0;

            if (itemDescInput && productSuggestionsDatalist) {
                const selectedProductName = itemDescInput.value;
                const matchingProduct = mockProducts.find(p => p.name === selectedProductName);
                if (matchingProduct && priceInput.value === '0.00' && selectedProductName) {
                    price = matchingProduct.price;
                    priceInput.value = price.toFixed(2);
                }
            }

            const itemTotal = qty * price;
            const itemTotalSpan = row.querySelector('.item-calculated-total');
            if (itemTotalSpan) {
                itemTotalSpan.textContent = itemTotal.toFixed(2);
            }
            subtotal += itemTotal;
        });

        const taxRate = parseFloat(taxRateInput ? taxRateInput.value : 0) || 0;
        const totalTax = subtotal * (taxRate / 100);
        const grandTotal = subtotal + totalTax;

        if (subtotalSpan) subtotalSpan.textContent = subtotal.toFixed(2);
        if (totalTaxSpan) totalTaxSpan.textContent = totalTax.toFixed(2);

        const currencySelector = document.getElementById('currency');
        let displayCurrency = 'KES';
        if (currencySelector) {
            displayCurrency = currencySelector.value;
        }

        if (grandTotalSpan) grandTotalSpan.textContent = grandTotal.toFixed(2) + ' ' + displayCurrency;
    }

    function addInvoiceItemRow() {
        itemCounter++;
        const newRow = document.createElement('div');
        newRow.classList.add('item-row');
        newRow.innerHTML = `
            <div class="form-group item-description">
                <label for="itemDesc-${itemCounter}">Description:</label>
                <input type="text" id="itemDesc-${itemCounter}" placeholder="Service/Product" list="product-suggestions" required>
            </div>
            <div class="form-group item-quantity">
                <label for="itemQty-${itemCounter}">Qty:</label>
                <input type="number" id="itemQty-${itemCounter}" value="1" min="1" required>
            </div>
            <div class="form-group item-price">
                <label for="itemPrice-${itemCounter}">Unit Price:</label>
                <input type="number" id="itemPrice-${itemCounter}" step="0.01" value="0.00" required>
            </div>
            <div class="form-group item-total">
                <label>Total:</label>
                <span class="item-calculated-total">0.00</span>
            </div>
            <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
        `;
        invoiceItemsContainer.appendChild(newRow);

        newRow.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', calculateTotals);
        });
        newRow.querySelector('[id^="itemDesc-"]').addEventListener('change', calculateTotals);

        newRow.querySelector('.remove-item-btn').addEventListener('click', function() {
            newRow.remove();
            calculateTotals();
        });

        calculateTotals();
    }

    // --- Invoice Form Submission / Data Handling (Backend Integration) ---
    if (document.getElementById('invoice-form')) {
        populateDatalists();
        initializeInvoiceForm();

        if (taxRateInput) {
            taxRateInput.addEventListener('input', calculateTotals);
        }
        if (addItemBtn) {
            addItemBtn.addEventListener('click', addInvoiceItemRow);
        }
        const invoiceDateInput = document.getElementById('invoiceDate');
        if (invoiceDateInput) {
            invoiceDateInput.addEventListener('change', setDueDate);
        }

        if (saveInvoiceBtn) {
            saveInvoiceBtn.addEventListener('click', async function(event) {
                event.preventDefault();

                const form = document.getElementById('invoice-form');
                let isValid = true;
                document.querySelectorAll('.item-row').forEach(row => {
                    const desc = row.querySelector('[id^="itemDesc-"]').value.trim();
                    const qty = parseFloat(row.querySelector('[id^="itemQty-"]').value);
                    const price = parseFloat(row.querySelector('[id^="itemPrice-"]').value);

                    if (!desc || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
                        isValid = false;
                        alert('Please fill in all invoice item details correctly (description, quantity > 0, price >= 0).');
                        return;
                    }
                });

                if (isValid) {
                    const invoiceNumber = document.getElementById('invoiceNumber').value;
                    const invoiceDate = document.getElementById('invoiceDate').value;
                    const customerName = document.getElementById('customer').value;
                    const grandTotal = parseFloat(grandTotalSpan.textContent.replace(' KES', ''));

                    // --- IMPORTANT: Simplified Double-Entry for Invoice ---
                    // For a full accounting system, you would typically have a dedicated
                    // backend endpoint (e.g., POST /api/invoices) that handles the
                    // complex double-entry (e.g., Debit Accounts Receivable, Credit Sales Revenue, Credit Sales Tax Payable).
                    // Here, we're creating a single 'Sale' transaction.
                    // You MUST ensure 'Accounts Receivable' and 'Sales Revenue' accounts exist in your backend database
                    // and get their IDs. For this example, we'll use placeholder IDs (e.g., 1 and 2).
                    // In a real app, you'd fetch account IDs dynamically or map via names.

                    // Placeholder Account IDs (replace with actual IDs from your backend)
                    // You would need to create these accounts via your backend's /api/accounts endpoint first.
                    const ACCOUNTS_RECEIVABLE_ID = 1; // Example ID for an Asset account
                    const SALES_REVENUE_ID = 2;       // Example ID for a Revenue account

                    if (!ACCOUNTS_RECEIVABLE_ID || !SALES_REVENUE_ID) {
                        alert('Error: Please ensure Accounts Receivable and Sales Revenue accounts are set up in your backend and their IDs are correctly configured in the frontend script.');
                        return;
                    }

                    const authToken = localStorage.getItem('authToken');
                    if (!authToken) {
                        alert('You are not authenticated. Please log in.');
                        window.location.href = 'auth.html';
                        return;
                    }

                    const transactionData = {
                        description: `Invoice #${invoiceNumber} for ${customerName}`,
                        amount: grandTotal,
                        debit_account_id: ACCOUNTS_RECEIVABLE_ID,
                        credit_account_id: SALES_REVENUE_ID,
                        transaction_type: 'Sale',
                        date: invoiceDate // Use the invoice date for the transaction
                    };

                    try {
                        const response = await fetch(`${BASE_URL}/transactions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify(transactionData)
                        });

                        const data = await response.json();

                        if (response.ok) {
                            alert('Invoice recorded successfully!');
                            // Store data locally for invoice-display.html (temporary, should be backend-driven)
                            const invoiceDataForDisplay = {
                                invoiceNumber: invoiceNumber,
                                invoiceDate: invoiceDate,
                                customer: customerName,
                                dueDate: document.getElementById('dueDate').value,
                                items: [], // You'd need to fetch these from backend if not storing in localStorage
                                subtotal: subtotalSpan.textContent,
                                taxRate: taxRateInput.value,
                                totalTax: totalTaxSpan.textContent,
                                grandTotal: grandTotalSpan.textContent
                            };
                             document.querySelectorAll('.item-row').forEach(row => {
                                invoiceDataForDisplay.items.push({
                                    description: row.querySelector('[id^="itemDesc-"]').value,
                                    quantity: parseFloat(row.querySelector('[id^="itemQty-"]').value),
                                    unitPrice: parseFloat(row.querySelector('[id^="itemPrice-"]').value),
                                    total: parseFloat(row.querySelector('.item-calculated-total').textContent)
                                });
                            });
                            localStorage.setItem('currentInvoiceData', JSON.stringify(invoiceDataForDisplay));

                            window.open('invoice-display.html', '_blank');
                            form.reset();
                            initializeInvoiceForm();
                            // Ideally, you'd refresh dashboard data here if on dashboard
                        } else {
                            alert(`Failed to record invoice: ${data.message}`);
                        }
                    } catch (error) {
                        alert('Network error while recording invoice. Please check your backend server.');
                        console.error('Invoice recording error:', error);
                    }
                }
            });
        }

        if (resetInvoiceBtn) {
            resetInvoiceBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
                    document.getElementById('invoice-form').reset();
                    initializeInvoiceForm();
                }
            });
        }
    }

    // --- Purchase Form Specific Logic (Backend Integration) ---
    const purchaseForm = document.querySelector('form[action="#"]'); // Assuming the purchase form has no action
    if (purchaseForm && window.location.pathname.includes('purchase-form.html')) {
        purchaseForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const purchaseDate = document.getElementById('purchaseDate').value;
            const vendor = document.getElementById('vendor').value;
            const description = document.getElementById('description').value;
            const category = document.getElementById('category').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const paymentMethod = document.getElementById('paymentMethod').value;

            // Basic validation
            if (!purchaseDate || !vendor || !description || !category || isNaN(amount) || amount <= 0 || !paymentMethod) {
                alert('Please fill in all required purchase details correctly.');
                return;
            }

            // --- IMPORTANT: Simplified Double-Entry for Purchase ---
            // You MUST ensure an appropriate 'Expense' account (e.g., 'Office Supplies Expense', 'Fuel Expense')
            // and a 'Cash' or 'Bank' account exist in your backend database and get their IDs.
            // For this example, we'll use placeholder IDs.
            const CASH_BANK_ACCOUNT_ID = 3; // Example ID for an Asset account (Cash/Bank)
            let EXPENSE_ACCOUNT_ID;          // This should vary based on category

            // Map category to a specific expense account ID (you'd need to create these in backend)
            switch(category) {
                case 'office-supplies': EXPENSE_ACCOUNT_ID = 4; break; // Example ID for Office Supplies Expense
                case 'fuel': EXPENSE_ACCOUNT_ID = 5; break;          // Example ID for Fuel Expense
                case 'rent': EXPENSE_ACCOUNT_ID = 6; break;          // Example ID for Rent Expense
                case 'utilities': EXPENSE_ACCOUNT_ID = 7; break;     // Example ID for Utilities Expense
                case 'marketing': EXPENSE_ACCOUNT_ID = 8; break;     // Example ID for Marketing Expense
                default: EXPENSE_ACCOUNT_ID = 9; break;              // Example ID for Other Expenses
            }

            if (!CASH_BANK_ACCOUNT_ID || !EXPENSE_ACCOUNT_ID) {
                 alert('Error: Please ensure Cash/Bank and relevant Expense accounts are set up in your backend and their IDs are correctly configured in the frontend script.');
                 return;
            }

            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                alert('You are not authenticated. Please log in.');
                window.location.href = 'auth.html';
                return;
            }

            const transactionData = {
                description: `${description} (${vendor})`,
                amount: amount,
                debit_account_id: EXPENSE_ACCOUNT_ID,
                credit_account_id: CASH_BANK_ACCOUNT_ID,
                transaction_type: 'Expense',
                date: purchaseDate
            };

            try {
                const response = await fetch(`${BASE_URL}/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(transactionData)
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Purchase recorded successfully!');
                    purchaseForm.reset();
                    // Ideally, you'd refresh dashboard data here if on dashboard
                } else {
                    alert(`Failed to record purchase: ${data.message}`);
                }
            } catch (error) {
                alert('Network error while recording purchase. Please check your backend server.');
                console.error('Purchase recording error:', error);
            }
        });
    }

    // --- Dashboard Data Fetching (Backend Integration) ---
    const recentTransactionsTableBody = document.querySelector('.recent-activity table tbody');
    const currentCashBalanceWidget = document.querySelector('.widget-content .widget-value'); // Assuming this is for cash balance

    if (recentTransactionsTableBody && currentCashBalanceWidget) { // Only run if on dashboard page
        async function fetchDashboardData() {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                // Handled by initial auth check, but good to have here too
                return;
            }

            try {
                // Fetch Transactions
                const transactionsResponse = await fetch(`${BASE_URL}/transactions`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const transactionsData = await transactionsResponse.json();

                if (transactionsResponse.ok) {
                    recentTransactionsTableBody.innerHTML = ''; // Clear existing rows
                    transactionsData.slice(0, 5).forEach(trans => { // Displaying top 5 recent transactions
                        const row = document.createElement('tr');
                        const amountClass = trans.transaction_type === 'Sale' ? 'amount-in' : 'amount-out';
                        const statusClass = trans.transaction_type === 'Sale' ? 'status-paid' : 'status-completed'; // Simplified status
                        
                        row.innerHTML = `
                            <td>${trans.date.split('T')[0]}</td>
                            <td class="type-${trans.transaction_type.toLowerCase()}">${trans.transaction_type}</td>
                            <td>${trans.description}</td>
                            <td class="${amountClass}">${trans.amount.toFixed(2)}</td>
                            <td class="${statusClass}">Recorded</td>
                        `;
                        recentTransactionsTableBody.appendChild(row);
                    });
                } else {
                    console.error('Failed to fetch transactions:', transactionsData.message);
                }

                // Fetch Accounts for Cash Balance
                const accountsResponse = await fetch(`${BASE_URL}/accounts`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const accountsData = await accountsResponse.json();

                if (accountsResponse.ok) {
                    // Find a 'Cash' or 'Bank' account and display its balance
                    const cashAccount = accountsData.find(acc => acc.name === 'Cash' || acc.name === 'Bank Account'); // Adjust name as per your backend
                    if (cashAccount) {
                        currentCashBalanceWidget.textContent = `$${cashAccount.current_balance.toFixed(2)}`; // Assuming USD for display
                    } else {
                        currentCashBalanceWidget.textContent = '$0.00';
                        console.warn('Cash or Bank Account not found. Please create one in your backend.');
                    }
                } else {
                    console.error('Failed to fetch accounts:', accountsData.message);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        }
        fetchDashboardData();
    }

    // --- Dashboard Currency Selector Logic (from index.html) ---
    const currencySelector = document.getElementById('currency');
    if (currencySelector) {
        // This selector currently only affects display.
        // In a real app, it would filter/convert backend data.
        currencySelector.addEventListener('change', function() {
            // You would re-fetch data or convert displayed values here
            console.log('Currency changed to:', this.value);
            // Re-call fetchDashboardData() if you implement currency conversion on backend
        });
    }

    // --- Logout Functionality ---
    const logoutBtn = document.getElementById('logout-btn'); // You'll add this button in index.html
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            window.location.href = 'auth.html'; // Redirect to login page
        });
    }
});
