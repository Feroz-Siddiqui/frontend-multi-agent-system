/**
 * Custom Workflow Edge for React Flow
 * Professional edge rendering with condition labels
 */

import { getBezierPath, EdgeLabelRenderer } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { Badge } from '../../../../../components/ui/badge';

interface EdgeData {
  condition_type: 'always' | 'success' | 'failure' | 'custom';
  condition?: string;
  sourceAgentName?: string;
  targetAgentName?: string;
}

export function CustomWorkflowEdge({
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

  // Color coding for different condition types
  const edgeStyles = {
    always: { 
      stroke: '#3b82f6', 
      strokeWidth: selected ? 3 : 2,
      strokeDasharray: 'none'
    },
    success: { 
      stroke: '#10b981', 
      strokeWidth: selected ? 3 : 2,
      strokeDasharray: 'none'
    },
    failure: { 
      stroke: '#ef4444', 
      strokeWidth: selected ? 3 : 2,
      strokeDasharray: '5,5'
    },
    custom: { 
      stroke: '#8b5cf6', 
      strokeWidth: selected ? 3 : 2,
      strokeDasharray: '10,5'
    }
  };

  const style = edgeStyles[data?.condition_type || 'always'];

  return (
    <>
      {/* Main Edge Path */}
      <path
        id={id}
        style={style}
        className={`react-flow__edge-path ${selected ? 'opacity-100' : 'opacity-80'} hover:opacity-100 transition-opacity`}
        d={edgePath}
        markerEnd="url(#workflow-arrow)"
      />
      
      {/* Condition Label */}
      {data?.condition_type && data.condition_type !== 'always' && (
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
                ${data.condition_type === 'success' ? 'border-green-500 text-green-700' : ''}
                ${data.condition_type === 'failure' ? 'border-red-500 text-red-700' : ''}
                ${data.condition_type === 'custom' ? 'border-purple-500 text-purple-700' : ''}
                ${selected ? 'ring-2 ring-blue-200' : ''}
                hover:shadow-md transition-shadow cursor-pointer
              `}
            >
              {data.condition_type === 'success' && '✓ Success'}
              {data.condition_type === 'failure' && '✗ Failure'}
              {data.condition_type === 'custom' && '⚙ Custom'}
            </Badge>
          </div>
        </EdgeLabelRenderer>
      )}

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
          id="workflow-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={style.stroke}
            stroke={style.stroke}
          />
        </marker>
      </defs>
    </>
  );
}
