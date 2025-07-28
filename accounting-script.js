document.addEventListener('DOMContentLoaded', function() {
    // Dynamic Year in Footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Common Form Logic (for both invoice and purchase forms) ---
    // Set current date for date inputs
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
    const saveInvoiceBtn = document.getElementById('save-invoice-btn'); // New ID
    const resetInvoiceBtn = document.getElementById('reset-invoice-btn');
    const customerSuggestionsDatalist = document.getElementById('customer-suggestions');
    const productSuggestionsDatalist = document.getElementById('product-suggestions');

    // Mock Data for Suggestions (in a real app, this would come from a backend API)
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

    // Function to populate datalists
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

    // Function to set due date (e.g., 30 days from invoice date)
    function setDueDate() {
        const invoiceDateInput = document.getElementById('invoiceDate');
        const dueDateInput = document.getElementById('dueDate');
        if (invoiceDateInput && dueDateInput && invoiceDateInput.value) {
            const invoiceDate = new Date(invoiceDateInput.value);
            invoiceDate.setDate(invoiceDate.getDate() + 30); // Add 30 days for due date
            const year = invoiceDate.getFullYear();
            const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
            const day = String(invoiceDate.getDate()).padStart(2, '0');
            dueDateInput.value = `${year}-${month}-${day}`;
        }
    }

    // Function to initialize/reset invoice form
    function initializeInvoiceForm() {
        if (!invoiceItemsContainer) return; // Only run if on invoice form page

        invoiceItemsContainer.innerHTML = ''; // Clear all existing rows
        itemCounter = 0; // Reset counter
        addInvoiceItemRow(); // Add one default empty row

        // Reset summary fields
        if (subtotalSpan) subtotalSpan.textContent = '0.00';
        if (taxRateInput) taxRateInput.value = '0';
        if (totalTaxSpan) totalTaxSpan.textContent = '0.00';
        if (grandTotalSpan) grandTotalSpan.textContent = '0.00 KES';

        // Set default dates
        const invoiceDateInput = document.getElementById('invoiceDate');
        const dueDateInput = document.getElementById('dueDate');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        if (invoiceDateInput) invoiceDateInput.value = `${year}-${month}-${day}`;
        setDueDate(); // Set due date based on invoice date
    }

    // --- Invoice Calculation & Item Management ---
    let itemCounter = 0; // Global counter for unique item row IDs

    function calculateTotals() {
        if (!invoiceItemsContainer) return;

        let subtotal = 0;
        document.querySelectorAll('.item-row').forEach(row => {
            const qtyInput = row.querySelector('[id^="itemQty-"]');
            const priceInput = row.querySelector('[id^="itemPrice-"]');
            const itemDescInput = row.querySelector('[id^="itemDesc-"]');

            const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
            let price = parseFloat(priceInput ? priceInput.value : 0) || 0;

            // Auto-fill price if product is selected from mock data
            if (itemDescInput && productSuggestionsDatalist) {
                const selectedProductName = itemDescInput.value;
                const matchingProduct = mockProducts.find(p => p.name === selectedProductName);
                if (matchingProduct && priceInput.value === '0.00' && selectedProductName) { // Only auto-fill if price is 0 and a product is selected
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

        // Get currency from selector on dashboard or default for invoice form
        const currencySelector = document.getElementById('currency'); // This is on index.html
        let displayCurrency = 'KES';
        if (currencySelector) { // If on dashboard, use its currency
            displayCurrency = currencySelector.value;
        }
        // else: use default 'KES' for invoice form

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

        // Attach event listeners to new row's inputs
        newRow.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', calculateTotals);
        });
        // Attach listener for description change (for price autofill)
        newRow.querySelector('[id^="itemDesc-"]').addEventListener('change', calculateTotals);


        // Attach event listener for remove button
        newRow.querySelector('.remove-item-btn').addEventListener('click', function() {
            newRow.remove();
            calculateTotals(); // Recalculate after removing a row
        });

        calculateTotals(); // Recalculate for the new row added
    }

    // --- Form Submission / Data Handling ---
    if (document.getElementById('invoice-form')) { // Only run if on invoice-form.html
        populateDatalists();
        initializeInvoiceForm();

        // Add event listeners for initial elements after initializeForm
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

        // Event listener for Save & View Invoice button
        if (saveInvoiceBtn) {
            saveInvoiceBtn.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default form submission

                const form = document.getElementById('invoice-form');
                // Basic validation for invoice items
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
                    // Collect all form data
                    const invoiceData = {
                        invoiceNumber: document.getElementById('invoiceNumber').value,
                        invoiceDate: document.getElementById('invoiceDate').value,
                        customer: document.getElementById('customer').value,
                        dueDate: document.getElementById('dueDate').value,
                        items: [],
                        subtotal: subtotalSpan.textContent,
                        taxRate: taxRateInput.value,
                        totalTax: totalTaxSpan.textContent,
                        grandTotal: grandTotalSpan.textContent
                    };

                    document.querySelectorAll('.item-row').forEach(row => {
                        invoiceData.items.push({
                            description: row.querySelector('[id^="itemDesc-"]').value,
                            quantity: parseFloat(row.querySelector('[id^="itemQty-"]').value),
                            unitPrice: parseFloat(row.querySelector('[id^="itemPrice-"]').value),
                            total: parseFloat(row.querySelector('.item-calculated-total').textContent)
                        });
                    });

                    // Save data to localStorage
                    localStorage.setItem('currentInvoiceData', JSON.stringify(invoiceData));

                    // In a real app, you would send this data to your backend here.
                    // alert('Invoice data collected and saved locally! Now opening print preview.');

                    // Redirect to the invoice display page
                    window.open('invoice-display.html', '_blank'); // Open in new tab
                    form.reset(); // Optionally clear the form after viewing
                    initializeInvoiceForm(); // Re-initialize for new invoice entry
                }
            });
        }

        // Event listener for Reset button
        if (resetInvoiceBtn) {
            resetInvoiceBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
                    document.getElementById('invoice-form').reset();
                    initializeInvoiceForm();
                }
            });
        }
    }

    // --- Dashboard Currency Selector Logic (from index.html) ---
    const currencySelector = document.getElementById('currency');
    if (currencySelector) {
        // If you had dynamic widget values on dashboard, you'd add event listeners here
        // currencySelector.addEventListener('change', updateDashboardWidgetCurrencies);
    }
});
