import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const HAZARD_COLORS = {
  fire: '#dc2626',
  flood: '#2563eb',
  storm: '#6366f1',
  tornado: '#0f172a',
  earthquake: '#ca8a04',
};

export default function HazardLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hazard Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {Object.entries(HAZARD_COLORS).map(([type, color]) => (
            <li key={type} className="flex items-center gap-2 capitalize">
              <span
                style={{ backgroundColor: color }}
                className="w-4 h-4 rounded-full inline-block"
                aria-hidden="true"
              ></span>
              {type}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
