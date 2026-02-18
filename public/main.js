const menuItems = [
	{ name: 'Drip coffee', price: 3.00},
	{ name: 'Americano', price: 5.50},
	{ name: 'Latte', price: 6.00 },
	{ name: 'Flat White', price: 6.00 },
	{ name: 'Oat milk latte', price: 7.00},
	{ name: 'Cold brew', price: 5.50},
	{ name: 'Cappuccino', price: 6.00},
	{ name: 'Oat milk Cappuccino', price: 7.00},
	{ name: 'Espresso', price: 5.00 },
	{ name: 'Double Espresso', price: 5.50},
	{ name: 'Mocha', price: 7.00},
	{ name: 'Oat milk Mocha', price: 8.00 },
	{ name: 'Chai latte', price: 5.50 },
	{ name: 'London Fog', price: 5.50 },
	{ name: 'Matcha latte', price: 7.50 },
	{ name: 'Hot Chocolate', price: 5.00},
	{ name: 'Steamed Milk', price: 4.50},
	{ name: 'Butter Croissant', price: 5.50},
	{ name: 'Vanilla Scone', price: 3.50}
];

const itemsGrid = document.getElementById('items-grid');
const orderList = document.getElementById('order-list');
const orderTotalVal = document.getElementById('order-total-val');
let order = [];

function renderMenu() {
	itemsGrid.innerHTML = '';
	menuItems.forEach((item, idx) => {
		const div = document.createElement('div');
		div.className = 'item-card';
		div.innerHTML = `
			<div class="item-name">${item.name}</div>
			<div class="item-price">$${item.price.toFixed(2)}</div>
		`;
		div.onclick = () => addToOrder(idx);
		itemsGrid.appendChild(div);
	});
}

function addToOrder(idx) {
	order.push(menuItems[idx]);
	renderOrder();
}

function renderOrder() {
	orderList.innerHTML = '';
	let total = 0;
	order.forEach((item, idx) => {
		const li = document.createElement('li');
		li.innerHTML = `
			<span>${item.name}</span>
			<span class="price-delete-wrap">
				<span class="order-price">$${item.price.toFixed(2)}</span>
				<button class="delete-btn" title="Remove">&times;</button>
			</span>
		`;
		li.querySelector('.delete-btn').onclick = () => {
			order.splice(idx, 1);
			renderOrder();
		};
		orderList.appendChild(li);
		total += item.price;
	});
	orderTotalVal.textContent = `$${total.toFixed(2)}`;
}

// Tab Navigation 
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

navButtons.forEach(btn => {
	btn.addEventListener('click', () => {
		navButtons.forEach(b => b.classList.remove('active'));
		btn.classList.add('active');
		const target = btn.id.replace('nav-', '');
		pages.forEach(p => {
			p.style.display = p.id === 'page-' + target ? '' : 'none';
		});
		if (target === 'history') renderHistory();
		if (target === 'inventory') renderInventory();
	});
});

// --- Order History ---
let orderHistory = [
    { id: 5001, customerID: 1, date: '2/05/26', time: '8:15am', cost: 8.25, items: [
        { name: 'Whole Milk Latte', price: 4.50 },
        { name: 'Butter Croissant', price: 3.75 }
    ]},
    { id: 5002, customerID: 2, date: '2/05/26', time: '9:33am', cost: 3.75, items: [
        { name: 'Butter Croissant', price: 3.75 }
    ]},
    { id: 5003, customerID: 1, date: '2/05/26', time: '11:56am', cost: 13.50, items: [
        { name: 'Double Espresso', price: 3.00 },
        { name: 'Double Espresso', price: 3.00 },
        { name: 'Butter Croissant', price: 3.75 },
        { name: 'Butter Croissant', price: 3.75 }
    ]}
];

