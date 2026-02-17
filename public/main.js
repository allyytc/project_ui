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
	let total = 0;
	entry.items.forEach(item => {
		const li = document.createElement('li');
		li.innerHTML = `
			<span>${item.name}</span>
			<span class="order-price">$${item.price.toFixed(2)}</span>
		`;
		list.appendChild(li);
		total += item.price;
	});
	document.getElementById('history-order-total').textContent = `$${total.toFixed(2)}`;
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

function renderInventory() {
	// Render inventory table
	const tbody = document.getElementById('inventory-tbody');
	tbody.innerHTML = '';
	inventoryData.forEach(item => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${item.name}</td>
			<td>${item.stock}</td>
			<td>${item.location}</td>
		`;
		tbody.appendChild(tr);
	});

	// Render status panel, items that need attention first (yellow/red)
	const statusList = document.getElementById('status-list');
	statusList.innerHTML = '';
	// Sort: red first, then yellow, then green
	// ----------- create a filter for status in the future?
	const sorted = [...inventoryData].sort((a, b) => a.stock - b.stock);
	sorted.forEach(item => {
		let color = 'green';
		if (item.stock === 0) color = 'red';
		else if (item.stock < 100) color = 'yellow';

		const li = document.createElement('li');
		li.innerHTML = `
			<span>${item.name}</span>
			<span class="status-dot ${color}"></span>
		`;
		statusList.appendChild(li);
	});
}

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

function showCustomerProfile(customer) {
    const profilePanel = document.getElementById('customer-details');
    profilePanel.innerHTML = `
        <div class="profile-meta" style="margin-bottom: 1.5vw; border-bottom: 1px solid #ccc; padding-bottom: 0.5vw;">
            <p><strong>Name:</strong> ${customer.name}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            <p><strong>Points:</strong> ${customer.numPoints}</p>
        </div>
        <div class="profile-orders">
            <div class="status-header" style="font-size: 1.1vw; margin-bottom: 0.5vw;">Order History</div>
            <div id="profile-order-list"></div>
        </div>
    `;

    const orderContainer = document.getElementById('profile-order-list');
    
    // Filter orders belonging to this customer
    const personalHistory = orderHistory.filter(o => o.customerID === customer.customerID);

    if (personalHistory.length === 0) {
        orderContainer.innerHTML = '<p style="font-size: 0.9vw; color: #666;">No orders found.</p>';
        return;
    }

    personalHistory.forEach(order => {
        // --- NEW LOGIC START: Aggregate items ---
        const aggregatedItems = {};
        
        order.items.forEach(item => {
            if (aggregatedItems[item.name]) {
                aggregatedItems[item.name].count += 1;
            } else {
                aggregatedItems[item.name] = {
                    name: item.name,
                    price: item.price,
                    count: 1
                };
            }
        });
        
        // Convert the object back to an array for mapping
        const uniqueItemsList = Object.values(aggregatedItems);
        // --- NEW LOGIC END ---

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
                            <span>
                                ${item.name} 
                                ${item.count > 1 ? `<span style="font-weight:bold; color: #666;">- x${item.count}</span>` : ''}
                            </span>
                            <span>$${(item.price * item.count).toFixed(2)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        // Toggle expansion
        orderRow.onclick = (e) => {
            const details = orderRow.querySelector('.order-expand-details');
            const isVisible = details.style.display === 'block';
            
            // Close all others first (optional, for cleaner UI)
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

renderMenu();
renderOrder();
renderCustomers();