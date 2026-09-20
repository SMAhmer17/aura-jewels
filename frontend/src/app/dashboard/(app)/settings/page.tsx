"use client";

import { useState, type FormEvent } from "react";
import { useSettings, updateSettings } from "@/lib/services/settings-service";
import type { StoreSettings } from "@/store/settings-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { toast } from "@/store/toast-store";
import { errorMessage } from "@/lib/api/client";

export default function SettingsPage() {
  const settings = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [syncedSettings, setSyncedSettings] = useState<StoreSettings>(settings);

  if (settings !== syncedSettings) {
    setSyncedSettings(settings);
    setForm(settings);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        ...form,
        shippingFlatRate: Number(form.shippingFlatRate) || 0,
        freeShippingThreshold: Number(form.freeShippingThreshold) || 0,
        giftBoxPrice: Number(form.giftBoxPrice) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
      });
      toast({ title: "Settings saved", variant: "success" });
    } catch (error) {
      toast({ title: "Could not save settings", description: errorMessage(error), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted">Store details used across the site.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="text-base text-ink">Store Profile</h2>
            <Input
              label="Store Name" placeholder="Enter your store name"
              value={form.storeName}
              onChange={(e) => setForm((prev) => ({ ...prev, storeName: e.target.value }))}
            />
            <Input
              label="Tagline" placeholder="e.g. By ZAS"
              value={form.tagline}
              onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
            />
            <Input
              label="Support Email" placeholder="e.g. contact@yourstore.com"
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, supportEmail: e.target.value }))}
            />
            <Input
              label="Support Phone" placeholder="e.g. 0311 8706843"
              value={form.supportPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, supportPhone: e.target.value }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="text-base text-ink">Inventory</h2>
            <Input
              label="Low Stock Threshold" placeholder="e.g. 5"
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={(e) => setForm((prev) => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
              hint="Sizes at or below this many units are flagged as low stock"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="text-base text-ink">Shipping</h2>
            <Input
              label="Flat Shipping Rate (PKR)" placeholder="e.g. 250"
              type="number"
              min="0"
              value={form.shippingFlatRate}
              onChange={(e) => setForm((prev) => ({ ...prev, shippingFlatRate: Number(e.target.value) }))}
            />
            <Input
              label="Free Shipping Threshold (PKR)" placeholder="e.g. 50000"
              type="number"
              min="0"
              value={form.freeShippingThreshold}
              onChange={(e) => setForm((prev) => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))}
              hint="Orders at or above this subtotal ship free"
            />
            <Input
              label="Gift Box Price (PKR)" placeholder="e.g. 300"
              type="number"
              min="0"
              value={form.giftBoxPrice}
              onChange={(e) => setForm((prev) => ({ ...prev, giftBoxPrice: Number(e.target.value) }))}
              hint="Charged when a customer adds a gift box at checkout"
            />
          </CardContent>
        </Card>

        <Button type="submit" variant="primary" size="lg" className="self-start" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
