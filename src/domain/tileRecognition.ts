import * as ort from 'onnxruntime-web/wasm';
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';

import {
  ALL_TILE_CODES,
  baseTileCode,
  isTileCode,
  type BaseTileCode,
  type TileCode,
} from './tiles';

export const DEFAULT_RECOGNITION_MODEL_URL = '/models/riichi-tile-yolo/riichi-37-yolo11n-640.onnx';
export const DEFAULT_RECOGNITION_IMAGE_SIZE = 640;
export const DEFAULT_RECOGNITION_CONFIDENCE = 0.35;
export const DEFAULT_RECOGNITION_IOU = 0.45;
export const DEFAULT_RECOGNITION_MAX_TILES = 14;

export const RIICHI_TILE_YOLO_LABELS = [
  '0m',
  '0p',
  '0s',
  '1m',
  '1p',
  '1s',
  '1z',
  '2m',
  '2p',
  '2s',
  '2z',
  '3m',
  '3p',
  '3s',
  '3z',
  '4m',
  '4p',
  '4s',
  '4z',
  '5m',
  '5p',
  '5s',
  '5z',
  '6m',
  '6p',
  '6s',
  '6z',
  '7m',
  '7p',
  '7s',
  '7z',
  '8m',
  '8p',
  '8s',
  '9m',
  '9p',
  '9s',
] as const;

export type RiichiTileYoloLabel = (typeof RIICHI_TILE_YOLO_LABELS)[number];
export type RecognitionModelStatus = 'ready' | 'missing' | 'error';

export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecognitionCandidate {
  tile: TileCode;
  confidence: number;
}

export interface RecognitionDetection {
  tile: TileCode;
  confidence: number;
  box: NormalizedBox;
  candidates: RecognitionCandidate[];
}

export interface RecognitionResult {
  tiles: TileCode[];
  detections: RecognitionDetection[];
  warnings: string[];
  imageSize: {
    width: number;
    height: number;
  };
  elapsedMs: number;
  modelStatus: RecognitionModelStatus;
}

export interface RecognitionOptions {
  modelUrl: string;
  imageSize: number;
  confidenceThreshold: number;
  iouThreshold: number;
  maxTiles: number;
}

export interface LetterboxInfo {
  targetSize: number;
  originalWidth: number;
  originalHeight: number;
  scale: number;
  padX: number;
  padY: number;
  scaledWidth: number;
  scaledHeight: number;
}

interface ParsedYoloParams {
  data: ArrayLike<number>;
  dims: readonly number[];
  letterbox: LetterboxInfo;
  confidenceThreshold?: number;
}

interface RecognitionPipelineParams {
  outputData: ArrayLike<number>;
  outputDims: readonly number[];
  letterbox: LetterboxInfo;
  confidenceThreshold: number;
  iouThreshold: number;
  maxTiles: number;
  elapsedMs: number;
}

type RawDetection = RecognitionDetection & {
  rawCenterX: number;
  rawCenterY: number;
};

const DEFAULT_RECOGNITION_OPTIONS: RecognitionOptions = {
  modelUrl: DEFAULT_RECOGNITION_MODEL_URL,
  imageSize: DEFAULT_RECOGNITION_IMAGE_SIZE,
  confidenceThreshold: DEFAULT_RECOGNITION_CONFIDENCE,
  iouThreshold: DEFAULT_RECOGNITION_IOU,
  maxTiles: DEFAULT_RECOGNITION_MAX_TILES,
};

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let sessionModelUrl = '';
let ortConfigured = false;

export function yoloLabelToTileCode(label: string): TileCode | null {
  if (label === '0m') return 'm5r';
  if (label === '0p') return 'p5r';
  if (label === '0s') return 's5r';

  const match = /^([1-9])([mpsz])$/.exec(label);
  if (!match) return null;

  const [, rank, suit] = match;
  const code = `${suit}${rank}`;
  return isTileCode(code) ? code : null;
}

export function tileCodeToYoloLabel(tile: TileCode): RiichiTileYoloLabel {
  if (tile === 'm5r') return '0m';
  if (tile === 'p5r') return '0p';
  if (tile === 's5r') return '0s';
  const label = `${tile[1]}${tile[0]}`;
  if (!RIICHI_TILE_YOLO_LABELS.includes(label as RiichiTileYoloLabel)) {
    throw new Error(`Unsupported tile for YOLO label mapping: ${tile}`);
  }
  return label as RiichiTileYoloLabel;
}

