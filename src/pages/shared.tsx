import type { ReactNode } from 'react';

import type { PageId } from './pageModel';
import { tileToCode, type FuValue, type HanFuTableRow, type PointResult, type ScoreMode, type Tile, type TileCode, type Wind } from '../domain';

export interface PageProps {
  navigate: (page: PageId) => void;
}

export const WIND_LABELS: Record<Wind, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
};

export const MODE_LABELS: Record<ScoreMode, string> = {
  yonma: '四麻',
  sanma: '三麻',
};

export const FU_OPTIONS: FuValue[] = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

export function tileCodes(tiles: readonly Tile[]): TileCode[] {
  return tiles.map(tileToCode);
}

export function formatHan(value: number | string): string {
  return typeof value === 'number' ? `${value}番` : value;
}

export function formatFu(value: number | undefined): string {
  return value ? `${value}符` : '-';
}

export function formatPoints(value: number | undefined): string {
  return value === undefined ? '-' : `${value.toLocaleString('zh-CN')} 点`;
}

export function formatLimit(result: Pick<PointResult, 'yaku_level_label'> | { yaku_level_label?: string | null }): string {
  return result.yaku_level_label ?? '普通手';
}

export function formatWinMethod(value: 'ron' | 'tsumo'): string {
  return value === 'tsumo' ? '自摸' : '荣和';
}

export function formatShanten(value: number): string {
  if (value < 0) return '和牌';
  if (value === 0) return '听牌';
  return `${value} 向听`;
}

export function formatTableLimit(row: HanFuTableRow): ReactNode {
  if (!row.legal) return '通常不成立';
  return row.yaku_level_label ?? '普通';
}

export function formatComebackAnswer(value: FuValue | 'impossible' | undefined): string {
  if (!value || value === 'impossible') return '不可逆转';
  return `${value}符`;
}
