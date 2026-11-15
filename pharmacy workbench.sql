
-- PHARMACY MANAGEMENT SYSTEM
-- COMPLETE DATABASE SETUP

DROP DATABASE IF EXISTS pharmacy_db;

CREATE DATABASE pharmacy_db;

USE pharmacy_db;


-- 1. MEDICINE TABLE

CREATE TABLE medicine (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    manufacturer VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 10
) ENGINE=InnoDB;


-- 2. SUPPLIER TABLE

CREATE TABLE supplier (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address VARCHAR(100)
) ENGINE=InnoDB;


-- 3. PURCHASES TABLE

CREATE TABLE purchases (
    purchase_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    supplier_id INT NOT NULL,
    quantity INT NOT NULL,
    purchase_date DATE NOT NULL,

    FOREIGN KEY (medicine_id)
    REFERENCES medicine(medicine_id),

    FOREIGN KEY (supplier_id)
    REFERENCES supplier(supplier_id)
) ENGINE=InnoDB;


-- 4. SALES TABLE

CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    quantity_sold INT NOT NULL,
    sale_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (medicine_id)
    REFERENCES medicine(medicine_id)
) ENGINE=InnoDB;


-- INSERT MEDICINE DETAILS

INSERT INTO medicine
(medicine_name, category, manufacturer, unit_price,
 expiry_date, quantity, reorder_level)
VALUES
('Paracetamol', 'Tablet', 'ABC Pharma', 5.00,
 '2027-12-31', 100, 10),

('Amoxicillin', 'Capsule', 'XYZ Pharma', 10.00,
 '2027-10-30', 50, 10),

('Vitamin C', 'Supplement', 'Health Pharma', 15.00,
 '2028-05-20', 80, 10);


-- INSERT SUPPLIER DETAILS

INSERT INTO supplier
(supplier_name, phone, address)
VALUES
('ABC Suppliers', '9876543210', 'Chennai'),

('XYZ Suppliers', '9876543211', 'Coimbatore');


-- CHECK ALL TABLES

SHOW TABLES;


-- DISPLAY MEDICINE

SELECT * FROM medicine;


-- DISPLAY SUPPLIER

SELECT * FROM supplier;


-- DISPLAY PURCHASES

SELECT * FROM purchases;


-- DISPLAY SALES

SELECT * FROM sales;
