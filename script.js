
let medicines = [];
let nextId = 1;

const medicineForm = document.getElementById("medicineForm");

medicineForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const medicine = {
        id: nextId++,
        name: document.getElementById("medicineName").value,
        category: document.getElementById("category").value,
        manufacturer: document.getElementById("manufacturer").value,
        price: Number(document.getElementById("price").value),
        quantity: Number(document.getElementById("quantity").value),
        expiry: document.getElementById("expiryDate").value
    };

    medicines.push(medicine);

    displayMedicines();
    updateDashboard();

    medicineForm.reset();

    alert("Medicine added successfully!");
});

function displayMedicines() {
    const table = document.getElementById("medicineTable");

    table.innerHTML = "";

    medicines.forEach(function(medicine) {
        const row = document.createElement("tr");

        [
            medicine.id,
            medicine.name,
            medicine.category,
            medicine.manufacturer,
            medicine.price.toFixed(2),
            medicine.quantity,
            medicine.expiry
        ].forEach(function(value) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        table.appendChild(row);
    });
}

function updateDashboard() {
    document.getElementById("totalMedicines").textContent =
        medicines.length;

    const stock = medicines.reduce(function(total, medicine) {
        return total + medicine.quantity;
    }, 0);

    document.getElementById("totalStock").textContent = stock;

    const lowStockCount = medicines.filter(function(medicine) {
        return medicine.quantity < 10;
    }).length;

    document.getElementById("lowStock").textContent =
        lowStockCount;
}