function renderHistory() {
	const tbody = document.getElementById('history-tbody');
	tbody.innerHTML = '';
	orderHistory.forEach((entry, idx) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${entry.date}&nbsp;&nbsp;${entry.time}</td>
			<td>#${entry.id}</td>
			<td>$${entry.cost.toFixed(2)}</td>
		`;
		tr.onclick = () => showHistoryOrder(idx);
		tbody.appendChild(tr);
	});
	// Clear the detail panel
	document.getElementById('history-order-title').textContent = 'Order <#>';
	document.getElementById('history-order-time').textContent = '';
	document.getElementById('history-order-list').innerHTML = '';
	document.getElementById('history-order-total').textContent = '$0.00';
}

function showHistoryOrder(idx) {
    const entry = orderHistory[idx];
    document.getElementById('history-order-title').textContent = `Order <#${entry.id}>`;
    document.getElementById('history-order-time').textContent = `${entry.time}  ${entry.date}`;
    
    const list = document.getElementById('history-order-list');
    list.innerHTML = '';
    
    // 1. Aggregate items (Count quantities)
    const aggregatedItems = {};
    entry.items.forEach(item => {
        if (aggregatedItems[item.name]) {
            aggregatedItems[item.name].count += 1;
            // We don't add price here because we just want the unit price for display
            // Total cost is already calculated in entry.cost
        } else {
            aggregatedItems[item.name] = { 
                name: item.name, 
                price: item.price, 
                count: 1 
            };
        }
    });

    // 2. Render the aggregated list
    Object.values(aggregatedItems).forEach(item => {
        const li = document.createElement('li');
        
        // Check if we need to show "x2", "x3", etc.
        const qtyDisplay = item.count > 1 
            ? `<span style="font-weight:bold; color: #666; margin-left: 0.5em;">x${item.count}</span>` 
            : '';

        li.innerHTML = `
            <span>${item.name}${qtyDisplay}</span>
            <span class="order-price">$${item.price.toFixed(2)}</span>
        `;
        list.appendChild(li);
    });

    document.getElementById('history-order-total').textContent = `$${entry.cost.toFixed(2)}`;

    // Highlight selected row
    const rows = document.querySelectorAll('#history-tbody tr');
    rows.forEach(r => r.classList.remove('selected'));
    rows[idx].classList.add('selected');
}

// --- Inventory ---
const inventoryData = [
	{ name: 'Drip Coffee', stock: 100, location: 'Shelf 2A' },
	{ name: 'Americano', stock: 200, location: 'Shelf 2A' },
	{ name: 'Latte', stock: 150, location: 'Shelf 2B' },
	{ name: 'Flat White', stock: 50, location: 'Shelf 2B' },
	{ name: 'Oat Milk Latte', stock: 30, location: 'Shelf 2B' },
	{ name: 'Cold Brew', stock: 80, location: 'Shelf 2C' },
	{ name: 'Cappuccino', stock: 120, location: 'Shelf 2C' },
	{ name: 'Oat Milk Cappuccino', stock: 45, location: 'Shelf 2C' },
	{ name: 'Espresso', stock: 300, location: 'Shelf 1A' },
	{ name: 'Double Espresso', stock: 300, location: 'Shelf 1A' },
	{ name: 'Mocha', stock: 90, location: 'Shelf 2D' },
	{ name: 'Oat Milk Mocha', stock: 25, location: 'Shelf 2D' },
	{ name: 'Chai Latte', stock: 120, location: 'Shelf 3A' },
	{ name: 'London Fog', stock: 60, location: 'Shelf 3A' },
	{ name: 'Matcha Latte', stock: 75, location: 'Shelf 3A' },
	{ name: 'Hot Chocolate', stock: 110, location: 'Shelf 3B' },
	{ name: 'Steamed Milk', stock: 200, location: 'Fridge 1' },
	{ name: 'Butter Croissant', stock: 0, location: 'Shelf 4A' },
	{ name: 'Vanilla Scone', stock: 15, location: 'Shelf 4A' },
];

// --- Updated Inventory Logic ---

let currentInvItem = null; // Store the item currently being viewed

function renderInventory() {
    // 1. Render Table
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';
    
    inventoryData.forEach((item, idx) => {
        const tr = document.createElement('tr');
        // Add click listener to select item
        tr.onclick = () => showInventoryItem(item, idx);
        
        // Highlight logic (optional, but good UX)
        tr.className = 'inventory-row'; // You can add :hover styles in CSS for this class
        
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.stock}</td>
            <td>${item.location}</td>
        `;
        tbody.appendChild(tr);
    });

    // 2. Render Status List (Logic remains same)
    renderStatusList();
}

function renderStatusList() {
    const statusList = document.getElementById('status-list');
    statusList.innerHTML = '';
    
    // Sort: red first, then yellow, then green
    const sorted = [...inventoryData].sort((a, b) => a.stock - b.stock);
    
    sorted.forEach(item => {
        let color = 'green';
        if (item.stock === 0) color = 'red';
        else if (item.stock < 100) color = 'yellow';

        // Only show items that need attention? Or all? 
        // Showing all for now based on previous code, or just red/yellow to save space.
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name}</span>
            <span class="status-dot ${color}"></span>
        `;
        // Allow clicking status items to open details too
        li.style.cursor = 'pointer';
        li.onclick = () => {
             // Find original index if needed, or just pass item
             showInventoryItem(item);
        };
        statusList.appendChild(li);
    });
}

