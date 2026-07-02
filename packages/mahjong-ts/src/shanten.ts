import { TERMINAL_AND_HONOR_INDICES } from "./constants";

export class Shanten {
  static TENPAI_STATE = 0;
  static AGARI_STATE = -1;

  static calculate_shanten(
    tiles_34: ArrayLike<number>,
    use_chiitoitsu = true,
    use_kokushi = true,
    is_three_player = false
  ): number {
    const countOfTiles = Array.from({ length: 34 }, (_, i) => tiles_34[i] ?? 0).reduce((a, b) => a + b, 0);
    const shantenResults = [new RegularShanten(tiles_34).calculate(countOfTiles, is_three_player)];
    if (countOfTiles >= 13) {
      if (use_chiitoitsu) {
        shantenResults.push(Shanten.calculate_shanten_for_chiitoitsu_hand(tiles_34));
      }
      if (use_kokushi) {
        shantenResults.push(Shanten.calculate_shanten_for_kokushi_hand(tiles_34));
      }
    }
    return Math.min(...shantenResults);
  }

  static calculate_shanten_for_chiitoitsu_hand(tiles_34: ArrayLike<number>): number {
    let pairs = 0;
    let kinds = 0;
    for (let i = 0; i < 34; i += 1) {
      const count = tiles_34[i] ?? 0;
      if (count >= 2) pairs += 1;
      if (count >= 1) kinds += 1;
    }
    if (pairs === 7) {
      return Shanten.AGARI_STATE;
    }
    return 6 - pairs + (kinds < 7 ? 7 - kinds : 0);
  }

  static calculate_shanten_for_kokushi_hand(tiles_34: ArrayLike<number>): number {
    let completedTerminals = 0;
    let terminals = 0;
    for (const i of TERMINAL_AND_HONOR_INDICES) {
      completedTerminals += (tiles_34[i] ?? 0) >= 2 ? 1 : 0;
      terminals += (tiles_34[i] ?? 0) !== 0 ? 1 : 0;
    }
    return 13 - terminals - (completedTerminals ? 1 : 0);
  }

  static calculate_shanten_for_regular_hand(tiles_34: ArrayLike<number>, is_three_player = false): number {
    const countOfTiles = Array.from({ length: 34 }, (_, i) => tiles_34[i] ?? 0).reduce((a, b) => a + b, 0);
    return new RegularShanten(tiles_34).calculate(countOfTiles, is_three_player);
  }
}

class RegularShanten {
  private _tiles: number[];
  private _number_melds = 0;
  private _number_tatsu = 0;
  private _number_pairs = 0;
  private _number_jidahai = 0;
  private _flag_four_copies = 0;
  private _flag_isolated_tiles = 0;
  private _min_shanten = 8;

  constructor(tiles_34: ArrayLike<number>) {
    this._tiles = Array.from({ length: 34 }, (_, i) => tiles_34[i] ?? 0);
  }

  calculate(count_of_tiles: number, is_three_player: boolean): number {
    if (is_three_player && this._tiles.slice(1, 8).some((x) => x !== 0)) {
      throw new Error("Invalid tile for three player");
    }
    if (count_of_tiles > 14) {
      throw new Error(`Too many tiles = ${count_of_tiles}`);
    }
    if (count_of_tiles % 3 === 0) {
      throw new Error(`Invalid tile count = ${count_of_tiles}. Valid counts: 1, 2, 4, 5, 7, 8, 10, 11, 13, 14.`);
    }

    this._remove_honor_and_terminal_man_tiles(count_of_tiles, is_three_player);
    const initMentsu = Math.floor((14 - count_of_tiles) / 3);
    this._scan(initMentsu, is_three_player);
    return this._min_shanten;
  }

  private _scan(init_mentsu: number, is_three_player: boolean): void {
    for (let i = 0; i < 27; i += 1) {
      this._flag_four_copies |= (this._tiles[i] === 4 ? 1 : 0) << i;
    }
    this._number_melds += init_mentsu;
    this._run(is_three_player ? 9 : 0);
  }

