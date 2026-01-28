'use client';

import { useState } from 'react';
import Image from 'next/image';

interface HeroImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export default function HeroImage({ src, fallbackSrc, alt, className }: HeroImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className}
      fill
      sizes="100vw"
      priority
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
