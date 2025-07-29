document.addEventListener('DOMContentLoaded', function() {
    const BASE_URL = 'http://127.0.0.1:5000/api'; // Your Flask backend URL

    // Function to get URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    const transactionId = getUrlParameter('id');
    const authToken = localStorage.getItem('authToken');

    if (!transactionId || !authToken) {
        alert('No invoice ID or authentication token found. Please create an invoice or log in.');
        window.close(); // Close the tab if it was opened
        // window.location.href = 'invoice-form.html'; // Or redirect to the form
        return;
    }

    async function fetchAndDisplayInvoice(id) {
        try {
            const response = await fetch(`${BASE_URL}/transactions/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const invoiceData = await response.json();

            if (response.ok) {
                // Populate header details
                document.getElementById('display-invoice-number').textContent = invoiceData.invoice_number || 'N/A';
                document.getElementById('display-invoice-date').textContent = invoiceData.date ? invoiceData.date.split('T')[0] : 'N/A';
                document.getElementById('display-due-date').textContent = invoiceData.due_date ? invoiceData.due_date.split('T')[0] : 'N/A';
                document.getElementById('display-customer').textContent = invoiceData.customer_name || 'N/A';

                // Populate items table
                const itemsTableBody = document.getElementById('invoice-display-items');
                itemsTableBody.innerHTML = ''; // Clear any existing content

                // Define headers for data-label attributes (matching invoice-form.html)
                const headers = ["#", "Description", "Qty", "Unit Price (Inc. VAT)", "Total (Inc. VAT)"];

                if (invoiceData.items_json) {
                    const items = JSON.parse(invoiceData.items_json);
                    items.forEach((item, index) => {
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
                }

                // Populate summary details
                document.getElementById('display-subtotal').textContent = invoiceData.net_subtotal ? invoiceData.net_subtotal.toFixed(2) : '0.00';
                document.getElementById('display-tax-rate').textContent = invoiceData.tax_rate ? invoiceData.tax_rate.toFixed(2) : '0.00';
                document.getElementById('display-total-tax').textContent = invoiceData.total_vat_amount ? invoiceData.total_vat_amount.toFixed(2) : '0.00';
                document.getElementById('display-grand-total').textContent = invoiceData.grand_total ? invoiceData.grand_total.toFixed(2) : '0.00';

            } else {
                alert(`Failed to load invoice: ${invoiceData.message || 'Unknown error'}`);
                window.close();
            }
        } catch (error) {
            alert('Network error while fetching invoice. Please check your backend server.');
            console.error('Invoice fetch error:', error);
            window.close();
        }
    }

    // Add print button functionality
    const printNowBtn = document.getElementById('print-now-btn');
    if (printNowBtn) {
        printNowBtn.addEventListener('click', function() {
            window.print(); // Triggers browser's print dialog
        });
    }

    // Paper size selector logic (from previous update)
    const paperSizeSelector = document.getElementById('paperSize');
    const bodyElement = document.body;
    if (paperSizeSelector) {
        bodyElement.setAttribute('data-paper-size', paperSizeSelector.value);
        paperSizeSelector.addEventListener('change', function() {
            bodyElement.setAttribute('data-paper-size', this.value);
        });
    }

    // Fetch and display invoice if ID is present
    if (transactionId) {
        fetchAndDisplayInvoice(transactionId);
    } else {
        // Fallback for direct access without ID (should ideally redirect or show error)
        // This path is less likely now that invoices are opened with an ID
        const invoiceDataString = localStorage.getItem('currentInvoiceData');
        if (invoiceDataString) {
            const invoiceData = JSON.parse(invoiceDataString);
            // Re-populate using localStorage data if no ID is provided (for old behavior)
            document.getElementById('display-invoice-number').textContent = invoiceData.invoiceNumber;
            document.getElementById('display-invoice-date').textContent = invoiceData.invoiceDate;
            document.getElementById('display-due-date').textContent = invoiceData.dueDate;
            document.getElementById('display-customer').textContent = invoiceData.customer;

            const itemsTableBody = document.getElementById('invoice-display-items');
            itemsTableBody.innerHTML = '';
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
            document.getElementById('display-subtotal').textContent = invoiceData.netSubtotal;
            document.getElementById('display-tax-rate').textContent = invoiceData.taxRate;
            document.getElementById('display-total-tax').textContent = invoiceData.totalVATAmount;
            document.getElementById('display-grand-total').textContent = invoiceData.grandTotal;
        } else {
            alert('No invoice data found. Please create an invoice first.');
            window.close();
        }
    }
});
