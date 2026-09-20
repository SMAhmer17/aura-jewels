import { loadAdminProducts } from "@/lib/services/catalog-service";
import { loadOrders } from "@/lib/services/orders-service";
import { loadDiscounts } from "@/lib/services/discounts-service";
import { loadAdminReviews } from "@/lib/services/reviews-service";
import { loadMessages } from "@/lib/services/messages-service";

/** Everything the dashboard screens read from. Loaded once after the admin is signed in, then kept fresh. */
export async function loadAdminData(): Promise<void> {
  await Promise.all([loadAdminProducts(), loadOrders(), loadDiscounts(), loadAdminReviews(), loadMessages()]);
}
