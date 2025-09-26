# Frontend Architecture Documentation

## 🏗️ Architecture Overview

This Next.js 15 application follows a production-ready architecture with strict separation of concerns, comprehensive error handling, and performance optimizations.

### 📁 Project Structure

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── (auth)/            # Route groups for auth pages
│   ├── (admin)/           # Admin route group
│   ├── api/               # API routes
│   │   └── monitoring/    # Error & metrics endpoints
│   ├── error.tsx          # Global error boundary
│   ├── not-found.tsx      # 404 page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/
│   ├── ui/                # Reusable UI components
│   ├── optimized/         # Performance-optimized components
│   ├── wishlist/          # Wishlist-specific components
│   └── error-boundary.tsx # Error boundary component
├── lib/
│   ├── env.ts             # Environment validation
│   ├── api.ts             # Enhanced API client
│   ├── monitoring.ts      # Error tracking & metrics
│   ├── wishlist.ts        # Wishlist state management
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
├── providers/             # Context providers
├── store/                 # Global state (Zustand)
├── styles/                # Global styles
└── types/                 # TypeScript definitions
```

## 🔐 Environment & Security

### Environment Validation
- **Strict validation** with Zod schemas
- **Server/client separation** enforced at runtime
- **Feature flags** based on environment
- **Safe defaults** for all configurations

```typescript
// Server-only variables never reach client
export const env = serverSchema.parse(process.env);

// Client variables properly typed and validated
export const clientEnv = clientSchema.parse(clientEnv);
```

### Security Headers
- **CSP (Content Security Policy)** with environment-specific rules
- **HSTS** for HTTPS enforcement
- **XSS Protection** and content type validation
- **Frame protection** against clickjacking
- **Rate limiting** with IP-based throttling

## 🚀 Performance Optimizations

### Code Splitting & Lazy Loading
```typescript
// Dynamic imports with proper loading states
export const LazyWishlistDrawer = createDynamicComponent(
  () => import('@/components/wishlist/WishlistDrawer'),
  { name: 'WishlistDrawer', ssr: false }
);
```

### Image Optimization
- **Next.js Image** with proper sizing strategies
- **Blur placeholders** for better UX
- **Priority loading** for above-the-fold content
- **WebP/AVIF** format support

### Caching Strategy
- **Static assets**: 1 year cache
- **API responses**: Environment-based cache times
- **Images**: Long-term caching with proper headers

## 🛡️ Error Handling

### Multi-Level Error Boundaries
1. **Global**: App-level error boundary in layout
2. **Page**: Individual page error boundaries
3. **Component**: Granular error isolation
4. **Client**: Separate boundaries for client-only code

### Error Monitoring
- **Automatic error reporting** to monitoring endpoints
- **Performance metrics** collection
- **User-friendly error messages** with recovery options
- **Development debugging** with detailed stack traces

## 🎯 Wishlist Implementation

### State Management
- **Zustand** with persistence middleware
- **Anonymous/authenticated** user support
- **Automatic sync** on authentication
- **Optimistic updates** with error recovery

### Features
- ✅ **Persistent storage** (localStorage for anonymous users)
- ✅ **Server sync** for authenticated users
- ✅ **Merge functionality** when logging in
- ✅ **Accessible UI** with ARIA support
- ✅ **Loading states** and error handling

## 🌐 API Integration

### Enhanced HTTP Client
- **Automatic retries** with exponential backoff
- **Request/response interceptors** for auth
- **Error classification** (network, client, server)
- **Request tracing** with unique IDs
- **Timeout handling** with environment-based values

### CORS Configuration
- **Environment-specific origins** allowed
- **Proper preflight handling** for complex requests
- **Credentials support** for authenticated requests
- **Security headers** on all API responses

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals** tracking
- **Custom metrics** collection
- **API performance** monitoring
- **Error rate tracking**

### Error Tracking
- **Structured logging** with context
- **Error aggregation** and deduplication
- **User impact assessment**
- **Recovery success tracking**

## 🎨 UI/UX Best Practices

### Accessibility
- **ARIA labels** and roles
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus management** for modals/drawers
- **Color contrast** compliance

### Performance UX
- **Loading skeletons** for better perceived performance
- **Optimistic updates** for immediate feedback
- **Progressive enhancement** for core functionality
- **Graceful degradation** for network issues

## 🔧 Development Experience

### Type Safety
- **Strict TypeScript** configuration
- **API response validation** with Zod
- **Environment variable** type checking
- **Component prop validation**

### Code Quality
- **ESLint** with Next.js rules
- **Prettier** for consistent formatting
- **Husky** for pre-commit hooks
- **Path aliases** for clean imports

## 📈 Scalability Considerations

### Bundle Optimization
- **Dynamic imports** for heavy components
- **Tree shaking** for unused code elimination
- **Code splitting** by route and feature
- **Vendor chunk optimization**

### State Management
- **Zustand** for lightweight global state
- **React Query** for server state
- **Local state** for component-specific data
- **Persistent state** with proper serialization

## 🚀 Deployment Recommendations

### Environment Setup
1. **Development**: Full debugging, relaxed CSP
2. **Staging**: Production-like with test data
3. **Production**: Strict security, monitoring enabled

### Performance Monitoring
- **Core Web Vitals** tracking
- **Error rate monitoring**
- **API response time** tracking
- **User journey analytics**

### Security Checklist
- ✅ Environment variables properly configured
- ✅ CSP headers implemented
- ✅ Rate limiting enabled
- ✅ Authentication flows secured
- ✅ Input validation implemented
- ✅ Error messages don't leak sensitive data

## 🔄 Maintenance & Updates

### Regular Tasks
- **Dependency updates** with security patches
- **Performance audits** using Lighthouse
- **Error log analysis** for improvement opportunities
- **User feedback integration**

### Monitoring Alerts
- **Error rate spikes** (>1% error rate)
- **Performance degradation** (LCP >2.5s)
- **API failures** (>5% failure rate)
- **Security incidents** (rate limit triggers)

## 📚 Key Technologies

- **Next.js 15**: App Router, Server Components
- **React 19**: Latest features and optimizations
- **TypeScript**: Strict type checking
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **Zod**: Runtime validation
- **Axios**: HTTP client with interceptors

This architecture provides a solid foundation for a production-ready e-commerce frontend with excellent performance, security, and maintainability.
