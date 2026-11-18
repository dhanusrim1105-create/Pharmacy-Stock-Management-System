// PHARMACY MANAGEMENT SYSTEM

const $ = id => document.getElementById(id);
const today = new Date().toISOString().slice(0, 10);

$("todayDate").textContent = new Date().toLocaleDateString("en-IN");
$("purchaseDate").value = today;
$("saleDate").value = today;

// Sample data is loaded only the first time.
function loadData(key, defaultData) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultData;
    } catch {
        return defaultData;
    }
}

let medicines = loadData("pharmacy_medicines", [
    {id: 1, name: "Paracetamol", category: "Tablet", manufacturer: "ABC Pharma", price: 20, stock: 150, expiry: "2027-05-20"},
    {id: 2, name: "Amoxicillin", category: "Antibiotic", manufacturer: "XYZ Pharma", price: 50, stock: 8, expiry: "2027-01-15"},
    {id: 3, name: "Cetirizine", category: "Tablet", manufacturer: "MediCare", price: 30, stock: 65, expiry: "2026-12-10"},
    {id: 4, name: "Vitamin C", category: "Supplement", manufacturer: "HealthPlus", price: 40, stock: 5, expiry: "2028-03-10"}
]);

let suppliers = loadData("pharmacy_suppliers", [
    {id: 1, name: "ABC Medical Suppliers", phone: "9876543210", address: "Chennai"},
    {id: 2, name: "HealthCare Distributors", phone: "9876501234", address: "Coimbatore"}
]);

let purchases = loadData("pharmacy_purchases", [
    {id: 1, medicineId: 1, supplierId: 1, quantity: 100, date: today}
]);

let sales = loadData("pharmacy_sales", [
    {id: 1, medicineId: 1, quantity: 10, date: today, amount: 200}
]);

let salesChart = null;
let stockChart = null;

function saveData() {
    localStorage.setItem("pharmacy_medicines", JSON.stringify(medicines));
    localStorage.setItem("pharmacy_suppliers", JSON.stringify(suppliers));
    localStorage.setItem("pharmacy_purchases", JSON.stringify(purchases));
    localStorage.setItem("pharmacy_sales", JSON.stringify(sales));
}

function money(value) {
    return "₹" + Number(value).toFixed(2);
}

function getMedicine(id) {
    return medicines.find(m => m.id === Number(id));
}

function getSupplier(id) {
    return suppliers.find(s => s.id === Number(id));
}

function isExpired(medicine) {
    return medicine.expiry < today;
}

function daysToExpiry(medicine) {
    const expiry = new Date(medicine.expiry + "T00:00:00");
    const current = new Date(today + "T00:00:00");
    return Math.ceil((expiry - current) / 86400000);
}

function medicineStatus(medicine) {
    if (isExpired(medicine)) return '<span class="status danger">Expired</span>';
    if (daysToExpiry(medicine) <= 30) return '<span class="status warning">Near Expiry</span>';
    if (medicine.stock <= 10) return '<span class="status warning">Low Stock</span>';
    return '<span class="status">Available</span>';
}

// SIDEBAR NAVIGATION
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
        document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));

        this.classList.add("active");
        const page = $(this.dataset.page);
        if (page) page.classList.add("active");

        $("pageTitle").textContent = this.textContent.trim();

        if (this.dataset.page === "reports") renderReports();
    });
});

// MEDICINE MANAGEMENT
function resetMedicineForm() {
    $("medicineForm").reset();
    $("medicineId").value = "";
    $("medicineFormTitle").textContent = "Add Medicine";
    $("medicineSubmit").textContent = "Add Medicine";
}

