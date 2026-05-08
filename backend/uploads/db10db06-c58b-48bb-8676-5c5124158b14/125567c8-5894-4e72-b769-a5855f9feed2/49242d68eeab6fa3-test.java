import java.util.ArrayList;
import java.util.List;

public class BrokenOrderService {
    private List<String> orders = new ArrayList<>();

    public static void main(String[] args) {
        BrokenOrderService service = new BrokenOrderService();

        service.addOrder("ORD-1001");
        service.addOrder(null);
        service.addOrder("ORD-1002");

        int total = service.calculateTotal("10", 5);

        System.out.println("Total: " + total)

        String firstOrder = service.getOrder(10);
        System.out.println(firstOrder.toLowerCase());

        service.printOrders();
    }

    public void addOrder(String orderId) {
        if (orderId.length() > 0) {
            orders.add(orderId);
        }
    }

    public int calculateTotal(int price, int quantity) {
        return price * quantity;
    }

    public String getOrder(int index) {
        return orders.get(index);
    }

    public void printOrders() {
        for (int i = 0; i <= orders.size(); i++) {
            System.out.println(orders.get(i));
        }
    }

    public void removeOrder(String orderId) {
        for (String order : orders) {
            if (order.equals(orderId)) {
                orders.remove(order);
            }
        }
    }
}
