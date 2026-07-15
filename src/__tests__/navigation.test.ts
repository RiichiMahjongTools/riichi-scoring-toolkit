import { describe, expect, it } from 'vitest';

import {
  APP_SECTIONS,
  defaultPageForSection,
  resolvePageFromHash,
  sectionForPage,
} from '../pages/pageModel';

describe('app navigation model', () => {
  it('maps every primary page into the four expected sections', () => {
    expect(APP_SECTIONS.map((section) => ({
      id: section.id,
      pages: section.tabs.map((tab) => tab.page),
    }))).toEqual([
      { id: 'score', pages: ['quick-score', 'han-fu-calculator', 'legacy-score'] },
      { id: 'practice', pages: ['fu-practice', 'point-practice', 'chinitsu', 'comeback'] },
      { id: 'reference', pages: ['yaku-list', 'help-fu', 'help-points', 'han-fu-table'] },
      { id: 'tools', pages: ['table-records', 'hand-recognition'] },
    ]);

    for (const section of APP_SECTIONS) {
      for (const tab of section.tabs) {
        expect(sectionForPage(tab.page)?.id).toBe(section.id);
      }
    }
    expect(sectionForPage('contact')).toBeUndefined();
  });

  it('uses the declared default page for each bottom section', () => {
    expect(defaultPageForSection('score')).toBe('quick-score');
    expect(defaultPageForSection('practice')).toBe('fu-practice');
    expect(defaultPageForSection('reference')).toBe('yaku-list');
    expect(defaultPageForSection('tools')).toBe('table-records');
  });

  it('normalizes old home, empty and unknown routes without adding history', () => {
    expect(resolvePageFromHash('')).toEqual({ page: 'quick-score', canonicalHash: '#/quick-score' });
    expect(resolvePageFromHash('#/home')).toEqual({ page: 'quick-score', canonicalHash: '#/quick-score' });
    expect(resolvePageFromHash('#/missing')).toEqual({ page: 'quick-score', canonicalHash: '#/quick-score' });
    expect(resolvePageFromHash('#/home?contact=1')).toEqual({ page: 'contact', canonicalHash: '#/contact' });
    expect(resolvePageFromHash('#/yaku-detail')).toEqual({ page: 'yaku-list', canonicalHash: '#/yaku-list' });
  });

  it('preserves known page queries so recognition imports can consume them', () => {
    expect(resolvePageFromHash('#/quick-score?tiles=m1%2Cm2')).toEqual({ page: 'quick-score' });
  });
});
