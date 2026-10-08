"use client";

// Filet de sécurité si la mise en page racine elle-même échoue (ex: Nav) —
// sans ça, une erreur ici produirait un écran blanc sans recours.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          // Ce composant remplace le layout racine : ni globals.css ni les
          // polices ne sont chargés, d'où les valeurs de la DA en dur (Nuit,
          // Blanc, Bleu Vynl) et la police système.
          background: "#050816",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>Something went wrong</h1>
          <button
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "0 1.5rem",
              borderRadius: 999,
              border: "none",
              background: "#0059f9",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
