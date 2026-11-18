import java.sql.*;
import java.util.Scanner;
import java.time.LocalDate;

public class Main {

    static final String URL = "jdbc:mysql://localhost:3306/pharmacy_db";
    static final String USER = "root";
    static final String PASSWORD = "dhanu@1105";

    static Scanner sc = new Scanner(System.in);

    public static void main(String[] args) {

        try (Connection con = DriverManager.getConnection(URL, USER, PASSWORD)) {

            System.out.println("================================");
            System.out.println(" PHARMACY MANAGEMENT SYSTEM");
            System.out.println("================================");

            while (true) {
                System.out.println("\n1. Add Medicine");
                System.out.println("2. View Medicines");
                System.out.println("3. Add Supplier");
                System.out.println("4. Purchase Medicine");
                System.out.println("5. Sell Medicine");
                System.out.println("6. Low Stock Report");
                System.out.println("7. Expiry Report");
                System.out.println("8. Daily Sales Report");
                System.out.println("9. Exit");

                System.out.print("Enter your choice: ");
                int choice = Integer.parseInt(sc.nextLine());

                switch (choice) {
                    case 1 -> addMedicine(con);
                    case 2 -> viewMedicines(con);
                    case 3 -> addSupplier(con);
                    case 4 -> purchaseMedicine(con);
                    case 5 -> sellMedicine(con);
                    case 6 -> lowStockReport(con);
                    case 7 -> expiryReport(con);
                    case 8 -> dailySalesReport(con);
                    case 9 -> {
                        System.out.println("Thank you!");
                        return;
                    }
                    default -> System.out.println("Invalid choice!");
                }
            }

        } catch (Exception e) {
            System.out.println("Database Error: " + e.getMessage());
        }
    }