// --- New Side Panel Logic ---

function showInventoryItem(item) {
    currentInvItem = item;

    // 1. Switch Panel Views
    document.getElementById('inventory-status-view').style.display = 'none';
    document.getElementById('inventory-detail-view').style.display = 'flex';

    // 2. Populate Read-Only Data
    document.getElementById('inv-detail-title').textContent = item.name;
    document.getElementById('disp-stock').textContent = item.stock;
    document.getElementById('disp-location').textContent = item.location;

    // 3. Reset Edit State (Ensure we are in View mode)
    toggleInvEditMode(false);

    // 4. Highlight Row (Visual feedback)
    const rows = document.querySelectorAll('#inventory-tbody tr');
    rows.forEach(r => r.style.background = ''); // Reset
    // Find the row that matches this item name (simple approach)
    Array.from(rows).find(r => r.cells[0].textContent === item.name).style.background = '#d0c4e0';
}

function toggleInvEditMode(isEdit) {
    const displayDiv = document.getElementById('inv-display-content');
    const editDiv = document.getElementById('inv-edit-content');
    const btnEdit = document.getElementById('btn-inv-edit');
    const btnConfirm = document.getElementById('btn-inv-confirm');

    if (isEdit) {
        // Switch to Inputs
        displayDiv.style.display = 'none';
        editDiv.style.display = 'block';
        
        // Show Save, Hide Edit
        btnEdit.style.display = 'none';
        btnConfirm.style.display = 'inline-block';

        // Pre-fill inputs
        document.getElementById('edit-inv-stock').value = currentInvItem.stock;
        document.getElementById('edit-inv-location').value = currentInvItem.location;
    } else {
        // Switch to Text
        displayDiv.style.display = 'block';
        editDiv.style.display = 'none';

        // Show Edit, Hide Save
        btnEdit.style.display = 'inline-block';
        btnConfirm.style.display = 'none';
    }
}

// --- Event Listeners for Inventory Actions ---

// 1. Back Button
document.getElementById('btn-inv-back').onclick = () => {
    document.getElementById('inventory-detail-view').style.display = 'none';
    document.getElementById('inventory-status-view').style.display = 'block';
    
    // Clear selection highlight
    const rows = document.querySelectorAll('#inventory-tbody tr');
    rows.forEach(r => r.style.background = '');
};

// 2. Edit Button
document.getElementById('btn-inv-edit').onclick = () => {
    toggleInvEditMode(true);
};

// 3. Confirm/Save Button
document.getElementById('btn-inv-confirm').onclick = () => {
    const newStock = parseInt(document.getElementById('edit-inv-stock').value);
    const newLoc = document.getElementById('edit-inv-location').value.trim();

    if (newStock >= 0 && newLoc) {
        // Update Data
        currentInvItem.stock = newStock;
        currentInvItem.location = newLoc;

        // Update UI
        renderInventory(); // Re-renders table AND status list (colors might change)
        
        // Refresh the detail view with new data
        document.getElementById('disp-stock').textContent = newStock;
        document.getElementById('disp-location').textContent = newLoc;

        // Return to View Mode
        toggleInvEditMode(false);
    } else {
        alert("Stock must be a positive number and Location cannot be empty.");
    }
};

// --- Customers Data ---
let customerData = [
    { customerID: 1, name: 'Seth Gleason', phone: '111-111-1111', numPoints: 4 },
    { customerID: 2, name: 'Ally Chen', phone: '222-222-2222', numPoints: 11 },
    { customerID: 3, name: 'Michael Curry', phone: '333-333-3333', numPoints: 0 }
];