$("medicineForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const id = $("medicineId").value;
    const name = $("medicineName").value.trim();
    const category = $("medicineCategory").value.trim();
    const manufacturer = $("manufacturer").value.trim();
    const price = Number($("medicinePrice").value);
    const stock = Number($("medicineStock").value);
    const expiry = $("medicineExpiry").value;

    if (!name || !category || !manufacturer || price <= 0 ||
        !Number.isInteger(stock) || stock < 0 || !expiry) {
        alert("Please enter valid medicine details.");
        return;
    }

    if (id) {
        const medicine = getMedicine(id);
        if (!medicine) return;

        medicine.name = name;
        medicine.category = category;
        medicine.manufacturer = manufacturer;
        medicine.price = price;
        medicine.stock = stock;
        medicine.expiry = expiry;

        alert("Medicine updated successfully!");
    } else {
        medicines.push({
            id: Date.now(),
            name,
            category,
            manufacturer,
            price,
            stock,
            expiry
        });

        alert("Medicine added successfully!");
    }

    saveData();
    resetMedicineForm();
    renderAll();
});

function editMedicine(id) {
    const medicine = getMedicine(id);
    if (!medicine) return;

    $("medicineId").value = medicine.id;
    $("medicineName").value = medicine.name;
    $("medicineCategory").value = medicine.category;
    $("manufacturer").value = medicine.manufacturer;
    $("medicinePrice").value = medicine.price;
    $("medicineStock").value = medicine.stock;
    $("medicineExpiry").value = medicine.expiry;

    $("medicineFormTitle").textContent = "Update Medicine";
    $("medicineSubmit").textContent = "Update Medicine";

    window.scrollTo({top: 0, behavior: "smooth"});
}

function deleteMedicine(id) {
    const linked = purchases.some(p => p.medicineId === Number(id)) ||
                   sales.some(s => s.medicineId === Number(id));

    if (linked) {
        alert("This medicine has purchase or sales records. It cannot be deleted.");
        return;
    }

    if (!confirm("Delete this medicine?")) return;

    medicines = medicines.filter(m => m.id !== Number(id));
    saveData();
    renderAll();
}

function renderMedicines(list = medicines) {
    $("medicineTable").innerHTML = list.length ? list.map(m => `
        <tr>
            <td>${m.id}</td>
            <td>${m.name}</td>
            <td>${m.category}</td>
            <td>${m.manufacturer}</td>
            <td>${money(m.price)}</td>
            <td>${m.stock}</td>
            <td>${m.expiry}</td>
            <td>${medicineStatus(m)}</td>
            <td>
                <button class="edit-btn" onclick="editMedicine(${m.id})">Edit</button>
                <button class="delete-btn" onclick="deleteMedicine(${m.id})">Delete</button>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="9">No medicines found</td></tr>`;
}

$("medicineSearch").addEventListener("input", function() {
    const value = this.value.toLowerCase();

    const filtered = medicines.filter(m =>
        m.name.toLowerCase().includes(value) ||
        m.category.toLowerCase().includes(value) ||
        m.manufacturer.toLowerCase().includes(value)
    );

    renderMedicines(filtered);
});

// SUPPLIER MANAGEMENT
$("supplierForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = $("supplierName").value.trim();
    const phone = $("supplierPhone").value.trim();
    const address = $("supplierAddress").value.trim();

    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Enter a valid 10-digit phone number.");
        return;
    }

    suppliers.push({
        id: Date.now(),
        name,
        phone,
        address
    });

    saveData();
    this.reset();
    renderAll();
    alert("Supplier added successfully!");
});

function deleteSupplier(id) {
    const linked = purchases.some(p => p.supplierId === Number(id));

    if (linked) {
        alert("This supplier has purchase records and cannot be deleted.");
        return;
    }

    if (!confirm("Delete this supplier?")) return;

    suppliers = suppliers.filter(s => s.id !== Number(id));
    saveData();
    renderAll();
}

