"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Renders a QR code for `value` as a data URL image, generated fully
 * client-side with the `qrcode` npm package (MIT licensed — see
 * SPEC.md for the license check). No network call, no server route: the
 * PNG is encoded in-browser via canvas and handed back as a data URL, so
 * it also works as a right-click-save-able / `<a download>`-able image.
 */
export function QRCodeImage({ value, size = 200 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return <p className="text-xs text-danger">Couldn&apos;t generate QR code.</p>;
  }

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded-brand bg-border"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image can't optimize it anyway
    <img src={dataUrl} alt="QR code" width={size} height={size} className="rounded-brand" />
  );
}
