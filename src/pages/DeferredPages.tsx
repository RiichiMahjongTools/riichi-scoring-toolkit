import {
  AlertCircle,
  Camera,
  Check,
  Copy,
  Hammer,
  Home,
  Image as ImageIcon,
  Keyboard,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActionButton,
  Alert,
  Chip,
  DataTable,
  MahjongTile,
  PaymentCards,
  SectionCard,
  SegmentedControl,
  TileKeyboard,
  TileStrip,
} from '../components';
import {
  baseTileCode,
  calculateScoreCost,
  getLegalFuOptions,
  isTileCode,
  tileLabel,
  type FuValue,
  type TileCode,
  type WinMethod,
} from '../domain';
import type { RecognitionDetection } from '../domain/tileRecognition';
import type { PageProps } from './shared';
import { formatPoints } from './shared';

const SEAT_IDS = ['east', 'south', 'west', 'north'] as const;
type SeatId = (typeof SEAT_IDS)[number];
type RecordOutcome = 'ron' | 'tsumo' | 'draw' | 'adjust';

interface PlayerState {
  id: SeatId;
  wind: string;
  name: string;
  score: number;
}

interface HistoryEntry {
  id: string;
  title: string;
  meta: string;
  delta: string;
  snapshot: {
    players: PlayerState[];
    dealerIndex: number;
    roundIndex: number;
    honba: number;
  };
}

const SEAT_LABELS: Record<SeatId, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
};

const INITIAL_PLAYERS: PlayerState[] = [
  { id: 'east', wind: '东', name: '东家', score: 25000 },
  { id: 'south', wind: '南', name: '南家', score: 25000 },
  { id: 'west', wind: '西', name: '西家', score: 25000 },
  { id: 'north', wind: '北', name: '北家', score: 25000 },
];

const LEGACY_YAKU = [
  { id: 'daisharin', name: '大车轮', han: 13, note: '常见古役满，按单倍役满估算' },
  { id: 'daichikurin', name: '大竹林', han: 13, note: '索子版大车轮，按单倍役满估算' },
  { id: 'daisuurin', name: '大数邻', han: 13, note: '万子版大车轮，按单倍役满估算' },
  { id: 'sanrenkou', name: '三连刻', han: 2, note: '地方役，默认 2 番' },
  { id: 'isshoku-yonsun', name: '一色四顺', han: 13, note: '地方役满估算' },
  { id: 'shiisanpuutaa', name: '十三不塔', han: 1, note: '地方役，默认 1 番' },
];

function toTileCodes(values: string[]): TileCode[] {
  return values.filter(isTileCode);
}

function hasFourPhysicalCopies(tile: string, currentTiles: string[]) {
  if (!isTileCode(tile)) return true;
  const base = baseTileCode(tile);
  return currentTiles.filter((value) => isTileCode(value) && baseTileCode(value) === base).length >= 4;
}

function recognitionTilesToHash(tiles: readonly TileCode[]) {
  return `#/quick-score?${new URLSearchParams({ tiles: tiles.join(',') }).toString()}`;
}

function formatPaymentSummary(params: {
  han: number;
  fu: number;
  isDealer: boolean;
  winMethod: WinMethod;
  honba: number;
}) {
  const result = calculateScoreCost({
    han: params.han,
    fu: params.fu,
    is_dealer: params.isDealer,
    is_tsumo: params.winMethod === 'tsumo',
    tsumi_number: params.honba,
  });
  if (params.winMethod === 'ron') return formatPoints(result.cost.main);
  if (params.isDealer) return `${result.cost.main.toLocaleString('zh-CN')} all`;
  return `${result.cost.additional.toLocaleString('zh-CN')} / ${result.cost.main.toLocaleString('zh-CN')}`;
}

async function copyLocalText(text: string, onDone: (message: string) => void) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      onDone('已复制到剪贴板');
      return;
    }
  } catch {
    // Fall through to prompt fallback for embedded browsers.
  }

  window.prompt('复制文本', text);
  onDone('已打开复制文本');
}

