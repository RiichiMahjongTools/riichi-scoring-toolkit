import { AlertCircle, Camera, Copy, Minus, Plus, RotateCcw, Share2, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  createMeldInput,
  expectedClosedTileCount,
  getMeldKind,
  getTileMeta,
  isTileCode,
  parseTileCodes,
  tileToCode,
  type MeldInput,
  type MeldKind,
  type ScoreComputation,
  type ScoreConditions,
  type ScoreMode,
  type TileCode,
  type Wind,
} from '../domain';
import {
  WIND_LABELS,
  formatFu,
  formatHan,
  formatLimit,
  formatPoints,
  formatWinMethod,
} from './shared';

type KeyboardTarget = 'hand' | 'dora' | 'ura' | 'meld';
type QuickComputation = ScoreComputation | { kind: 'empty' };
type ScorePageVariant = 'quick' | 'legacy';

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

const NORTH_DORA_OPTIONS = [0, 1, 2, 3, 4] as const;

const COMMON_EXTRA_OPTIONS: Array<{ key: keyof ScoreConditions; label: string }> = [
  { key: 'riichi', label: '立直' },
  { key: 'tsumo', label: '自摸' },
];

const EXTRA_OPTIONS: Array<{ key: keyof ScoreConditions; label: string }> = [
  { key: 'doubleRiichi', label: '两立直' },
  { key: 'ippatsu', label: '一发' },
  { key: 'rinshan', label: '岭上' },
  { key: 'haiteiOrHoutei', label: '河/海底' },
  { key: 'chankan', label: '抢杠' },
  { key: 'tenhou', label: '天和' },
  { key: 'chiihou', label: '地和' },
];

const LEGACY_EVENT_OPTIONS: Array<{ key: keyof ScoreConditions; label: string; note: string }> = [
  { key: 'renhou', label: '人和', note: '子家第一次摸牌前荣和，按 5 番' },
  { key: 'tsubameGaeshi', label: '燕返', note: '门前荣和他家的立直宣言牌，按 1 番' },
  { key: 'kanfuri', label: '杠振', note: '荣和他家杠后摸岭上牌再打出的牌，按 1 番' },
];

function toTileCodes(values: string[]): TileCode[] {
  return values.filter(isTileCode);
}

export function parseQuickScoreTileImport(hash: string): TileCode[] {
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return [];

  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const rawTiles = params.get('tiles');
  if (!rawTiles) return [];

  return rawTiles.split(/[,\s]+/).filter(isTileCode).slice(0, 14);
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
    const metas = parsedTiles.map(getTileMeta);
    const [first] = metas;
    const ranks = metas.map((tile) => tile.rank).sort((a, b) => a - b);
    const isSequence =
      first.suit !== 'z' &&
      metas.every((tile) => tile.suit === first.suit) &&
      ranks[0] + 1 === ranks[1] &&
      ranks[1] + 1 === ranks[2];
    return isSequence ? '' : '吃牌必须是同一数牌花色的连续 3 枚';
  }

  return uniqueBaseCodes.size === 1 ? '' : `${MELD_KIND_LABELS[kind]}必须由相同牌组成`;
}

function normalizeWinTileIndex(length: number, expectedLength: number, index: number | null): number | null {
  if (length === 0 || length !== expectedLength) return null;
  if (index === null) return length - 1;
  return Math.min(Math.max(index, 0), length - 1);
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
  return <ScoreCalculatorPage variant="quick" />;
}

export function LegacyScorePage() {
  return <ScoreCalculatorPage variant="legacy" />;
}

