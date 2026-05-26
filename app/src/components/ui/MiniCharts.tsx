import Svg, { Rect, Path } from 'react-native-svg';

type BarsProps = { data: number[]; color: string; height?: number; width?: number };

export function MiniBars({ data, color, height = 60, width = 130 }: BarsProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const gap = 2;
  const bw = (width - gap * (data.length - 1)) / data.length;
  return (
    <Svg width={width} height={height}>
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * (height - 4));
        return (
          <Rect
            key={i}
            x={i * (bw + gap)}
            y={height - h}
            width={bw}
            height={h}
            rx={bw / 2}
            fill={color}
            opacity={0.85}
          />
        );
      })}
    </Svg>
  );
}

type WaveProps = { data: number[]; color: string; height?: number; width?: number };

export function MiniWave({ data, color, height = 60, width = 130 }: WaveProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const pts = data.map((v, i) => [i * step, height - 4 - (v / max) * (height - 8)] as const);
  let d = `M 0 ${height} L ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  d += ` L ${width} ${height} Z`;
  return (
    <Svg width={width} height={height}>
      <Path d={d} fill={color} opacity={0.85} />
    </Svg>
  );
}
