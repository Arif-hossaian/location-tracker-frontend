import { accuracyBand, formatMeters, type AccuracyBand } from '../utils/format';

const BARS_LIT: Record<AccuracyBand, number> = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
};

const LABEL: Record<AccuracyBand, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export function AccuracyIndicator({ accuracy }: { accuracy: number | null }) {
  const band = accuracyBand(accuracy);
  const lit = BARS_LIT[band];

  return (
    <div className="accuracy">
      <div className="accuracy__bars" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="accuracy__bar"
            data-on={i < lit ? 'true' : 'false'}
          />
        ))}
      </div>
      <span className={`accuracy__text band-${band}`}>
        {LABEL[band]} · {formatMeters(accuracy)}
      </span>
    </div>
  );
}
