/* oxlint-disable next/no-img-element -- This is the static Vite compatibility layer for next/image. */

import type { ImgHTMLAttributes } from 'react';

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
  unoptimized?: boolean;
};

export default function Image({
  priority,
  unoptimized: _unoptimized,
  alt = '',
  ...props
}: ImageProps) {
  return (
    <img
      {...props}
      alt={alt}
      loading={priority ? 'eager' : props.loading}
      fetchPriority={priority ? 'high' : props.fetchPriority}
    />
  );
}
