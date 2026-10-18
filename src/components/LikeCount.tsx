import { HeartIcon } from "@/components/icons";
import { formatCount, likesLabel } from "@/lib/formatCount";

// Le nombre de « j'aime » d'un morceau, en petit et sans bruit, là où il n'y a pas de bouton cœur
// (la liste de la recherche). Rien tant que personne n'a aimé le morceau.
export function LikeCount({ count }: { count: number | null | undefined }) {
  if (!count || count < 1) return null;
  return (
    <span className="like-count like-count--inline" title={likesLabel(count)}>
      <HeartIcon size={11} />
      <span aria-hidden="true">{formatCount(count)}</span>
      <span className="sr-only">{likesLabel(count)}</span>
    </span>
  );
}
