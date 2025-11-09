export const HAZARD_COLORS = {
  fire: '#dc2626',
  flood: '#2563eb',
  storm: '#6366f1',
  tornado: '#0f172a',
  earthquake: '#ca8a04',
};

export default function HazardLegend() {
  return (
    <div>
      <strong>Hazard legend</strong>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.entries(HAZARD_COLORS).map(([type, color]) => (
          <li key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '1rem', height: '1rem', background: color, display: 'inline-block', borderRadius: '50%' }} aria-hidden="true"></span>
            {type}
          </li>
        ))}
      </ul>
    </div>
  );
}
