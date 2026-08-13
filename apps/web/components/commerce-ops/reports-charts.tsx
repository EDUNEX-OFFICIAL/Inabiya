'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { formatInr } from '@/lib/catalog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const STATUS_COLORS = [
  'var(--primary)',
  'var(--inabiya-mint, #b5ead7)',
  'var(--inabiya-yellow, #ffd166)',
  'var(--inabiya-lavender, #e8d5f5)',
  'var(--inabiya-sky, #d4eaf7)',
  'color-mix(in srgb, var(--primary) 55%, white)',
];

export function SalesTrendChart({
  daily,
  metric,
}: {
  daily: Array<{ date: string; orders: number; revenuePaise: number }>;
  metric: 'revenue' | 'orders';
}) {
  const data = daily.map((d) => ({
    date: d.date.slice(5), // MM-DD
    fullDate: d.date,
    revenueInr: d.revenuePaise / 100,
    revenuePaise: d.revenuePaise,
    orders: d.orders,
  }));

  const config = {
    revenueInr: { label: 'Revenue', color: 'var(--primary)' },
    orders: { label: 'Orders', color: 'var(--primary)' },
  } satisfies ChartConfig;

  const dataKey = metric === 'revenue' ? 'revenueInr' : 'orders';

  return (
    <ChartContainer config={config} className="aspect-auto h-[10.5rem] w-full sm:h-[12rem]">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={metric === 'revenue' ? 52 : 36}
          tickFormatter={(v) =>
            metric === 'revenue'
              ? `₹${Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : v}`
              : String(v)
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { fullDate?: string } | undefined;
                return row?.fullDate ?? '';
              }}
              formatter={(value, name) => {
                const n = typeof value === 'number' ? value : Number(value);
                if (name === 'revenueInr' || metric === 'revenue') {
                  return (
                    <div className="flex w-full justify-between gap-4">
                      <span className="text-[var(--muted-foreground)]">Revenue</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatInr(Math.round(n * 100))}
                      </span>
                    </div>
                  );
                }
                return (
                  <div className="flex w-full justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Orders</span>
                    <span className="font-mono font-medium tabular-nums">{n}</span>
                  </div>
                );
              }}
            />
          }
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={`var(--color-${dataKey})`}
          fill={`var(--color-${dataKey})`}
          fillOpacity={0.18}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function ProductsBarChart({
  rows,
}: {
  rows: Array<{ sku: string; title: string; units: number; revenuePaise: number }>;
}) {
  const data = rows.map((r) => ({
    name: r.title.length > 18 ? `${r.title.slice(0, 16)}…` : r.title,
    fullTitle: r.title,
    sku: r.sku,
    revenueInr: r.revenuePaise / 100,
    revenuePaise: r.revenuePaise,
    units: r.units,
  }));

  const config = {
    revenueInr: { label: 'Revenue', color: 'var(--primary)' },
  } satisfies ChartConfig;

  const height = Math.max(180, data.length * 36);

  return (
    <ChartContainer config={config} className="w-full" style={{ aspectRatio: 'auto', height }}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : v}`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as
                  { fullTitle?: string; sku?: string } | undefined;
                return row ? `${row.fullTitle} · ${row.sku}` : '';
              }}
              formatter={(value) => {
                const n = typeof value === 'number' ? value : Number(value);
                return (
                  <div className="flex w-full justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Revenue</span>
                    <span className="font-mono font-medium tabular-nums">
                      {formatInr(Math.round(n * 100))}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="revenueInr" fill="var(--color-revenueInr)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

export function InventoryBarChart({
  rows,
}: {
  rows: Array<{ sku: string; productTitle: string; available: number }>;
}) {
  const data = rows.slice(0, 12).map((r) => ({
    name: r.sku.length > 12 ? `${r.sku.slice(0, 10)}…` : r.sku,
    sku: r.sku,
    title: r.productTitle,
    available: r.available,
  }));

  const config = {
    available: { label: 'Available', color: 'var(--inabiya-yellow, #ffd166)' },
  } satisfies ChartConfig;

  const height = Math.max(160, data.length * 32);

  return (
    <ChartContainer config={config} className="w-full" style={{ aspectRatio: 'auto', height }}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={72} tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { title?: string; sku?: string } | undefined;
                return row ? `${row.title} · ${row.sku}` : '';
              }}
            />
          }
        />
        <Bar dataKey="available" fill="var(--color-available)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

export function ReturnsStatusChart({
  byStatus,
}: {
  byStatus: Array<{ status: string; count: number }>;
}) {
  const data = byStatus.map((s, i) => ({
    status: s.status,
    count: s.count,
    fill: STATUS_COLORS[i % STATUS_COLORS.length],
  }));

  const config = Object.fromEntries(
    data.map((d) => [d.status, { label: d.status, color: d.fill }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square max-h-[16rem] w-full max-w-[16rem]"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={48} strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.status} fill={d.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export function CouponsBarChart({
  rows,
}: {
  rows: Array<{ code: string; windowDiscountPaise: number; windowOrders: number }>;
}) {
  const data = rows.slice(0, 10).map((r) => ({
    code: r.code,
    discountInr: r.windowDiscountPaise / 100,
    discountPaise: r.windowDiscountPaise,
    orders: r.windowOrders,
  }));

  const config = {
    discountInr: { label: 'Discount', color: 'var(--primary)' },
  } satisfies ChartConfig;

  const height = Math.max(160, data.length * 32);

  return (
    <ChartContainer config={config} className="w-full" style={{ aspectRatio: 'auto', height }}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : v}`}
        />
        <YAxis type="category" dataKey="code" width={72} tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => {
                const n = typeof value === 'number' ? value : Number(value);
                return (
                  <div className="flex w-full justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Discount</span>
                    <span className="font-mono font-medium tabular-nums">
                      {formatInr(Math.round(n * 100))}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="discountInr" fill="var(--color-discountInr)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

export function FunnelBarChart({ events }: { events: Array<{ name: string; count: number }> }) {
  const data = events.map((e) => ({
    name: e.name.length > 22 ? `${e.name.slice(0, 20)}…` : e.name,
    fullName: e.name,
    count: e.count,
  }));

  const config = {
    count: { label: 'Events', color: 'var(--inabiya-lavender, #e8d5f5)' },
  } satisfies ChartConfig;

  const height = Math.max(180, data.length * 36);

  return (
    <ChartContainer config={config} className="w-full" style={{ aspectRatio: 'auto', height }}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { fullName?: string } | undefined;
                return row?.fullName ?? '';
              }}
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