export function LegacyScorePage() {
  const [selectedYaku, setSelectedYaku] = useState<string[]>(['sanrenkou']);
  const [customName, setCustomName] = useState('');
  const [customHan, setCustomHan] = useState(0);
  const [isDealer, setIsDealer] = useState(false);
  const [winMethod, setWinMethod] = useState<WinMethod>('ron');
  const [honba, setHonba] = useState(0);
  const totalHan = selectedYaku.reduce((sum, id) => sum + (LEGACY_YAKU.find((yaku) => yaku.id === id)?.han ?? 0), 0) + (customName.trim() ? customHan : 0);
  const legalFu = getLegalFuOptions(Math.max(1, Math.min(13, totalHan || 1)));
  const [fu, setFu] = useState<FuValue>(40);
  const safeFu = legalFu.includes(fu) ? fu : legalFu[0] ?? 30;
  const canCalculate = totalHan > 0;
  const result = canCalculate
    ? calculateScoreCost({ han: totalHan, fu: safeFu, is_dealer: isDealer, is_tsumo: winMethod === 'tsumo', tsumi_number: honba })
    : null;

  const toggleYaku = (id: string) => {
    setSelectedYaku((value) => (value.includes(id) ? value.filter((item) => item !== id) : [...value, id]));
  };

  return (
    <div className="mj-page-stack mj-legacy-page">
      <SectionCard title="地方役 / 古役">
        <div className="mj-chip-row">
          {LEGACY_YAKU.map((yaku) => (
            <Chip key={yaku.id} selected={selectedYaku.includes(yaku.id)} tone={yaku.han >= 13 ? 'danger' : 'warning'} onClick={() => toggleYaku(yaku.id)}>
              {yaku.name}
            </Chip>
          ))}
        </div>
        <DataTable
          columns={[
            { id: 'name', header: '役' },
            { id: 'han', header: '番值', align: 'center' },
            { id: 'note', header: '口径' },
          ]}
          rows={LEGACY_YAKU.filter((yaku) => selectedYaku.includes(yaku.id)).map((yaku) => ({
            id: yaku.id,
            name: yaku.name,
            han: yaku.han >= 13 ? '役满' : `${yaku.han}番`,
            note: yaku.note,
          }))}
          rowKey={(row) => String(row.id)}
        />
      </SectionCard>

      <SectionCard title="自定义古役">
        <div className="mj-inline-form-grid">
          <label>
            <span>古役名</span>
            <input value={customName} placeholder="例如 一色三顺" onChange={(event) => setCustomName(event.target.value)} />
          </label>
          <label>
            <span>番值</span>
            <input
              inputMode="numeric"
              max={26}
              min={0}
              type="number"
              value={customHan}
              onChange={(event) => setCustomHan(Math.max(0, Math.min(26, Number(event.target.value) || 0)))}
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="估算条件">
        <div className="mj-info-row">
          <span>亲闲</span>
          <span className="mj-info-row__chips">
            <Chip selected={!isDealer} onClick={() => setIsDealer(false)}>闲家</Chip>
            <Chip selected={isDealer} onClick={() => setIsDealer(true)}>亲家</Chip>
          </span>
        </div>
        <div className="mj-info-row">
          <span>和牌</span>
          <span className="mj-info-row__chips">
            <Chip selected={winMethod === 'ron'} onClick={() => setWinMethod('ron')}>荣和</Chip>
            <Chip selected={winMethod === 'tsumo'} onClick={() => setWinMethod('tsumo')}>自摸</Chip>
          </span>
        </div>
        <div className="mj-info-row">
          <span>符数</span>
          <span className="mj-info-row__chips">
            {legalFu.slice(0, 6).map((option) => (
              <Chip key={option} selected={safeFu === option} onClick={() => setFu(option)}>{option}符</Chip>
            ))}
          </span>
        </div>
        <div className="mj-info-row">
          <span>本场</span>
          <span className="mj-info-row__chips">
            {[0, 1, 2, 3].map((value) => (
              <Chip key={value} selected={honba === value} onClick={() => setHonba(value)}>{value}本场</Chip>
            ))}
          </span>
        </div>
      </SectionCard>

      <div className="mj-score-hero">
        <span>估算点数</span>
        <strong>{result ? result.cost.total.toLocaleString('zh-CN') : '-'}</strong>
        <small>{canCalculate ? `${totalHan >= 13 ? result?.yaku_level_label ?? '役满' : `${totalHan}番${safeFu}符`} · ${isDealer ? '亲家' : '闲家'}${winMethod === 'ron' ? '荣和' : '自摸'}` : '请选择至少一个古役'}</small>
      </div>

      {result ? (
        <PaymentCards
          items={[
            {
              id: 'payment',
              label: winMethod === 'ron' ? '荣和支付' : '自摸支付',
              value: formatPaymentSummary({ han: totalHan, fu: safeFu, isDealer, winMethod, honba }),
              caption: result.yaku_level_label ?? '普通手',
              tone: 'success',
            },
          ]}
        />
      ) : null}

      <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="规则口径">
        古役和地方役没有统一标准，本页只按手动选择的番值进入点数公式，不自动判定牌型。
      </Alert>
    </div>
  );
}

