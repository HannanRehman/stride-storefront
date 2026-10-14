"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { notifyAccount } from "@/lib/account-events";
export type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};
async function request(path: string, data: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not save changes.");
}
export function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await request("/api/auth/logout", {});
            notifyAccount();
            router.push("/login");
            router.refresh();
          } catch {
            setError("Could not sign out. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </Button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </>
  );
}
export function ProfileForm({
  name,
  phone,
  email,
}: {
  name: string;
  phone: string;
  email: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  return (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        setBusy(true);
        setError("");
        setMessage("");
        try {
          await request("/api/account/profile", data);
          setMessage("Profile saved.");
          router.refresh();
        } catch (error) {
          setError(error instanceof Error ? error.message : "Could not save.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Full name
        <input
          name="full_name"
          autoComplete="name"
          defaultValue={name}
          required
          maxLength={100}
        />
      </label>
      <label>
        Phone number
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={phone}
          maxLength={30}
        />
      </label>
      <label>
        Email address
        <input type="email" value={email} readOnly />
        <small>Your sign-in email is shown here for reference.</small>
      </label>
      <p role="status" className="form-status">
        {message}
      </p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Address | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function remove(address: Address) {
    setBusy(true);
    setError("");
    try {
      await request("/api/account/addresses", {
        action: "delete",
        id: address.id,
      });
      setMessage("Address removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not remove address.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="account-intro">
        Keep addresses ready for later. Saving an address does not place an
        order.
      </p>
      <div className="address-list">
        {addresses.map((address) => (
          <section className="address-entry" key={address.id}>
            <h3>{address.label}</h3>
            <p>
              {address.recipient}
              <br />
              {address.line1}
              {address.line2 && (
                <>
                  <br />
                  {address.line2}
                </>
              )}
              <br />
              {address.city}, {address.province} {address.postal_code}
              <br />
              {address.country}
              <br />
              {address.phone}
            </p>
            <div className="account-actions">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setEditing(address);
                  setError("");
                }}
              >
                Edit {address.label}
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => remove(address)}
              >
                Remove {address.label}
              </Button>
            </div>
          </section>
        ))}
      </div>
      {!addresses.length && (
        <p className="account-empty">
          No saved addresses yet. Add your first address below.
        </p>
      )}
      {editing === undefined ? (
        <Button
          onClick={() => {
            setEditing(null);
            setError("");
          }}
        >
          Add address
        </Button>
      ) : (
        <form
          key={editing?.id || "new"}
          className="account-form address-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            setBusy(true);
            setError("");
            try {
              await request("/api/account/addresses", {
                ...data,
                id: editing?.id,
              });
              setEditing(undefined);
              setMessage("Address saved.");
              router.refresh();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Could not save address.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>{editing ? "Edit address" : "New address"}</h3>
          {(
            [
              ["label", "Address label", "nickname", 40],
              ["recipient", "Recipient name", "shipping name", 100],
              ["phone", "Phone number", "shipping tel", 30],
              ["line1", "Street address", "shipping address-line1", 150],
              [
                "line2",
                "Address line 2 (optional)",
                "shipping address-line2",
                150,
              ],
              ["city", "City", "shipping address-level2", 80],
              ["province", "Province / region", "shipping address-level1", 80],
              [
                "postal_code",
                "Postal code (optional)",
                "shipping postal-code",
                20,
              ],
              ["country", "Country code", "shipping country", 2],
            ] as const
          ).map(([field, label, autocomplete, max]) => (
            <label key={field}>
              {label}
              <input
                name={field}
                autoComplete={autocomplete}
                defaultValue={
                  editing?.[field] || (field === "country" ? "PK" : "")
                }
                required={!["line2", "postal_code"].includes(field)}
                maxLength={max}
                type={field === "phone" ? "tel" : "text"}
              />
              {field === "country" && (
                <small>Two letters, for example PK for Pakistan.</small>
              )}
            </label>
          ))}
          <div className="account-actions">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save address"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setEditing(undefined)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p role="status" className="form-status">
        {message}
      </p>
    </>
  );
}
