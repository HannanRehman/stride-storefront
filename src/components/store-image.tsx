"use client";
import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";
export default function StoreImage(props: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(
    null,
  );
  const failed = failedSource === props.src;
  return (
    <NextImage
      {...props}
      src={failed ? "/images/fallback.svg" : props.src}
      alt={failed ? `Image unavailable: ${props.alt}` : props.alt}
      unoptimized={failed || props.unoptimized}
      onError={(event) => {
        if (!failed) setFailedSource(props.src);
        props.onError?.(event);
      }}
    />
  );
}
