"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Arial, sans-serif", padding: 48 }}>
        <main>
          <h1>The store couldn’t load.</h1>
          <p>Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{ padding: "12px 24px", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
