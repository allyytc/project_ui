// --- Custom Tooltip System ---
(function() {
	const tip = document.createElement('div');
	tip.id = 'custom-tooltip';
	document.body.appendChild(tip);

	document.addEventListener('mouseover', function(e) {
		const el = e.target.closest('[data-tooltip]');
		if (el) {
			tip.textContent = el.getAttribute('data-tooltip');
			tip.classList.add('visible');
		}
	});

	document.addEventListener('mousemove', function(e) {
		if (tip.classList.contains('visible')) {
			let x = e.clientX + 12;
			let y = e.clientY + 16;
			// Keep tooltip on screen
			if (x + tip.offsetWidth > window.innerWidth) x = e.clientX - tip.offsetWidth - 8;
			if (y + tip.offsetHeight > window.innerHeight) y = e.clientY - tip.offsetHeight - 8;
			tip.style.left = x + 'px';
			tip.style.top = y + 'px';
		}
	});

	document.addEventListener('mouseout', function(e) {
		const el = e.target.closest('[data-tooltip]');
		if (el) {
			tip.classList.remove('visible');
		}
	});
})();

// populated from database via fetch
let menuItems = [];           // From Products table
let inventoryData = [];       // From Inventory JOIN Products
let customerData = [];        // From Customers table
let orderHistory = [];        // Completed orders from Orders table
let activeQueue = [];         // Queued orders from Orders table

let order = [];               // Current order being built (local state)
let redeemFreeDrink = false;
let selectedQueueIdx = null;

// Substitution mapping built dynamically from substituteProductID
let oatMilkSubs = {};         // { productName: { name, productID, ... } }



// NEW: These functions replace all hardcoded data. Each one hits a
// API route that runs a SELECT query on the database.
// fetchProducts() also builds the oat milk substitution map dynamically
// from the substituteProductID column in the Products table, replacing
// the old hardcoded oatMilkSubs object.
async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        menuItems = await res.json();
        // Build substitution mapping from substituteProductID
        oatMilkSubs = {};
        menuItems.forEach(item => {
            if (item.substituteProductID) {
                const sub = menuItems.find(m => m.productID === item.substituteProductID);
                if (sub) {
                    oatMilkSubs[item.productName] = sub;
                }
            }
        });
    } catch (err) {
        console.error('Failed to fetch products:', err);
    }
}

async function fetchInventory() {
    try {
        const res = await fetch('/api/inventory');
        inventoryData = await res.json();
    } catch (err) {
        console.error('Failed to fetch inventory:', err);
    }
}

async function fetchCustomers() {
    try {
        const res = await fetch('/api/customers');
        customerData = await res.json();
    } catch (err) {
        console.error('Failed to fetch customers:', err);
    }
}

async function fetchCompletedOrders() {
    try {
        const res = await fetch('/api/orders?status=completed');
        orderHistory = await res.json();
    } catch (err) {
        console.error('Failed to fetch completed orders:', err);
    }
}

async function fetchQueuedOrders() {
    try {
        const res = await fetch('/api/orders?status=queued');
        activeQueue = await res.json();
    } catch (err) {
        console.error('Failed to fetch queued orders:', err);
    }
}

async function fetchOrderItems(orderID) {
    try {
        const res = await fetch(`/api/orders/${orderID}/items`);
        return await res.json();
    } catch (err) {
        console.error('Failed to fetch order items:', err);
        return [];
    }
}

async function fetchCustomerOrders(customerID) {
    try {
        const res = await fetch(`/api/customers/${customerID}/orders`);
        return await res.json();
    } catch (err) {
        console.error('Failed to fetch customer orders:', err);
        return [];
    }
}

// Reload all data from database
async function refreshAllData() {
    await Promise.all([
        fetchProducts(),
        fetchInventory(),
        fetchCustomers(),
        fetchCompletedOrders(),
        fetchQueuedOrders()
    ]);
}

// Menu Rendering (Create Order Page)

const itemsGrid = document.getElementById('items-grid');
const orderList = document.getElementById('order-list');
const orderTotalVal = document.getElementById('order-total-val');

// Had to change slightly to match with new sub logic
// Pretty much the same
function renderMenu() {
    itemsGrid.innerHTML = '';
    menuItems.forEach((item) => {
        // Skip oat milk items — only available via the substitute button
        if (item.productName.toLowerCase().startsWith('oat milk')) return;

        const hasSub = oatMilkSubs.hasOwnProperty(item.productName);
        const div = document.createElement('div');
        div.className = 'item-card';
        div.setAttribute('data-tooltip', `Click to add ${item.productName} to order`);
        div.innerHTML = `
            <div class="item-name">${item.productName}</div>
            ${hasSub ? '<div class="item-sub-label">Oat milk option available</div>' : ''}
            <div class="item-price">$${Number(item.productCost).toFixed(2)}</div>
        `;
        div.onclick = () => addToOrder(item);
        itemsGrid.appendChild(div);
    });
}

