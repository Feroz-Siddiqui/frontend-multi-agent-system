/**
 * Sequential Edge Component
 * Blue solid line for sequential workflow connections
 */

import { getBezierPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';

interface EdgeData {
  condition_type?: string;
  workflowType?: string;
}

export function SequentialEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected
}: EdgeProps<EdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Main Edge Path */}
      <path
        id={id}
        style={{
          stroke: '#3b82f6',
          strokeWidth: selected ? 3 : 2,
          fill: 'none'
        }}
        className={`react-flow__edge-path ${selected ? 'opacity-100' : 'opacity-80'} hover:opacity-100 transition-opacity`}
        d={edgePath}
        markerEnd="url(#sequential-arrow)"
      />
      
      {/* Selection Indicator */}
      {selected && (
        <path
          style={{
            stroke: '#3b82f6',
            strokeWidth: 6,
            strokeOpacity: 0.2,
            fill: 'none'
          }}
          d={edgePath}
        />
      )}

      {/* Arrow Marker Definition */}
      <defs>
        <marker
          id="sequential-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill="#3b82f6"
            stroke="#3b82f6"
          />
        </marker>
      </defs>
    </>
  );
}
