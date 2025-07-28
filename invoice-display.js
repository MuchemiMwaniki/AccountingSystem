document.addEventListener('DOMContentLoaded', function() {
    const invoiceDataString = localStorage.getItem('currentInvoiceData');

    if (invoiceDataString) {
        const invoiceData = JSON.parse(invoiceDataString);

        // Populate header details
        document.getElementById('display-invoice-number').textContent = invoiceData.invoiceNumber;
        document.getElementById('display-invoice-date').textContent = invoiceData.invoiceDate;
        document.getElementById('display-due-date').textContent = invoiceData.dueDate;
        document.getElementById('display-customer').textContent = invoiceData.customer;

        // Populate items table
        const itemsTableBody = document.getElementById('invoice-display-items');
        itemsTableBody.innerHTML = ''; // Clear any existing content
        invoiceData.items.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
            `;
            itemsTableBody.appendChild(row);
        });

        // Populate summary details
        document.getElementById('display-subtotal').textContent = invoiceData.subtotal;
        document.getElementById('display-tax-rate').textContent = invoiceData.taxRate;
        document.getElementById('display-total-tax').textContent = invoiceData.totalTax;
        document.getElementById('display-grand-total').textContent = invoiceData.grandTotal;

        // Clear data from localStorage after populating to avoid displaying old data on next visit
        // localStorage.removeItem('currentInvoiceData'); // Uncomment if you want data to be single-use

        // Add print button functionality
        const printNowBtn = document.getElementById('print-now-btn');
        if (printNowBtn) {
            printNowBtn.addEventListener('click', function() {
                window.print(); // Triggers browser's print dialog
            });
        }

    } else {
        // Handle case where no invoice data is found (e.g., direct access to invoice-display.html)
        alert('No invoice data found. Please create an invoice first.');
        // Optionally redirect back to the invoice form
        window.close(); // Close the tab if it was opened
        // window.location.href = 'invoice-form.html'; // Or redirect to the form
    }
});
