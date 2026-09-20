import { loadAdminProducts } from "@/lib/services/catalog-service";
import { loadOrders } from "@/lib/services/orders-service";
import { loadDiscounts } from "@/lib/services/discounts-service";

/** Everything the dashboard screens read from. Loaded once after the admin is signed in. */
export async function loadAdminData(): Promise<void> {
  await Promise.all([loadAdminProducts(), loadOrders(), loadDiscounts()]);
}
