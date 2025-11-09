export const HAZARD_COLORS = {
  fire: '#dc2626',
  flood: '#2563eb',
  storm: '#6366f1',
  tornado: '#0f172a',
  earthquake: '#ca8a04',
};

export default function HazardLegend() {
  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <strong>Hazard legend</strong>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {Object.entries(HAZARD_COLORS).map(([type, color]) => (
          <li key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'capitalize' }}>
            <span
              style={{
                width: '1.1rem',
                height: '1.1rem',
                background: color,
                display: 'inline-block',
                borderRadius: '999px',
              }}
              aria-hidden="true"
            ></span>
            {type}
          </li>
        ))}
      </ul>
    </div>
  );
}