export function makeLetterboxInfo(width: number, height: number, targetSize = DEFAULT_RECOGNITION_IMAGE_SIZE): LetterboxInfo {
  const scale = Math.min(targetSize / width, targetSize / height);
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);

  return {
    targetSize,
    originalWidth: width,
    originalHeight: height,
    scale,
    padX: (targetSize - scaledWidth) / 2,
    padY: (targetSize - scaledHeight) / 2,
    scaledWidth,
    scaledHeight,
  };
}

export function parseYoloDetections({
  data,
  dims,
  letterbox,
  confidenceThreshold = DEFAULT_RECOGNITION_CONFIDENCE,
}: ParsedYoloParams): RecognitionDetection[] {
  const output = describeYoloOutput(dims);
  if (!output) return [];

  const coordinateScale = inferCoordinateScale(data, output, letterbox.targetSize);
  const detections: RecognitionDetection[] = [];

  for (let index = 0; index < output.detectionCount; index += 1) {
    const x = readYoloValue(data, output, index, 0) * coordinateScale;
    const y = readYoloValue(data, output, index, 1) * coordinateScale;
    const width = readYoloValue(data, output, index, 2) * coordinateScale;
    const height = readYoloValue(data, output, index, 3) * coordinateScale;
    const objectness = output.classOffset === 5 ? readYoloValue(data, output, index, 4) : 1;
    const candidates = topClassCandidates(data, output, index, objectness);
    const topCandidate = candidates[0];

    if (!topCandidate || topCandidate.confidence < confidenceThreshold) continue;

    detections.push({
      tile: topCandidate.tile,
      confidence: topCandidate.confidence,
      box: yoloBoxToNormalizedBox({ x, y, width, height }, letterbox),
      candidates,
    });
  }

  return detections.filter((detection) => detection.box.width > 0 && detection.box.height > 0);
}

export function nonMaxSuppression(detections: readonly RecognitionDetection[], iouThreshold = DEFAULT_RECOGNITION_IOU): RecognitionDetection[] {
  const sorted = [...detections].sort((left, right) => right.confidence - left.confidence);
  const kept: RecognitionDetection[] = [];

  for (const detection of sorted) {
    if (kept.every((current) => boxIou(current.box, detection.box) <= iouThreshold)) {
      kept.push(detection);
    }
  }

  return kept;
}

export function sortDetectionsForHand(detections: readonly RecognitionDetection[]): RecognitionDetection[] {
  return [...detections].sort((left, right) => centerX(left.box) - centerX(right.box));
}

export function buildRecognitionResult({
  outputData,
  outputDims,
  letterbox,
  confidenceThreshold,
  iouThreshold,
  maxTiles,
  elapsedMs,
}: RecognitionPipelineParams): RecognitionResult {
  const parsed = parseYoloDetections({
    data: outputData,
    dims: outputDims,
    letterbox,
    confidenceThreshold,
  });
  const suppressed = nonMaxSuppression(parsed, iouThreshold);
  const ordered = sortDetectionsForHand(suppressed);
  const detections = ordered.slice(0, maxTiles);
  const tiles = detections.map((detection) => detection.tile);
  const warnings = buildRecognitionWarnings({
    detections,
    parsedCount: parsed.length,
    orderedCount: ordered.length,
    maxTiles,
  });

  return {
    tiles,
    detections,
    warnings,
    imageSize: { width: letterbox.originalWidth, height: letterbox.originalHeight },
    elapsedMs,
    modelStatus: 'ready',
  };
}

export async function recognizeTilesFromImage(
  file: File,
  partialOptions: Partial<RecognitionOptions> = {},
): Promise<RecognitionResult> {
  const startedAt = performance.now();
  const options = { ...DEFAULT_RECOGNITION_OPTIONS, ...partialOptions };
  const decoded = await decodeImageFile(file, options.imageSize);

  try {
    const session = await getRecognitionSession(options.modelUrl);
    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];
    const feeds: Record<string, ort.Tensor> = {
      [inputName]: new ort.Tensor('float32', decoded.tensorData, [1, 3, options.imageSize, options.imageSize]),
    };
    const outputs = await session.run(feeds);
    const output = outputs[outputName] ?? Object.values(outputs)[0];

    if (!(output instanceof ort.Tensor)) {
      throw new Error('ONNX 模型没有返回可解析的张量');
    }

    return buildRecognitionResult({
      outputData: output.data as ArrayLike<number>,
      outputDims: output.dims,
      letterbox: decoded.letterbox,
      confidenceThreshold: options.confidenceThreshold,
      iouThreshold: options.iouThreshold,
      maxTiles: options.maxTiles,
      elapsedMs: performance.now() - startedAt,
    });
  } catch (error) {
    const modelStatus = isModelMissingError(error) ? 'missing' : 'error';
    return {
      tiles: [],
      detections: [],
      warnings: [
        modelStatus === 'missing'
          ? 'ONNX 模型尚未放入 public/models/riichi-tile-yolo/，可以先用牌键盘手动录入。'
          : `识别模型运行失败：${error instanceof Error ? error.message : '未知错误'}`,
      ],
      imageSize: { width: decoded.letterbox.originalWidth, height: decoded.letterbox.originalHeight },
      elapsedMs: performance.now() - startedAt,
      modelStatus,
    };
  }
}

