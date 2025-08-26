# API & Code Patterns Guide

## 🎯 Data Operation Patterns

### Standard CRUD Pattern
Always follow this pattern for data operations:

```typescript
// 1. Optimistic Update (UI responds instantly)
const updateItem = async (itemId: string, updates: Partial<Item>) => {
  // Update UI immediately
  setItems(prev => prev.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  ));
  
  try {
    // Persist to storage
    await hybridDataService.saveItems(tripId, updatedItems);
  } catch (error) {
    // Revert on failure
    setItems(prev => /* restore original state */);
    setError('Failed to save changes');
  }
};
```

### Loading Pattern with Error Handling
```typescript
const [data, setData] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await hybridDataService.getItems(tripId);
      setData(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      // Still show cached data if available
      const cached = await getCachedItems(tripId);
      if (cached) setData(cached);
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, [tripId]);
```

## 🔄 State Management Patterns

### Context for Shared State
```typescript
// Use context for truly global state
const AuthContext = createContext<AuthContextType>();

// Use outlet context for trip-specific data
const TripContext = useOutletContext<TripContextType>();
```

### Local State with Custom Hooks
```typescript
// Encapsulate complex state logic
const usePackingItems = (tripId: string) => {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // All CRUD operations
  const addItem = async (item: PackingItem) => { /* ... */ };
  const updateItem = async (id: string, updates: Partial<PackingItem>) => { /* ... */ };
  const deleteItem = async (id: string) => { /* ... */ };
  
  return { items, loading, addItem, updateItem, deleteItem };
};
```

## 🎨 Component Patterns

### Modal Component Pattern
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => Promise<void>;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2>{title}</h2>
        {children}
        {/* Action buttons */}
      </div>
    </div>
  );
};
```

### List Item Component Pattern
```typescript
const ListItem: React.FC<ItemProps> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(item.name);
  
  const handleSave = () => {
    onUpdate(item.id, { name: tempValue });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setTempValue(item.name);
    setIsEditing(false);
  };
  
  return isEditing ? (
    <EditView value={tempValue} onSave={handleSave} onCancel={handleCancel} />
  ) : (
    <DisplayView item={item} onEdit={() => setIsEditing(true)} onDelete={onDelete} />
  );
};
```

## 🔐 Security Patterns

### Input Validation
```typescript
// Always validate user input
import { z } from 'zod';

const TripSchema = z.object({
  tripName: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  tripType: z.enum(['car camping', 'canoe camping', 'hike camping', 'cottage'])
});

const validateTrip = (data: unknown) => {
  try {
    return TripSchema.parse(data);
  } catch (error) {
    throw new Error('Invalid trip data');
  }
};
```

### RLS-Aware Queries
```typescript
// Always include user context in Supabase queries
const getItems = async (tripId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('trip_id', tripId)
    .eq('user_id', user.id); // RLS requirement
    
  if (error) throw error;
  return data;
};
```

## ⚡ Performance Patterns

### Debounced Operations
```typescript
const useDebouncedSave = (saveFunction: Function, delay: number = 150) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveFunction(...args);
    }, delay);
  }, [saveFunction, delay]);
};
```

### Memoization Pattern
```typescript
const expensiveCalculation = useMemo(() => {
  return items.reduce((acc, item) => {
    // Complex calculation
    return acc + complexFunction(item);
  }, 0);
}, [items]); // Only recalculate when items change
```

### Virtual Scrolling Pattern
```typescript
// Use react-window for long lists
import { FixedSizeList } from 'react-window';

const LongList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index].name}
      </div>
    )}
  </FixedSizeList>
);
```

## 🧪 Testing Patterns

### Component Testing
```typescript
describe('PackingList', () => {
  const mockTrip = { /* ... */ };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should add item optimistically', async () => {
    const { getByText, getByRole } = render(<PackingList trip={mockTrip} />);
    
    // User action
    fireEvent.click(getByText('Add Item'));
    
    // Immediate UI update
    expect(getByText('New Item')).toBeInTheDocument();
    
    // Wait for save
    await waitFor(() => {
      expect(hybridDataService.savePackingItems).toHaveBeenCalled();
    });
  });
});
```

### Service Testing
```typescript
describe('HybridDataService', () => {
  test('should fall back to local storage on Supabase error', async () => {
    supabase.from.mockRejectedValueOnce(new Error('Network error'));
    
    const result = await hybridDataService.getItems('trip123');
    
    expect(localStorage.getItem).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
```

## 🚀 Deployment Patterns

### Environment Variables
```typescript
// Always provide defaults for local development
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'local-dev-key';
```

### Feature Flags
```typescript
// Use feature flags for gradual rollout
const FEATURES = {
  MEAL_TEMPLATES: process.env.REACT_APP_FEATURE_MEAL_TEMPLATES === 'true',
  EXPENSE_TRACKING: process.env.REACT_APP_FEATURE_EXPENSE_TRACKING === 'true',
};

// In component
if (FEATURES.MEAL_TEMPLATES) {
  return <MealTemplates />;
}
```