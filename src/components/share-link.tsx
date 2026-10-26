"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
export function ShareLink({ title }: { title: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    const url = new URL(window.location.pathname, window.location.origin).href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setMessage("");
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied.");
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setMessage("Copy the page address from your browser to share it.");
    }
  }
  return (
    <div className="share-link">
      <button type="button" className="order-link-button" onClick={share}>
        <Share2 size={16} />
        Share this page
      </button>
      {message && <span role="status">{message}</span>}
    </div>
  );
}