// Updated
function addToOrder(item) {
    order.push({
        productID: item.productID,
        productName: item.productName,
        productCost: Number(item.productCost),
        productType: item.productType,
        substituteProductID: item.substituteProductID
    });
    renderOrder();
}

function renderOrder() {
    orderList.innerHTML = '';
    let total = 0;

    // Find cheapest drink index for free drink redemption
    let cheapestDrinkIdx = -1;
    if (redeemFreeDrink) {
        let cheapestPrice = Infinity;
        order.forEach((item, idx) => {
            if (item.productType === 'drink' && item.productCost < cheapestPrice) {
                cheapestPrice = item.productCost;
                cheapestDrinkIdx = idx;
            }
        });
        // If no drinks in order, can't redeem
        if (cheapestDrinkIdx === -1) redeemFreeDrink = false;
    }

    order.forEach((item, idx) => {
        const li = document.createElement('li');
        const isFree = (idx === cheapestDrinkIdx);
        const canSub = oatMilkSubs.hasOwnProperty(item.productName);
        const isOat = item.productName.toLowerCase().startsWith('oat milk');
        li.innerHTML = `
            <span>${item.productName}${isFree ? ' <span style="color: green; font-weight: bold;">(FREE)</span>' : ''}</span>
            <span class="price-delete-wrap">
                ${canSub ? `<button class="sub-btn" data-tooltip="${isOat ? 'Switch to regular milk' : 'Switch to oat milk'}">${isOat ? 'Regular' : 'Sub Oat Milk'}</button>` : ''}
                <span class="order-price" ${isFree ? 'style="text-decoration: line-through; color: #999;"' : ''}>$${item.productCost.toFixed(2)}</span>
                <button class="delete-btn" data-tooltip="Remove">&times;</button>
            </span>
        `;
        li.querySelector('.delete-btn').onclick = () => {
            order.splice(idx, 1);
            renderOrder();
        };
        if (canSub) {
            li.querySelector('.sub-btn').onclick = () => {
                const subItem = oatMilkSubs[item.productName];
                if (subItem) {
                    // Updated
                    order[idx] = {
                        productID: subItem.productID,
                        productName: subItem.productName,
                        productCost: Number(subItem.productCost),
                        productType: subItem.productType,
                        substituteProductID: subItem.substituteProductID
                    };
                    renderOrder();
                }
            };
        }
        orderList.appendChild(li);
        total += isFree ? 0 : item.productCost;
    });
    orderTotalVal.textContent = `$${total.toFixed(2)}`;
    updatePointsInfo();
}

function updatePointsInfo() {
    const pointsInfo = document.getElementById('points-info');
    const pointsDisplay = document.getElementById('points-display');
    const redeemBtn = document.getElementById('redeem-drink-btn');
    
    if (!pointsInfo) return;

    const customerName = document.getElementById('order-customer-name').value.trim();
    const customer = customerData.find(c => c.customerName.toLowerCase() === customerName.toLowerCase());

    if (!customer) {
        pointsInfo.style.display = 'none';
        redeemFreeDrink = false;
        return;
    }

    const hasDrinks = order.some(item => item.productType === 'drink');

    pointsInfo.style.display = 'block';
    pointsDisplay.textContent = `Points available: ${customer.numPoints} points`;

    if (customer.numPoints >= 10 && hasDrinks) {
        redeemBtn.style.display = 'inline-block';
        if (redeemFreeDrink) {
            redeemBtn.textContent = 'Free Drink Applied (-10 pts)';
            redeemBtn.style.backgroundColor = '#4CAF50';
            redeemBtn.setAttribute('data-tooltip', 'Remove Free Drink discount');
        } else {
            redeemBtn.textContent = 'Redeem Free Drink (-10 pts)';
            redeemBtn.style.backgroundColor = '#ff9800';
            redeemBtn.setAttribute('data-tooltip', 'Use 10 points to get the cheapest drink free');
        }
    } else {
        redeemBtn.style.display = 'none';
        if (!hasDrinks) redeemFreeDrink = false;
    }
}

// Tab Navigation 
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

navButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.id.replace('nav-', '');
        pages.forEach(p => {
            p.style.display = p.id === 'page-' + target ? '' : 'none';
        });

        // CHANGE: Tab clicks now fetch fresh data from the DB before rendering.
        // This means if someone else changed data (or you used PHPMyAdmin),
        // switching tabs will pick up those changes.
        if (target === 'history') {
            await fetchCompletedOrders();
            await fetchQueuedOrders();
            renderHistory();
            renderQueue();
        }
        if (target === 'inventory') {
            await fetchInventory();
            renderInventory();
        }
        if (target === 'customers') {
            await fetchCustomers();
            renderCustomers();
        }
        if (target === 'items') {
            await fetchProducts();
            await fetchCustomers();
            renderMenu();
        }
    });
});