// --- Customers Logic ---
const nameInp = document.getElementById('input-name');
const phoneInp = document.getElementById('input-phone');

function renderCustomers(results) {
    const tbody = document.getElementById('customers-tbody');
    const data = results || customerData;
    
    tbody.innerHTML = '';

    data.forEach((customer) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${customer.name}</td><td>${customer.phone}</td><td>${customer.numPoints}</td>`;
        tr.onclick = () => {
            document.querySelectorAll('#customers-tbody tr').forEach(r => r.classList.remove('selected'));
            tr.classList.add('selected');
            // Show this specific customer's profile
            showCustomerProfile(customer);
        };
        tbody.appendChild(tr);
    });
}

// --- Updated showCustomerProfile in main.js ---

function showCustomerProfile(customer) {
    const profilePanel = document.getElementById('customer-details');
    
    // We render the "View Mode" by default
    renderProfileViewMode(customer);
}

function renderProfileViewMode(customer) {
    const profilePanel = document.getElementById('customer-details');
    
    // 1. Header with Edit Button
    profilePanel.innerHTML = `
        <div class="profile-header-row">
            <span class="profile-title-text">Customer Profile</span>
            <div class="profile-actions">
                <button class="icon-btn edit-btn" id="edit-profile-btn" title="Edit Profile">✎</button>
            </div>
        </div>
        
        <div id="profile-data-container">
            <div class="profile-meta" style="margin-bottom: 1.5vw; border-bottom: 1px solid #ccc; padding-bottom: 0.5vw;">
                <p><strong>Name:</strong> ${customer.name}</p>
                <p><strong>Phone:</strong> ${customer.phone}</p>
                <p><strong>Points:</strong> ${customer.numPoints}</p>
            </div>
        </div>

        <div class="profile-orders">
            <div class="status-header" style="font-size: 1.1vw; margin-bottom: 0.5vw;">Order History</div>
            <div id="profile-order-list"></div>
        </div>
    `;

    // 2. Attach Listener to Edit Button
    document.getElementById('edit-profile-btn').onclick = () => enableEditMode(customer);

    // 3. Render Orders (Same as before)
    renderProfileOrders(customer);
}

function enableEditMode(customer) {
    const container = document.getElementById('profile-data-container');
    
    // Select the .profile-actions strictly INSIDE the customer-details panel
    const actionsDiv = document.getElementById('customer-details').querySelector('.profile-actions');
    
    let isMarkedForDeletion = false;

    // 1. Replace Buttons
    actionsDiv.innerHTML = `
        <button class="icon-btn confirm-btn" id="confirm-edit-btn" title="Save Changes">✔</button>
        <button class="icon-btn delete-btn" id="delete-toggle-btn" title="Delete Customer">🗑</button>
    `;

    // 2. Inject Inputs
    container.innerHTML = `
        <div class="profile-meta" id="edit-form-wrapper" style="margin-bottom: 1.5vw; border-bottom: 1px solid #ccc; padding-bottom: 0.5vw;">
            <label style="font-size:0.9vw; font-weight:bold;">Name:</label>
            <input type="text" class="profile-input" id="edit-name" value="${customer.name}">
            
            <label style="font-size:0.9vw; font-weight:bold;">Phone:</label>
            <input type="text" class="profile-input" id="edit-phone" value="${customer.phone}">
            
            <label style="font-size:0.9vw; font-weight:bold;">Points:</label>
            <input type="number" class="profile-input" id="edit-points" value="${customer.numPoints}">
        </div>
    `;

    const deleteBtn = document.getElementById('delete-toggle-btn');
    const confirmBtn = document.getElementById('confirm-edit-btn');
    const formWrapper = document.getElementById('edit-form-wrapper');
    const inputs = formWrapper.querySelectorAll('input');

    // --- NEW: Add Enter Key Listener to all new inputs ---
    inputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click(); // Simulate clicking the green check
            }
        });
    });

    // 3. Delete Toggle Logic
    deleteBtn.onclick = () => {
        isMarkedForDeletion = !isMarkedForDeletion;
        if (isMarkedForDeletion) {
            formWrapper.classList.add('pending-delete-state');
            inputs.forEach(input => input.disabled = true);
            confirmBtn.title = "Confirm Deletion";
        } else {
            formWrapper.classList.remove('pending-delete-state');
            inputs.forEach(input => input.disabled = false);
            confirmBtn.title = "Save Changes";
        }
    };

    // 4. Confirm Logic
    confirmBtn.onclick = () => {
        if (isMarkedForDeletion) {
            const index = customerData.findIndex(c => c.customerID === customer.customerID);
            if (index > -1) customerData.splice(index, 1);

            renderCustomers();
            document.getElementById('customer-details').innerHTML = '<p style="padding:1vw;">Select a customer to view details.</p>';
            alert(`Customer deleted.`);
        } else {
            const newName = document.getElementById('edit-name').value;
            const newPhone = document.getElementById('edit-phone').value;
            const newPoints = parseInt(document.getElementById('edit-points').value);

            if(newName && newPhone) {
                customer.name = newName;
                customer.phone = newPhone;
                customer.numPoints = newPoints;

                renderCustomers();
                renderProfileViewMode(customer);
            } else {
                alert("Name and Phone cannot be empty.");
            }
        }
    };
}
// Helper to render the order list (extracted from your previous code)
function renderProfileOrders(customer) {
    const orderContainer = document.getElementById('profile-order-list');
    const personalHistory = orderHistory.filter(o => o.customerID === customer.customerID);

    if (personalHistory.length === 0) {
        orderContainer.innerHTML = '<p style="font-size: 0.9vw; color: #666;">No orders found.</p>';
        return;
    }

    personalHistory.forEach(order => {
        // Aggregation Logic
        const aggregatedItems = {};
        order.items.forEach(item => {
            if (aggregatedItems[item.name]) {
                aggregatedItems[item.name].count += 1;
            } else {
                aggregatedItems[item.name] = { name: item.name, price: item.price, count: 1 };
            }
        });
        const uniqueItemsList = Object.values(aggregatedItems);

        const orderRow = document.createElement('div');
        orderRow.className = 'history-item-row';
        orderRow.style = "cursor:pointer; border-bottom:1px solid #eee; padding: 0.5vw 0;";
        
        orderRow.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size: 1vw;">
                <span>${order.date} ${order.time}</span>
                <span>$${order.cost.toFixed(2)}</span>
            </div>
            <div class="order-expand-details" style="display:none; padding: 0.5vw; background: #f9f9f9; font-size: 0.9vw; margin-top: 0.3vw;">
                <ul style="list-style:none; padding:0; margin:0;">
                    ${uniqueItemsList.map(item => `
                        <li style="display:flex; justify-content:space-between;">
                            <span>${item.name} ${item.count > 1 ? `<span style="font-weight:bold; color: #666;">- x${item.count}</span>` : ''}</span>
                            <span>$${item.price.toFixed(2)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        orderRow.onclick = (e) => {
            const details = orderRow.querySelector('.order-expand-details');
            const isVisible = details.style.display === 'block';
            document.querySelectorAll('.order-expand-details').forEach(d => d.style.display = 'none');
            details.style.display = isVisible ? 'none' : 'block';
            e.stopPropagation();
        };

        orderContainer.appendChild(orderRow);
    });
}

