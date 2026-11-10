/** Soulkeep 的标记：一段被钉子钉住的虚线轮廓。跟随 currentColor。 */
export function SoulkeepMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.4c4.6 0 8.4 2.9 8.4 6.6s-3.8 6.6-8.4 6.6S3.6 13.7 3.6 10 7.4 3.4 12 3.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2.6 2.2"
        strokeLinecap="round"
      />
      <path d="M12 3.2v3.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="2.9" r="1.5" fill="currentColor" />
      <path d="M8.2 10.2c1-1.3 2.3-1.9 3.8-1.9s2.8.6 3.8 1.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
