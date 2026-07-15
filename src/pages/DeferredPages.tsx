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
  ContentSection,
  DataTable,
  FieldGroup,
  MahjongTile,
  PlaceholderPanel,
  SegmentedControl,
  SurfacePanel,
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
import { recognitionTilesToHash, type RecognitionScoreTarget } from '../domain/recognitionRouting';
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

function toTileCodes(values: string[]): TileCode[] {
  return values.filter(isTileCode);
}

function hasFourPhysicalCopies(tile: string, currentTiles: string[]) {
  if (!isTileCode(tile)) return true;
  const base = baseTileCode(tile);
  return currentTiles.filter((value) => isTileCode(value) && baseTileCode(value) === base).length >= 4;
}

function recognitionScoreTarget(hash: string): RecognitionScoreTarget {
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return 'quick-score';
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  return params.get('return') === 'legacy-score' ? 'legacy-score' : 'quick-score';
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
      <dl className="mj-table-record-stats">
        <div>
          <dt>局数</dt>
          <dd>{roundLabel(roundIndex)}</dd>
        </div>
        <div>
          <dt>本场</dt>
          <dd>{honba}本场</dd>
        </div>
        <div>
          <dt>合计</dt>
          <dd>{totalScore.toLocaleString('zh-CN')}</dd>
        </div>
      </dl>

      <ContentSection aria-label="四人桌玩家点数" className="mj-table-seat-section">
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
      </ContentSection>

      <FieldGroup className="mj-round-record-group" legend="记录一手">
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
      </FieldGroup>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone={totalScore === 100000 ? 'success' : 'warning'} title="总点校验">
        当前玩家合计 {totalScore.toLocaleString('zh-CN')} 点。
      </Alert>

      <ContentSection className="mj-history-section" title="历史流水">
        <DataTable
          columns={[
            { id: 'meta', header: '局' },
            { id: 'title', header: '内容' },
            { id: 'delta', header: '变动', align: 'right' },
          ]}
          rows={history.map((item) => ({ id: item.id, meta: item.meta, title: item.title, delta: item.delta }))}
          rowKey={(row) => String(row.id)}
        />
      </ContentSection>

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
  const scoreTarget = recognitionScoreTarget(window.location.hash);
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

  const importToScore = () => {
    window.location.hash = recognitionTilesToHash(tiles, scoreTarget);
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

      <SurfacePanel aria-label="手牌照片预览" className="mj-recognition-preview">
        <div className={imageDataUrl ? 'mj-scan-preview mj-scan-preview--image' : 'mj-scan-preview mj-scan-preview--empty'}>
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
      </SurfacePanel>

      {statusAlert ? (
        <Alert icon={status === 'recognizing' ? <LoaderCircle aria-hidden="true" /> : <AlertCircle aria-hidden="true" />} tone={statusAlert.tone} title={statusAlert.title}>
          {statusAlert.text}
        </Alert>
      ) : null}

      <ContentSection className="mj-recognition-result-section" title="最终牌序">
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
        <ActionButton disabled={tiles.length === 0} fullWidth icon={<Sparkles aria-hidden="true" />} onClick={importToScore}>
          {scoreTarget === 'legacy-score' ? '带入古役算分' : '带入快速算分'}
        </ActionButton>
      </ContentSection>

      {warnings.length > 0 ? (
        <div className="mj-recognition-warning-list">
          {warnings.map((warning) => (
            <Alert key={warning} icon={<AlertCircle aria-hidden="true" />} tone="warning" title="识别提示">
              {warning}
            </Alert>
          ))}
        </div>
      ) : null}

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
      <ContentSection title="手牌预览">
        <TileStrip
          emptyLabel="点击下方牌面输入"
          maxSlots={14}
          tileSize="xs"
          tiles={tiles}
          onRemove={(index) => setTiles(tiles.filter((_, currentIndex) => currentIndex !== index))}
        />
      </ContentSection>
      {tiles.length >= 14 ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="最大张数限制">
          当前目标最多 14 张，请删除一张后再继续输入。
        </Alert>
      ) : null}
      <FieldGroup className="mj-inline-keyboard" legend={`选择手牌 ${tiles.length}/14`}>
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
      </FieldGroup>
      {message ? <Alert tone="success">{message}</Alert> : null}
    </div>
  );
}

export function DesignedPlaceholderPage({ navigate }: PageProps) {
  return (
    <div className="mj-page-stack mj-placeholder-designed-page">
      <PlaceholderPanel
        description="当前入口没有绑定到可用功能，请返回快速算分或选择其他底部功能。"
        icon={<AlertCircle aria-hidden="true" />}
        statusLabel="未找到"
        title="没有匹配的页面"
      />
      <ActionButton fullWidth icon={<Home aria-hidden="true" />} onClick={() => navigate('quick-score')}>
        返回快速算分
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
