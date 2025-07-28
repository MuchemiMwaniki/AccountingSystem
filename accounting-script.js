document.addEventListener('DOMContentLoaded', function() {
    // Dynamic Year in Footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Invoice Form Logic ---
    const invoiceItemsContainer = document.getElementById('invoice-items-container');
    const addItemBtn = document.querySelector('.add-item-btn');
    const subtotalSpan = document.getElementById('subtotal');
    const taxRateInput = document.getElementById('taxRate');
    const totalTaxSpan = document.getElementById('totalTax');
    const grandTotalSpan = document.getElementById('grandTotal');
    const currencySelector = document.getElementById('currency'); // Added for currency display (on dashboard)

    // Check if on invoice-form.html to initialize item counter and listeners
    let itemCounter = 0;
    if (invoiceItemsContainer) {
        // Count existing items to initialize itemCounter correctly
        itemCounter = invoiceItemsContainer.querySelectorAll('.item-row').length;
    }


    // Function to calculate totals (used for invoice form)
    function calculateTotals() {
        if (!invoiceItemsContainer) return; // Only run if on invoice form page

        let subtotal = 0;
        document.querySelectorAll('.item-row').forEach(row => {
            const qtyInput = row.querySelector('[id^="itemQty"]');
            const priceInput = row.querySelector('[id^="itemPrice"]');

            const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
            const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
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
        
        let displayCurrency = 'KES'; // Default currency if selector isn't present
        if (currencySelector) { // Check if currencySelector is present (on dashboard only for now)
            displayCurrency = currencySelector.value;
        } else { // If on invoice form, assume KES for simplicity or grab from a global setting if available
            // For this mock-up, we'll just use KES on the invoice form if currencySelector is not found (which it won't be)
            // In a real app, this would be passed from the dashboard's selection or a user setting.
        }

        if (grandTotalSpan) grandTotalSpan.textContent = grandTotal.toFixed(2) + ' ' + displayCurrency;
    }

    // Function to add a new item row
    function addInvoiceItemRow() {
        itemCounter++;
        const newRow = document.createElement('div');
        newRow.classList.add('item-row');
        newRow.innerHTML = `
            <div class="form-group item-description">
                <label for="itemDesc${itemCounter}">Description:</label>
                <input type="text" id="itemDesc${itemCounter}" placeholder="Service/Product" required>
            </div>
            <div class="form-group item-quantity">
                <label for="itemQty${itemCounter}">Qty:</label>
                <input type="number" id="itemQty${itemCounter}" value="1" min="1" required>
            </div>
            <div class="form-group item-price">
                <label for="itemPrice${itemCounter}">Unit Price:</label>
                <input type="number" id="itemPrice${itemCounter}" step="0.01" value="0.00" required>
            </div>
            <div class="form-group item-total">
                <label>Total:</label>
                <span class="item-calculated-total">0.00</span>
            </div>
            <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
        `;
        invoiceItemsContainer.appendChild(newRow);

        // Attach event listeners to new row's inputs and remove button
        newRow.querySelectorAll('input[type="number"], input[type="text"]').forEach(input => { // Listen to text for description as well
            input.addEventListener('input', calculateTotals);
        });
        newRow.querySelector('.remove-item-btn').addEventListener('click', function() {
            newRow.remove();
            calculateTotals(); // Recalculate after removing a row
        });
        calculateTotals(); // Recalculate for the new row added
    }

    // Initialize event listeners for invoice items (on page load for invoice-form.html)
    if (invoiceItemsContainer) { // Only run if on invoice-form.html
        document.querySelectorAll('.item-row input[type="number"]').forEach(input => {
            input.addEventListener('input', calculateTotals);
        });
        // Event listener for tax rate
        if (taxRateInput) {
            taxRateInput.addEventListener('input', calculateTotals);
        }
        // Event listener for add item button
        if (addItemBtn) {
            addItemBtn.addEventListener('click', addInvoiceItemRow);
        }
        // Event listeners for remove buttons on initial rows
        document.querySelectorAll('.item-row .remove-item-btn').forEach(button => {
            button.addEventListener('click', function() {
                button.closest('.item-row').remove();
                calculateTotals();
            });
        });
        calculateTotals(); // Initial calculation on page load
    }

    // Set current date for date inputs (for both invoice and purchase forms)
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) { // Only set if no value is already present (e.g., from pre-filled data)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(today.getDate()).padStart(2, '0');
            input.value = `${year}-${month}-${day}`;
        }
    });

    // Handle currency display update (on dashboard if currencySelector is present)
    if (currencySelector && grandTotalSpan) { // grandTotalSpan will only be present on invoice form, not dashboard, so let's adjust this
        // On Dashboard: Just update the display if there were any calculations tied to currency
        // (Currently, only the invoice form has calculations affecting display with currency)
        // If you had dashboard widgets with dynamic values and currency symbols, you'd update them here.
        // For now, no direct effect on dashboard widgets, as their values are static in HTML.
    }

    // For the invoice form's grand total currency display
    if (currencySelector && grandTotalSpan) {
        currencySelector.addEventListener('change', calculateTotals); // Recalculate to update currency symbol
    } else if (document.location.pathname.includes('invoice-form.html')) {
        // If on invoice form, and currency selector is NOT on this page, but there's a grandTotalSpan
        // You might want to default to a specific currency or get it from a global setting.
        // For now, it defaults to KES in calculateTotals if currencySelector is null.
    }


    // Example for form submission (frontend only, no backend)
    const accountingForms = document.querySelectorAll('.accounting-form');
    accountingForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission

            // Basic validation check for invoice items
            let isValid = true;
            if (form.id === 'invoice-form') { // You could add an ID to the form if needed
                document.querySelectorAll('.item-row').forEach(row => {
                    const desc = row.querySelector('[id^="itemDesc"]').value.trim();
                    const qty = parseFloat(row.querySelector('[id^="itemQty"]').value);
                    const price = parseFloat(row.querySelector('[id^="itemPrice"]').value);

                    if (!desc || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
                        isValid = false;
                        alert('Please fill in all item details correctly (description, quantity > 0, price >= 0).');
                        // You could add visual feedback (e.g., red borders) here
                        return; // Exit forEach early
                    }
                });
            }

            if (isValid) {
                alert('Form submitted! (This is a frontend mock-up, data is not saved.)');
                // In a real application, you would send this data to your backend here.
                // Example of collecting data:
                // const formData = new FormData(form);
                // fetch('/api/save-invoice', { method: 'POST', body: formData })
                //   .then(response => response.json())
                //   .then(data => console.log(data));
                form.reset(); // Optionally clear the form
                if (invoiceItemsContainer) { // Re-add one empty row after reset for invoice form
                    invoiceItemsContainer.innerHTML = ''; // Clear all
                    itemCounter = 0; // Reset counter
                    addInvoiceItemRow(); // Add one default row
                }
            }
        });
    });

});
