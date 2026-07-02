import { AlertCircle, Copy, Plus, RotateCcw, Share2, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ActionButton,
  Alert,
  Chip,
  MahjongTile,
  SegmentedControl,
  TileKeyboard,
  TileStrip,
} from '../components';
import {
  DEFAULT_SCORE_CONDITIONS,
  baseTileCode,
  calculateScoreOrEfficiency,
  countRedDora,
  expectedClosedTileCount,
  isTileCode,
  parseTileCodes,
  type MeldInput,
  type MeldKind,
  type ScoreComputation,
  type ScoreConditions,
  type ScoreMode,
  type ScoreResult,
  type TileCode,
  type Wind,
} from '../domain';
import {
  MODE_LABELS,
  WIND_LABELS,
  formatFu,
  formatHan,
  formatLimit,
  formatPoints,
  formatWinMethod,
} from './shared';

type KeyboardTarget = 'hand' | 'dora' | 'ura' | 'meld';
type QuickComputation = ScoreComputation | { kind: 'empty' };

const MELD_KIND_OPTIONS: Array<{ value: MeldKind; label: string; tiles: number }> = [
  { value: 'chi', label: '吃', tiles: 3 },
  { value: 'pon', label: '碰', tiles: 3 },
  { value: 'openKan', label: '明杠', tiles: 4 },
  { value: 'closedKan', label: '暗杠', tiles: 4 },
];

const MELD_KIND_LABELS: Record<MeldKind, string> = {
  chi: '吃',
  pon: '碰',
  openKan: '明杠',
  closedKan: '暗杠',
  addedKan: '加杠',
};

const WIND_OPTIONS: Array<{ value: Wind; label: string }> = [
  { value: 'east', label: '东' },
  { value: 'south', label: '南' },
  { value: 'west', label: '西' },
  { value: 'north', label: '北' },
];

const EXTRA_OPTIONS: Array<{ key: keyof ScoreConditions; label: string }> = [
  { key: 'riichi', label: '立直' },
  { key: 'ippatsu', label: '一发' },
  { key: 'haiteiOrHoutei', label: '海底' },
  { key: 'rinshan', label: '岭上' },
  { key: 'chankan', label: '抢杠' },
  { key: 'doubleRiichi', label: '双立直' },
];

function toTileCodes(values: string[]): TileCode[] {
  return values.filter(isTileCode);
}

function hasFourPhysicalCopies(tile: string, currentTiles: string[]) {
  if (!isTileCode(tile)) return true;
  const base = baseTileCode(tile);
  return currentTiles.filter((value) => isTileCode(value) && baseTileCode(value) === base).length >= 4;
}

function meldTileLimit(kind: MeldKind): number {
  return MELD_KIND_OPTIONS.find((option) => option.value === kind)?.tiles ?? 3;
}

function validateMeldDraft(kind: MeldKind, tiles: TileCode[], mode: ScoreMode): string {
  const expected = meldTileLimit(kind);
  if (mode === 'sanma' && kind === 'chi') return '三麻快速算分不支持吃牌';
  if (tiles.length !== expected) return `${MELD_KIND_LABELS[kind]}需要选择 ${expected} 枚牌`;

  const parsedTiles = parseTileCodes(tiles);
  const baseCodes = tiles.map(baseTileCode);
  const uniqueBaseCodes = new Set(baseCodes);

  if (kind === 'chi') {
    const [first] = parsedTiles;
    const ranks = parsedTiles.map((tile) => tile.rank).sort((a, b) => a - b);
    const isSequence =
      first.suit !== 'z' &&
      parsedTiles.every((tile) => tile.suit === first.suit) &&
      ranks[0] + 1 === ranks[1] &&
      ranks[1] + 1 === ranks[2];
    return isSequence ? '' : '吃牌必须是同一数牌花色的连续 3 枚';
  }

  return uniqueBaseCodes.size === 1 ? '' : `${MELD_KIND_LABELS[kind]}必须由相同牌组成`;
}

function keyboardTitle(target: KeyboardTarget): string {
  if (target === 'dora') return '录入宝牌指示牌';
  if (target === 'ura') return '录入里宝牌指示牌';
  if (target === 'meld') return '录入副露面子';
  return '录入手牌';
}