function ScoreCalculatorPage({ variant }: { variant: ScorePageVariant }) {
  const isLegacy = variant === 'legacy';
  const initialImportedTiles = parseQuickScoreTileImport(window.location.hash);
  const [mode, setMode] = useState<ScoreMode>('yonma');
  const [handTiles, setHandTiles] = useState<TileCode[]>(initialImportedTiles);
  const [winTileIndex, setWinTileIndex] = useState<number | null>(
    initialImportedTiles.length > 0 ? initialImportedTiles.length - 1 : null,
  );
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
  const selectedHandWinTileIndex = normalizeWinTileIndex(handTiles.length, expectedClosedTiles, winTileIndex);

  useEffect(() => {
    const applyImportedTiles = () => {
      const importedTiles = parseQuickScoreTileImport(window.location.hash);
      if (importedTiles.length === 0) return;
      setHandTiles(importedTiles);
      setWinTileIndex(importedTiles.length - 1);
      setCopyMessage('已带入识别手牌，请确认和牌张/最后摸切张');
    };

    applyImportedTiles();
    window.addEventListener('hashchange', applyImportedTiles);
    return () => window.removeEventListener('hashchange', applyImportedTiles);
  }, []);

  const computation = useMemo<QuickComputation>(() => {
    if (handTiles.length === 0) return { kind: 'empty' };

    try {
      const parsedHandTiles = parseTileCodes(handTiles);
      return calculateScoreOrEfficiency(
        {
          mode,
          handTiles: parsedHandTiles,
          winTile: selectedHandWinTileIndex === null ? null : parsedHandTiles[selectedHandWinTileIndex],
          melds,
          doraIndicators: parseTileCodes(doraIndicators),
          uraDoraIndicators: parseTileCodes(uraDoraIndicators),
          northDoraCount,
          roundWind,
          seatWind,
          honba,
          doubleWindPairTwoFu,
          conditions,
        },
        { enableLegacyYaku: isLegacy },
      );
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
    honba,
    melds,
    mode,
    northDoraCount,
    roundWind,
    handTiles,
    selectedHandWinTileIndex,
    seatWind,
    uraDoraIndicators,
    isLegacy,
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
    const previousLength = handTiles.length;
    setHandTiles(next);
    setWinTileIndex((current) => {
      if (next.length !== expectedClosedTiles) return null;
      if (next.length !== previousLength || current === null) return next.length - 1;
      return Math.min(current, next.length - 1);
    });
  };

  const selectHandWinTileIndex = (index: number) => {
    if (handTiles.length === 0) return;
    setWinTileIndex(index);
  };

  const selectMode = (nextMode: ScoreMode) => {
    setMode(nextMode);
    if (nextMode === 'sanma' && meldKind === 'chi') setMeldKind('pon');
    if (nextMode === 'yonma') setNorthDoraCount(0);
  };

  const addMeld = () => {
    if (meldDraftError || melds.length >= 4) return;
    setMelds((value) => [...value, createMeldInput(meldKind, parseTileCodes(meldDraftTiles))]);
    setMeldDraftTiles([]);
  };

  const reset = () => {
    setHandTiles([]);
    setWinTileIndex(null);
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

  const openHandRecognition = () => {
    window.location.hash = `#/hand-recognition?return=${isLegacy ? 'legacy-score' : 'quick-score'}`;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const resultText = makeResultText(computation);
  const noYakuWarnings = computation.kind === 'score' && !computation.result.valid ? computation.result.warnings : [];
  const invalidErrors = computation.kind === 'invalid' ? computation.errors : [];

  return (
    <div className={isLegacy ? 'mj-page-stack mj-quick-page mj-legacy-page' : 'mj-page-stack mj-quick-page'}>
      <QuickScorePanel computation={computation} seatWind={seatWind} />

      <section className="mj-design-card mj-quick-hand-card">
        <header className="mj-design-card__header">
          <h2>手牌与副露</h2>
          <span>和牌张/最后摸切张 {handTiles.length}/{expectedClosedTiles}</span>
        </header>
        <div className="mj-quick-tile-row" aria-label="当前手牌与和牌张/最后摸切张">
          {handTiles.length > 0 ? (
            handTiles.map((tile, index) => {
              const isWinning = index === selectedHandWinTileIndex;
              return (
                <MahjongTile
                  key={`${tile}-${index}`}
                  className={isWinning ? 'mj-tile--winning' : undefined}
                  code={tile}
                  marker={isWinning ? '和' : undefined}
                  selected={isWinning}
                  size="xs"
                  onClick={() => selectHandWinTileIndex(index)}
                />
              );
            })
          ) : (
            <span className="mj-muted-line">未录入手牌</span>
          )}
        </div>

        {melds.length > 0 ? (
          <div className="mj-meld-list" aria-label="已录入副露面子">
            {melds.map((meld, index) => (
              <div key={`${meld.type}-${index}`} className="mj-meld-row">
                <div className="mj-meld-row__content">
                  <strong>{MELD_KIND_LABELS[getMeldKind(meld)]}</strong>
                  <TileStrip tileSize="xs" tiles={meld.tiles.map(tileToCode)} />
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
              <TileStrip emptyLabel="无" maxSlots={5} tileSize="xs" tiles={doraIndicators} />
            </button>
            <button type="button" onClick={() => setKeyboardTarget('ura')}>
              <span>里宝牌</span>
              <TileStrip emptyLabel="无" maxSlots={5} tileSize="xs" tiles={uraDoraIndicators} />
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
              tileSize="xs"
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

      <div className="mj-quick-scan-entry">
        <ActionButton
          className="mj-quick-scan-action"
          fullWidth
          icon={<Camera aria-hidden="true" />}
          variant="ghost"
          onClick={openHandRecognition}
        >
          拍照识别手牌
        </ActionButton>
      </div>

      <section className="mj-design-card">
        <header className="mj-design-card__header">
          <h2>场况与规则</h2>
        </header>
        <RuleRow label="四麻 / 三麻">
          <Pill selected={mode === 'yonma'} onClick={() => selectMode('yonma')}>四麻</Pill>
          <Pill selected={mode === 'sanma'} onClick={() => selectMode('sanma')}>三麻</Pill>
        </RuleRow>
        <RuleRow label="场风">
          {WIND_OPTIONS.map((option) => (
            <Pill key={option.value} selected={roundWind === option.value} onClick={() => setRoundWind(option.value)}>
              {option.label}
            </Pill>
          ))}
        </RuleRow>
        <RuleRow label="自风">
          {WIND_OPTIONS.map((option) => (
            <Pill key={option.value} selected={seatWind === option.value} onClick={() => setSeatWind(option.value)}>
              {option.label}
            </Pill>
          ))}
        </RuleRow>
        {mode === 'sanma' ? (
          <RuleRow label="三麻拔北">
            {NORTH_DORA_OPTIONS.map((value) => (
              <Pill
                key={value}
                selected={northDoraCount === value}
                onClick={() => setNorthDoraCount(value)}
              >
                {value}
              </Pill>
            ))}
          </RuleRow>
        ) : null}
        <RuleRow label="本场">
          <HonbaStepper
            value={honba}
            onDecrement={() => setHonba((value) => Math.max(0, value - 1))}
            onIncrement={() => setHonba((value) => value + 1)}
          />
        </RuleRow>
        <RuleRow label="连风雀头">
          <Pill selected={!doubleWindPairTwoFu} onClick={() => setDoubleWindPairTwoFu(false)}>4符</Pill>
          <Pill selected={doubleWindPairTwoFu} onClick={() => setDoubleWindPairTwoFu(true)}>2符</Pill>
        </RuleRow>
      </section>

      <section className="mj-design-card">
        <header className="mj-design-card__header">
          <h2>额外役与修正</h2>
        </header>
        <div className="mj-quick-extra-layout">
          <div className="mj-quick-chip-grid">
            {EXTRA_OPTIONS.map((option) => (
              <Chip key={option.key} selected={conditions[option.key]} onClick={() => toggleCondition(option.key)}>
                {option.label}
              </Chip>
            ))}
            <Chip onClick={() => setCopyMessage('流局满贯需要特殊规则确认，当前不会写入结果')}>流局满贯</Chip>
            {isLegacy ? LEGACY_EVENT_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                selected={conditions[option.key]}
                title={option.note}
                onClick={() => toggleCondition(option.key)}
              >
                {option.label}
              </Chip>
            )) : null}
          </div>
          <div aria-label="常用役" className="mj-quick-common-actions">
            {COMMON_EXTRA_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                className="mj-quick-common-chip"
                selected={conditions[option.key]}
                onClick={() => toggleCondition(option.key)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
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
        previewHighlightIndex={keyboardTarget === 'hand' ? selectedHandWinTileIndex : null}
        previewHighlightLast={false}
        previewLabel={
          keyboardTarget === 'hand'
            ? '当前手牌'
            : keyboardTarget === 'meld'
              ? `${MELD_KIND_LABELS[meldKind]}预览`
              : '当前指示牌'
        }
        tiles={keyboardTiles}
        title={null}
        isTileDisabled={hasFourPhysicalCopies}
        onChange={setKeyboardTiles}
        onClose={() => setKeyboardTarget(null)}
        onDone={() => setKeyboardTarget(null)}
        onPreviewTileSelect={keyboardTarget === 'hand' ? selectHandWinTileIndex : undefined}
      />
    </div>
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

function HonbaStepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="mj-honba-stepper" aria-label="本场数">
      <button aria-label="减少本场" disabled={value <= 0} type="button" onClick={onDecrement}>
        <Minus aria-hidden="true" />
      </button>
      <strong>{value}</strong>
      <button aria-label="增加本场" type="button" onClick={onIncrement}>
        <Plus aria-hidden="true" />
      </button>
      <span>本场</span>
    </div>
  );
}

function Pill({
  selected,
  children,
  disabled = false,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={selected ? 'mj-rule-pill mj-rule-pill--selected' : 'mj-rule-pill'}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
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
    const value = formatPoints(result.cost?.total).replace(' 点', '');
    const method = result.is_tsumo ? '自摸' : '荣和';
    const seat = WIND_LABELS[seatWind] === '东' ? '庄家' : '闲家';
    const mainPayment = result.cost ? result.cost.main + result.cost.main_bonus : undefined;
    const additionalPayment = result.cost ? result.cost.additional + result.cost.additional_bonus : undefined;

    return (
      <section className="mj-score-hero mj-score-hero--quick">
        <span>最终点数</span>
        <strong>{value}</strong>
        <small>{seat}{method} · {formatHan(result.han)}{formatFu(result.fu)} · {formatLimit(result)}</small>
        <div className="mj-score-badges">
          {!result.is_tsumo ? <b>放铳 {formatPoints(mainPayment).replace(' 点', '')}</b> : null}
          {result.is_tsumo && result.is_dealer ? <b>每家 {formatPoints(mainPayment).replace(' 点', '')}</b> : null}
          {result.is_tsumo && !result.is_dealer ? <b>庄家 {formatPoints(mainPayment).replace(' 点', '')}</b> : null}
          {result.is_tsumo && !result.is_dealer ? <b>子家 {formatPoints(additionalPayment).replace(' 点', '')}</b> : null}
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
  const effective_tiles = result.effective_tiles.slice(0, 7).map((entry) => tileToCode(entry.tile));
  const shantenText = result.shanten < 0 ? '听牌/和牌' : `${result.shanten} 向听`;
  const countText = `${result.total_effective_tiles} 枚`;

  return (
    <section className="mj-design-card">
      <header className="mj-design-card__header">
        <h2>未和牌时</h2>
      </header>
      <p className="mj-efficiency-title">{shantenText} · 有效牌 {countText}</p>
      <div className="mj-quick-tile-row">
        {effective_tiles.length > 0 ? (
          effective_tiles.map((tile, index) => (
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
    return `牌效估算：${result.shanten} 向听，有效牌 ${result.total_effective_tiles} 枚`;
  }
  const result = computation.result;
  if (!result.valid) return `不能计分：${result.warnings.join('、') || '没有役'}`;
  return [
    `日麻算分：${formatHan(result.han)} ${formatFu(result.fu)} ${formatLimit(result)}`,
    `方式：${formatWinMethod(result.is_tsumo ? 'tsumo' : 'ron')}`,
    `收入：${formatPoints(result.cost?.total)}`,
    `役种：${result.yaku.map((yaku) => `${yaku.name}${formatHan(yaku.han)}`).join('、')}`,
  ].join('\n');
}
