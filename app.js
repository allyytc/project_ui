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
    try {
        await db.query('CALL sp_reset_sally_coffee();');
        res.json({ success: true });
    } catch (err) {
        console.error('POST /api/reset error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/*
    API ROUTES — CUSTOMERS
*/

// GET /api/customers — Get all customers (with optional search filters)
app.get('/api/customers', async (req, res) => {
    try {
        const name = req.query.name || '';
        const number = req.query.number || '';

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
    } catch (err) {
        console.error('GET /api/customers error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/customers — Add a new customer
app.post('/api/customers', async (req, res) => {
    try {
        const { customerName, customerNumber, numPoints } = req.body;
        const points = numPoints || 0;
        const [result] = await db.query(
            'INSERT INTO Customers (customerName, customerNumber, numPoints) VALUES (?, ?, ?)',
            [customerName, customerNumber || null, points]
        );
        res.json({ customerID: result.insertId, customerName, customerNumber, numPoints: points });
    } catch (err) {
        console.error('POST /api/customers error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/customers/:id — Update a customer
app.put('/api/customers/:id', async (req, res) => {
    try {
        const { customerName, customerNumber, numPoints } = req.body;
        await db.query(
            'UPDATE Customers SET customerName = ?, customerNumber = ?, numPoints = ? WHERE customerID = ?',
            [customerName, customerNumber || null, numPoints, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /api/customers/:id error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/customers/:id — Delete a customer using stored procedure
app.delete('/api/customers/:id', async (req, res) => {
    try {
        await db.query('CALL sp_delete_customer(?)', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/customers/:id error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/customers/:id/orders — Get a specific customer's completed order history
app.get('/api/customers/:id/orders', async (req, res) => {
    try {
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
    } catch (err) {
        console.error('GET /api/customers/:id/orders error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/*
    API ROUTES — PRODUCTS
*/

// GET /api/products — Get all products for the menu
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT productID, productName, productCost, productType, substituteProductID FROM Products'
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/products error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/*
    API ROUTES — ORDERS
*/

// GET /api/orders — Get orders by status (queued or completed)
app.get('/api/orders', async (req, res) => {
    try {
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
    } catch (err) {
        console.error('GET /api/orders error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/orders/:id/items — Get items for a specific order
app.get('/api/orders/:id/items', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT Products.productID, Products.productName, Products.productCost,
                    Products.productType, OrderHasProducts.quantity
             FROM OrderHasProducts
             INNER JOIN Products ON OrderHasProducts.productID = Products.productID
             WHERE OrderHasProducts.orderID = ?`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/orders/:id/items error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders — Place a new order (enters queue with status='queued')
// Calls sp_place_order to INSERT the order and update customer points,
// then loops items to INSERT into OrderHasProducts and decrement Inventory.
app.post('/api/orders', async (req, res) => {
    const { customerID, totalCost, items, redeemedPoints } = req.body;
    try {
        // SP inserts the order row and stores redeemedPoints; returns new orderID via OUT param
        await db.query(
            'CALL sp_place_order(?, ?, ?, @p_orderID)',
            [customerID, totalCost, redeemedPoints || 0]
        );
        const [[row]] = await db.query('SELECT @p_orderID AS orderID');
        const orderID = row.orderID;

        // Insert each item into OrderHasProducts and decrement Inventory
        for (const item of items) {
            await db.query(
                'INSERT INTO OrderHasProducts (orderID, productID, quantity) VALUES (?, ?, ?)',
                [orderID, item.productID, item.quantity]
            );
            await db.query(
                'UPDATE Inventory SET productStock = productStock - ? WHERE productID = ?',
                [item.quantity, item.productID]
            );
        }
        res.json({ success: true, orderID });
    } catch (err) {
        console.error('POST /api/orders error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/orders/:id/complete — Mark a queued order as completed
// Calls sp_complete_order which flips status from 'queued' to 'completed'.
app.put('/api/orders/:id/complete', async (req, res) => {
    try {
        await db.query('CALL sp_complete_order(?)', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /api/orders/:id/complete error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/orders/:id — Cancel a queued order and restore inventory
// Calls sp_cancel_order which restores Inventory stock then deletes the order
// (ON DELETE CASCADE removes OrderHasProducts rows automatically).
app.delete('/api/orders/:id', async (req, res) => {
    try {
        await db.query('CALL sp_cancel_order(?)', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/orders/:id error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});


// PUT /api/orders/:id/items — Update items in a queued order (save queue edit)
// For each item: UPDATE or DELETE from OrderHasProducts, adjust Inventory by
// the quantity difference, then recalculate and UPDATE the order total cost.
app.put('/api/orders/:id/items', async (req, res) => {
    const orderID = req.params.id;
    const { updates } = req.body; // [{productID, oldQuantity, newQuantity, unitPrice}]
    try {
        let newCost = 0;
        for (const u of updates) {
            const diff = u.newQuantity - u.oldQuantity;

            if (u.newQuantity === 0) {
                // Remove item entirely from this order
                await db.query(
                    'DELETE FROM OrderHasProducts WHERE orderID = ? AND productID = ?',
                    [orderID, u.productID]
                );
            } else if (u.oldQuantity === 0) {
                // New item being added to the order — INSERT, not UPDATE
                await db.query(
                    'INSERT INTO OrderHasProducts (orderID, productID, quantity) VALUES (?, ?, ?)',
                    [orderID, u.productID, u.newQuantity]
                );
                newCost += u.newQuantity * u.unitPrice;
            } else {
                // Existing item — update the quantity in the intersection table
                await db.query(
                    'UPDATE OrderHasProducts SET quantity = ? WHERE orderID = ? AND productID = ?',
                    [u.newQuantity, orderID, u.productID]
                );
                newCost += u.newQuantity * u.unitPrice;
            }

            // Adjust inventory by the difference (positive diff = more items = decrement)
            if (diff !== 0) {
                await db.query(
                    'UPDATE Inventory SET productStock = productStock - ? WHERE productID = ?',
                    [diff, u.productID]
                );
            }
        }

        // Recalculate and save the updated order total
        await db.query(
            'UPDATE Orders SET orderCost = ? WHERE orderID = ?',
            [newCost, orderID]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /api/orders/:id/items error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/*
    API ROUTES — INVENTORY
*/

// GET /api/inventory — Get all inventory items with product names
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT Inventory.inventoryID, Products.productID, Products.productName,
                    Inventory.productStock, Inventory.productLocation
             FROM Inventory
             INNER JOIN Products ON Inventory.productID = Products.productID`
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/inventory error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/inventory/:id — Update stock level and location
app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { productStock, productLocation } = req.body;
        await db.query(
            'UPDATE Inventory SET productStock = ?, productLocation = ? WHERE inventoryID = ?',
            [productStock, productLocation, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /api/inventory/:id error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/*
    LISTENER
*/

app.listen(PORT, function () {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});