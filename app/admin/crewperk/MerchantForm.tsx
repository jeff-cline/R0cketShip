import type { MerchantRow } from "@/app/_crew/merchants";

const CATEGORIES = ["Food & Drink", "Beaches", "Excursions", "Transport", "Wellness", "Nightlife", "Shopping", "Events"];
const TIERS = [["community_builder", "Community Builder ($750/mo)"], ["advanced", "Merchant Advanced ($3,000/mo)"], ["free", "Free listing"]];
const PRICES = ["$", "$$", "$$$", "$$$$"];
const COUPONS = [["", "No coupon"], ["one_time", "One-time"], ["for_life", "For life"]];

export function MerchantForm({ merchant, action, submitLabel }: { merchant?: MerchantRow; action: (fd: FormData) => void; submitLabel: string }) {
  const m = merchant;
  return (
    <form action={action} className="grid gap-3">
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col"><span className="label">Business name *</span><input name="name" required defaultValue={m?.name} className="input" /></label>
        <label className="flex flex-col"><span className="label">Port</span><input name="port" defaultValue={m?.port ?? "San Juan, Puerto Rico"} className="input" /></label>
        <label className="flex flex-col"><span className="label">Category</span><select name="category" defaultValue={m?.category ?? "Food & Drink"} className="input">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="flex flex-col"><span className="label">Tier</span><select name="tier" defaultValue={m?.tier ?? "community_builder"} className="input">{TIERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex flex-col"><span className="label">Crew perk</span><input name="perk" defaultValue={m?.perk ?? ""} placeholder="Free appetizer" className="input" /></label>
        <label className="flex flex-col"><span className="label">Price level</span><select name="priceLevel" defaultValue={m?.priceLevel ?? "$$"} className="input">{PRICES.map((p) => <option key={p}>{p}</option>)}</select></label>
      </div>
      <label className="flex flex-col"><span className="label">Description</span><textarea name="description" rows={2} defaultValue={m?.description ?? ""} className="input" /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col"><span className="label">Phone</span><input name="phone" defaultValue={m?.phone ?? ""} className="input" /></label>
        <label className="flex flex-col"><span className="label">Address</span><input name="address" defaultValue={m?.address ?? ""} className="input" /></label>
        <label className="flex flex-col"><span className="label">Website</span><input name="website" defaultValue={m?.website ?? ""} className="input" /></label>
        <label className="flex flex-col"><span className="label">Latitude</span><input name="lat" defaultValue={m?.lat ?? ""} className="input" /></label>
        <label className="flex flex-col"><span className="label">Longitude</span><input name="lon" defaultValue={m?.lon ?? ""} className="input" /></label>
        <label className="flex flex-col"><span className="label">Status</span><select name="status" defaultValue={m?.status ?? "active"} className="input"><option value="active">Active</option><option value="hidden">Hidden</option></select></label>
      </div>
      <label className="flex flex-col"><span className="label">Image URLs (one per line)</span><textarea name="images" rows={3} defaultValue={(m?.images ?? []).join("\n")} className="input" placeholder="https://…" /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col"><span className="label">Coupon code</span><input name="couponCode" defaultValue={m?.couponCode ?? ""} className="input" /></label>
        <label className="flex flex-col"><span className="label">Coupon type</span><select name="couponType" defaultValue={m?.couponType ?? ""} className="input">{COUPONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex flex-col"><span className="label">Coupon note</span><input name="couponNote" defaultValue={m?.couponNote ?? ""} className="input" /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={m?.featured ?? false} /> Featured (top of grid &amp; map)</label>
      <div><button className="btn btn-primary" style={{ padding: "10px 18px" }}>{submitLabel}</button></div>
    </form>
  );
}
