-- =============================================================
-- PL.SQL — Sally's Coffee Shop
-- Stored Procedures for Project Step 5
-- =============================================================
-- Citation: Structure based on CS340 Project Step 5 assignment
-- example (sp_moviedb.sql) and class materials.
-- =============================================================

-- -------------------------------------------------------
-- 1. sp_reset_sally_coffee
-- Purpose: Drops all tables, recreates schema, and reinserts
--          all sample data. Called by the RESET button on the UI.
-- -------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_reset_sally_coffee;

DELIMITER //

CREATE PROCEDURE sp_reset_sally_coffee()
BEGIN

    SET FOREIGN_KEY_CHECKS = 0;

    DROP TABLE IF EXISTS OrderHasProducts;
    DROP TABLE IF EXISTS Inventory;
    DROP TABLE IF EXISTS Orders;
    DROP TABLE IF EXISTS Products;
    DROP TABLE IF EXISTS Customers;

    CREATE TABLE Customers (
        customerID int PRIMARY KEY AUTO_INCREMENT,
        customerName varchar(45) NOT NULL,
        customerNumber varchar(15),
        numPoints int NOT NULL DEFAULT 0
    );

    -- redeemedPoints stores whether points were spent at placement so sp_complete_order
    -- can award the net points (drinkCount - redeemedPoints) only when the order is completed.
    CREATE TABLE Orders (
        orderID int PRIMARY KEY AUTO_INCREMENT,
        orderDate datetime,
        orderCost decimal(10,2) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'completed',
        redeemedPoints int NOT NULL DEFAULT 0,
        customerID int NOT NULL,
        FOREIGN KEY (customerID) REFERENCES Customers(customerID) ON DELETE CASCADE
    );

    CREATE TABLE Products (
        productID int PRIMARY KEY AUTO_INCREMENT,
        productName varchar(45) NOT NULL,
        productType varchar(45) NOT NULL,
        productCost decimal(10,2),
        substituteProductID int NULL,
        FOREIGN KEY (substituteProductID) REFERENCES Products(productID)
    );

    CREATE TABLE OrderHasProducts (
        orderID int,
        productID int,
        quantity int NOT NULL,
        PRIMARY KEY (orderID, productID),
        FOREIGN KEY (orderID) REFERENCES Orders(orderID) ON DELETE CASCADE,
        FOREIGN KEY (productID) REFERENCES Products(productID)
    );

    CREATE TABLE Inventory (
        inventoryID int PRIMARY KEY AUTO_INCREMENT,
        productID int,
        productStock int NOT NULL,
        productLocation varchar(45),
        UNIQUE (productID),
        FOREIGN KEY (productID) REFERENCES Products(productID)
    );

    INSERT INTO Customers (customerID, customerName, customerNumber, numPoints) VALUES
    (1, 'Seth Gleason', '111-111-1111', 4),
    (2, 'Ally Chen', '222-222-2222', 11),
    (3, 'Michael Curry', '333-333-3333', 0);

    INSERT INTO Products (productID, productName, productType, productCost, substituteProductID) VALUES
    (1,  'Drip Coffee',          'drink', 3.00, NULL),
    (2,  'Americano',            'drink', 5.50, NULL),
    (3,  'Latte',                'drink', 6.00, 5),
    (4,  'Flat White',           'drink', 6.00, NULL),
    (5,  'Oat Milk Latte',       'drink', 7.00, 3),
    (6,  'Cold Brew',            'drink', 5.50, NULL),
    (7,  'Cappuccino',           'drink', 6.00, 8),
    (8,  'Oat Milk Cappuccino',  'drink', 7.00, 7),
    (9,  'Espresso',             'drink', 5.00, NULL),
    (10, 'Double Espresso',      'drink', 5.50, NULL),
    (11, 'Mocha',                'drink', 7.00, 12),
    (12, 'Oat Milk Mocha',       'drink', 8.00, 11),
    (13, 'Chai Latte',           'drink', 5.50, NULL),
    (14, 'London Fog',           'drink', 5.50, NULL),
    (15, 'Matcha Latte',         'drink', 7.50, NULL),
    (16, 'Hot Chocolate',        'drink', 5.00, NULL),
    (17, 'Steamed Milk',         'drink', 4.50, NULL),
    (18, 'Butter Croissant',     'food',  5.50, NULL),
    (19, 'Vanilla Scone',        'food',  3.50, NULL);

    INSERT INTO Orders (orderID, orderDate, orderCost, status, redeemedPoints, customerID) VALUES
    (5001, '2026-02-05 08:15:23', 11.50, 'completed', 0, 1),
    (5002, '2026-02-05 09:33:11', 5.50,  'completed', 0, 2),
    (5003, '2026-02-05 11:56:48', 22.00, 'completed', 0, 1);

    INSERT INTO OrderHasProducts (orderID, productID, quantity) VALUES
    (5001, 3,  1),
    (5001, 18, 1),
    (5002, 18, 1),
    (5003, 10, 2),
    (5003, 18, 2);

    INSERT INTO Inventory (inventoryID, productID, productStock, productLocation) VALUES
    (1,  1,  100, 'Shelf 2A'),
    (2,  2,  200, 'Shelf 2A'),
    (3,  3,  150, 'Shelf 2B'),
    (4,  4,  50,  'Shelf 2B'),
    (5,  5,  30,  'Shelf 2B'),
    (6,  6,  80,  'Shelf 2C'),
    (7,  7,  120, 'Shelf 2C'),
    (8,  8,  45,  'Shelf 2C'),
    (9,  9,  300, 'Shelf 1A'),
    (10, 10, 300, 'Shelf 1A'),
    (11, 11, 90,  'Shelf 2D'),
    (12, 12, 25,  'Shelf 2D'),
    (13, 13, 120, 'Shelf 3A'),
    (14, 14, 60,  'Shelf 3A'),
    (15, 15, 75,  'Shelf 3A'),
    (16, 16, 110, 'Shelf 3B'),
    (17, 17, 200, 'Fridge 1'),
    (18, 18, 0,   'Shelf 4A'),
    (19, 19, 15,  'Shelf 4A');

    SET FOREIGN_KEY_CHECKS = 1;