function renderSuppliers(list = suppliers) {
    $("supplierTable").innerHTML = list.length ? list.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.phone}</td>
            <td>${s.address}</td>
            <td><button class="delete-btn" onclick="deleteSupplier(${s.id})">Delete</button></td>
        </tr>
    `).join("") : `<tr><td colspan="5">No suppliers found</td></tr>`;
}

$("supplierSearch").addEventListener("input", function() {
    const value = this.value.toLowerCase();

    renderSuppliers(suppliers.filter(s =>
        s.name.toLowerCase().includes(value) ||
        s.phone.includes(value) ||
        s.address.toLowerCase().includes(value)
    ));
});

// DROPDOWN OPTIONS
function renderDropdowns() {
    $("purchaseMedicine").innerHTML =
        '<option value="">Select Medicine</option>' +
        medicines.map(m => `<option value="${m.id}">${m.name} (Stock: ${m.stock})</option>`).join("");

    $("saleMedicine").innerHTML =
        '<option value="">Select Medicine</option>' +
        medicines.map(m => `<option value="${m.id}">${m.name} (Stock: ${m.stock})</option>`).join("");

    $("purchaseSupplier").innerHTML =
        '<option value="">Select Supplier</option>' +
        suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
}

// PURCHASE MANAGEMENT
$("purchaseForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const medicineId = Number($("purchaseMedicine").value);
    const supplierId = Number($("purchaseSupplier").value);
    const quantity = Number($("purchaseQuantity").value);
    const date = $("purchaseDate").value;

    const medicine = getMedicine(medicineId);
    const supplier = getSupplier(supplierId);

    if (!medicine || !supplier || !Number.isInteger(quantity) ||
        quantity <= 0 || !date) {
        alert("Please enter valid purchase details.");
        return;
    }

    medicine.stock += quantity;

    purchases.push({
        id: Date.now(),
        medicineId,
        supplierId,
        quantity,
        date
    });

    saveData();
    this.reset();
    $("purchaseDate").value = today;
    renderAll();

    alert("Purchase recorded! Medicine stock increased.");
});

function renderPurchases() {
    $("purchaseTable").innerHTML = purchases.length ? [...purchases].reverse().map(p => {
        const medicine = getMedicine(p.medicineId);
        const supplier = getSupplier(p.supplierId);

        return `
            <tr>
                <td>${p.id}</td>
                <td>${medicine ? medicine.name : "Medicine unavailable"}</td>
                <td>${supplier ? supplier.name : "Supplier unavailable"}</td>
                <td>${p.quantity}</td>
                <td>${p.date}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="5">No purchase records</td></tr>`;
}

// SALES MANAGEMENT
$("salesForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const medicineId = Number($("saleMedicine").value);
    const quantity = Number($("saleQuantity").value);
    const date = $("saleDate").value;

    const medicine = getMedicine(medicineId);

    if (!medicine || !Number.isInteger(quantity) || quantity <= 0 || !date) {
        alert("Please enter valid sales details.");
        return;
    }

    if (isExpired(medicine)) {
        alert("Sale blocked! This medicine is expired.");
        return;
    }

    if (medicine.stock < quantity) {
        alert("Insufficient stock! Available quantity: " + medicine.stock);
        return;
    }

    medicine.stock -= quantity;

    sales.push({
        id: Date.now(),
        medicineId,
        quantity,
        date,
        amount: quantity * medicine.price
    });

    saveData();
    this.reset();
    $("saleDate").value = today;
    renderAll();

    alert("Sale completed successfully!");
});

function renderSales() {
    $("salesTable").innerHTML = sales.length ? [...sales].reverse().map(s => {
        const medicine = getMedicine(s.medicineId);

        return `
            <tr>
                <td>${s.id}</td>
                <td>${medicine ? medicine.name : "Medicine unavailable"}</td>
                <td>${s.quantity}</td>
                <td>${s.date}</td>
                <td>${money(s.amount)}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="5">No sales records</td></tr>`;

    $("recentSales").innerHTML = sales.length ? [...sales].slice(-5).reverse().map(s => {
        const medicine = getMedicine(s.medicineId);

        return `
            <tr>
                <td>${s.id}</td>
                <td>${medicine ? medicine.name : "Medicine unavailable"}</td>
                <td>${s.quantity}</td>
                <td>${s.date}</td>
                <td>${money(s.amount)}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="5">No recent sales</td></tr>`;
}

// DASHBOARD
function renderDashboard() {
    const totalStock = medicines.reduce((sum, m) => sum + m.stock, 0);
    const todaySales = sales
        .filter(s => s.date === today)
        .reduce((sum, s) => sum + s.amount, 0);

    $("dashMedicines").textContent = medicines.length;
    $("dashStock").textContent = totalStock;
    $("dashSuppliers").textContent = suppliers.length;
    $("dashSales").textContent = money(todaySales);

    const lowStock = medicines.filter(m => m.stock <= 10 && !isExpired(m));

    $("lowStockAlerts").innerHTML = lowStock.length
        ? lowStock.map(m => `<div class="alert-item">${m.name} — Only ${m.stock} units left</div>`).join("")
        : '<p class="empty">No low-stock alerts</p>';

    const nearExpiry = medicines.filter(m =>
        !isExpired(m) && daysToExpiry(m) <= 30
    );

    $("expiryAlerts").innerHTML = nearExpiry.length
        ? nearExpiry.map(m => `<div class="alert-item danger">${m.name} — Expires on ${m.expiry}</div>`).join("")
        : '<p class="empty">No near-expiry alerts</p>';
}

// REPORTS
function renderReports() {
    const totalStock = medicines.reduce((sum, m) => sum + m.stock, 0);
    const lowStock = medicines.filter(m => m.stock <= 10 && !isExpired(m));
    const nearExpiry = medicines.filter(m =>
        !isExpired(m) && daysToExpiry(m) <= 30
    );
    const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);

    $("reportStock").textContent = totalStock;
    $("reportLow").textContent = lowStock.length;
    $("reportExpiry").textContent = nearExpiry.length;
    $("reportSales").textContent = money(totalSales);

    $("inventoryReport").innerHTML = medicines.length ? medicines.map(m => `
        <tr>
            <td>${m.name}</td>
            <td>${m.stock}</td>
            <td>${m.expiry}</td>
            <td>${medicineStatus(m)}</td>
        </tr>
    `).join("") : `<tr><td colspan="4">No medicines available</td></tr>`;

    const daily = {};

    sales.forEach(s => {
        if (!daily[s.date]) daily[s.date] = {transactions: 0, quantity: 0, amount: 0};

        daily[s.date].transactions++;
        daily[s.date].quantity += s.quantity;
        daily[s.date].amount += s.amount;
    });

    const dates = Object.keys(daily).sort().reverse();

    $("dailyReport").innerHTML = dates.length ? dates.map(date => `
        <tr>
            <td>${date}</td>
            <td>${daily[date].transactions}</td>
            <td>${daily[date].quantity}</td>
            <td>${money(daily[date].amount)}</td>
        </tr>
    `).join("") : `<tr><td colspan="4">No sales recorded</td></tr>`;

    createCharts();
}

function createCharts() {
    if (typeof Chart === "undefined") {
        return;
    }

    const medicineSales = {};

    sales.forEach(s => {
        const medicine = getMedicine(s.medicineId);
        const name = medicine ? medicine.name : "Deleted medicine";
        medicineSales[name] = (medicineSales[name] || 0) + s.quantity;
    });

    const categoryStock = {};

    medicines.forEach(m => {
        categoryStock[m.category] = (categoryStock[m.category] || 0) + m.stock;
    });

    if (salesChart) salesChart.destroy();
    if (stockChart) stockChart.destroy();

    salesChart = new Chart($("salesChart"), {
        type: "bar",
        data: {
            labels: Object.keys(medicineSales),
            datasets: [{
                label: "Units Sold",
                data: Object.values(medicineSales),
                backgroundColor: "#27877b"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });

    stockChart = new Chart($("stockChart"), {
        type: "doughnut",
        data: {
            labels: Object.keys(categoryStock),
            datasets: [{
                label: "Available Stock",
                data: Object.values(categoryStock),
                backgroundColor: ["#27877b", "#f2b84b", "#5489b5", "#d77b70", "#8b75b5"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// REFRESH ALL MODULES
function renderAll() {
    renderMedicines();
    renderSuppliers();
    renderDropdowns();
    renderPurchases();
    renderSales();
    renderDashboard();
    renderReports();
}

// INITIAL LOAD
renderAll();