  private _run(depth: number): void {
    if (this._min_shanten === Shanten.AGARI_STATE) {
      return;
    }

    while (!this._tiles[depth]) {
      depth += 1;
      if (depth >= 27) {
        break;
      }
    }

    if (depth >= 27) {
      this._update_result();
      return;
    }

    let i = depth;
    if (i > 8) i -= 9;
    if (i > 8) i -= 9;

    if (this._tiles[depth] === 4) {
      this._increase_set(depth);
      if (i < 7 && this._tiles[depth + 2]) {
        if (this._tiles[depth + 1]) {
          this._increase_syuntsu(depth);
          this._run(depth + 1);
          this._decrease_syuntsu(depth);
        }
        this._increase_tatsu_second(depth);
        this._run(depth + 1);
        this._decrease_tatsu_second(depth);
      }
      if (i < 8 && this._tiles[depth + 1]) {
        this._increase_tatsu_first(depth);
        this._run(depth + 1);
        this._decrease_tatsu_first(depth);
      }
      this._increase_isolated_tile(depth);
      this._run(depth + 1);
      this._decrease_isolated_tile(depth);
      this._decrease_set(depth);
      this._increase_pair(depth);
      if (i < 7 && this._tiles[depth + 2]) {
        if (this._tiles[depth + 1]) {
          this._increase_syuntsu(depth);
          this._run(depth);
          this._decrease_syuntsu(depth);
        }
        this._increase_tatsu_second(depth);
        this._run(depth + 1);
        this._decrease_tatsu_second(depth);
      }
      if (i < 8 && this._tiles[depth + 1]) {
        this._increase_tatsu_first(depth);
        this._run(depth + 1);
        this._decrease_tatsu_first(depth);
      }
      this._decrease_pair(depth);
    }

    if (this._tiles[depth] === 3) {
      this._increase_set(depth);
      this._run(depth + 1);
      this._decrease_set(depth);
      this._increase_pair(depth);

      if (i < 7 && this._tiles[depth + 1] && this._tiles[depth + 2]) {
        this._increase_syuntsu(depth);
        this._run(depth + 1);
        this._decrease_syuntsu(depth);
      } else {
        if (i < 7 && this._tiles[depth + 2]) {
          this._increase_tatsu_second(depth);
          this._run(depth + 1);
          this._decrease_tatsu_second(depth);
        }
        if (i < 8 && this._tiles[depth + 1]) {
          this._increase_tatsu_first(depth);
          this._run(depth + 1);
          this._decrease_tatsu_first(depth);
        }
      }
      this._decrease_pair(depth);

      if (i < 7 && this._tiles[depth + 2] >= 2 && this._tiles[depth + 1] >= 2) {
        this._increase_syuntsu(depth);
        this._increase_syuntsu(depth);
        this._run(depth);
        this._decrease_syuntsu(depth);
        this._decrease_syuntsu(depth);
      }
    }

    if (this._tiles[depth] === 2) {
      this._increase_pair(depth);
      this._run(depth + 1);
      this._decrease_pair(depth);
      if (i < 7 && this._tiles[depth + 2] && this._tiles[depth + 1]) {
        this._increase_syuntsu(depth);
        this._run(depth);
        this._decrease_syuntsu(depth);
      }
    }

    if (this._tiles[depth] === 1) {
      if (i < 6 && this._tiles[depth + 1] === 1 && this._tiles[depth + 2] && this._tiles[depth + 3] !== 4) {
        this._increase_syuntsu(depth);
        this._run(depth + 2);
        this._decrease_syuntsu(depth);
      } else {
        this._increase_isolated_tile(depth);
        this._run(depth + 1);
        this._decrease_isolated_tile(depth);

        if (i < 7 && this._tiles[depth + 2]) {
          if (this._tiles[depth + 1]) {
            this._increase_syuntsu(depth);
            this._run(depth + 1);
            this._decrease_syuntsu(depth);
          }
          this._increase_tatsu_second(depth);
          this._run(depth + 1);
          this._decrease_tatsu_second(depth);
        }
        if (i < 8 && this._tiles[depth + 1]) {
          this._increase_tatsu_first(depth);
          this._run(depth + 1);
          this._decrease_tatsu_first(depth);
        }
      }
    }
  }