function roundLabel(roundIndex: number) {
  const wind = ['东', '南', '西', '北'][Math.floor(roundIndex / 4) % 4];
  return `${wind}${(roundIndex % 4) + 1}局`;
}

function updatePlayerScore(players: PlayerState[], id: SeatId, delta: number) {
  return players.map((player) => (player.id === id ? { ...player, score: player.score + delta } : player));
}

export function TableRecordsPage() {
  const [players, setPlayers] = useState<PlayerState[]>(INITIAL_PLAYERS);
  const [dealerIndex, setDealerIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [honba, setHonba] = useState(0);
  const [outcome, setOutcome] = useState<RecordOutcome>('ron');
  const [winner, setWinner] = useState<SeatId>('south');
  const [loser, setLoser] = useState<SeatId>('west');
  const [han, setHan] = useState(4);
  const [fu, setFu] = useState<FuValue>(30);
  const [adjustSeat, setAdjustSeat] = useState<SeatId>('east');
  const [adjustAmount, setAdjustAmount] = useState(1000);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const dealerId = SEAT_IDS[dealerIndex % 4];
  const legalFu = getLegalFuOptions(han);
  const safeFu = legalFu.includes(fu) ? fu : legalFu[0] ?? 30;
  const point = calculateScoreCost({ han, fu: safeFu, is_dealer: winner === dealerId, is_tsumo: outcome === 'tsumo', tsumi_number: honba });
  const totalScore = players.reduce((sum, player) => sum + player.score, 0);

  const snapshot = () => ({ players, dealerIndex, roundIndex, honba });
  const selectWinner = (seat: SeatId) => {
    setWinner(seat);
    if (loser === seat) {
      setLoser(SEAT_IDS.find((candidate) => candidate !== seat) ?? 'east');
    }
  };

  const advanceRound = (winnerSeat?: SeatId) => {
    if (winnerSeat && winnerSeat === dealerId) {
      setHonba((value) => value + 1);
      return;
    }
    setDealerIndex((value) => value + 1);
    setRoundIndex((value) => value + 1);
    setHonba(0);
  };

  const pushHistory = (title: string, delta: string, before = snapshot()) => {
    setHistory((value) => [
      {
        id: `${Date.now()}-${value.length}`,
        title,
        meta: `${roundLabel(roundIndex)} ${honba}本场`,
        delta,
        snapshot: before,
      },
      ...value,
    ]);
  };

  const applyRecord = () => {
    const before = snapshot();
    if (outcome === 'draw') {
      pushHistory('流局', '本场+1', before);
      setHonba((value) => value + 1);
      return;
    }

    if (outcome === 'adjust') {
      setPlayers((value) => updatePlayerScore(value, adjustSeat, adjustAmount));
      pushHistory(`${SEAT_LABELS[adjustSeat]}家手动调整`, `${adjustAmount > 0 ? '+' : ''}${adjustAmount}`, before);
      return;
    }

    if (outcome === 'ron') {
      const effectiveLoser = loser === winner ? SEAT_IDS.find((seat) => seat !== winner) ?? loser : loser;
      const payment = point.cost.main;
      setPlayers((value) => updatePlayerScore(updatePlayerScore(value, winner, payment), effectiveLoser, -payment));
      pushHistory(`${SEAT_LABELS[winner]}家 荣和 ${SEAT_LABELS[effectiveLoser]}家`, `+${payment}`, before);
      advanceRound(winner);
      return;
    }

    const nextPlayers = players.reduce((current, player) => {
      if (player.id === winner) return current;
      const loss = winner === dealerId ? point.cost.main : player.id === dealerId ? point.cost.main : point.cost.additional;
      return updatePlayerScore(current, player.id, -loss);
    }, players);
    setPlayers(updatePlayerScore(nextPlayers, winner, point.cost.total));
    pushHistory(`${SEAT_LABELS[winner]}家 自摸`, `+${point.cost.total}`, before);
    advanceRound(winner);
  };

  const undo = () => {
    const [latest, ...rest] = history;
    if (!latest) return;
    setPlayers(latest.snapshot.players);
    setDealerIndex(latest.snapshot.dealerIndex);
    setRoundIndex(latest.snapshot.roundIndex);
    setHonba(latest.snapshot.honba);
    setHistory(rest);
  };

  const clear = () => {
    setPlayers(INITIAL_PLAYERS);
    setDealerIndex(0);
    setRoundIndex(0);
    setHonba(0);
    setHistory([]);
  };

  return (
    <div className="mj-page-stack mj-table-records-page">
      <div className="mj-table-record-stats">
        <span>
          <small>局数</small>
          <strong>{roundLabel(roundIndex)}</strong>
        </span>
        <span>
          <small>本场</small>
          <strong>{honba}本场</strong>
        </span>
        <span>
          <small>合计</small>
          <strong>{totalScore.toLocaleString('zh-CN')}</strong>
        </span>
      </div>

      <SectionCard className="mj-table-seat-card" title="四人桌">
        <div className="mj-player-score-list">
          {players.map((player) => {
            const badge = player.id === dealerId ? '亲家' : player.id === winner && outcome !== 'draw' ? '赢家' : player.id === loser && outcome === 'ron' ? '放铳' : '记录';
            const tone = badge === '放铳' ? 'red' : badge === '记录' ? 'muted' : 'green';
            return (
              <div key={player.id} className={`mj-player-score-row mj-player-score-row--${tone}`}>
                <span className="mj-wind-dot">{player.wind}</span>
                <input
                  aria-label={`${player.wind}家名称`}
                  className="mj-record-name-input"
                  value={player.name}
                  onChange={(event) => setPlayers((value) => value.map((item) => (item.id === player.id ? { ...item, name: event.target.value } : item)))}
                />
                <strong>{player.score.toLocaleString('zh-CN')}</strong>
                <small>{badge}</small>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard className="mj-round-record-card" title="记录一手">
        <div className="mj-chip-row">
          {[
            ['ron', '荣和'],
            ['tsumo', '自摸'],
            ['draw', '流局'],
            ['adjust', '手动调整'],
          ].map(([value, label]) => (
            <Chip key={value} selected={outcome === value} onClick={() => setOutcome(value as RecordOutcome)}>
              {label}
            </Chip>
          ))}
        </div>

        {outcome === 'adjust' ? (
          <div className="mj-inline-form-grid">
            <label>
              <span>座位</span>
              <select value={adjustSeat} onChange={(event) => setAdjustSeat(event.target.value as SeatId)}>
                {SEAT_IDS.map((seat) => <option key={seat} value={seat}>{SEAT_LABELS[seat]}家</option>)}
              </select>
            </label>
            <label>
              <span>调整点</span>
              <input type="number" value={adjustAmount} onChange={(event) => setAdjustAmount(Number(event.target.value) || 0)} />
            </label>
          </div>
        ) : null}

        {outcome === 'ron' || outcome === 'tsumo' ? (
          <>
            <div className="mj-record-form-row">
              <span>赢家</span>
              <span className="mj-info-row__chips">
                {SEAT_IDS.map((seat) => (
                  <Chip key={seat} selected={winner === seat} onClick={() => selectWinner(seat)}>{SEAT_LABELS[seat]}</Chip>
                ))}
              </span>
            </div>
            {outcome === 'ron' ? (
              <div className="mj-record-form-row">
                <span>放铳者</span>
                <span className="mj-info-row__chips">
                  {SEAT_IDS.filter((seat) => seat !== winner).map((seat) => (
                    <Chip key={seat} selected={loser === seat} onClick={() => setLoser(seat)}>{SEAT_LABELS[seat]}</Chip>
                  ))}
                </span>
              </div>
            ) : null}
            <div className="mj-record-form-row">
              <span>番符</span>
              <strong>{han}番{safeFu}符</strong>
              <small>{formatPaymentSummary({ han, fu: safeFu, isDealer: winner === dealerId, winMethod: outcome === 'tsumo' ? 'tsumo' : 'ron', honba })}</small>
            </div>
            <div className="mj-chip-row">
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <Chip key={value} selected={han === value} onClick={() => setHan(value)}>{value === 5 ? '满贯' : `${value}番`}</Chip>
              ))}
            </div>
            <div className="mj-chip-row">
              {legalFu.slice(0, 6).map((value) => (
                <Chip key={value} selected={safeFu === value} onClick={() => setFu(value)}>{value}符</Chip>
              ))}
            </div>
          </>
        ) : null}

        <ActionButton fullWidth icon={<Check aria-hidden="true" />} onClick={applyRecord}>
          写入流水
        </ActionButton>
      </SectionCard>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone={totalScore === 100000 ? 'success' : 'warning'} title="总点校验">
        当前玩家合计 {totalScore.toLocaleString('zh-CN')} 点。
      </Alert>

      <SectionCard className="mj-history-card" title="历史流水">
        <DataTable
          columns={[
            { id: 'meta', header: '局' },
            { id: 'title', header: '内容' },
            { id: 'delta', header: '变动', align: 'right' },
          ]}
          rows={history.map((item) => ({ id: item.id, meta: item.meta, title: item.title, delta: item.delta }))}
          rowKey={(row) => String(row.id)}
        />
      </SectionCard>

      <div className="mj-button-row mj-button-row--two">
        <ActionButton className="mj-record-white-action" disabled={history.length === 0} icon={<RotateCcw aria-hidden="true" />} variant="ghost" onClick={undo}>
          撤销上一条
        </ActionButton>
        <ActionButton className="mj-action-button--soft-danger" icon={<Trash2 aria-hidden="true" />} variant="ghost" onClick={clear}>
          清空本桌
        </ActionButton>
      </div>
    </div>
  );
}

type RecognitionStatus = 'idle' | 'recognizing' | 'ready' | 'missing' | 'error';

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

function imageFileFromClipboard(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files ?? []);
  const file = files.find((candidate) => candidate.type.startsWith('image/'));
  if (file) return file;

  const items = Array.from(event.clipboardData?.items ?? []);
  const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'));
  const blob = imageItem?.getAsFile();
  if (!blob) return null;

  return new File([blob], 'clipboard-image.png', { type: blob.type || 'image/png' });
}

export function HandRecognitionPage() {
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [tiles, setTiles] = useState<TileCode[]>([]);
  const [recognitionCandidates, setRecognitionCandidates] = useState<RecognitionDetection['candidates'][]>([]);
  const [detections, setDetections] = useState<RecognitionDetection[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [selectedRecognitionIndex, setSelectedRecognitionIndex] = useState<number | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setStatus('recognizing');
    setMessage('');
    setWarnings([]);
    setDetections([]);
    setRecognitionCandidates([]);
    setSelectedRecognitionIndex(null);

    try {
      const recognitionPromise = import('../domain/tileRecognition').then(({ recognizeTilesFromImage }) => recognizeTilesFromImage(file));
      const [preview, result] = await Promise.all([fileToDataUrl(file), recognitionPromise]);
      setImageDataUrl(preview);
      setTiles(result.tiles);
      setDetections(result.detections);
      setRecognitionCandidates(result.detections.map((detection) => detection.candidates));
      setWarnings(result.warnings);
      setElapsedMs(result.elapsedMs);
      setStatus(result.modelStatus === 'ready' ? 'ready' : result.modelStatus);
      setMessage(result.modelStatus === 'ready' ? '识别完成，请确认最终牌序' : '图片已载入，可用牌键盘手动录入');
    } catch (error) {
      try {
        setImageDataUrl(await fileToDataUrl(file));
      } catch {
        setImageDataUrl('');
      }
      setStatus('error');
      setElapsedMs(null);
      setWarnings([error instanceof Error ? error.message : '图片读取失败']);
      setMessage('图片处理失败，请换一张照片或手动录入');
    }
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const file = imageFileFromClipboard(event);
      if (!file) return;
      event.preventDefault();
      void handleFile(file);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleFile]);

  const selectedCandidateTiles =
    selectedRecognitionIndex === null ? [] : (recognitionCandidates[selectedRecognitionIndex] ?? []);

  const chooseRecognitionCandidate = (tile: TileCode) => {
    if (selectedRecognitionIndex === null) return;
    setTiles((value) => value.map((currentTile, index) => (index === selectedRecognitionIndex ? tile : currentTile)));
  };

  const isCandidateDisabled = (candidate: TileCode) => {
    if (selectedRecognitionIndex === null) return true;
    const candidateBase = baseTileCode(candidate);
    return tiles.filter((tile, index) => index !== selectedRecognitionIndex && baseTileCode(tile) === candidateBase).length >= 4;
  };

  const copyTiles = () => {
    const text = tiles.map(tileLabel).join(' ');
    void copyLocalText(text || '未选择牌', setMessage);
  };

  const removeTile = (index: number) => {
    setTiles((value) => value.filter((_, currentIndex) => currentIndex !== index));
    setRecognitionCandidates((value) => value.filter((_, currentIndex) => currentIndex !== index));
    setSelectedRecognitionIndex(null);
  };

  const setKeyboardTiles = (value: string[]) => {
    setTiles(toTileCodes(value));
    setSelectedRecognitionIndex(null);
  };

  const importToQuickScore = () => {
    window.location.hash = recognitionTilesToHash(tiles);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const statusAlert = useMemo(() => {
    if (status === 'recognizing') {
      return { tone: 'info' as const, title: '正在本地识别', text: '模型加载和推理都在浏览器内完成，照片不会上传。' };
    }
    if (status === 'missing') {
      return { tone: 'warning' as const, title: '模型尚未接入', text: '训练完成后把 ONNX 放到约定路径，本页会自动启用识别。' };
    }
    if (status === 'error') {
      return { tone: 'danger' as const, title: '识别失败', text: '可以换一张照片，或直接打开牌键盘手动录入。' };
    }
    if (status === 'ready') {
      return {
        tone: 'success' as const,
        title: '识别完成',
        text: elapsedMs === null ? '请确认候选和最终牌序。' : `识别用时 ${Math.round(elapsedMs)} ms，请确认候选和最终牌序。`,
      };
    }
    return null;
  }, [elapsedMs, status]);

  return (
    <div className="mj-page-stack mj-hand-recognition-page">
      <div className="mj-button-row mj-button-row--two">
        <label className="mj-upload-action">
          <Camera aria-hidden="true" />
          <span>拍照导入</span>
          <input accept="image/*" capture="environment" type="file" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>
        <label className="mj-upload-action mj-upload-action--secondary">
          <ImageIcon aria-hidden="true" />
          <span>相册选择</span>
          <input accept="image/*" type="file" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>
      </div>

      <SectionCard className="mj-recognition-preview-card">
        <div className={imageDataUrl ? 'mj-scan-preview mj-scan-preview--image' : 'mj-scan-preview'}>
          {imageDataUrl ? (
            <div className="mj-recognition-image-wrap">
              <img alt="待确认的手牌照片" src={imageDataUrl} />
              {detections.length > 0 ? (
                <div className="mj-recognition-box-layer" aria-hidden="true">
                  {detections.map((detection, index) => (
                    <span
                      key={`${detection.tile}-${index}`}
                      className="mj-recognition-box"
                      style={{
                        left: `${detection.box.x * 100}%`,
                        top: `${detection.box.y * 100}%`,
                        width: `${detection.box.width * 100}%`,
                        height: `${detection.box.height * 100}%`,
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <ScanFrameIcon />
          )}
          {!imageDataUrl ? <span>导入照片后在本地预览</span> : null}
          {status === 'recognizing' ? (
            <span className="mj-recognition-loading">
              <LoaderCircle aria-hidden="true" />
              正在识别
            </span>
          ) : null}
        </div>
      </SectionCard>

      {statusAlert ? (
        <Alert icon={status === 'recognizing' ? <LoaderCircle aria-hidden="true" /> : <AlertCircle aria-hidden="true" />} tone={statusAlert.tone} title={statusAlert.title}>
          {statusAlert.text}
        </Alert>
      ) : null}

      <SectionCard className="mj-recognition-result-card" title="最终牌序">
        {selectedCandidateTiles.length > 0 ? (
          <div aria-label="识别候选牌" className="mj-recognition-candidates">
            {selectedCandidateTiles.map((candidate) => {
              const percent = Math.round(candidate.confidence * 100);
              return (
                <button
                  key={candidate.tile}
                  className="mj-recognition-candidate-button"
                  disabled={isCandidateDisabled(candidate.tile)}
                  type="button"
                  onClick={() => chooseRecognitionCandidate(candidate.tile)}
                >
                  <MahjongTile
                    aria-hidden="true"
                    code={candidate.tile}
                    selected={tiles[selectedRecognitionIndex ?? -1] === candidate.tile}
                    size="lg"
                  />
                  <span>{percent}%</span>
                </button>
              );
            })}
          </div>
        ) : null}
        <TileStrip
          emptyLabel={null}
          highlightIndex={selectedRecognitionIndex}
          maxSlots={14}
          selectionMarker={null}
          tileSize="xs"
          tiles={tiles}
          onTileClick={recognitionCandidates.length > 0 ? setSelectedRecognitionIndex : undefined}
          onRemove={removeTile}
        />
        <ActionButton fullWidth icon={<Keyboard aria-hidden="true" />} onClick={() => setKeyboardOpen(true)}>
          打开牌键盘修正
        </ActionButton>
        <ActionButton disabled={tiles.length === 0} fullWidth icon={<Sparkles aria-hidden="true" />} onClick={importToQuickScore}>
          带入快速算分
        </ActionButton>
      </SectionCard>

      {warnings.length > 0 ? (
        <div className="mj-recognition-warning-list">
          {warnings.map((warning) => (
            <Alert key={warning} icon={<AlertCircle aria-hidden="true" />} tone="warning" title="识别提示">
              {warning}
            </Alert>
          ))}
        </div>
      ) : (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="info" title="本地处理">
          本页不会上传照片；牌序以你确认后的输入为准，同一物理牌最多 4 枚。
        </Alert>
      )}

      <ActionButton disabled={tiles.length === 0} fullWidth icon={<Copy aria-hidden="true" />} onClick={copyTiles}>
        复制最终牌序
      </ActionButton>
      {message ? <Alert tone="success">{message}</Alert> : null}

      <TileKeyboard
        allowRedFives
        maxTiles={14}
        open={keyboardOpen}
        previewLabel="最终牌序"
        tiles={tiles}
        title="修正实体手牌"
        isTileDisabled={hasFourPhysicalCopies}
        onChange={setKeyboardTiles}
        onClose={() => setKeyboardOpen(false)}
        onDone={() => setKeyboardOpen(false)}
      />
    </div>
  );
}

export function TileKeyboardDemoPage() {
  const [suit, setSuit] = useState<'m' | 'p' | 's' | 'z'>('m');
  const [tiles, setTiles] = useState<TileCode[]>([]);
  const [message, setMessage] = useState('');
  const gridTiles = useMemo(() => {
    if (suit === 'z') return ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7'] as TileCode[];
    return Array.from({ length: 9 }, (_, index) => `${suit}${index + 1}` as TileCode);
  }, [suit]);

  const addTile = (tile: TileCode) => {
    if (tiles.length >= 14 || hasFourPhysicalCopies(tile, tiles)) return;
    setTiles((value) => [...value, tile]);
  };

  const copyTiles = () => {
    void copyLocalText(tiles.join(' '), setMessage);
  };

  return (
    <div className="mj-page-stack mj-keyboard-demo-page">
      <SectionCard title="手牌预览">
        <TileStrip
          emptyLabel="点击下方牌面输入"
          maxSlots={14}
          tileSize="xs"
          tiles={tiles}
          onRemove={(index) => setTiles(tiles.filter((_, currentIndex) => currentIndex !== index))}
        />
      </SectionCard>
      {tiles.length >= 14 ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="最大张数限制">
          当前目标最多 14 张，请删除一张后再继续输入。
        </Alert>
      ) : null}
      <section className="mj-inline-keyboard" aria-label="牌输入键盘">
        <h2>选择手牌 {tiles.length}/14</h2>
        <SegmentedControl
          ariaLabel="选择花色"
          options={[
            { value: 'm', label: '万子' },
            { value: 'p', label: '筒子' },
            { value: 's', label: '索子' },
            { value: 'z', label: '字牌' },
          ]}
          value={suit}
          onChange={(value) => setSuit(value as 'm' | 'p' | 's' | 'z')}
        />
        <div className="mj-tile-choice-grid">
          {gridTiles.map((tile) => {
            const count = tiles.filter((value) => baseTileCode(value) === baseTileCode(tile)).length;
            return (
              <MahjongTile
                key={tile}
                code={tile}
                count={count > 0 ? count : undefined}
                disabled={tiles.length >= 14 || count >= 4}
                selected={count > 0}
                size="xl"
                onClick={() => addTile(tile)}
              />
            );
          })}
        </div>
        <div className="mj-tile-keyboard__actions">
          <ActionButton disabled={tiles.length === 0} icon={<Trash2 aria-hidden="true" />} variant="ghost" onClick={() => setTiles((value) => value.slice(0, -1))}>
            退格
          </ActionButton>
          <ActionButton className="mj-action-button--soft-danger" disabled={tiles.length === 0} icon={<Trash2 aria-hidden="true" />} variant="ghost" onClick={() => setTiles([])}>
            清空
          </ActionButton>
          <ActionButton disabled={tiles.length === 0} fullWidth icon={<Copy aria-hidden="true" />} onClick={copyTiles}>
            复制
          </ActionButton>
        </div>
      </section>
      {message ? <Alert tone="success">{message}</Alert> : null}
    </div>
  );
}

export function DesignedPlaceholderPage({ navigate }: PageProps) {
  return (
    <div className="mj-page-stack mj-placeholder-designed-page">
      <SectionCard title="没有匹配的页面">
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning">
          当前入口没有绑定到可用功能，请返回首页重新选择。
        </Alert>
      </SectionCard>
      <ActionButton fullWidth icon={<Home aria-hidden="true" />} onClick={() => navigate('home')}>
        返回首页
      </ActionButton>
    </div>
  );
}

function ScanFrameIcon() {
  return (
    <span className="mj-scan-frame" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
