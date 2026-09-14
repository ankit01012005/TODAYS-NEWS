/// Logo direction 04 "The Pulse" — a city's signal, read as a waveform.
/// The exact polyline the design handoff specifies, drawn in Sindoor Red
/// at stroke-width 2 under the wordmark, or on its own as a section
/// device. `draw` animates the line in once (globals.css `.pulse-draw`);
/// `beat` adds the slow heartbeat used next to a live indicator.
export function PulseLine({
  width = 150,
  color = "currentColor",
  draw = false,
  beat = false,
  className = "",
}: {
  width?: number;
  color?: string;
  draw?: boolean;
  beat?: boolean;
  className?: string;
}) {
  const height = Math.round((width * 12) / 150);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 150 12"
      fill="none"
      aria-hidden="true"
      className={`block shrink-0 ${beat ? "pulse-beat" : ""} ${className}`}
    >
      <polyline
        points="0,8 44,8 52,2 58,11 64,5 70,8 150,8"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className={draw ? "pulse-draw" : undefined}
      />
    </svg>
  );
}