  private _update_result(): void {
    let retShanten = 8 - this._number_melds * 2 - this._number_tatsu - this._number_pairs;
    let nMentsuKouho = this._number_melds + this._number_tatsu;
    if (this._number_pairs) {
      nMentsuKouho += this._number_pairs - 1;
    } else if (
      this._flag_four_copies &&
      this._flag_isolated_tiles &&
      (this._flag_four_copies | this._flag_isolated_tiles) === this._flag_four_copies
    ) {
      retShanten += 1;
    }

    if (nMentsuKouho > 4) {
      retShanten += nMentsuKouho - 4;
    }
    if (retShanten !== Shanten.AGARI_STATE && retShanten < this._number_jidahai) {
      retShanten = this._number_jidahai;
    }
    this._min_shanten = Math.min(this._min_shanten, retShanten);
  }

  private _increase_set(k: number): void {
    this._tiles[k] -= 3;
    this._number_melds += 1;
  }

  private _decrease_set(k: number): void {
    this._tiles[k] += 3;
    this._number_melds -= 1;
  }

  private _increase_pair(k: number): void {
    this._tiles[k] -= 2;
    this._number_pairs += 1;
  }

  private _decrease_pair(k: number): void {
    this._tiles[k] += 2;
    this._number_pairs -= 1;
  }

  private _increase_syuntsu(k: number): void {
    this._tiles[k] -= 1;
    this._tiles[k + 1] -= 1;
    this._tiles[k + 2] -= 1;
    this._number_melds += 1;
  }

  private _decrease_syuntsu(k: number): void {
    this._tiles[k] += 1;
    this._tiles[k + 1] += 1;
    this._tiles[k + 2] += 1;
    this._number_melds -= 1;
  }

  private _increase_tatsu_first(k: number): void {
    this._tiles[k] -= 1;
    this._tiles[k + 1] -= 1;
    this._number_tatsu += 1;
  }

  private _decrease_tatsu_first(k: number): void {
    this._tiles[k] += 1;
    this._tiles[k + 1] += 1;
    this._number_tatsu -= 1;
  }

  private _increase_tatsu_second(k: number): void {
    this._tiles[k] -= 1;
    this._tiles[k + 2] -= 1;
    this._number_tatsu += 1;
  }

  private _decrease_tatsu_second(k: number): void {
    this._tiles[k] += 1;
    this._tiles[k + 2] += 1;
    this._number_tatsu -= 1;
  }

  private _increase_isolated_tile(k: number): void {
    this._tiles[k] -= 1;
    this._flag_isolated_tiles |= 1 << k;
  }

  private _decrease_isolated_tile(k: number): void {
    this._tiles[k] += 1;
    this._flag_isolated_tiles &= ~(1 << k);
  }

  private _remove_honor_and_terminal_man_tiles(nc: number, is_three_player: boolean): void {
    let fourCopies = 0;
    let isolated = 0;
    const indices = [27, 28, 29, 30, 31, 32, 33];
    if (is_three_player) {
      indices.push(0, 8);
    }

    for (let flagPos = 0; flagPos < indices.length; flagPos += 1) {
      const i = indices[flagPos];
      if (this._tiles[i] === 4) {
        this._number_melds += 1;
        this._number_jidahai += 1;
        fourCopies |= 1 << flagPos;
        isolated |= 1 << flagPos;
      }
      if (this._tiles[i] === 3) {
        this._number_melds += 1;
      }
      if (this._tiles[i] === 2) {
        this._number_pairs += 1;
      }
      if (this._tiles[i] === 1) {
        isolated |= 1 << flagPos;
      }
    }

    if (this._number_jidahai && nc % 3 === 2) {
      this._number_jidahai -= 1;
    }
    if (isolated) {
      this._flag_isolated_tiles |= 1 << 27;
      if ((fourCopies | isolated) === fourCopies) {
        this._flag_four_copies |= 1 << 27;
      }
    }
  }
}
