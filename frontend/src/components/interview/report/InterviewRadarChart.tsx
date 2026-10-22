import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RadarPoint } from "@/components/interview/report/types";

type InterviewRadarChartProps = {
  points: RadarPoint[];
};

export default function InterviewRadarChart({
  points,
}: InterviewRadarChartProps) {
  const [hovered, setHovered] = useState<{
    label: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  if (points.length === 0) {
    return (
      <div className="mx-auto flex min-h-[180px] w-full max-w-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-5 text-center text-xs leading-6 text-muted-foreground">
        <span className="font-medium">本场未记录分维评分</span>
        <span>仍可查看逐题得分与反馈。新练习会记录准确性、完整性、分析取舍和表达四个维度。</span>
      </div>
    );
  }

  const size = 260;
  const center = size / 2;
  const radius = 78;
  const levels = [0.25, 0.5, 0.75, 1];
  const pointsOnChart = points.map((item, index) => {
    const angle = (Math.PI * 2 * index) / points.length - Math.PI / 2;
    const r = (item.value / 100) * radius;
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  });
  const polygon = pointsOnChart.map((point) => point.join(",")).join(" ");
  const labelRadius = radius + 22;
  const hoverPoints = points.map((item, index) => {
    const angle = (Math.PI * 2 * index) / points.length - Math.PI / 2;
    const r = (item.value / 100) * radius;
    return {
      ...item,
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      labelX: center + Math.cos(angle) * labelRadius,
      labelY: center + Math.sin(angle) * labelRadius,
    };
  });

  return (
    <div className="relative w-fit mx-auto">
      <motion.svg
        width={size}
        height={size}
        className="mx-auto"
        onMouseLeave={() => setHovered(null)}
        initial={{ opacity: 0, scale: 0.94, filter: "blur(3px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {levels.map((level) => (
          <polygon
            key={level}
            points={points
              .map((_, index) => {
                const angle =
                  (Math.PI * 2 * index) / points.length - Math.PI / 2;
                const r = radius * level;
                return [
                  center + Math.cos(angle) * r,
                  center + Math.sin(angle) * r,
                ].join(",");
              })
              .join(" ")}
            fill="none"
            stroke="#dce3f3"
          />
        ))}
        <motion.polygon
          points={polygon}
          fill="#4d5ac7"
          fillOpacity={hovered ? "0.28" : "0.18"}
          stroke="#4d5ac7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
        />
        {hoverPoints.map((item) => (
          <g key={item.label}>
            <motion.circle
              cx={item.x}
              cy={item.y}
              r={5}
              fill="#4d5ac7"
              opacity={hovered?.label === item.label ? 0.9 : 0.6}
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{
                opacity: hovered?.label === item.label ? 0.9 : 0.6,
                scale: 1,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
            <circle
              cx={item.x}
              cy={item.y}
              r={12}
              fill="transparent"
              onMouseEnter={() =>
                setHovered({
                  label: item.label,
                  value: item.value,
                  x: item.x,
                  y: item.y,
                })
              }
              onMouseMove={() =>
                setHovered({
                  label: item.label,
                  value: item.value,
                  x: item.x,
                  y: item.y,
                })
              }
            />
          </g>
        ))}
        {hoverPoints.map((item) => (
          <text
            key={item.label}
            x={item.labelX}
            y={item.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="#60708b"
          >
            {item.label}
          </text>
        ))}
      </motion.svg>
      <AnimatePresence>
        {hovered ? (
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-sheet px-3 py-1 text-xs text-foreground/85 shadow-sm"
            style={{ left: hovered.x, top: hovered.y - 10 }}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {hovered.label}：{hovered.value}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
