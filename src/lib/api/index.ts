// Export the main API client
export { apiClient } from './client';
export type { ApiError, ValidationError, NetworkError } from './client';

// Export all schemas and types
export * from './schemas';

// Export all services
export { catalogService } from './services/catalog';
export { authService } from './services/auth';
export { ordersService } from './services/orders';
export { recommendationService } from './services/recommendations';

// Export service classes for custom instances if needed
export { CatalogService } from './services/catalog';
export { AuthService } from './services/auth';
export { OrdersService } from './services/orders';
export { RecommendationService } from './services/recommendations';
