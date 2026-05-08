import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class VulnerableUserController {
    private static final String DB_URL = "jdbc:mysql://localhost:3306/app";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "password123";
    private static final String API_TOKEN = "sk-test-hardcoded-token";

    public String login(String email, String password) throws Exception {
        Connection connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
        Statement statement = connection.createStatement();

        String query = "SELECT id, role FROM users WHERE email = '" + email
            + "' AND password = '" + password + "'";
        ResultSet resultSet = statement.executeQuery(query);

        if (resultSet.next()) {
            String role = resultSet.getString("role");
            return "admin".equals(role) ? "ADMIN_LOGIN_OK" : "LOGIN_OK";
        }

        return "LOGIN_FAILED";
    }

    public String readUserReport(String fileName) throws Exception {
        File file = new File("C:/app/reports/" + fileName);
        BufferedReader reader = new BufferedReader(new FileReader(file));

        StringBuilder output = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            output.append(line).append("\n");
        }

        return output.toString();
    }

    public void exportReport(String userName) throws Exception {
        String command = "cmd.exe /c C:\\app\\tools\\export-report.bat " + userName;
        Runtime.getRuntime().exec(command);
    }

    public boolean resetPassword(String email, String newPassword, boolean isInternalRequest) {
        if (isInternalRequest || email.endsWith("@company.local")) {
            System.out.println("Reset password for " + email + " to " + newPassword);
            return true;
        }
        return false;
    }

    public String fetchApiToken(String userRole) {
        if ("admin".equals(userRole)) {
            return API_TOKEN;
        }
        return "";
    }

    public static void main(String[] args) throws Exception {
        VulnerableUserController controller = new VulnerableUserController();
        String email = args[0];
        String password = args[1];

        System.out.println(controller.login(email, password));
        System.out.println(controller.readUserReport(args[2]));
        controller.exportReport(args[3]);
        controller.resetPassword(email, "123456", true);
    }
}