// --- Order History ---

// CHANGE: Now async. Items come from the OrderHasProducts JOIN query
// instead of being stored in a local array. The DB already groups by
// product with a quantity column, so no client-side aggregation needed.
function renderHistory() {
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = '';
    orderHistory.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        const d = new Date(entry.orderDate);
        const dateStr = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        tr.setAttribute('data-tooltip', `Click to view order #${entry.orderID} details`);
        tr.innerHTML = `
            <td>${dateStr}&nbsp;&nbsp;${timeStr}</td>
            <td>#${entry.orderID}</td>
            <td>$${Number(entry.orderCost).toFixed(2)}</td>
        `;
        tr.onclick = () => showHistoryOrder(idx);
        tbody.appendChild(tr);
    });
}


// Very Updated
async function showHistoryOrder(idx) {
    const entry = orderHistory[idx];
    const items = await fetchOrderItems(entry.orderID);

    const d = new Date(entry.orderDate);
    const dateStr = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    document.getElementById('history-order-title').textContent = `Order <#${entry.orderID}>`;
    document.getElementById('history-order-time').textContent = `${timeStr}  ${dateStr}`;

    const list = document.getElementById('history-order-list');
    list.innerHTML = '';

    items.forEach(item => {
        const li = document.createElement('li');
        const qtyDisplay = item.quantity > 1
            ? `<span style="font-weight:bold; color: #666; margin-left: 0.5em;">x${item.quantity}</span>`
            : '';
        li.innerHTML = `
            <span>${item.productName}${qtyDisplay}</span>
            <span class="order-price">$${Number(item.productCost).toFixed(2)}</span>
        `;
        list.appendChild(li);
    });

    document.getElementById('history-order-total').textContent = `$${Number(entry.orderCost).toFixed(2)}`;

    // Highlight selected row
    document.querySelectorAll('#history-tbody tr').forEach(r => r.classList.remove('selected'));
    const rows = document.querySelectorAll('#history-tbody tr');
    if (rows[idx]) rows[idx].classList.add('selected');

    selectedQueueIdx = null;
    document.querySelectorAll('#queue-tbody tr').forEach(r => r.classList.remove('selected'));
}

// --- Queue Rendering ---

// CHANGE: Time is now parsed from the DB datetime field instead of
// being a string we stored when the order was created locally.d
function renderQueue() {
    const tbody = document.getElementById('queue-tbody');
    const emptyMsg = document.getElementById('queue-empty-msg');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (activeQueue.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';

    activeQueue.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        if (selectedQueueIdx === idx) tr.classList.add('selected');

        // Added
        const d = new Date(entry.orderDate);
        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        // End update

        tr.setAttribute('data-tooltip', `Click to view ${entry.customerName}'s order`);
        tr.innerHTML = `
            <td style="font-weight:bold;">${entry.customerName}</td>
            <td>${timeStr}</td>
            <td style="text-align:right;">$${Number(entry.orderCost).toFixed(2)}</td>
        `;
        tr.onclick = () => showQueueOrder(idx);
        tbody.appendChild(tr);
    });
}

// CHANGE: Now async. Fetches items from DB via JOIN instead of reading
// from the local queue entry. Passes fetched items to edit mode.
async function showQueueOrder(idx) {
    selectedQueueIdx = idx;
    const entry = activeQueue[idx];
    const items = await fetchOrderItems(entry.orderID);
    const d = new Date(entry.orderDate);
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const panel = document.getElementById('history-order-summary');
    panel.innerHTML = `
        <div class="profile-header-row" style="margin-bottom:0.8em;">
            <span class="profile-title-text" style="font-size:1.2vw;">${entry.customerName}</span>
            <div class="profile-actions">
                <button class="icon-btn edit-btn" id="queue-edit-btn" data-tooltip="Edit or cancel this order">✎</button>
            </div>
        </div>
        <div style="font-size:0.85vw; color:#888; margin-bottom:0.8em;">⏰ ${timeStr}</div>
        <ul class="order-list">
            ${items.map(item => `
                <li>
                    <span>${item.productName}${item.quantity > 1
                        ? ` <span style="font-weight:bold; color:#666;">x${item.quantity}</span>`
                        : ''}
                    </span>
                    <span class="order-price">$${Number(item.productCost).toFixed(2)}</span>
                </li>
            `).join('')}
        </ul>
        <div class="order-total" style="margin-top:1em;">
            <span>Total:</span>
            <span>$${Number(entry.orderCost).toFixed(2)}</span>
        </div>
        <button id="queue-complete-btn" class="action-btn"
                style="width:100%; margin-top:1vw; background:#4CAF50; padding:0.6em;"
                data-tooltip="Mark this order as complete and move to history">
            ✅ Complete Order
        </button>
    `;

    document.getElementById('queue-edit-btn').onclick = () => enableQueueEditMode(idx, items);
    document.getElementById('queue-complete-btn').onclick = () => completeQueueOrder(idx);

    document.querySelectorAll('#queue-tbody tr').forEach((r, i) => r.classList.toggle('selected', i === idx));
    document.querySelectorAll('#history-tbody tr').forEach(r => r.classList.remove('selected'));
}

