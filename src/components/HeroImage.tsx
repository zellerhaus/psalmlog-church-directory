'use client';

import { useState } from 'react';

interface HeroImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export default function HeroImage({ src, fallbackSrc, alt, className }: HeroImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
