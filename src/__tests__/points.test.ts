import { describe, expect, it } from 'vitest';
import {
  buildHanFuTable,
  calculatePoint,
  getLegalFuOptions,
  getLegalRonFuOptions,
  getLimitClass,
  isLegalHanFu,
} from '../domain/points';

describe('han/fu point calculation', () => {
  it('matches the visible 1 han 30 fu lookup row', () => {
    expect(calculatePoint({ han: 1, fu: 30, isDealer: true, winMethod: 'ron' }).payments.ron).toBe(1500);
    expect(calculatePoint({ han: 1, fu: 30, isDealer: true, winMethod: 'tsumo' }).payments.tsumoAllPays).toBe(500);

    const nonDealerTsumo = calculatePoint({ han: 1, fu: 30, isDealer: false, winMethod: 'tsumo' });
    expect(nonDealerTsumo.payments.tsumoNonDealerPays).toBe(300);
    expect(nonDealerTsumo.payments.tsumoDealerPays).toBe(500);
    expect(calculatePoint({ han: 1, fu: 30, isDealer: false, winMethod: 'ron' }).payments.ron).toBe(1000);
  });

  it('classifies limit hands', () => {
    expect(getLimitClass(3, 70).limit).toBe('mangan');
    expect(getLimitClass(4, 40).limit).toBe('mangan');
    expect(getLimitClass(6, 30).limit).toBe('haneman');
    expect(getLimitClass(8, 30).limit).toBe('baiman');
    expect(getLimitClass(11, 30).limit).toBe('sanbaiman');
    expect(getLimitClass(13, 30).limit).toBe('yakuman');
  });

  it('tracks legal fu options for lookup controls', () => {
    expect(isLegalHanFu(1, 20)).toBe(false);
    expect(isLegalHanFu(1, 25)).toBe(false);
    expect(isLegalHanFu(2, 20)).toBe(true);
    expect(isLegalHanFu(2, 25)).toBe(true);
    expect(getLegalFuOptions(1)).toEqual([30, 40, 50, 60, 70, 80, 90, 100, 110]);
    expect(getLegalRonFuOptions(2)).not.toContain(20);
    expect(getLegalRonFuOptions(2)).toContain(25);
  });

  it('builds rows covering 1 through 13 han', () => {
    const table = buildHanFuTable();
    expect(new Set(table.map((row) => row.han)).size).toBe(13);
    expect(table.some((row) => row.han === 13 && row.limit === 'yakuman')).toBe(true);
  });
});
