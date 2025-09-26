export function ProductSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Size Selection Skeleton */}
      <div>
        <div className="h-4 bg-gray-200 rounded w-12 mb-3"></div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-md"></div>
          ))}
        </div>
      </div>

      {/* Color Selection Skeleton */}
      <div>
        <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-8 h-8 bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Quantity Selection Skeleton */}
      <div>
        <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-8 h-6 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="space-y-3">
        <div className="h-12 bg-gray-200 rounded-md"></div>
        <div className="flex space-x-3">
          <div className="flex-1 h-12 bg-gray-200 rounded-md"></div>
          <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
        </div>
      </div>

      {/* Additional Info Skeleton */}
      <div className="border-t border-gray-200 pt-6 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      </div>
    </div>
  );
}