function configureOrtRuntime() {
  if (ortConfigured) return;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = { wasm: ortWasmUrl };
  ortConfigured = true;
}

async function getRecognitionSession(modelUrl: string) {
  configureOrtRuntime();

  if (sessionPromise && sessionModelUrl === modelUrl) return sessionPromise;

  sessionModelUrl = modelUrl;
  sessionPromise = ort.InferenceSession.create(modelUrl, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  }).catch((error) => {
    sessionPromise = null;
    throw error;
  });

  return sessionPromise;
}

async function decodeImageFile(file: File, imageSize: number) {
  const bitmap = await createImageBitmap(file);
  const letterbox = makeLetterboxInfo(bitmap.width, bitmap.height, imageSize);
  const canvas = document.createElement('canvas');
  canvas.width = imageSize;
  canvas.height = imageSize;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('当前浏览器无法读取图片像素');

  context.fillStyle = 'rgb(114, 114, 114)';
  context.fillRect(0, 0, imageSize, imageSize);
  context.drawImage(bitmap, letterbox.padX, letterbox.padY, letterbox.scaledWidth, letterbox.scaledHeight);

  const pixels = context.getImageData(0, 0, imageSize, imageSize).data;
  const area = imageSize * imageSize;
  const tensorData = new Float32Array(area * 3);

  for (let pixelIndex = 0; pixelIndex < area; pixelIndex += 1) {
    const imageIndex = pixelIndex * 4;
    tensorData[pixelIndex] = pixels[imageIndex] / 255;
    tensorData[area + pixelIndex] = pixels[imageIndex + 1] / 255;
    tensorData[area * 2 + pixelIndex] = pixels[imageIndex + 2] / 255;
  }

  bitmap.close();
  return { letterbox, tensorData };
}

function isModelMissingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /404|failed to fetch|fetch failed|failed to load external data file|network/i.test(message);
}

