/**
 * Conditional Edge Component
 * Orange line with condition labels for conditional workflow connections
 */

import { getBezierPath, EdgeLabelRenderer } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { Badge } from '../../../../../components/ui/badge';

interface EdgeData {
  condition_type?: 'success' | 'failure' | 'custom';
  workflowType?: string;
}

export function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}: EdgeProps<EdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getConditionColor = (conditionType?: string) => {
    switch (conditionType) {
      case 'success': return '#10b981';
      case 'failure': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getConditionLabel = (conditionType?: string) => {
    switch (conditionType) {
      case 'success': return '✓ Success';
      case 'failure': return '✗ Failure';
      default: return '⚙ Custom';
    }
  };

  const edgeColor = getConditionColor(data?.condition_type);

  return (
    <>
      {/* Main Edge Path */}
      <path
        id={id}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '5,5',
          fill: 'none'
        }}
        className={`react-flow__edge-path ${selected ? 'opacity-100' : 'opacity-80'} hover:opacity-100 transition-opacity`}
        d={edgePath}
        markerEnd="url(#conditional-arrow)"
      />
      
      {/* Condition Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Badge 
            variant="outline" 
            className={`
              text-xs font-medium shadow-sm bg-white border-2 px-2 py-1
              ${data?.condition_type === 'success' ? 'border-green-500 text-green-700' : ''}
              ${data?.condition_type === 'failure' ? 'border-red-500 text-red-700' : ''}
              ${data?.condition_type === 'custom' ? 'border-orange-500 text-orange-700' : ''}
              ${selected ? 'ring-2 ring-blue-200' : ''}
              hover:shadow-md transition-shadow cursor-pointer
            `}
          >
            {getConditionLabel(data?.condition_type)}
          </Badge>
        </div>
      </EdgeLabelRenderer>
      
      {/* Selection Indicator */}
      {selected && (
        <path
          style={{
            stroke: edgeColor,
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
          id="conditional-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={edgeColor}
            stroke={edgeColor}
          />
        </marker>
      </defs>
    </>
  );
}
