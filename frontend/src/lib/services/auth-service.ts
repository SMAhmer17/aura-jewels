import { api } from "@/lib/api/client";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { useCustomerAuthStore, type CustomerProfile } from "@/store/customer-auth-store";
import { useCatalogStore } from "@/store/catalog-store";
import { useOrdersStore } from "@/store/orders-store";
import { useDiscountsStore } from "@/store/discounts-store";

/** Signs the admin in with the API. Throws an ApiError ("Incorrect email or password.") on failure. */
export async function adminLogin(email: string, password: string) {
  const res = await api<{ accessToken: string; email: string }>("/auth/admin/login", {
    method: "POST",
    body: { email, password },
  });
  useAdminAuthStore.getState().setSession(res.accessToken, res.email);
}

/** Signs out and clears the dashboard's data from memory so it can't be seen by the next person on this browser. */
export function adminLogout() {
  useAdminAuthStore.getState().logout();
  useCatalogStore.getState().setAdminProducts([]);
  useOrdersStore.setState({ orders: [], loaded: false });
  useDiscountsStore.setState({ discounts: [], loaded: false });
}

interface CustomerSession {
  accessToken: string;
  customer: CustomerProfile;
}

export async function customerRegister(input: { name: string; email: string; password: string }) {
  const res = await api<CustomerSession>("/auth/register", { method: "POST", body: input });
  useCustomerAuthStore.getState().setSession(res.accessToken, res.customer);
  return res.customer;
}

export async function customerLogin(email: string, password: string) {
  const res = await api<CustomerSession>("/auth/login", { method: "POST", body: { email, password } });
  useCustomerAuthStore.getState().setSession(res.accessToken, res.customer);
  return res.customer;
}

export function customerLogout() {
  useCustomerAuthStore.getState().logout();
}
