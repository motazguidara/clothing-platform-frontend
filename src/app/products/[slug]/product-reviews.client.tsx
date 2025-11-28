'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError, ValidationError } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/types';

type Review = NonNullable<Product['reviews']>[number];

interface Props {
  productSlug: string;
  reviews?: Review[];
  reviewCount?: number | null;
  avgRating?: number | null;
}

const clampRating = (value: number) => Math.min(5, Math.max(1, value));

const Star = ({ filled }: { filled: boolean }) => (
  <svg
    className={`h-4 w-4 ${filled ? 'text-yellow-500' : 'text-gray-300'} fill-current`}
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export function ProductReviews({ productSlug, reviews = [], reviewCount, avgRating }: Props) {
  const { isAuthenticated, isLoading: authLoading } = useAuth({ fetchProfile: false });
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayReviews = useMemo(() => reviews, [reviews]);
  const totalReviews = useMemo(() => reviewCount ?? reviews.length ?? 0, [reviewCount, reviews.length]);
  const average = useMemo(() => (typeof avgRating === 'number' ? avgRating : null), [avgRating]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      await apiClient.post(`/catalog/products/${productSlug}/reviews/`, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      setSuccess('Thank you! Your review was submitted and is awaiting approval.');
      setTitle('');
      setComment('');
      setRating(5);
    } catch (err) {
      if (err instanceof ValidationError) {
        const fieldMsg = err.nonFieldErrors?.[0] || Object.values(err.fieldErrors || {})[0]?.[0];
        setError(fieldMsg || err.message);
      } else if (err instanceof ApiError) {
        setError(err.message || 'Unable to submit your review right now.');
      } else {
        setError('Unable to submit your review right now.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          <p className="text-sm text-gray-600">See what others are saying about this product.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star key={idx} filled={average ? idx < Math.round(average) : false} />
            ))}
          </div>
          <div className="text-sm text-gray-700">
            {average ? average.toFixed(1) : '—'} • {totalReviews} review{totalReviews === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Write a review</h3>
          {!mounted || (!isAuthenticated && !authLoading) ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
              Please{' '}
              <Link href="/(auth)/login" className="font-semibold text-gray-900 underline">
                sign in
              </Link>{' '}
              to share your experience with this product.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Rating</label>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const val = idx + 1;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRating(val)}
                        className={`rounded-full border p-2 transition ${rating === val ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 hover:border-gray-400'}`}
                        aria-label={`Rate ${val} star${val > 1 ? 's' : ''}`}
                      >
                        <Star filled={val <= rating} />
                      </button>
                    );
                  })}
                  <span className="text-xs text-gray-600">({clampRating(rating)} / 5)</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900" htmlFor="review-title">
                  Title
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Amazing quality and fit"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900" htmlFor="review-comment">
                  Comment
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  minLength={10}
                  required
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Share details on comfort, sizing, and quality."
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !isAuthenticated}
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {submitting ? 'Submitting…' : 'Submit review'}
              </button>
              <p className="text-xs text-gray-500">Reviews are published once approved by our team.</p>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">What shoppers are saying</h3>
          {displayReviews.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              No reviews yet. Be the first to share your thoughts once you try this product.
            </p>
          ) : (
            <div className="space-y-3">
              {displayReviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} filled={idx < clampRating(Number(review.rating) || 0)} />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{review.title}</span>
                    </div>
                    {review.created_at && (
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                  <p className="mt-2 text-xs text-gray-500">by {review.user_name || 'Customer'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
