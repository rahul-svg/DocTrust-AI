import { confidenceHexColor } from '../utils/statusStyles';

export default function ConfidenceGauge({
  confidence,
  size = 96,
}: {
  confidence: number;
  size?: number;
}) {
  const pct = Math.min(100, Math.max(0, confidence));
  const strokeWidth = Math.max(6, size * 0.08);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const center = size / 2;
  const color = confidenceHexColor(pct);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-gray-800" style={{ fontSize: size * 0.22 }}>
          {pct}%
        </span>
        {size >= 72 && <span className="text-[10px] text-gray-400">confidence</span>}
      </div>
    </div>
  );
}
