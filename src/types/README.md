# Frontend Type System Integration

This directory contains TypeScript types that are **fully aligned** with the backend Python models used in the LangGraph execution workflow.

## 🎯 Integration Status

### ✅ **Fully Integrated Types**

#### HITL (Human-in-the-Loop) Types
- **`InterventionType`** - Matches `src/models/template.py:15`
- **`InterventionPoint`** - Matches `src/models/template.py:24`
- **`CompletionStrategy`** - Matches `src/models/template.py:88`
- **`ExecutionStatus`** - Enhanced version matching `src/models/template.py:76`
- **`HITLConfig`** - Matches `src/models/template.py:32`

#### Tavily API Types
- **`TavilyAPIType`** - Matches `src/models/tavily/responses.py:14`
- **`TavilyConfig`** - Matches `src/models/template.py:151`
- **All Response Models** - Match Tavily response models

#### Core Execution Types
- **`AgentType`** - Matches `src/models/template.py:208`
- **`WorkflowMode`** - Matches template workflow modes
- **`TemplateCategory`** - Matches `src/models/template.py:257`

## 📁 File Structure

```
frontend/src/types/
├── hitl.types.ts          # HITL workflow types
├── tavily.types.ts        # Tavily API integration types
├── index.ts               # Centralized exports
└── README.md              # This documentation
```

## 🔄 Usage Examples

### Import from Centralized Location
```typescript
import { 
  ExecutionStatus, 
  InterventionType, 
  CompletionStrategy,
  TavilyConfig 
} from '@/types';
```

### HITL Configuration
```typescript
const hitlConfig: HITLConfig = {
  enabled: true,
  intervention_points: ['before_execution', 'after_execution'],
  intervention_type: 'approval',
  timeout_seconds: 300,
  auto_approve_after_timeout: false,
  required_fields: [],
};
```

### Parallel Execution Strategy
```typescript
const workflowConfig: WorkflowConfig = {
  mode: 'parallel',
  completion_strategy: 'majority',
  max_concurrent_agents: 3,
  required_completions: 2,
};
```

### Tavily API Configuration
```typescript
const tavilyConfig: TavilyConfig = {
  search_api: true,
  extract_api: false,
  crawl_api: false,
  map_api: false,
  search_depth: 'advanced',
  max_results: 5,
  // ... other config
};
```

## 🔗 Backend Alignment

### Python Enum → TypeScript Union Type Mapping

| Backend Python Enum | Frontend TypeScript Type | Status |
|---------------------|---------------------------|---------|
| `InterventionType` | `InterventionType` | ✅ Aligned |
| `InterventionPoint` | `InterventionPoint` | ✅ Aligned |
| `CompletionStrategy` | `CompletionStrategy` | ✅ Aligned |
| `ExecutionStatus` | `ExecutionStatus` | ✅ Enhanced |
| `TavilyAPIType` | `TavilyAPIType` | ✅ Aligned |
| `AgentType` (template) | `AgentType` | ✅ Aligned |

### Model Structure Alignment

| Backend Model | Frontend Interface | Alignment |
|---------------|-------------------|-----------|
| `HITLConfig` | `HITLConfig` | ✅ Perfect |
| `TavilyConfig` | `TavilyConfig` | ✅ Perfect |
| `Agent` | `Agent` | ✅ Enhanced |
| `WorkflowConfig` | `WorkflowConfig` | ✅ Enhanced |
| `ExecutionState` | `ExecutionState` | ✅ Perfect |

## 🚀 Benefits

1. **Type Safety** - Full IntelliSense support for all HITL and execution types
2. **Runtime Safety** - Prevents type mismatches between frontend/backend
3. **Developer Experience** - Clear, documented types with examples
4. **Maintainability** - Centralized type definitions
5. **Consistency** - Aligned with actual LangGraph execution workflow

## 🔧 Maintenance

When backend models change:

1. Update the corresponding TypeScript types
2. Run type checking: `npm run type-check`
3. Update this documentation if needed
4. Test integration with actual API calls

## 📝 Notes

- **No TypeScript Enums**: We use union types instead of enums for better JSON serialization
- **Optional Fields**: Frontend types include optional fields for flexibility
- **Default Values**: Provided for all major configuration objects
- **Backward Compatibility**: Existing code continues to work with enhanced types