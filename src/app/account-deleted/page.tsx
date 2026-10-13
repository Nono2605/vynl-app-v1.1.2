import Link from "next/link";

// Page publique affichée après la suppression d'un compte (la session n'existe plus).
export default function AccountDeletedPage() {
  return (
    <div
      className="bg-signature surface-calme"
      style={{ maxWidth: 440, width: "calc(100% - 2 * var(--space-sm))", margin: "var(--space-xl) auto", padding: "var(--space-lg)" }}
    >
      <h1 className="display-title" style={{ marginBottom: "var(--space-md)" }}>Your account has been deleted</h1>
      <p style={{ color: "var(--vynl-texte-2)" }}>
        Your personal data has been removed and any subscription has ended. Thank you for having been here.
      </p>
      <p style={{ marginTop: "var(--space-md)" }}>
        <Link href="/" className="text-link">
          Back to Vynl
        </Link>
      </p>
    </div>
  );
}
