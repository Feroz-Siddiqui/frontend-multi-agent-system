/**
 * Start and End Nodes for React Flow
 * Professional workflow entry and exit points
 */

import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Play, Square } from 'lucide-react';

export function StartNode({ selected }: NodeProps) {
  return (
    <div className={`
      bg-green-100 border-2 border-green-500 rounded-full w-20 h-20 
      flex items-center justify-center shadow-lg relative
      ${selected ? 'ring-2 ring-green-300' : ''}
      hover:shadow-xl transition-all duration-200
    `}>
      <Play className="h-8 w-8 text-green-600" />
      
      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-green-600">
        Start
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-green-500 border-2 border-white hover:bg-green-600 transition-colors"
        style={{ right: -8 }}
      />
    </div>
  );
}

export function EndNode({ selected }: NodeProps) {
  return (
    <div className={`
      bg-red-100 border-2 border-red-500 rounded-full w-20 h-20 
      flex items-center justify-center shadow-lg relative
      ${selected ? 'ring-2 ring-red-300' : ''}
      hover:shadow-xl transition-all duration-200
    `}>
      <Square className="h-8 w-8 text-red-600" />
      
      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-red-600">
        End
      </div>
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-red-500 border-2 border-white hover:bg-red-600 transition-colors"
        style={{ left: -8 }}
      />
    </div>
  );
}
