import Link from "next/link";

// Temporary home page until the app shell exists (step 3).
export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px 16px", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>ديلول تشس</h1>
        <p>الموقع قيد البناء · Site en construction</p>
        <Link href="/dev/design" style={{ textDecoration: "underline" }}>
          اتجاهات التصميم · Pistes de design
        </Link>
      </div>
    </main>
  );
}