// CHANGE: Receives items from the caller instead of re-aggregating.
// Inputs now store data-productid (needed for DB updates) instead of data-name.
async function enableQueueEditMode(idx, items) {
    const entry = activeQueue[idx];
    const panel = document.getElementById('history-order-summary');

    panel.innerHTML = `
        <div class="profile-header-row" style="margin-bottom:0.8em;">
            <span class="profile-title-text" style="font-size:1.2vw;">${entry.customerName}</span>
            <div class="profile-actions">
                <button class="icon-btn confirm-btn" id="queue-save-btn" data-tooltip="Save changes">✔</button>
                <button class="icon-btn delete-btn" id="queue-cancel-order-btn" data-tooltip="Cancel this order">🗑</button>
            </div>
        </div>
        <ul class="order-list" id="queue-edit-list">
            ${items.map((item, i) => `
                <li style="gap:0.5em;">
                    <span style="flex:1; font-size:0.9vw;">${item.productName}</span>
                    <input type="number" class="qty-input" id="edit-qty-${i}"
                           value="${item.quantity}" min="0"
                           data-productid="${item.productID}"
                           data-oldqty="${item.quantity}"
                           data-price="${item.productCost}">
                    <span class="order-price">$${Number(item.productCost).toFixed(2)}</span>
                </li>
            `).join('')}
        </ul>
        <div class="order-total" style="margin-top:1em;">
            <span>Total:</span>
            <span id="queue-edit-total">$${Number(entry.orderCost).toFixed(2)}</span>
        </div>
        <div style="font-size:0.75vw; color:#888; text-align:right; margin-top:0.3em;">
            Set qty to 0 to remove an item.
        </div>
    `;

    // Live total update
    items.forEach((item, i) => {
        document.getElementById(`edit-qty-${i}`).addEventListener('input', () => {
            let total = 0;
            items.forEach((it, j) => {
                const qty = parseInt(document.getElementById(`edit-qty-${j}`)?.value) || 0;
                total += qty * Number(it.productCost);
            });
            document.getElementById('queue-edit-total').textContent = `$${total.toFixed(2)}`;
        });
    });

    document.getElementById('queue-save-btn').onclick = () => saveQueueEdit(idx, items);
    document.getElementById('queue-cancel-order-btn').onclick = () => {
        if (confirm(`Cancel order for ${entry.customerName}? Inventory will be restored.`)) {
            cancelQueueOrder(idx);
        }
    };
}


// CHANGE: Completely rewritten. Instead of mutating local arrays,
// sends updates to the backend which handles the DB transaction:
// updates OrderHasProducts quantities, adjusts Inventory, recalculates cost.
async function saveQueueEdit(idx, originalItems) {
    const entry = activeQueue[idx];
    const updates = [];
    let allZero = true;

    originalItems.forEach((item, i) => {
        const newQty = parseInt(document.getElementById(`edit-qty-${i}`).value) || 0;
        if (newQty > 0) allZero = false;
        updates.push({
            productID: item.productID,
            oldQuantity: item.quantity,
            newQuantity: newQty,
            unitPrice: Number(item.productCost)
        });
    });

    if (allZero) {
        if (confirm("All items removed. Cancel this order entirely?")) {
            await cancelQueueOrder(idx);
        }
        return;
    }

    try {
        const res = await fetch(`/api/orders/${entry.orderID}/items`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        });
        const data = await res.json();
        if (data.success) {
            await fetchQueuedOrders();
            await fetchInventory();
            renderQueue();
            renderInventory();
            // Re-show the updated order
            const newIdx = activeQueue.findIndex(o => o.orderID === entry.orderID);
            if (newIdx >= 0) showQueueOrder(newIdx);
        }
    } catch (err) {
        console.error('Failed to save queue edit:', err);
        alert('Failed to save changes.');
    }
}