END //

DELIMITER ;


-- -------------------------------------------------------
-- 2. sp_delete_customer
-- Purpose: Deletes a customer by customerID.
--          ON DELETE CASCADE on Orders.customerID handles
--          removing their orders (and cascading to OHP).
-- Usage:   CALL sp_delete_customer(1);
-- -------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_delete_customer;

DELIMITER //

CREATE PROCEDURE sp_delete_customer(IN p_customerID INT)
BEGIN
    DELETE FROM Customers
    WHERE customerID = p_customerID;
END //

DELIMITER ;


-- -------------------------------------------------------
-- 3. sp_place_order
-- Purpose: Inserts a new order with status='queued', updates
--          the customer's points (add drinkCount, subtract
--          redeemedPoints), and returns the new orderID via
--          an OUT parameter. The Node.js route handles the
--          per-item inserts into OrderHasProducts and the
--          inventory decrements in a loop after calling this.
-- Usage:   CALL sp_place_order(1, 12.50, 2, 0, @newOrderID);
--          SELECT @newOrderID;
-- -------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_place_order;

DELIMITER //

CREATE PROCEDURE sp_place_order(
    IN  p_customerID     INT,
    IN  p_totalCost      DECIMAL(10,2),
    IN  p_redeemedPoints INT,
    OUT p_orderID        INT
)
BEGIN
    -- Insert the order into the queue.
    -- Store redeemedPoints on the row so sp_complete_order can deduct them later.
    -- Points are awarded only when the order is marked completed.
    INSERT INTO Orders (orderDate, orderCost, status, redeemedPoints, customerID)
    VALUES (NOW(), p_totalCost, 'queued', p_redeemedPoints, p_customerID);

    SET p_orderID = LAST_INSERT_ID();
END //

DELIMITER ;


-- -------------------------------------------------------
-- 4. sp_complete_order
-- Purpose: Marks a queued order as completed by updating
--          the status column. Called when the barista clicks
--          "Complete Order" in the Order History queue.
-- Usage:   CALL sp_complete_order(5004);
-- -------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_complete_order;

DELIMITER //

CREATE PROCEDURE sp_complete_order(IN p_orderID INT)
BEGIN
    DECLARE v_customerID     INT;
    DECLARE v_redeemedPoints INT;
    DECLARE v_drinkCount     INT;

    -- Look up the customer and how many points were redeemed at placement
    SELECT customerID, redeemedPoints
    INTO v_customerID, v_redeemedPoints
    FROM Orders
    WHERE orderID = p_orderID;

    -- Count total drink quantity in this order
    SELECT COALESCE(SUM(ohp.quantity), 0)
    INTO v_drinkCount
    FROM OrderHasProducts ohp
    INNER JOIN Products p ON ohp.productID = p.productID
    WHERE ohp.orderID = p_orderID AND p.productType = 'drink';

    -- Mark the order as completed
    UPDATE Orders
    SET status = 'completed'
    WHERE orderID = p_orderID;

    -- Award points now that the order is complete:
    -- +1 per drink ordered, -10 if a free drink was redeemed
    UPDATE Customers
    SET numPoints = numPoints + v_drinkCount - v_redeemedPoints
    WHERE customerID = v_customerID;
END //

DELIMITER ;


-- -------------------------------------------------------
-- 5. sp_cancel_order
-- Purpose: Restores inventory for every item in the order,
--          then deletes the order. ON DELETE CASCADE on
--          OrderHasProducts handles the intersection rows.
--          Called when the barista cancels a queued order.
-- Usage:   CALL sp_cancel_order(5004);
-- -------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_cancel_order;

DELIMITER //

CREATE PROCEDURE sp_cancel_order(IN p_orderID INT)
BEGIN
    -- Restore stock for every item in this order in one UPDATE
    UPDATE Inventory
    INNER JOIN OrderHasProducts ON Inventory.productID = OrderHasProducts.productID
    SET Inventory.productStock = Inventory.productStock + OrderHasProducts.quantity
    WHERE OrderHasProducts.orderID = p_orderID;

    -- Delete the order; CASCADE removes its OrderHasProducts rows
    DELETE FROM Orders WHERE orderID = p_orderID;
END //

DELIMITER ;