async function copyResult(text: string, onDone: (message: string) => void) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      onDone('结果已复制到剪贴板');
      return;
    }
  } catch {
    // Fall through to prompt fallback for WebViews with blocked clipboard writes.
  }

  window.prompt('复制结果', text);
  onDone('已打开复制文本');
}

export function QuickScorePage() {
  const [mode, setMode] = useState<ScoreMode>('yonma');
  const [handTiles, setHandTiles] = useState<TileCode[]>([]);
  const [melds, setMelds] = useState<MeldInput[]>([]);
  const [meldKind, setMeldKind] = useState<MeldKind>('chi');
  const [meldDraftTiles, setMeldDraftTiles] = useState<TileCode[]>([]);
  const [doraIndicators, setDoraIndicators] = useState<TileCode[]>([]);
  const [uraDoraIndicators, setUraDoraIndicators] = useState<TileCode[]>([]);
  const [roundWind, setRoundWind] = useState<Wind>('east');
  const [seatWind, setSeatWind] = useState<Wind>('south');
  const [honba, setHonba] = useState(0);
  const [northDoraCount, setNorthDoraCount] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [doubleWindPairTwoFu, setDoubleWindPairTwoFu] = useState(false);
  const [conditions, setConditions] = useState<ScoreConditions>({ ...DEFAULT_SCORE_CONDITIONS });
  const [keyboardTarget, setKeyboardTarget] = useState<KeyboardTarget | null>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const meldDraftError = validateMeldDraft(meldKind, meldDraftTiles, mode);
  const expectedClosedTiles = expectedClosedTileCount(melds.length);

  const computation = useMemo<QuickComputation>(() => {
    if (handTiles.length === 0) return { kind: 'empty' };

    try {
      return calculateScoreOrEfficiency({
        mode,
        handTiles: parseTileCodes(handTiles),
        melds,
        doraIndicators: parseTileCodes(doraIndicators),
        uraDoraIndicators: parseTileCodes(uraDoraIndicators),
        northDoraCount,
        roundWind,
        seatWind,
        honba,
        doubleWindPairTwoFu,
        conditions,
      });
    } catch (error) {
      return {
        kind: 'invalid',
        errors: [error instanceof Error ? error.message : '计算引擎返回异常，请调整手牌后重试'],
        warnings: [],
      };
    }
  }, [
    conditions,
    doraIndicators,
    doubleWindPairTwoFu,
    handTiles,
    honba,
    melds,
    mode,
    northDoraCount,
    roundWind,
    seatWind,
    uraDoraIndicators,
  ]);

  const keyboardTiles =
    keyboardTarget === 'dora'
      ? doraIndicators
      : keyboardTarget === 'ura'
        ? uraDoraIndicators
        : keyboardTarget === 'meld'
          ? meldDraftTiles
          : handTiles;

  const setKeyboardTiles = (tiles: string[]) => {
    const next = toTileCodes(tiles);
    if (keyboardTarget === 'dora') {
      setDoraIndicators(next);
      return;
    }
    if (keyboardTarget === 'ura') {
      setUraDoraIndicators(next);
      return;
    }
    if (keyboardTarget === 'meld') {
      setMeldDraftTiles(next);
      return;
    }
    setHandTiles(next);
  };

  const selectMode = (nextMode: ScoreMode) => {
    setMode(nextMode);
    if (nextMode === 'sanma' && meldKind === 'chi') setMeldKind('pon');
  };

  const addMeld = () => {
    if (meldDraftError || melds.length >= 4) return;
    setMelds((value) => [...value, { kind: meldKind, tiles: parseTileCodes(meldDraftTiles) }]);
    setMeldDraftTiles([]);
  };

  const reset = () => {
    setHandTiles([]);
    setMelds([]);
    setMeldDraftTiles([]);
    setDoraIndicators([]);
    setUraDoraIndicators([]);
    setRoundWind('east');
    setSeatWind('south');
    setHonba(0);
    setNorthDoraCount(0);
    setDoubleWindPairTwoFu(false);
    setConditions({ ...DEFAULT_SCORE_CONDITIONS });
    setCopyMessage('');
  };

  const toggleCondition = (key: keyof ScoreConditions) => {
    setConditions((value) => ({ ...value, [key]: !value[key] }));
  };

  const resultText = makeResultText(computation);
  const noYakuWarnings = computation.kind === 'score' && !computation.result.valid ? computation.result.warnings : [];
  const invalidErrors = computation.kind === 'invalid' ? computation.errors : [];

  return (
    <div className="mj-page-stack mj-quick-page">
      <div className="mj-quick-summary-grid">
        <QuickSummaryCard label="模式" value={MODE_LABELS[mode]} onClick={() => selectMode(mode === 'yonma' ? 'sanma' : 'yonma')} />
        <QuickSummaryCard
          label="和牌"
          tone="danger"
          value={conditions.tsumo ? '自摸' : '荣和'}
          onClick={() => setConditions((value) => ({ ...value, tsumo: !value.tsumo }))}
        />
        <QuickSummaryCard
          label="本场"
          tone="gold"
          value={`${honba}本场`}
          onClick={() => setHonba((value) => (value + 1) % 5)}
        />
      </div>

      <section className="mj-design-card mj-quick-hand-card">
        <header className="mj-design-card__header">
          <h2>手牌与副露</h2>
          <span>{handTiles.length}/{expectedClosedTiles}</span>
        </header>
        <div className="mj-quick-tile-row" aria-label="当前手牌">
          {handTiles.length > 0 ? (
            handTiles.map((tile, index) => (
              <MahjongTile
                key={`${tile}-${index}`}
                code={tile}
                size="sm"
                onClick={() => setHandTiles(handTiles.filter((_, currentIndex) => currentIndex !== index))}
              />
            ))
          ) : (
            <span className="mj-muted-line">未录入手牌</span>
          )}
        </div>

        {melds.length > 0 ? (
          <div className="mj-meld-list" aria-label="已录入副露面子">
            {melds.map((meld, index) => (
              <div key={`${meld.kind}-${index}`} className="mj-meld-row">
                <div className="mj-meld-row__content">
                  <strong>{MELD_KIND_LABELS[meld.kind]}</strong>
                  <TileStrip tileSize="sm" tiles={meld.tiles.map((tile) => tile.code)} />
                </div>
                <ActionButton
                  aria-label={`删除第 ${index + 1} 组副露`}
                  icon={<Trash2 aria-hidden="true" />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setMelds(melds.filter((_, currentIndex) => currentIndex !== index))}
                >
                  删除
                </ActionButton>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mj-quick-hand-actions">
          <ActionButton icon={<Plus aria-hidden="true" />} onClick={() => setKeyboardTarget('hand')}>
            手牌
          </ActionButton>
          <ActionButton className="mj-quick-white-action" icon={<Copy aria-hidden="true" />} variant="ghost" onClick={() => setKeyboardTarget('meld')}>
            副露
          </ActionButton>
          <ActionButton icon={<Sparkles aria-hidden="true" />} variant="gold" onClick={() => setKeyboardTarget('dora')}>
            宝牌/里宝
          </ActionButton>
        </div>

        {doraIndicators.length > 0 || uraDoraIndicators.length > 0 ? (
          <div className="mj-dora-compact">
            <button type="button" onClick={() => setKeyboardTarget('dora')}>
              <span>宝牌</span>
              <TileStrip emptyLabel="无" maxSlots={5} tileSize="sm" tiles={doraIndicators} />
            </button>
            <button type="button" onClick={() => setKeyboardTarget('ura')}>
              <span>里宝牌</span>
              <TileStrip emptyLabel="无" maxSlots={5} tileSize="sm" tiles={uraDoraIndicators} />
            </button>
          </div>
        ) : null}

        {keyboardTarget === 'meld' || meldDraftTiles.length > 0 ? (
          <div className="mj-meld-editor">
            <SegmentedControl
              ariaLabel="选择副露面子类型"
              options={MELD_KIND_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                disabled: mode === 'sanma' && option.value === 'chi',
              }))}
              value={meldKind}
              onChange={(value) => {
                setMeldKind(value);
                setMeldDraftTiles([]);
              }}
            />
            <TileStrip
              emptyLabel={`选择${MELD_KIND_LABELS[meldKind]}所需牌`}
              maxSlots={meldTileLimit(meldKind)}
              tileSize="sm"
              tiles={meldDraftTiles}
              onRemove={(index) => setMeldDraftTiles(meldDraftTiles.filter((_, currentIndex) => currentIndex !== index))}
            />
            {meldDraftTiles.length > 0 && meldDraftError ? <Alert tone="warning">{meldDraftError}</Alert> : null}
            <ActionButton
              disabled={Boolean(meldDraftError) || melds.length >= 4}
              fullWidth
              icon={<Plus aria-hidden="true" />}
              variant="secondary"
              onClick={addMeld}
            >
              添加面子
            </ActionButton>
          </div>
        ) : null}
      </section>

      <section className="mj-design-card">
        <header className="mj-design-card__header">
          <h2>场况与规则</h2>
        </header>
        <RuleRow label="四麻 / 三麻">
          <Pill selected={mode === 'yonma'} onClick={() => selectMode('yonma')}>四麻</Pill>
          <Pill selected={mode === 'sanma'} onClick={() => selectMode('sanma')}>三麻</Pill>
        </RuleRow>
        <RuleRow label="场风">
          {WIND_OPTIONS.slice(0, 2).map((option) => (
            <Pill key={option.value} selected={roundWind === option.value} onClick={() => setRoundWind(option.value)}>
              {option.label}
            </Pill>
          ))}
        </RuleRow>
        <RuleRow label="自风">
          {WIND_OPTIONS.slice(1, 3).map((option) => (
            <Pill key={option.value} selected={seatWind === option.value} onClick={() => setSeatWind(option.value)}>
              {option.label}
            </Pill>
          ))}
        </RuleRow>
        <RuleRow label="三麻拔北">
          <Pill selected={northDoraCount === 0} onClick={() => setNorthDoraCount(0)}>关闭</Pill>
          <Pill selected={northDoraCount > 0} onClick={() => setNorthDoraCount(northDoraCount > 0 ? 0 : 1)}>开启</Pill>
        </RuleRow>
      </section>

      <section className="mj-design-card">
        <header className="mj-design-card__header">
          <h2>额外役与修正</h2>
        </header>
        <div className="mj-quick-chip-grid">
          {EXTRA_OPTIONS.map((option) => (
            <Chip key={option.key} selected={conditions[option.key]} onClick={() => toggleCondition(option.key)}>
              {option.label}
            </Chip>
          ))}
          <Chip onClick={() => setCopyMessage('流局满贯需要特殊规则确认，当前不会写入结果')}>流局满贯</Chip>
        </div>
      </section>

      {noYakuWarnings.length > 0 ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="danger" title="不能计分">
          {noYakuWarnings.join('；')}
        </Alert>
      ) : null}

      {invalidErrors.length > 0 ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="输入需要调整">
          {invalidErrors.join('；')}
        </Alert>
      ) : null}

      {mode === 'sanma' ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="三麻规则差异">
          拔北、北宝牌与万子缺牌按当前设置估算。
        </Alert>
      ) : null}

      <QuickScorePanel computation={computation} seatWind={seatWind} />
      <QuickEfficiencyPanel computation={computation} />

      <div className="mj-quick-actions-bottom">
        <ActionButton icon={<RotateCcw aria-hidden="true" />} variant="ghost" onClick={reset}>
          清空
        </ActionButton>
        <ActionButton className="mj-quick-white-action" icon={<SlidersHorizontal aria-hidden="true" />} variant="ghost" onClick={() => setKeyboardTarget('hand')}>
          修改
        </ActionButton>
        <ActionButton
          disabled={!resultText}
          icon={<Share2 aria-hidden="true" />}
          onClick={() =>
            void copyResult(
              resultText,
              setCopyMessage,
            )
          }
        >
          分享结果
        </ActionButton>
      </div>

      {copyMessage ? <Alert tone="success">{copyMessage}</Alert> : null}

      <TileKeyboard
        allowRedFives
        doneLabel="完成"
        maxTiles={
          keyboardTarget === 'hand'
            ? expectedClosedTiles
            : keyboardTarget === 'meld'
              ? meldTileLimit(meldKind)
              : 5
        }
        open={keyboardTarget !== null}
        previewLabel={
          keyboardTarget === 'hand'
            ? '当前手牌'
            : keyboardTarget === 'meld'
              ? `${MELD_KIND_LABELS[meldKind]}预览`
              : '当前指示牌'
        }
        subtitle="同一物理牌最多 4 枚；普通五与赤五共享数量。"
        tiles={keyboardTiles}
        title={keyboardTarget ? keyboardTitle(keyboardTarget) : '录入牌'}
        isTileDisabled={hasFourPhysicalCopies}
        onChange={setKeyboardTiles}
        onClose={() => setKeyboardTarget(null)}
        onDone={() => setKeyboardTarget(null)}
      />
    </div>
  );
}