// CHANGE: Instead of manually moving data between local arrays,
// tells the backend to flip the status column from 'queued' to 'completed'.
async function completeQueueOrder(idx) {
    const entry = activeQueue[idx];
    try {
        const res = await fetch(`/api/orders/${entry.orderID}/complete`, { method: 'PUT' });
        const data = await res.json();
        if (data.success) {
            selectedQueueIdx = null;
            resetHistorySidebar();
            await fetchQueuedOrders();
            await fetchCompletedOrders();
            await fetchCustomers();
            renderQueue();
            renderHistory();
            updateOrderHeader();
        }
    } catch (err) {
        console.error('Failed to complete order:', err);
        alert('Failed to complete order.');
    }
}

// CHANGE: Backend handles inventory restoration and order deletion
// in a transaction instead of local array manipulation.
async function cancelQueueOrder(idx) {
    const entry = activeQueue[idx];
    try {
        const res = await fetch(`/api/orders/${entry.orderID}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            selectedQueueIdx = null;
            resetHistorySidebar();
            await fetchQueuedOrders();
            await fetchInventory();
            renderQueue();
            renderInventory();
        }
    } catch (err) {
        console.error('Failed to cancel order:', err);
        alert('Failed to cancel order.');
    }
}

// Change: moved into its own function from completeQueueOrder and cancelQueueOrder
function resetHistorySidebar() {
    const panel = document.getElementById('history-order-summary');
    panel.innerHTML = `
        <div class="order-header">
            <span id="history-order-title">Order &lt;#&gt;</span>
            <span class="order-time" id="history-order-time"></span>
        </div>
        <ul class="order-list" id="history-order-list"></ul>
        <div class="order-total">
            <span>Total:</span>
            <span id="history-order-total">$0.00</span>
        </div>
    `;
}

// --- Inventory ---

let currentInvItem = null; // Store the item currently being viewed

function renderInventory() {
    // 1. Render Table
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';

    inventoryData.forEach((item) => {
        const tr = document.createElement('tr');
        // Add click listener to select item
        tr.onclick = () => showInventoryItem(item);
        tr.setAttribute('data-tooltip', `Click to view ${item.productName} details`);

        // Highlight logic
        tr.className = 'inventory-row';

        tr.innerHTML = `
            <td>${item.productName}</td>
            <td>${item.productStock}</td>
            <td>${item.productLocation}</td>
        `;
        tbody.appendChild(tr);
    });

    // 2. Render Status List
    renderStatusList();
}

function renderStatusList() {
    const statusList = document.getElementById('status-list');
    statusList.innerHTML = '';

    // Sort: red first, then yellow, then green
    const sorted = [...inventoryData].sort((a, b) => a.productStock - b.productStock);

    sorted.forEach(item => {
        let color = 'green';
        if (item.productStock === 0) color = 'red';
        else if (item.productStock < 100) color = 'yellow';

        // Only show items that need attention? Or all? 
        // Showing all for now based on previous code, or just red/yellow to save space.
        const li = document.createElement('li');
        li.setAttribute('data-tooltip', `Click to view ${item.productName} details (Stock: ${item.productStock})`);
        li.innerHTML = `
            <span>${item.productName}</span>
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

function showInventoryItem(item) {
    currentInvItem = item;

    // 1. Switch Panel Views
    document.getElementById('inventory-status-view').style.display = 'none';
    document.getElementById('inventory-detail-view').style.display = 'flex';

    // 2. Populate Read-Only Data
    document.getElementById('inv-detail-title').textContent = item.productName;
    document.getElementById('disp-stock').textContent = item.productStock;
    document.getElementById('disp-location').textContent = item.productLocation;

    // 3. Reset Edit State (Ensure we are in View mode)
    toggleInvEditMode(false);

    // 4. Highlight Row (Visual feedback)
    const rows = document.querySelectorAll('#inventory-tbody tr');
    rows.forEach(r => r.style.background = '');
    // Find the row that matches this item name (simple approach)
    const match = Array.from(rows).find(r => r.cells[0].textContent === item.productName);
    if (match) match.style.background = '#d0c4e0';
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
        document.getElementById('edit-inv-stock').value = currentInvItem.productStock;
        document.getElementById('edit-inv-location').value = currentInvItem.productLocation;
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
// CHANGE: Now sends the update to the database instead of just
// changing the local object. Re-fetches inventory after saving
// so the UI reflects the actual DB state.
document.getElementById('btn-inv-confirm').onclick = async () => {
    const newStock = parseInt(document.getElementById('edit-inv-stock').value);
    const newLoc = document.getElementById('edit-inv-location').value.trim();

    if (newStock >= 0 && newLoc) {
        try {
            const res = await fetch(`/api/inventory/${currentInvItem.inventoryID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // Update Data
                body: JSON.stringify({ productStock: newStock, productLocation: newLoc })
            });
            const data = await res.json();
            if (data.success) {
                await fetchInventory();

                // Update UI
                renderInventory();

                // Re-select the updated item
                const updated = inventoryData.find(i => i.inventoryID === currentInvItem.inventoryID);
                if (updated) showInventoryItem(updated);

                // Return to View Mode
                toggleInvEditMode(false);
            }
        } catch (err) {
            console.error('Failed to update inventory:', err);
            alert('Failed to save changes.');
        }
    } else {
        alert("Stock must be a positive number and Location cannot be empty.");
    }
};

// Enter key for inventory edit
['edit-inv-stock', 'edit-inv-location'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('btn-inv-confirm').click();
        });
    }
});

// --- Customers Logic ---
const nameInp = document.getElementById('input-name');
const numberInp = document.getElementById('input-number');

function renderCustomers(results) {
    const tbody = document.getElementById('customers-tbody');
    const data = results || customerData;

    tbody.innerHTML = '';

    data.forEach((customer) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-tooltip', `Click to view ${customer.customerName}'s profile`);
        tr.innerHTML = `<td>${customer.customerName}</td><td>${customer.customerNumber || ''}</td><td>${customer.numPoints}</td>`;
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
    renderProfileViewMode(customer);
}

async function renderProfileViewMode(customer) {
    const profilePanel = document.getElementById('customer-details');

    // 1. Header with Edit Button
    profilePanel.innerHTML = `
        <div class="profile-header-row">
            <span class="profile-title-text">Customer Profile</span>
            <div class="profile-actions">
                <button class="icon-btn edit-btn" id="edit-profile-btn" data-tooltip="Edit Profile">✎</button>
            </div>
        </div>

        <div id="profile-data-container">
            <div class="profile-meta" style="margin-bottom: 1.5vw; border-bottom: 1px solid #ccc; padding-bottom: 0.5vw;">
                <p><strong>Name:</strong> ${customer.customerName}</p>
                <p><strong>Phone:</strong> ${customer.customerNumber}</p>
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
    await renderProfileOrders(customer);
}

function enableEditMode(customer) {
    const container = document.getElementById('profile-data-container');

    // Select the .profile-actions strictly INSIDE the customer-details panel
    const actionsDiv = document.getElementById('customer-details').querySelector('.profile-actions');

    let isMarkedForDeletion = false;

    // 1. Replace Buttons
    actionsDiv.innerHTML = `
        <button class="icon-btn confirm-btn" id="confirm-edit-btn" data-tooltip="Save Changes">✔</button>
        <button class="icon-btn delete-btn" id="delete-toggle-btn" data-tooltip="Delete Customer">🗑</button>
    `;

    // 2. Inject Inputs
    container.innerHTML = `
        <div class="profile-meta" id="edit-form-wrapper" style="margin-bottom: 1.5vw; border-bottom: 1px solid #ccc; padding-bottom: 0.5vw;">
            <label style="font-size:0.9vw; font-weight:bold;">Name:</label>
            <input type="text" class="profile-input" id="edit-name" value="${customer.customerName}">

            <label style="font-size:0.9vw; font-weight:bold;">Phone:</label>
            <input type="text" class="profile-input" id="edit-number" value="${customer.customerNumber}">
            
            <label style="font-size:0.9vw; font-weight:bold;">Points:</label>
            <input type="number" class="profile-input" id="edit-points" value="${customer.numPoints}">
        </div>
    `;

    const deleteBtn = document.getElementById('delete-toggle-btn');
    const confirmBtn = document.getElementById('confirm-edit-btn');
    const formWrapper = document.getElementById('edit-form-wrapper');
    const inputs = formWrapper.querySelectorAll('input');

    // -- Add Enter Key Listener to all new inputs ---
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
            confirmBtn.setAttribute('data-tooltip', 'Confirm Deletion');
        } else {
            formWrapper.classList.remove('pending-delete-state');
            inputs.forEach(input => input.disabled = false);
            confirmBtn.setAttribute('data-tooltip', 'Save Changes');
        }
    };

    // 4. Confirm Logic
    confirmBtn.onclick = async () => {
        if (isMarkedForDeletion) {
            // DELETE customer using stored procedure via API
            try {

                // CHANGE: Delete now goes through the backend stored procedure.
                // CASCADE handles removing the customer's orders and order items.
                // refreshAllData() is called because the cascade affects multiple tables.
                const res = await fetch(`/api/customers/${customer.customerID}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    await refreshAllData();
                    renderCustomers();
                    renderHistory();
                    renderInventory();
                    document.getElementById('customer-details').innerHTML = '<p style="padding:1vw;">Customer deleted. Select another customer.</p>';
                    alert('Customer deleted.');
                }
            } catch (err) {
                console.error('Failed to delete customer:', err);
                alert('Failed to delete customer.');
            }
        } else {
            // UPDATE customer
            const newName = document.getElementById('edit-name').value.trim();
            const newNumber = document.getElementById('edit-number').value.trim();
            const newPoints = parseInt(document.getElementById('edit-points').value);

            if (newName) {
                try {
                    const res = await fetch(`/api/customers/${customer.customerID}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            customerName: newName,
                            customerNumber: newNumber || null,
                            numPoints: newPoints
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        await fetchCustomers();
                        const updated = customerData.find(c => c.customerID === customer.customerID);
                        renderCustomers();
                        if (updated) renderProfileViewMode(updated);
                    }
                } catch (err) {
                    console.error('Failed to update customer:', err);
                    alert('Failed to save changes.');
                }
            } else {
                alert("Name cannot be empty.");
            }
        }
    };
}

// Helper to render the order list
// CHANGE: Now fetches this customer's orders from a dedicated API endpoint
// that does the JOIN server-side, instead of filtering the local array.
async function renderProfileOrders(customer) {
    const orderContainer = document.getElementById('profile-order-list');
    const orders = await fetchCustomerOrders(customer.customerID);

    if (orders.length === 0) {
        orderContainer.innerHTML = '<p style="font-size: 0.9vw; color: #666;">No orders found.</p>';
        return;
    }

    orders.forEach(order => {
        const d = new Date(order.orderDate);
        const dateStr = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const orderRow = document.createElement('div');
        orderRow.className = 'history-item-row';
        orderRow.style = "cursor:pointer; border-bottom:1px solid #eee; padding: 0.5vw 0;";

        orderRow.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size: 1vw;">
                <span>${dateStr} ${timeStr}</span>
                <span>$${Number(order.orderCost).toFixed(2)}</span>
            </div>
            <div class="order-expand-details" style="display:none; padding: 0.5vw; background: #f9f9f9; font-size: 0.9vw; margin-top: 0.3vw;">
                <ul style="list-style:none; padding:0; margin:0;">
                    ${(order.items || []).map(item => `
                        <li style="display:flex; justify-content:space-between;">
                            <span>${item.productName} ${item.quantity > 1 ? `<span style="font-weight:bold; color:#666;">x${item.quantity}</span>` : ''}</span>
                            <span>$${Number(item.productCost).toFixed(2)}</span>
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
document.getElementById('search-customer-btn').addEventListener('click', async () => {
    const n = nameInp.value.trim();
    const p = numberInp.value.trim();
    try {
        const res = await fetch(`/api/customers?name=${encodeURIComponent(n)}&number=${encodeURIComponent(p)}`);
        const filtered = await res.json();
        renderCustomers(filtered);
    } catch (err) {
        console.error('Failed to search customers:', err);
    }
});

// Add: Update array, clear inputs, show all
document.getElementById('add-customer-btn').addEventListener('click', async () => {
    const name = nameInp.value.trim();
    const number = numberInp.value.trim();

    if (name && number) {
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerName: name, customerNumber: number, numPoints: 0 })
            });
            const data = await res.json();
            if (data.customerID) {
                nameInp.value = '';
                numberInp.value = '';
                await fetchCustomers();
                renderCustomers();
            }
        } catch (err) {
            console.error('Failed to add customer:', err);
            alert('Failed to add customer.');
        }
    } else {
        alert("Enter both Name and Phone Number to add a customer.");
    }
});

// --- Place Order & Autocomplete Logic ---

const nameInput = document.getElementById('order-customer-name');
const hintInput = document.getElementById('order-customer-hint');
const numberInput = document.getElementById('order-customer-number');
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
        redeemFreeDrink = false;
        updatePointsInfo();
        return;
    }

    // A. Autocomplete/Hint Logic
    const match = customerData.find(c => c.customerName.toLowerCase().startsWith(val.toLowerCase()));

    hintInput.value = match ? match.customerName : '';

    // B. New Customer Detection Logic
    // Check for EXACT match to determine if we need the phone field
    const exactMatch = customerData.find(c => c.customerName.toLowerCase() === val.toLowerCase());

    if (exactMatch) {
        setExistingCustomerState();
    } else {
        setNewCustomerState();
        redeemFreeDrink = false;
    }
    updatePointsInfo();
    renderOrder();
});

// 2. Listen for Tab Key (Autocomplete)
nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab' && hintInput.value) {
        e.preventDefault();
        this.value = hintInput.value;
        setExistingCustomerState(); // We autofilled an existing name, so hide phone field
        updatePointsInfo();
        renderOrder();
    }
});

