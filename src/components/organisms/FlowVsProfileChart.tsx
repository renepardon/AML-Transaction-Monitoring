import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatChfRounded } from '@/lib/format';
import { useClientMonthlySeries } from '@/stores/selectors/cases';

const config = {
  inflow: { label: 'Inflow', color: 'var(--chart-1)' },
  outflow: { label: 'Outflow', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat('de-CH', { notation: 'compact', maximumFractionDigits: 0 });

export interface FlowVsProfileChartProps {
  clientId: string;
}

export function FlowVsProfileChart({ clientId }: FlowVsProfileChartProps) {
  const data = useClientMonthlySeries(clientId);
  const first = data[0];
  return (
    <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-base">Flow vs profile</CardTitle>
        <CardDescription>
          Monthly inflow and outflow. Dashed lines: expected inflow{' '}
          {first ? formatChfRounded(first.expectedInflow * 100) : ''} and outflow{' '}
          {first ? formatChfRounded(first.expectedOutflow * 100) : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No transactions.</p>
        ) : (
          <ChartContainer
            config={config}
            className="h-56 w-full"
            aria-label="Monthly inflow and outflow compared with the expected profile"
          >
            <BarChart data={data} margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.4} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) => compact.format(v)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(v, name) =>
                      `${config[name as keyof typeof config]?.label ?? name}: ${formatChfRounded(Number(v) * 100)}`
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="inflow" fill="var(--color-inflow)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="outflow" fill="var(--color-outflow)" radius={[6, 6, 0, 0]} />
              {first && (
                <ReferenceLine
                  y={first.expectedInflow}
                  stroke="var(--color-inflow)"
                  strokeDasharray="5 4"
                />
              )}
              {first && (
                <ReferenceLine
                  y={first.expectedOutflow}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="2 4"
                />
              )}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