    static void addMedicine(Connection con) throws SQLException {
        String sql = "INSERT INTO medicine " +
                "(medicine_name, category, manufacturer, unit_price, expiry_date, quantity, reorder_level) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            System.out.print("Medicine name: ");
            ps.setString(1, sc.nextLine());

            System.out.print("Category: ");
            ps.setString(2, sc.nextLine());

            System.out.print("Manufacturer: ");
            ps.setString(3, sc.nextLine());

            System.out.print("Unit price: ");
            ps.setDouble(4, Double.parseDouble(sc.nextLine()));

            System.out.print("Expiry date (YYYY-MM-DD): ");
            ps.setDate(5, Date.valueOf(sc.nextLine()));

            System.out.print("Quantity: ");
            ps.setInt(6, Integer.parseInt(sc.nextLine()));

            System.out.print("Reorder level: ");
            ps.setInt(7, Integer.parseInt(sc.nextLine()));

            ps.executeUpdate();
            System.out.println("Medicine added successfully!");
        }
    }

    static void viewMedicines(Connection con) throws SQLException {
        String sql = "SELECT * FROM medicine";

        try (Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {

            System.out.println("\nID | Name | Category | Price | Expiry | Stock");

            while (rs.next()) {
                System.out.println(
                        rs.getInt("medicine_id") + " | " +
                        rs.getString("medicine_name") + " | " +
                        rs.getString("category") + " | " +
                        rs.getDouble("unit_price") + " | " +
                        rs.getDate("expiry_date") + " | " +
                        rs.getInt("quantity")
                );
            }
        }
    }

    static void addSupplier(Connection con) throws SQLException {
        String sql = "INSERT INTO supplier (supplier_name, phone, address) VALUES (?, ?, ?)";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            System.out.print("Supplier name: ");
            ps.setString(1, sc.nextLine());

            System.out.print("Phone: ");
            ps.setString(2, sc.nextLine());

            System.out.print("Address: ");
            ps.setString(3, sc.nextLine());

            ps.executeUpdate();
            System.out.println("Supplier added successfully!");
        }
    }

    static void purchaseMedicine(Connection con) throws SQLException {
        System.out.print("Medicine ID: ");
        int medicineId = Integer.parseInt(sc.nextLine());

        System.out.print("Supplier ID: ");
        int supplierId = Integer.parseInt(sc.nextLine());

        System.out.print("Purchase quantity: ");
        int quantity = Integer.parseInt(sc.nextLine());

        if (quantity <= 0) {
            System.out.println("Quantity must be greater than zero.");
            return;
        }

        try {
            con.setAutoCommit(false);

            String insert = "INSERT INTO purchases " +
                    "(medicine_id, supplier_id, quantity, purchase_date) VALUES (?, ?, ?, ?)";

            try (PreparedStatement ps = con.prepareStatement(insert)) {
                ps.setInt(1, medicineId);
                ps.setInt(2, supplierId);
                ps.setInt(3, quantity);
                ps.setDate(4, Date.valueOf(LocalDate.now()));
                ps.executeUpdate();
            }

            String update = "UPDATE medicine SET quantity = quantity + ? WHERE medicine_id = ?";

            try (PreparedStatement ps = con.prepareStatement(update)) {
                ps.setInt(1, quantity);
                ps.setInt(2, medicineId);

                if (ps.executeUpdate() == 0) {
                    throw new SQLException("Medicine ID not found.");
                }
            }

            con.commit();
            System.out.println("Purchase recorded and stock updated!");

        } catch (SQLException e) {
            con.rollback();
            System.out.println("Purchase failed: " + e.getMessage());
        } finally {
            con.setAutoCommit(true);
        }
    }

    static void sellMedicine(Connection con) throws SQLException {
        System.out.print("Medicine ID: ");
        int medicineId = Integer.parseInt(sc.nextLine());

        System.out.print("Quantity to sell: ");
        int quantity = Integer.parseInt(sc.nextLine());

        if (quantity <= 0) {
            System.out.println("Quantity must be greater than zero.");
            return;
        }

        try {
            con.setAutoCommit(false);

            String check = "SELECT quantity, expiry_date, unit_price " +
                    "FROM medicine WHERE medicine_id = ? FOR UPDATE";

            int stock;
            Date expiry;
            double price;

            try (PreparedStatement ps = con.prepareStatement(check)) {
                ps.setInt(1, medicineId);

                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new SQLException("Medicine not found.");
                    }

                    stock = rs.getInt("quantity");
                    expiry = rs.getDate("expiry_date");
                    price = rs.getDouble("unit_price");
                }
            }

            if (expiry.toLocalDate().isBefore(LocalDate.now())) {
                throw new SQLException("Medicine is expired. Sale not allowed.");
            }

            if (stock < quantity) {
                throw new SQLException("Insufficient stock.");
            }

            double total = price * quantity;

            String insert = "INSERT INTO sales " +
                    "(medicine_id, quantity_sold, sale_date, total_amount) VALUES (?, ?, ?, ?)";

            try (PreparedStatement ps = con.prepareStatement(insert)) {
                ps.setInt(1, medicineId);
                ps.setInt(2, quantity);
                ps.setDate(3, Date.valueOf(LocalDate.now()));
                ps.setDouble(4, total);
                ps.executeUpdate();
            }

            String update = "UPDATE medicine SET quantity = quantity - ? WHERE medicine_id = ?";

            try (PreparedStatement ps = con.prepareStatement(update)) {
                ps.setInt(1, quantity);
                ps.setInt(2, medicineId);
                ps.executeUpdate();
            }

            con.commit();
            System.out.println("Sale successful!");
            System.out.println("Total amount: Rs. " + total);

        } catch (SQLException e) {
            con.rollback();
            System.out.println("Sale failed: " + e.getMessage());
        } finally {
            con.setAutoCommit(true);
        }
    }

    static void lowStockReport(Connection con) throws SQLException {
        String sql = "SELECT medicine_name, quantity, reorder_level " +
                "FROM medicine WHERE quantity <= reorder_level";

        try (Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {

            System.out.println("\nLOW STOCK REPORT");

            while (rs.next()) {
                System.out.println(
                        rs.getString("medicine_name") +
                        " | Stock: " + rs.getInt("quantity") +
                        " | Reorder Level: " + rs.getInt("reorder_level")
                );
            }
        }
    }

    static void expiryReport(Connection con) throws SQLException {
        String sql = "SELECT medicine_name, expiry_date FROM medicine " +
                "WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)";

        try (Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {

            System.out.println("\nEXPIRY REPORT");

            while (rs.next()) {
                System.out.println(
                        rs.getString("medicine_name") +
                        " | Expiry: " + rs.getDate("expiry_date")
                );
            }
        }
    }

    static void dailySalesReport(Connection con) throws SQLException {
        String sql = "SELECT SUM(quantity_sold) AS total_quantity, " +
                "SUM(total_amount) AS total_sales FROM sales WHERE sale_date = CURDATE()";

        try (Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {

            if (rs.next()) {
                System.out.println("\nDAILY SALES REPORT");
                System.out.println("Total quantity sold: " + rs.getInt("total_quantity"));
                System.out.println("Total sales amount: Rs. " + rs.getDouble("total_sales"));
            }
        }
    }
}