// 3. Place Order Button Logic
placeOrderBtn.addEventListener('click', async () => {
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

    // Identify Customer
    // NOTE: points are awarded on Complete, not here
    let customer = customerData.find(c => c.customerName.toLowerCase() === customerName.toLowerCase());
    let customerID;
    const drinkCount = order.filter(item => item.productType === 'drink').length;

    if (!customer) {
        // --- NEW CUSTOMER ---
        // Validation: Phone is required for new accounts
        const customerNumber = numberInput.value.trim();
        if (!customerNumber) {
            alert("This is a new customer. Please enter a phone number to create the account.");
            return;
        }
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerName, customerNumber, numPoints: 0 })
            });
            const data = await res.json();
            customerID = data.customerID;
        } catch (err) {
            console.error('Failed to create customer:', err);
            alert('Failed to create customer account.');
            return;
        }
    } else {
        // --- EXISTING CUSTOMER ---
        customerID = customer.customerID;
    }

    // Aggregate order items by productID
    const itemMap = {};
    order.forEach(item => {
        if (itemMap[item.productID]) {
            itemMap[item.productID].quantity++;
        } else {
            itemMap[item.productID] = { productID: item.productID, quantity: 1 };
        }
    });
    const items = Object.values(itemMap);

    // Calculate cost with free drink discount
    let totalCost = order.reduce((sum, item) => sum + item.productCost, 0);
    let redeemedPoints = 0;
    if (redeemFreeDrink) {
        // Find and subtract cheapest drink price
        let cheapestPrice = Infinity;
        order.forEach(item => {
            if (item.productType === 'drink' && item.productCost < cheapestPrice) {
                cheapestPrice = item.productCost;
            }
        });
        if (cheapestPrice < Infinity) {
            totalCost -= cheapestPrice;
            redeemedPoints = 10;
        }
    }

    // Reserve inventory immediately when order enters queue
    try {

        // CHANGE: The entire order placement is now a single API call.
        // The backend handles it in a DB transaction: creates the order,
        // inserts items into OrderHasProducts, decrements inventory,
        // and updates customer points — all atomically.
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerID,
                totalCost,
                items,
                drinkCount,
                redeemedPoints
            })
        });
        const data = await res.json();
        if (data.success) {
            // Cleanup & Refresh
            order = [];
            nameInput.value = '';
            hintInput.value = '';
            numberInput.value = ''; // Clear phone
            redeemFreeDrink = false;

            setExistingCustomerState(); // Reset button to green/hidden phone

            await fetchCustomers();
            await fetchInventory();
            renderOrder();
            renderMenu();
            updateOrderHeader();
        }
    } catch (err) {
        console.error('Failed to place order:', err);
        alert('Failed to place order.');
    }
});

