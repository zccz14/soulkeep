import { Handle, Position, type NodeProps } from '@xyflow/react';

const HIDDEN = { opacity: 0, width: 1, height: 1, minWidth: 0, minHeight: 0, border: 'none', background: 'transparent' };

/**
 * 实体方框，带三个不显眼的接口：
 * out（底）与 in（顶）走从属；peer（底）走平级与同体——
 * 两个底边连起来，线会在下面走一条浅弧，而不是绕箱子一圈。
 */
export function SkeletonNode({ data }: NodeProps) {
  return (
    <>
      <Handle id="out" type="source" position={Position.Bottom} style={HIDDEN} isConnectable={false} />
      <Handle id="peer" type="target" position={Position.Bottom} style={HIDDEN} isConnectable={false} />
      <Handle id="in" type="target" position={Position.Top} style={HIDDEN} isConnectable={false} />
      <span>{String(data.label)}</span>
    </>
  );
}