// Search: Explicit action only
document.getElementById('search-customer-btn').addEventListener('click', () => {
    const n = nameInp.value.toLowerCase();
    const p = phoneInp.value;

    const filtered = customerData.filter(c => 
        c.name.toLowerCase().includes(n) && c.phone.includes(p)
    );
    renderCustomers(filtered);
});

// Add: Update array, clear inputs, show all
document.getElementById('add-customer-btn').addEventListener('click', () => {
    const name = nameInp.value.trim();
    const phone = phoneInp.value.trim();

    if (name && phone) {
        customerData.push({ name, phone, numPoints: 0 });
        nameInp.value = '';
        phoneInp.value = '';
        renderCustomers(); // Re-renders the full updated list
    } else {
        alert("Enter both Name and Phone Number to add a customer.");
    }
});


// --- Place Order & Autocomplete Logic ---

const nameInput = document.getElementById('order-customer-name');
const hintInput = document.getElementById('order-customer-hint');
const phoneInput = document.getElementById('order-customer-phone');
const newCustomerFields = document.getElementById('new-customer-fields');
const placeOrderBtn = document.getElementById('place-order-btn');

// Helper to reset UI state
function setExistingCustomerState() {
    newCustomerFields.style.display = 'none';
    placeOrderBtn.style.backgroundColor = '#4CAF50'; // Green
    placeOrderBtn.textContent = 'Place Order';
}