// 4. Redeem Free Drink Button
document.getElementById('redeem-drink-btn').addEventListener('click', () => {
    redeemFreeDrink = !redeemFreeDrink;
    updatePointsInfo();
    renderOrder();
});


// NEW: Calls the stored procedure sp_reset_sally_coffee() which drops
// all tables, recreates them, and reinserts the original sample data.
// Then refreshes all local data and re-renders every page.
document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset the database?\n\nThis will erase all changes and restore the original sample data.')) {
        return;
    }

    try {
        const res = await fetch('/api/reset', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            // Reload all data
            await refreshAllData();

            // Reset local state
            order = [];
            redeemFreeDrink = false;
            selectedQueueIdx = null;
            nameInput.value = '';
            hintInput.value = '';
            numberInput.value = '';
            setExistingCustomerState();

            // Re-render all pages
            renderMenu();
            renderOrder();
            renderCustomers();
            renderHistory();
            renderQueue();
            renderInventory();
            updateOrderHeader();

            // Reset sidebar panels
            resetHistorySidebar();
            document.getElementById('customer-details').innerHTML = '<p style="padding:1vw;">Select a customer to view details.</p>';
            document.getElementById('inventory-detail-view').style.display = 'none';
            document.getElementById('inventory-status-view').style.display = 'block';

            alert('Database has been reset to original sample data.');
        } else {
            alert('Reset failed: ' + (data.error));
        }
    } catch (err) {
        console.error('Reset failed:', err);
        alert('Failed to reset database. Check the console for details.');
    }
});

// ORDER HEADER (clock + next order number)

async function updateOrderHeader() {
    // Use the max orderID from completed + queued orders to predict next
    let maxID = 5000;
    orderHistory.forEach(o => { if (o.orderID > maxID) maxID = o.orderID; });
    activeQueue.forEach(o => { if (o.orderID > maxID) maxID = o.orderID; });
    const nextID = maxID + 1;
    document.getElementById('current-order-number').textContent = `Order <#${nextID}>`;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    document.getElementById('current-order-time').textContent = `${timeStr}  ${dateStr}`;
}

setInterval(updateOrderHeader, 1000);


// CHANGE: App startup now fetches all data from the database before
// rendering anything. Without this, all pages would be empty.
async function init() {
    await refreshAllData();
    renderMenu();
    renderOrder();
    renderCustomers();
    updateOrderHeader();
}

init();