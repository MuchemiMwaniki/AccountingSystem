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

        // Populate summary details with new keys
        document.getElementById('display-subtotal').textContent = invoiceData.netSubtotal; // Now displays Net Subtotal
        document.getElementById('display-tax-rate').textContent = invoiceData.taxRate;
        document.getElementById('display-total-tax').textContent = invoiceData.totalVATAmount; // Now displays VAT Total
        document.getElementById('display-grand-total').textContent = invoiceData.grandTotal;

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
        window.close();
    }
});
