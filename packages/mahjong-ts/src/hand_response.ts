import type { FuDetail } from "./fu";
import type { ScoresResult, ScoreValue } from "./scores";
import type { Yaku } from "./yaku";

export class HandResponse<T extends ScoreValue = ScoreValue> {
  cost: ScoresResult<T> | null;
  han: number | null;
  fu: number | null;
  fu_details: FuDetail[] | null;
  yaku: Yaku[] | null;
  error: string | null;
  is_open_hand: boolean;

  constructor(params: {
    cost?: ScoresResult<T> | null;
    han?: number | null;
    fu?: number | null;
    yaku?: Iterable<Yaku> | null;
    error?: string | null;
    fu_details?: FuDetail[] | null;
    is_open_hand?: boolean;
  } = {}) {
    this.cost = params.cost ?? null;
    this.han = params.han ?? null;
    this.fu = params.fu ?? null;
    this.error = params.error ?? null;
    this.is_open_hand = params.is_open_hand ?? false;
    this.fu_details = params.fu_details && params.fu_details.length > 0
      ? [...params.fu_details].sort((a, b) => b.fu - a.fu)
      : null;
    this.yaku = params.yaku ? [...params.yaku].sort((a, b) => a.yaku_id - b.yaku_id) : null;
  }

  toString(): string {
    if (this.error) {
      return this.error;
    }
    return `${this.han} han, ${this.fu} fu`;
  }
}
