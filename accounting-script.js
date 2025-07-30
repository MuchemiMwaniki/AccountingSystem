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
    const subtotalSpan = document.getElementById('subtotal'); // This will now be Net Subtotal
    const taxRateInput = document.getElementById('taxRate');
    const totalTaxSpan = document.getElementById('totalTax'); // This will now be VAT Total
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
        if (taxRateInput) taxRateInput.value = '16'; // Default VAT to 16%
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

        let totalGrossAmount = 0; // Sum of all item totals (inclusive of VAT)
        let totalNetSubtotal = 0; // Sum of all item net totals (exclusive of VAT)
        let totalVATAmount = 0;   // Sum of all item VAT amounts

        const taxRate = parseFloat(taxRateInput ? taxRateInput.value : 0) || 0;
        const taxFactor = 1 + (taxRate / 100); // e.g., 1.16 for 16% VAT

        document.querySelectorAll('.item-row').forEach(row => {
            const qtyInput = row.querySelector('[id^="itemQty-"]');
            const priceInput = row.querySelector('[id^="itemPrice-"]'); // This is the GROSS unit price
            const itemDescInput = row.querySelector('[id^="itemDesc-"]');

            const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
            let grossUnitPrice = parseFloat(priceInput ? priceInput.value : 0) || 0;

            if (itemDescInput && productSuggestionsDatalist) {
                const selectedProductName = itemDescInput.value;
                const matchingProduct = mockProducts.find(p => p.name === selectedProductName);
                if (matchingProduct && grossUnitPrice === 0 && selectedProductName) { // Only pre-fill if price is 0
                    grossUnitPrice = matchingProduct.price;
                    priceInput.value = grossUnitPrice.toFixed(2);
                }
            }

            const grossItemTotal = qty * grossUnitPrice; // Total for this item, inclusive of VAT
            const netItemTotal = grossItemTotal / taxFactor; // Net total for this item
            const itemVATAmount = grossItemTotal - netItemTotal; // VAT amount for this item

            const itemTotalSpan = row.querySelector('.item-calculated-total');
            if (itemTotalSpan) {
                // Display the gross total for the item row
                itemTotalSpan.textContent = grossItemTotal.toFixed(2);
            }

            totalGrossAmount += grossItemTotal;
            totalNetSubtotal += netItemTotal;
            totalVATAmount += itemVATAmount;
        });

        // Update summary spans
        if (subtotalSpan) subtotalSpan.textContent = totalNetSubtotal.toFixed(2); // This is now Net Subtotal
        if (totalTaxSpan) totalTaxSpan.textContent = totalVATAmount.toFixed(2);   // This is now VAT Total

        const currencySelector = document.getElementById('currency');
        let displayCurrency = 'KES';
        if (currencySelector) {
            displayCurrency = currencySelector.value;
        }

        // Grand Total remains the total gross amount
        if (grandTotalSpan) grandTotalSpan.textContent = totalGrossAmount.toFixed(2) + ' ' + displayCurrency;
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
                <label for="itemPrice-${itemCounter}">Unit Price (Inc. VAT):</label>
                <input type="number" id="itemPrice-${itemCounter}" step="0.01" value="0.00" required>
            </div>
            <div class="form-group item-total">
                <label>Total (Inc. VAT):</label>
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
                const invoiceItems = []; // Array to store item details for backend
                document.querySelectorAll('.item-row').forEach(row => {
                    const desc = row.querySelector('[id^="itemDesc-"]').value.trim();
                    const qty = parseFloat(row.querySelector('[id^="itemQty-"]').value);
                    const price = parseFloat(row.querySelector('[id^="itemPrice-"]').value); // This is gross price
                    const itemTotal = parseFloat(row.querySelector('.item-calculated-total').textContent); // This is gross item total

                    if (!desc || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
                        isValid = false;
                        alert('Please fill in all invoice item details correctly (description, quantity > 0, price >= 0).');
                        return;
                    }
                    invoiceItems.push({ description: desc, quantity: qty, unitPrice: price, total: itemTotal });
                });

                if (isValid) {
                    const invoiceNumber = document.getElementById('invoiceNumber').value;
                    const invoiceDate = document.getElementById('invoiceDate').value;
                    const customerName = document.getElementById('customer').value;
                    const dueDate = document.getElementById('dueDate').value; // Get due date
                    const grandTotal = parseFloat(grandTotalSpan.textContent.replace(' KES', '')); // This is the total GROSS amount
                    const netSubtotal = parseFloat(subtotalSpan.textContent); // This is the calculated NET subtotal
                    const totalVATAmount = parseFloat(totalTaxSpan.textContent); // This is the calculated VAT total
                    const taxRate = parseFloat(taxRateInput.value);

                    // IMPORTANT: Updated Account IDs based on your provided list
                    const ACCOUNTS_RECEIVABLE_ID = 7; // From your list: "Accounts Receivable", "id": 7
                    const SALES_REVENUE_ID = 8;       // From your list: "Sales Revenue", "id": 8
                    const VAT_PAYABLE_ID = 13;        // From your list: "VAT Payable", "id": 13

                    if (!ACCOUNTS_RECEIVABLE_ID || !SALES_REVENUE_ID || !VAT_PAYABLE_ID) {
                        alert('Error: Please ensure Accounts Receivable, Sales Revenue, AND VAT Payable accounts are set up in your backend and their IDs are correctly configured in the frontend script.');
                        return;
                    }

                    const authToken = localStorage.getItem('authToken');
                    if (!authToken) {
                        alert('You are not authenticated. Please log in.');
                        window.location.href = 'auth.html';
                        return;
                    }

                    // Prepare common invoice data to be stored with the transaction
                    const commonInvoiceData = {
                        invoice_number: invoiceNumber,
                        customer_name: customerName,
                        due_date: dueDate,
                        items_json: JSON.stringify(invoiceItems), // Store items as JSON string
                        tax_rate: taxRate,
                        net_subtotal: netSubtotal,
                        total_vat_amount: totalVATAmount,
                        grand_total: grandTotal
                    };

                    // --- Send two transactions to backend for double-entry ---
                    // 1. Record the Sale (Net Amount)
                    const salesTransactionData = {
                        description: `Sale (Net) for Invoice #${invoiceNumber} to ${customerName}`,
                        amount: netSubtotal, // Send the NET amount for Sales Revenue
                        debit_account_id: ACCOUNTS_RECEIVABLE_ID,
                        credit_account_id: SALES_REVENUE_ID,
                        transaction_type: 'Sale',
                        date: invoiceDate,
                        ...commonInvoiceData // Include all invoice details
                    };

                    // 2. Record the VAT component (if any)
                    const vatTransactionData = {
                        description: `VAT for Invoice #${invoiceNumber}`,
                        amount: totalVATAmount, // Send the VAT amount
                        debit_account_id: ACCOUNTS_RECEIVABLE_ID, // Customer owes this VAT
                        credit_account_id: VAT_PAYABLE_ID,         // This is a liability to the tax authority
                        transaction_type: 'VAT Collection',
                        date: invoiceDate,
                        ...commonInvoiceData // Include all invoice details
                    };

                    try {
                        let salesTransactionId = null;
                        // Send Sales Transaction
                        const salesResponse = await fetch(`${BASE_URL}/transactions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify(salesTransactionData)
                        });
                        const salesData = await salesResponse.json();

                        if (salesResponse.ok) {
                            salesTransactionId = salesData.transaction_id; // Get the ID of the created sales transaction
                        } else {
                            alert(`Failed to record sales portion of invoice: ${salesData.message}`);
                            return; // Stop if first transaction fails
                        }

                        // Send VAT Transaction (only if VAT > 0)
                        if (totalVATAmount > 0) {
                            const vatResponse = await fetch(`${BASE_URL}/transactions`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${authToken}`
                                },
                                body: JSON.stringify(vatTransactionData)
                            });
                            const vatData = await vatResponse.json();

                            if (!vatResponse.ok) {
                                alert(`Failed to record VAT portion of invoice: ${vatData.message}`);
                                // Consider rolling back the sales transaction here if VAT fails
                                return; // Stop if second transaction fails
                            }
                        }

                        alert('Invoice recorded successfully (Net & VAT components)!');
                        // Redirect to invoice display page using the ID of the sales transaction
                        if (salesTransactionId) {
                            window.open(`invoice-display.html?id=${salesTransactionId}`, '_blank');
                        } else {
                            // Fallback if salesTransactionId is somehow null (shouldn't happen with salesResponse.ok check)
                            window.open('invoice-display.html', '_blank');
                        }
                        form.reset();
                        initializeInvoiceForm();
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
            // Updated Account IDs based on your provided list
            const CASH_BANK_ACCOUNT_ID = 9; // From your list: "Cash", "id": 9
            let EXPENSE_ACCOUNT_ID;          // This should vary based on category

            // Map category to a specific expense account ID (you'd need to create these in backend)
            switch(category) {
                case 'office-supplies': EXPENSE_ACCOUNT_ID = 10; break; // From your list: "Office Supplies Expense", "id": 10
                case 'fuel': EXPENSE_ACCOUNT_ID = 11; break;          // From your list: "Fuel Expense", "id": 11
                case 'rent': EXPENSE_ACCOUNT_ID = 12; break;          // From your list: "Rent Expense", "id": 12
                // Add more cases here if you create other specific expense accounts
                // For example:
                // case 'utilities': EXPENSE_ACCOUNT_ID = YOUR_UTILITIES_ID; break;
                // case 'marketing': EXPENSE_ACCOUNT_ID = YOUR_MARKETING_ID; break;
                default: EXPENSE_ACCOUNT_ID = 10; break; // Default to Office Supplies if no specific match
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
    const totalRevenueWidget = document.querySelector('.dashboard-widgets .widget:nth-child(1) .widget-value');
    const totalExpensesWidget = document.querySelector('.dashboard-widgets .widget:nth-child(2) .widget-value');
    const currentCashBalanceWidget = document.querySelector('.dashboard-widgets .widget:nth-child(3) .widget-value');
    const outstandingInvoicesWidget = document.querySelector('.dashboard-widgets .widget:nth-child(4) .widget-value');


    if (recentTransactionsTableBody && currentCashBalanceWidget) { // Only run if on dashboard page
        async function fetchDashboardData() {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
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
                    let totalRevenue = 0;
                    let totalExpenses = 0;
                    let outstandingInvoicesCount = 0;
                    let outstandingInvoicesAmount = 0;

                    transactionsData.forEach(trans => {
                        const row = document.createElement('tr');
                        const amountClass = trans.transaction_type === 'Sale' ? 'amount-in' : 'amount-out';
                        const statusClass = trans.transaction_type === 'Sale' ? 'status-paid' : 'status-completed'; // Simplified status

                        row.innerHTML = `
                            <td>${trans.date.split('T')[0]}</td>
                            <td class="type-${trans.transaction_type.toLowerCase()}">${trans.transaction_type}</td>
                            <td>${trans.description}</td>
                            <td class="${amountClass}">${trans.amount.toFixed(2)}</td>
                            <td class="${statusClass}">Recorded</td>
                            <td>
                                ${trans.transaction_type === 'Sale' ?
                                    `<button class="action-btn view-invoice-btn" data-transaction-id="${trans.id}" title="View/Print Invoice"><i class="fas fa-print"></i></button>` : ''}
                            </td>
                        `;
                        recentTransactionsTableBody.appendChild(row);

                        // Calculate dashboard widget values
                        if (trans.transaction_type === 'Sale') {
                            totalRevenue += trans.amount;
                            outstandingInvoicesCount++; // Simplified: all sales are outstanding for now
                            outstandingInvoicesAmount += trans.amount;
                        } else if (trans.transaction_type === 'Expense') {
                            totalExpenses += trans.amount;
                        }
                    });

                    // Add event listeners for view/print buttons
                    document.querySelectorAll('.view-invoice-btn').forEach(button => {
                        button.addEventListener('click', function() {
                            const transactionId = this.dataset.transactionId;
                            if (transactionId) {
                                window.open(`invoice-display.html?id=${transactionId}`, '_blank');
                            }
                        });
                    });


                    // Update dashboard widgets
                    if (totalRevenueWidget) totalRevenueWidget.textContent = `$${totalRevenue.toFixed(2)}`;
                    if (totalExpensesWidget) totalExpensesWidget.textContent = `$${totalExpenses.toFixed(2)}`;
                    if (outstandingInvoicesWidget) outstandingInvoicesWidget.textContent = `${outstandingInvoicesCount} ($${outstandingInvoicesAmount.toFixed(2)})`;

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
