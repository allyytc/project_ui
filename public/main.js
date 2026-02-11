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
	{ date: '2/10/26', time: '11:30am', id: 81, cost: 12.50, items: [
		{ name: 'Latte', price: 6.00 },
		{ name: 'Americano', price: 5.50 },
		{ name: 'Drip coffee', price: 3.00 }
	]},
	{ date: '2/11/26', time: '11:30am', id: 82, cost: 16.00, items: [
		{ name: 'Mocha', price: 7.00 },
		{ name: 'Chai latte', price: 5.50 },
		{ name: 'Vanilla Scone', price: 3.50 }
	]},
	{ date: '2/12/26', time: '11:30am', id: 83, cost: 9.00, items: [
		{ name: 'Drip coffee', price: 3.00 },
		{ name: 'Flat White', price: 6.00 }
	]},
	{ date: '2/16/26', time: '11:30am', id: 84, cost: 22.50, items: [
		{ name: 'Oat milk latte', price: 7.00 },
		{ name: 'Matcha latte', price: 7.50 },
		{ name: 'Oat milk Mocha', price: 8.00 }
	]},
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

renderMenu();
renderOrder();
