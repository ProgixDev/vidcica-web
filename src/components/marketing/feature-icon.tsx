/** The line-art icon used by the feature cards (landing + /fonctionnalites). */
export function FeatureIcon({
  path,
  circles,
}: {
  path?: string;
  circles?: [number, number, number][];
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4.5"
      aria-hidden
    >
      {path ? <path d={path} /> : null}
      {circles?.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}
