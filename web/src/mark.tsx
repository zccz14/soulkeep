/**
 * SoulKeep 的标记：SK 徽标。字母用 mask 挖空，整枚标记只用一种颜色（currentColor）——
 * 侧栏里挖出来的是侧栏底色，标签页里挖出来的是标签栏底色，两边都不用第二支笔。
 * 外壳会把这枚 svg 原样序列化成 favicon，所以它必须一直是 svg。
 */
export function SoulKeepMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <defs>
        <mask id="soulkeep-mark">
          <rect width="32" height="32" rx="9" fill="#ffffff" />
          <text
            x="16"
            y="22"
            fill="#000000"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            fontSize="15"
            fontWeight="800"
            letterSpacing="-0.7"
            textAnchor="middle"
          >
            SK
          </text>
        </mask>
      </defs>
      <rect width="32" height="32" rx="9" fill="currentColor" mask="url(#soulkeep-mark)" />
    </svg>
  );
}
