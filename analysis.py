
import mysql.connector
import pandas as pd
import matplotlib.pyplot as plt

# Database connection
con = mysql.connector.connect(
    host="localhost",
    user="root",
    password="dhanu@1105",
    database="pharmacy_db"
)

print("DATABASE CONNECTED SUCCESSFULLY!")

# Retrieve medicine data
medicine = pd.read_sql(
    "SELECT * FROM medicine", con
)

print("\nMEDICINE DETAILS")
print(medicine)

# Low stock report
low_stock = medicine[
    medicine["quantity"] <= medicine["reorder_level"]
]

print("\nLOW STOCK REPORT")
print(low_stock)

# Near expiry report (within 30 days)
medicine["expiry_date"] = pd.to_datetime(
    medicine["expiry_date"]
)

today = pd.Timestamp.today().normalize()

near_expiry = medicine[
    (medicine["expiry_date"] >= today) &
    (medicine["expiry_date"] <= today + pd.Timedelta(days=30))
]

print("\nNEAR EXPIRY REPORT")
print(near_expiry)

# Stock visualization
plt.figure(figsize=(8, 5))
plt.bar(medicine["medicine_name"], medicine["quantity"])
plt.xlabel("Medicine Name")
plt.ylabel("Available Stock")
plt.title("Medicine Stock Analysis")
plt.xticks(rotation=20)
plt.tight_layout()
plt.savefig("stock_analysis.png")
plt.show()

# Daily sales analysis
sales = pd.read_sql(
    "SELECT sale_date, SUM(total_amount) AS total_sales "
    "FROM sales GROUP BY sale_date ORDER BY sale_date",
    con
)

print("\nDAILY SALES REPORT")
print(sales)

# Sales visualization
if not sales.empty:
    plt.figure(figsize=(8, 5))
    plt.bar(sales["sale_date"].astype(str), sales["total_sales"])
    plt.xlabel("Sale Date")
    plt.ylabel("Total Sales")
    plt.title("Daily Medicine Sales Analysis")
    plt.xticks(rotation=30)
    plt.tight_layout()
    plt.savefig("sales_analysis.png")
    plt.show()
else:
    print("No sales records available for chart.")

con.close()

print("\nDATA ANALYSIS COMPLETED!")
