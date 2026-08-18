"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(
  () => import("./LocationPicker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-brand border border-border text-sm text-muted">
        Loading map…
      </div>
    ),
  },
);

export function LocationPickerLoader({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  return <LocationPicker onChange={onChange} />;
}
