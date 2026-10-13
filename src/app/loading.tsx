export default function Loading() {
  return (
    <main id="main" className="section" aria-busy="true">
      <span className="sr-only" role="status">
        Loading Stride…
      </span>
      <div className="loading-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} />
        ))}
      </div>
    </main>
  );
}