function setNewCustomerState() {
    newCustomerFields.style.display = 'block';
    placeOrderBtn.style.backgroundColor = '#ff9800'; // Orange
    placeOrderBtn.textContent = 'Create account and place order?';
}

// 1. Listen for typing (Input Event)
nameInput.addEventListener('input', function() {
    const val = this.value;
    
    // Clear hint if input is empty
    if (!val) {
        hintInput.value = '';
        setExistingCustomerState(); // Default back to clean state
        return;
    }

    // A. Autocomplete/Hint Logic
    const match = customerData.find(c => c.name.toLowerCase().startsWith(val.toLowerCase()));
    
    if (match) {
        hintInput.value = match.name;
    } else {
        hintInput.value = '';
    }

    // B. New Customer Detection Logic
    // Check for EXACT match to determine if we need the phone field
    const exactMatch = customerData.find(c => c.name.toLowerCase() === val.toLowerCase());

    if (exactMatch) {
        setExistingCustomerState();
    } else {
        setNewCustomerState();
    }
});

// 2. Listen for Tab Key (Autocomplete)
nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab' && hintInput.value) {
        e.preventDefault();
        this.value = hintInput.value;
        setExistingCustomerState(); // We autofilled an existing name, so hide phone field
    }
});

// 3. Place Order Button Logic
placeOrderBtn.addEventListener('click', () => {
    // Validation: Items
    if (order.length === 0) {
        alert("Please add items to the order first.");
        return;
    }
    
    const customerName = nameInput.value.trim();
    if (!customerName) {
        alert("Please enter a customer name.");
        return;
    }

    // Setup Date Data
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Identify Customer
    let customer = customerData.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    let customerID;

    if (customer) {
        // --- EXISTING CUSTOMER ---
        customerID = customer.customerID;
        customer.numPoints += order.length;
    } else {
        // --- NEW CUSTOMER ---
        const customerPhone = phoneInput.value.trim();
        
        // Validation: Phone is required for new accounts
        if (!customerPhone) {
            alert("This is a new customer. Please enter a phone number to create the account.");
            return;
        }

        const maxId = customerData.reduce((max, c) => (c.customerID > max ? c.customerID : max), 0);
        customerID = maxId + 1;
        
        const newCustomer = {
            customerID: customerID,
            name: customerName,
            phone: customerPhone,
            numPoints: order.length
        };
        customerData.push(newCustomer);
    }

    // Update Inventory
    order.forEach(orderItem => {
        const inventoryItem = inventoryData.find(inv => inv.name.toLowerCase() === orderItem.name.toLowerCase());
        if (inventoryItem) {
            inventoryItem.stock = Math.max(0, inventoryItem.stock - 1);
        }
    });

    // Update History
    const totalCost = order.reduce((sum, item) => sum + item.price, 0);
    const newOrderID = orderHistory.length > 0 ? orderHistory[orderHistory.length - 1].id + 1 : 5001;

    const newHistoryEntry = {
        id: newOrderID,
        customerID: customerID,
        date: dateStr,
        time: timeStr,
        cost: totalCost,
        items: [...order]
    };
    orderHistory.push(newHistoryEntry);

    // Cleanup & Refresh
    order = []; 
    nameInput.value = ''; 
    hintInput.value = ''; 
    phoneInput.value = ''; // Clear phone
    
    setExistingCustomerState(); // Reset button to green/hidden phone

    renderOrder();     
    renderHistory();    
    renderInventory();  
    renderCustomers();  

});

// Allow pressing "Enter" to save Inventory edits
['edit-inv-stock', 'edit-inv-location'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('btn-inv-confirm').click();
            }
        });
    }
});

renderMenu();
renderOrder();
renderCustomers();