function QuickSummaryCard({
  label,
  value,
  tone = 'default',
  onClick,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'danger' | 'gold';
  onClick: () => void;
}) {
  return (
    <button className={`mj-quick-summary-card mj-quick-summary-card--${tone}`} type="button" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function RuleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mj-rule-row">
      <span>{label}</span>
      <div className="mj-rule-row__controls">{children}</div>
    </div>
  );
}

function Pill({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button className={selected ? 'mj-rule-pill mj-rule-pill--selected' : 'mj-rule-pill'} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function QuickScorePanel({ computation, seatWind }: { computation: QuickComputation; seatWind: Wind }) {
  if (computation.kind === 'empty') {
    return (
      <section className="mj-score-hero mj-score-hero--quick mj-score-hero--empty">
        <span>最终点数</span>
        <strong>-</strong>
        <small>录入手牌、和牌方式和场况后显示计算结果</small>
      </section>
    );
  }

  if (computation.kind === 'score' && computation.result.valid) {
    const result = computation.result;
    const value = formatPoints(result.payments?.totalGain).replace(' 点', '');
    const method = result.payments?.ron === undefined ? '自摸' : '荣和';
    const seat = WIND_LABELS[seatWind] === '东' ? '庄家' : '闲家';

    return (
      <section className="mj-score-hero mj-score-hero--quick">
        <span>最终点数</span>
        <strong>{value}</strong>
        <small>{seat}{method} · {formatHan(result.han)}{formatFu(result.fu)} · {formatLimit(result)}</small>
        <div className="mj-score-badges">
          {result.payments?.ron !== undefined ? <b>放铳 {formatPoints(result.payments.ron).replace(' 点', '')}</b> : null}
          {result.payments?.tsumoDealerPays !== undefined ? <b>庄家 {formatPoints(result.payments.tsumoDealerPays).replace(' 点', '')}</b> : null}
          {result.payments?.tsumoNonDealerPays !== undefined ? <b>子家 {formatPoints(result.payments.tsumoNonDealerPays).replace(' 点', '')}</b> : null}
        </div>
      </section>
    );
  }

  if (computation.kind === 'efficiency') {
    return (
      <section className="mj-score-hero mj-score-hero--quick mj-score-hero--empty">
        <span>最终点数</span>
        <strong>-</strong>
        <small>当前牌姿未组成和牌，已转为向听与有效牌估算</small>
      </section>
    );
  }

  return null;
}

function QuickEfficiencyPanel({ computation }: { computation: QuickComputation }) {
  if (computation.kind !== 'efficiency') return null;

  const result = computation.result;
  const effectiveTiles = result.effectiveTiles.slice(0, 7).map((entry) => entry.tile.code);
  const shantenText = result.shanten < 0 ? '听牌/和牌' : `${result.shanten} 向听`;
  const countText = `${result.totalEffectiveTileCount} 枚`;

  return (
    <section className="mj-design-card">
      <header className="mj-design-card__header">
        <h2>未和牌时</h2>
      </header>
      <p className="mj-efficiency-title">{shantenText} · 有效牌 {countText}</p>
      <div className="mj-quick-tile-row">
        {effectiveTiles.length > 0 ? (
          effectiveTiles.map((tile, index) => (
            <MahjongTile key={`${tile}-${index}`} code={tile} size="sm" />
          ))
        ) : (
          <span className="mj-muted-line">没有可列出的有效牌</span>
        )}
      </div>
    </section>
  );
}

function makeResultText(computation: QuickComputation): string {
  if (computation.kind === 'empty' || computation.kind === 'invalid') return '';
  if (computation.kind === 'efficiency') {
    const result = computation.result;
    return `牌效估算：${result.shanten} 向听，有效牌 ${result.totalEffectiveTileCount} 枚`;
  }
  const result = computation.result;
  if (!result.valid) return `不能计分：${result.warnings.join('、') || '没有役'}`;
  return [
    `日麻算分：${formatHan(result.han)} ${formatFu(result.fu)} ${formatLimit(result)}`,
    `方式：${formatWinMethod(result.payments?.ron === undefined ? 'tsumo' : 'ron')}`,
    `收入：${formatPoints(result.payments?.totalGain)}`,
    `役种：${result.yaku.map((yaku) => `${yaku.name}${formatHan(yaku.han)}`).join('、')}`,
  ].join('\n');
}
