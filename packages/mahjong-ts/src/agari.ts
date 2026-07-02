export class Agari {
  static is_agari(tiles_34: ArrayLike<number>, open_sets_34: ArrayLike<number>[] | null = null): boolean {
    let tiles: number[];
    if (open_sets_34 && open_sets_34.length > 0) {
      tiles = Array.from({ length: 34 }, (_, i) => tiles_34[i] ?? 0);
      for (const meld of open_sets_34) {
        tiles[meld[0]] -= 1;
        tiles[meld[1]] -= 1;
        tiles[meld[2]] -= 1;
        if (meld.length > 3) {
          tiles[meld[3]] -= 1;
        }
      }
    } else {
      tiles = Array.from({ length: 34 }, (_, i) => tiles_34[i] ?? 0);
    }

    const j =
      (1 << tiles[27]) |
      (1 << tiles[28]) |
      (1 << tiles[29]) |
      (1 << tiles[30]) |
      (1 << tiles[31]) |
      (1 << tiles[32]) |
      (1 << tiles[33]);

    if (j >= 0x10) {
      return false;
    }

    if (
      (j & 3) === 2 &&
      tiles[0] *
        tiles[8] *
        tiles[9] *
        tiles[17] *
        tiles[18] *
        tiles[26] *
        tiles[27] *
        tiles[28] *
        tiles[29] *
        tiles[30] *
        tiles[31] *
        tiles[32] *
        tiles[33] ===
        2
    ) {
      return true;
    }

    if (!(j & 10) && tiles.filter((x) => x === 2).length === 7) {
      return true;
    }

    if (j & 2) {
      return false;
    }

    const n00 = tiles[0] + tiles[3] + tiles[6];
    const n01 = tiles[1] + tiles[4] + tiles[7];
    const n02 = tiles[2] + tiles[5] + tiles[8];

    const n10 = tiles[9] + tiles[12] + tiles[15];
    const n11 = tiles[10] + tiles[13] + tiles[16];
    const n12 = tiles[11] + tiles[14] + tiles[17];

    const n20 = tiles[18] + tiles[21] + tiles[24];
    const n21 = tiles[19] + tiles[22] + tiles[25];
    const n22 = tiles[20] + tiles[23] + tiles[26];

    const n0 = (n00 + n01 + n02) % 3;
    if (n0 === 1) {
      return false;
    }

    const n1 = (n10 + n11 + n12) % 3;
    if (n1 === 1) {
      return false;
    }

    const n2 = (n20 + n21 + n22) % 3;
    if (n2 === 1) {
      return false;
    }

    const pairCandidates =
      Number(n0 === 2) +
      Number(n1 === 2) +
      Number(n2 === 2) +
      Number(tiles[27] === 2) +
      Number(tiles[28] === 2) +
      Number(tiles[29] === 2) +
      Number(tiles[30] === 2) +
      Number(tiles[31] === 2) +
      Number(tiles[32] === 2) +
      Number(tiles[33] === 2);
    if (pairCandidates !== 1) {
      return false;
    }

    const nn0 = (n00 * 1 + n01 * 2) % 3;
    const m0 = Agari._to_meld(tiles, 0);
    const nn1 = (n10 * 1 + n11 * 2) % 3;
    const m1 = Agari._to_meld(tiles, 9);
    const nn2 = (n20 * 1 + n21 * 2) % 3;
    const m2 = Agari._to_meld(tiles, 18);

    if (j & 4) {
      return !(n0 | nn0 | n1 | nn1 | n2 | nn2) && Agari._is_mentsu(m0) && Agari._is_mentsu(m1) && Agari._is_mentsu(m2);
    }

    if (n0 === 2) {
      return !(n1 | nn1 | n2 | nn2) && Agari._is_mentsu(m1) && Agari._is_mentsu(m2) && Agari._is_atama_mentsu(nn0, m0);
    }

    if (n1 === 2) {
      return !(n2 | nn2 | n0 | nn0) && Agari._is_mentsu(m2) && Agari._is_mentsu(m0) && Agari._is_atama_mentsu(nn1, m1);
    }

    return !(n0 | nn0 | n1 | nn1) && Agari._is_mentsu(m0) && Agari._is_mentsu(m1) && Agari._is_atama_mentsu(nn2, m2);
  }

  static _is_mentsu(m: number): boolean {
    let a = m & 7;
    let b = 0;
    let c = 0;
    if (a === 1 || a === 4) {
      b = 1;
      c = 1;
    } else if (a === 2) {
      b = 2;
      c = 2;
    }
    m >>= 3;
    a = (m & 7) - b;
    if (a < 0) {
      return false;
    }

    for (let i = 0; i < 6; i += 1) {
      b = c;
      c = 0;
      if (a === 1 || a === 4) {
        b += 1;
        c += 1;
      } else if (a === 2) {
        b += 2;
        c += 2;
      }
      m >>= 3;
      a = (m & 7) - b;
      if (a < 0) {
        return false;
      }
    }

    m >>= 3;
    a = (m & 7) - c;
    return a === 0 || a === 3;
  }

  static _is_atama_mentsu(nn: number, m: number): boolean {
    if (nn === 0) {
      if ((m & (7 << 6)) >= 2 << 6 && Agari._is_mentsu(m - (2 << 6))) return true;
      if ((m & (7 << 15)) >= 2 << 15 && Agari._is_mentsu(m - (2 << 15))) return true;
      if ((m & (7 << 24)) >= 2 << 24 && Agari._is_mentsu(m - (2 << 24))) return true;
    } else if (nn === 1) {
      if ((m & (7 << 3)) >= 2 << 3 && Agari._is_mentsu(m - (2 << 3))) return true;
      if ((m & (7 << 12)) >= 2 << 12 && Agari._is_mentsu(m - (2 << 12))) return true;
      if ((m & (7 << 21)) >= 2 << 21 && Agari._is_mentsu(m - (2 << 21))) return true;
    } else if (nn === 2) {
      if ((m & 7) >= 2 && Agari._is_mentsu(m - 2)) return true;
      if ((m & (7 << 9)) >= 2 << 9 && Agari._is_mentsu(m - (2 << 9))) return true;
      if ((m & (7 << 18)) >= 2 << 18 && Agari._is_mentsu(m - (2 << 18))) return true;
    }
    return false;
  }

  static _to_meld(tiles: ArrayLike<number>, d: number): number {
    return (
      (tiles[d] ?? 0) |
      ((tiles[d + 1] ?? 0) << 3) |
      ((tiles[d + 2] ?? 0) << 6) |
      ((tiles[d + 3] ?? 0) << 9) |
      ((tiles[d + 4] ?? 0) << 12) |
      ((tiles[d + 5] ?? 0) << 15) |
      ((tiles[d + 6] ?? 0) << 18) |
      ((tiles[d + 7] ?? 0) << 21) |
      ((tiles[d + 8] ?? 0) << 24)
    );
  }
}
