import Link from "next/link";
import { featuredCredits, otherCreditsLine, type Credit } from "@/lib/trackMeta";

function Names({ credits }: { credits: Credit[] }) {
  return (
    <>
      {credits.map((credit, index) => (
        <span key={`${credit.name}-${index}`}>
          {index > 0 && ", "}
          {credit.slug ? (
            <Link href={`/artists/${credit.slug}`} className="text-link">
              {credit.name}
            </Link>
          ) : (
            credit.name
          )}
        </span>
      ))}
    </>
  );
}

// Sous le titre d'un morceau : les artistes invités (« feat. Nova, Kid », avec un lien vers la page de chacun quand
// il en a une), puis le producteur et l'auteur. Rien s'il n'y a aucun crédit.
export function CreditLine({ credits }: { credits: Credit[] | undefined }) {
  const guests = featuredCredits(credits);
  const others = otherCreditsLine(credits);
  if (guests.length === 0 && !others) return null;

  return (
    <span className="credit-line" style={{ display: "block", color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>
      {guests.length > 0 && (
        <>
          feat. <Names credits={guests} />
        </>
      )}
      {guests.length > 0 && others && " · "}
      {others}
    </span>
  );
}
