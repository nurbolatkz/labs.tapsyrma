const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };

export function LeafIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 26" aria-hidden="true" {...stroke}>
      <path d="M19 3C6 3 2 10 6 17c5 7 15-1 13-14Z" />
      <path d="M5 23 17 6M9 16l-2-6m6 1 5-1" />
    </svg>
  );
}

export function SoundIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 9h4l5-4v14l-5-4H4zM17 8q5 4 0 8m3-11q8 7 0 14" />
    </svg>
  );
}

export function MuteIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6" />
    </svg>
  );
}

export function ReplayIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" />
    </svg>
  );
}

export function StopIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function CameraIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M3 7h5l2-3h4l2 3h5v13H3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function ArrowIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function PlayIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M7 5v14l12-7z" />
    </svg>
  );
}
