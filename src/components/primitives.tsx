import type { ReactNode } from 'react';

export function Panel({
  label,
  tag,
  children,
}: {
  label: string;
  tag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel__head">
        <span className="panel__label">{label}</span>
        {tag !== undefined && <span className="panel__tag">{tag}</span>}
      </div>
      {children}
    </section>
  );
}

export function Readout({
  label,
  value,
  signal = false,
}: {
  label: string;
  value: ReactNode;
  signal?: boolean;
}) {
  return (
    <div className="readout">
      <span className="readout__key">{label}</span>
      <span className={`readout__val${signal ? ' readout__val--signal' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="kv">
      <span className="kv__k">{k}</span>
      <span className="kv__v">{v}</span>
    </div>
  );
}
