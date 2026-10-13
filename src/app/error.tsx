"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="not-found">
      <h1>LET’S TRY THAT AGAIN.</h1>
      <p>The page couldn’t load. Try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
