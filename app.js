/*
    SETUP
*/

const express = require('express');  // We are using the express library for the web server
const app = express();               // We need to instantiate an express object to interact with the server in our code
const PORT = 6777;     // Set a port number
const db = require('./db-connector');

// Middleware
app.use(express.static('public'));
app.use(express.json());

/*
    HTML ROUTE
*/

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

/*
    API ROUTES — RESET
*/

// POST /api/reset — Calls the stored procedure to drop/recreate/reseed all tables
app.post('/api/reset', async (req, res) => {
    await db.query('CALL sp_reset_sally_coffee();');
    res.json({ success: true});
});

/*
    API ROUTES — CUSTOMERS
*/

// GET /api/customers — Get all customers (with optional search filters)
app.get('/api/customers', async (req, res) => {
    const name = req.query.name;
    const number = req.query.number;

    let query, params;
    if (name || number) {
        query = `SELECT customerID, customerName, customerNumber, numPoints
                 FROM Customers
                 WHERE customerName LIKE CONCAT('%', ?, '%')
                   AND (customerNumber LIKE CONCAT('%', ?, '%') OR (customerNumber IS NULL AND ? = ''))`;
        params = [name, number, number];
    } else {
        query = `SELECT customerID, customerName, customerNumber, numPoints FROM Customers`;
        params = [];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
});

// POST /api/customers — Add a new customer
app.post('/api/customers', async (req, res) => {
    const { customerName, customerNumber, numPoints } = req.body;
    const points = numPoints || 0;
    const [result] = await db.query(
        'INSERT INTO Customers (customerName, customerNumber, numPoints) VALUES (?, ?, ?)',
        [customerName, customerNumber || null, points]
    );
    res.json({ customerID: result.insertId, customerName, customerNumber, numPoints: points });
});

// PUT /api/customers/:id — Update a customer
app.put('/api/customers/:id', async (req, res) => {
    const { customerName, customerNumber, numPoints } = req.body;
    await db.query(
        'UPDATE Customers SET customerName = ?, customerNumber = ?, numPoints = ? WHERE customerID = ?',
        [customerName, customerNumber || null, numPoints, req.params.id]
    );
    res.json({ success: true });
});

// DELETE /api/customers/:id — Delete a customer using stored procedure
app.delete('/api/customers/:id', async (req, res) => {
    await db.query('CALL sp_delete_customer(?)', [req.params.id]);
    res.json({ success: true });
});

// GET /api/customers/:id/orders — Get a specific customer's completed order history
app.get('/api/customers/:id/orders', async (req, res) => {
    const [orders] = await db.query(
        'SELECT orderID, orderDate, orderCost FROM Orders WHERE customerID = ? AND status = ? ORDER BY orderDate DESC',
        [req.params.id, 'completed']
    );

    // For each order, fetch its items
    for (let order of orders) {
        const [items] = await db.query(
            `SELECT Products.productID, Products.productName, Products.productCost,
                    Products.productType, OrderHasProducts.quantity
             FROM OrderHasProducts
             INNER JOIN Products ON OrderHasProducts.productID = Products.productID
             WHERE OrderHasProducts.orderID = ?`,
            [order.orderID]
        );
        order.items = items;
    }

    res.json(orders);
});

/*
    API ROUTES — PRODUCTS
*/

// GET /api/products — Get all products for the menu
app.get('/api/products', async (req, res) => {
    const [rows] = await db.query(
        'SELECT productID, productName, productCost, productType, substituteProductID FROM Products'
    );
    res.json(rows);
});

/*
    API ROUTES — ORDERS
*/

// GET /api/orders — Get orders by status (queued or completed)
app.get('/api/orders', async (req, res) => {
    const status = req.query.status || 'completed';
    const [rows] = await db.query(
        `SELECT Orders.orderID, Orders.orderDate, Orders.orderCost, Orders.status,
                Orders.customerID, Customers.customerName
         FROM Orders
         INNER JOIN Customers ON Orders.customerID = Customers.customerID
         WHERE Orders.status = ?
         ORDER BY Orders.orderDate DESC`,
        [status]
    );
    res.json(rows);
});

// GET /api/orders/:id/items — Get items for a specific order
app.get('/api/orders/:id/items', async (req, res) => {
    const [rows] = await db.query(
        `SELECT Products.productID, Products.productName, Products.productCost,
                Products.productType, OrderHasProducts.quantity
         FROM OrderHasProducts
         INNER JOIN Products ON OrderHasProducts.productID = Products.productID
         WHERE OrderHasProducts.orderID = ?`,
        [req.params.id]
    );
    res.json(rows);
});

// TODO: 
// POST /api/orders — Place a new order (enters queue with status='queued')
// SP needs to: INSERT Orders, INSERT OrderHasProducts per item, UPDATE Inventory, UPDATE Customers points
app.post('/api/orders', async (req, res) => {});

// TODO: 
// PUT /api/orders/:id/complete — Mark a queued order as completed
// SP needs to: UPDATE Orders SET status = 'completed'
app.put('/api/orders/:id/complete', async (req, res) => {});

// TODO: 
// DELETE /api/orders/:id — Cancel a queued order and restore inventory
// SP needs to: look up OHP items, restore Inventory for each, DELETE from Orders (CASCADE handles OHP)
app.delete('/api/orders/:id', async (req, res) => {});


// TODO: 
// PUT /api/orders/:id/items — Update items in a queued order (save queue edit)
// SP needs to: loop updates, UPDATE/DELETE OHP, adjust Inventory by diff, recalculate Orders cost
app.put('/api/orders/:id/items', async (req, res) => {});

/*
    API ROUTES — INVENTORY
*/

// GET /api/inventory — Get all inventory items with product names
app.get('/api/inventory', async (req, res) => {
    const [rows] = await db.query(
        `SELECT Inventory.inventoryID, Products.productID, Products.productName,
                Inventory.productStock, Inventory.productLocation
         FROM Inventory
         INNER JOIN Products ON Inventory.productID = Products.productID`
    );
    res.json(rows);
});

// PUT /api/inventory/:id — Update stock level and location
app.put('/api/inventory/:id', async (req, res) => {
    const { productStock, productLocation } = req.body;
    await db.query(
        'UPDATE Inventory SET productStock = ?, productLocation = ? WHERE inventoryID = ?',
        [productStock, productLocation, req.params.id]
    );
    res.json({ success: true });
});

/*
    LISTENER
*/

app.listen(PORT, function () {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});