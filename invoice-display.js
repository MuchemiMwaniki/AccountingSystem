document.addEventListener('DOMContentLoaded', function() {
    const invoiceDataString = localStorage.getItem('currentInvoiceData');
    const paperSizeSelector = document.getElementById('paperSize');
    const bodyElement = document.body;

    // Set initial paper size from selector or default
    if (paperSizeSelector) {
        bodyElement.setAttribute('data-paper-size', paperSizeSelector.value);
        paperSizeSelector.addEventListener('change', function() {
            bodyElement.setAttribute('data-paper-size', this.value);
        });
    }

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

        // Define headers for data-label attributes
        const headers = ["#", "Description", "Qty", "Unit Price (Inc. VAT)", "Total (Inc. VAT)"];

        invoiceData.items.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="${headers[0]}">${index + 1}</td>
                <td data-label="${headers[1]}">${item.description}</td>
                <td data-label="${headers[2]}">${item.quantity}</td>
                <td data-label="${headers[3]}">${item.unitPrice.toFixed(2)}</td>
                <td data-label="${headers[4]}">${item.total.toFixed(2)}</td>
            `;
            itemsTableBody.appendChild(row);
        });

        // Populate summary details with new keys
        document.getElementById('display-subtotal').textContent = invoiceData.netSubtotal;
        document.getElementById('display-tax-rate').textContent = invoiceData.taxRate;
        document.getElementById('display-total-tax').textContent = invoiceData.totalVATAmount;
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