function buildRecognitionWarnings({
  detections,
  parsedCount,
  orderedCount,
  maxTiles,
}: {
  detections: readonly RecognitionDetection[];
  parsedCount: number;
  orderedCount: number;
  maxTiles: number;
}) {
  const warnings: string[] = [];

  if (parsedCount === 0) {
    warnings.push('没有识别到置信度足够的牌，请换一张更清晰、横向裁切的照片。');
  }
  if (orderedCount > maxTiles) {
    warnings.push(`识别到 ${orderedCount} 张牌，已保留前 ${maxTiles} 张，请确认是否包含副露或背景牌。`);
  }
  if (detections.length > 0 && detections.length < 13) {
    warnings.push(`只识别到 ${detections.length} 张牌，请确认照片是否拍完整。`);
  }
  const counts = new Map<BaseTileCode, number>();
  for (const detection of detections) {
    const base = baseTileCode(detection.tile);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  const duplicates = [...counts.entries()].filter(([, count]) => count > 4);
  if (duplicates.length > 0) {
    warnings.push(`存在超过 4 枚的物理牌：${duplicates.map(([tile]) => tile).join('、')}，请手动修正。`);
  }

  if (detections.some((detection) => detection.confidence < 0.5)) {
    warnings.push('部分牌置信度偏低，建议点选牌面查看候选并修正。');
  }

  return warnings;
}

function topClassCandidates(data: ArrayLike<number>, output: YoloOutputDescription, detectionIndex: number, objectness: number): RecognitionCandidate[] {
  const candidates: RecognitionCandidate[] = [];

  for (let classIndex = 0; classIndex < output.classCount; classIndex += 1) {
    const label = RIICHI_TILE_YOLO_LABELS[classIndex];
    const tile = yoloLabelToTileCode(label);
    if (!tile) continue;
    const confidence = readYoloValue(data, output, detectionIndex, output.classOffset + classIndex) * objectness;
    candidates.push({ tile, confidence });
  }

  return candidates.sort((left, right) => right.confidence - left.confidence).slice(0, 3);
}

interface YoloOutputDescription {
  detectionCount: number;
  attributeCount: number;
  classCount: number;
  classOffset: 4 | 5;
  layout: 'channels-first' | 'channels-last';
}

function describeYoloOutput(dims: readonly number[]): YoloOutputDescription | null {
  const normalizedDims = dims.filter((dimension) => dimension > 1);
  if (normalizedDims.length < 2) return null;

  const first = normalizedDims[0];
  const second = normalizedDims[1];

  if (isYoloAttributeCount(first)) {
    return {
      detectionCount: second,
      attributeCount: first,
      classCount: first - (first === RIICHI_TILE_YOLO_LABELS.length + 5 ? 5 : 4),
      classOffset: first === RIICHI_TILE_YOLO_LABELS.length + 5 ? 5 : 4,
      layout: 'channels-first',
    };
  }

  if (isYoloAttributeCount(second)) {
    return {
      detectionCount: first,
      attributeCount: second,
      classCount: second - (second === RIICHI_TILE_YOLO_LABELS.length + 5 ? 5 : 4),
      classOffset: second === RIICHI_TILE_YOLO_LABELS.length + 5 ? 5 : 4,
      layout: 'channels-last',
    };
  }

  return null;
}

function isYoloAttributeCount(count: number) {
  return count === RIICHI_TILE_YOLO_LABELS.length + 4 || count === RIICHI_TILE_YOLO_LABELS.length + 5;
}

function readYoloValue(data: ArrayLike<number>, output: YoloOutputDescription, detectionIndex: number, attributeIndex: number) {
  if (output.layout === 'channels-first') {
    return data[attributeIndex * output.detectionCount + detectionIndex] ?? 0;
  }
  return data[detectionIndex * output.attributeCount + attributeIndex] ?? 0;
}

function inferCoordinateScale(data: ArrayLike<number>, output: YoloOutputDescription, targetSize: number) {
  let maxCoordinate = 0;
  const sampleCount = Math.min(output.detectionCount, 50);

  for (let detectionIndex = 0; detectionIndex < sampleCount; detectionIndex += 1) {
    for (let attributeIndex = 0; attributeIndex < 4; attributeIndex += 1) {
      maxCoordinate = Math.max(maxCoordinate, Math.abs(readYoloValue(data, output, detectionIndex, attributeIndex)));
    }
  }

  return maxCoordinate <= 2 ? targetSize : 1;
}

function yoloBoxToNormalizedBox(
  box: { x: number; y: number; width: number; height: number },
  letterbox: LetterboxInfo,
): NormalizedBox {
  const x1 = (box.x - box.width / 2 - letterbox.padX) / letterbox.scale;
  const y1 = (box.y - box.height / 2 - letterbox.padY) / letterbox.scale;
  const x2 = (box.x + box.width / 2 - letterbox.padX) / letterbox.scale;
  const y2 = (box.y + box.height / 2 - letterbox.padY) / letterbox.scale;

  const left = clamp(x1 / letterbox.originalWidth);
  const top = clamp(y1 / letterbox.originalHeight);
  const right = clamp(x2 / letterbox.originalWidth);
  const bottom = clamp(y2 / letterbox.originalHeight);

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function boxIou(left: NormalizedBox, right: NormalizedBox) {
  const leftX2 = left.x + left.width;
  const leftY2 = left.y + left.height;
  const rightX2 = right.x + right.width;
  const rightY2 = right.y + right.height;
  const intersectionX1 = Math.max(left.x, right.x);
  const intersectionY1 = Math.max(left.y, right.y);
  const intersectionX2 = Math.min(leftX2, rightX2);
  const intersectionY2 = Math.min(leftY2, rightY2);
  const intersection = Math.max(0, intersectionX2 - intersectionX1) * Math.max(0, intersectionY2 - intersectionY1);
  const leftArea = left.width * left.height;
  const rightArea = right.width * right.height;
  const union = leftArea + rightArea - intersection;

  return union <= 0 ? 0 : intersection / union;
}

function centerX(box: NormalizedBox) {
  return box.x + box.width / 2;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function recognitionTilesToHash(tiles: readonly TileCode[]) {
  const params = new URLSearchParams({ tiles: tiles.filter((tile) => ALL_TILE_CODES.includes(tile)).join(',') });
  return `#/quick-score?${params.toString()}`;
}
