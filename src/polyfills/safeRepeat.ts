/**
 * Guard against libraries calling `String.prototype.repeat`
 * with invalid counts (negative or non-finite), which would otherwise
 * throw a RangeError and crash rendering. We gracefully fallback to
 * returning an empty string instead.
 */
(() => {
  const proto = String.prototype as typeof String.prototype & {
    __patchedSafeRepeat__?: boolean;
  };

  if (proto.__patchedSafeRepeat__) return;

  const original = proto.repeat;

  Object.defineProperty(proto, "__patchedSafeRepeat__", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  Object.defineProperty(proto, "repeat", {
    configurable: true,
    enumerable: false,
    writable: true,
    value(this: string, count: number) {
      const numericCount = Number(count);
      if (!Number.isFinite(numericCount) || numericCount < 0) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[safeRepeat] intercepted invalid count for String.repeat:",
            count
          );
        }
        return "";
      }
      const bounded = Math.floor(numericCount);
      return original.call(this, bounded);
    },
  });
})();
