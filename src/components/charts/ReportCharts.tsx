"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getTheme } from "@/src/lib/emotionTheme";

const tooltipStyle = {
  background: "var(--emotion-surface, var(--bg-elevated))",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--emotion-text, var(--text-primary))",
};

export function FrequencyChart({
  data,
  emotions,
}: {
  data: Record<string, string | number>[];
  emotions: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(237,242,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        {emotions.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="emo"
            fill={getTheme(key).accentColor}
            radius={i === emotions.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data }: { data: Record<string, string | number | null>[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(237,242,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        <Line
          type="monotone"
          dataKey="positive"
          name="Positive / regulated mood"
          stroke="var(--accent-soft)"
          strokeWidth={3}
          dot={{ r: 4 }}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="difficult"
          name="Difficult mood signals"
          stroke="var(--accent-alert)"
          strokeWidth={3}
          dot={{ r: 4 }}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="scanConfidence"
          name="Average scan confidence"
          stroke="var(--emotion-accent,var(--accent-primary))"
          strokeWidth={3}
          dot={{ r: 4 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
