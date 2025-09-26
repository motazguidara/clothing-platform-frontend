import React from "react";

interface ProductImagePlaceholderProps {
  className?: string;
  productName?: string;
}

export function ProductImagePlaceholder({
  className = "flex h-full w-full items-center justify-center text-gray-500 bg-gray-100",
  productName = "Product"
}: ProductImagePlaceholderProps) {
  return (
    <div className={className}>
      <div className="text-center">
        <svg
          className="w-12 h-12 mx-auto mb-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm font-medium">No Image</p>
        {productName && (
          <p className="text-xs text-gray-400 mt-1">{productName}</p>
        )}
      </div>
    </div>
  );
}
