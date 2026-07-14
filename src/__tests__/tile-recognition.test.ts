import { describe, expect, it } from 'vitest';

import { recognitionTilesToHash } from '../domain/recognitionRouting';
import { parseQuickScoreTileImport } from '../pages/QuickScorePage';
import {
  RIICHI_TILE_YOLO_LABELS,
  buildRecognitionResult,
  makeLetterboxInfo,
  nonMaxSuppression,
  parseYoloDetections,
  sortDetectionsForHand,
  tileCodeToYoloLabel,
  yoloLabelToTileCode,
  type RecognitionDetection,
} from '../domain/tileRecognition';

const ATTRIBUTE_COUNT = RIICHI_TILE_YOLO_LABELS.length + 4;

function makeChannelsFirstOutput(detections: Array<{ x: number; y: number; w: number; h: number; classIndex: number; confidence: number }>) {
  const data = new Float32Array(ATTRIBUTE_COUNT * detections.length);

  detections.forEach((detection, detectionIndex) => {
    [detection.x, detection.y, detection.w, detection.h].forEach((value, attributeIndex) => {
      data[attributeIndex * detections.length + detectionIndex] = value;
    });
    data[(4 + detection.classIndex) * detections.length + detectionIndex] = detection.confidence;
  });

  return data;
}

function makeChannelsLastOutput(detections: Array<{ x: number; y: number; w: number; h: number; classIndex: number; confidence: number }>) {
  const data = new Float32Array(ATTRIBUTE_COUNT * detections.length);

  detections.forEach((detection, detectionIndex) => {
    const offset = detectionIndex * ATTRIBUTE_COUNT;
    data[offset] = detection.x;
    data[offset + 1] = detection.y;
    data[offset + 2] = detection.w;
    data[offset + 3] = detection.h;
    data[offset + 4 + detection.classIndex] = detection.confidence;
  });

  return data;
}

function detection(tile: RecognitionDetection['tile'], x: number, confidence = 0.9): RecognitionDetection {
  return {
    tile,
    confidence,
    box: { x, y: 0.2, width: 0.1, height: 0.3 },
    candidates: [{ tile, confidence }],
  };
}

describe('tile recognition pipeline', () => {
  it('maps fixed YOLO labels to local tile codes, including red fives', () => {
    expect(yoloLabelToTileCode('0m')).toBe('m5r');
    expect(yoloLabelToTileCode('0p')).toBe('p5r');
    expect(yoloLabelToTileCode('0s')).toBe('s5r');
    expect(yoloLabelToTileCode('7z')).toBe('z7');
    expect(tileCodeToYoloLabel('m5r')).toBe('0m');
    expect(tileCodeToYoloLabel('p9')).toBe('9p');
  });

  it('parses channels-first Ultralytics output and sorts detections by hand order', () => {
    const letterbox = makeLetterboxInfo(640, 640);
    const data = makeChannelsFirstOutput([
      { x: 420, y: 320, w: 80, h: 110, classIndex: 4, confidence: 0.85 },
      { x: 210, y: 320, w: 80, h: 110, classIndex: 0, confidence: 0.95 },
    ]);

    const parsed = parseYoloDetections({ data, dims: [1, ATTRIBUTE_COUNT, 2], letterbox });
    expect(parsed.map((entry) => entry.tile)).toEqual(['p1', 'm5r']);
    expect(sortDetectionsForHand(parsed).map((entry) => entry.tile)).toEqual(['m5r', 'p1']);
  });

  it('parses channels-last output and applies class-agnostic NMS', () => {
    const letterbox = makeLetterboxInfo(640, 640);
    const data = makeChannelsLastOutput([
      { x: 320, y: 320, w: 100, h: 120, classIndex: 10, confidence: 0.9 },
      { x: 322, y: 322, w: 100, h: 120, classIndex: 11, confidence: 0.6 },
    ]);

    const parsed = parseYoloDetections({ data, dims: [1, 2, ATTRIBUTE_COUNT], letterbox });
    expect(parsed.map((entry) => entry.tile)).toEqual(['z2', 'm3']);
    expect(nonMaxSuppression(parsed, 0.45).map((entry) => entry.tile)).toEqual(['z2']);
  });

  it('builds warnings for truncated and physically impossible detections', () => {
    const letterbox = makeLetterboxInfo(640, 640);
    const repeatedM1 = Array.from({ length: 15 }, (_, index) => ({
      x: 35 + index * 40,
      y: 320,
      w: 35,
      h: 70,
      classIndex: 3,
      confidence: 0.9,
    }));

    const result = buildRecognitionResult({
      outputData: makeChannelsFirstOutput(repeatedM1),
      outputDims: [1, ATTRIBUTE_COUNT, repeatedM1.length],
      letterbox,
      confidenceThreshold: 0.35,
      iouThreshold: 0.1,
      maxTiles: 14,
      elapsedMs: 12,
    });

    expect(result.tiles).toHaveLength(14);
    expect(result.warnings.some((warning) => warning.includes('已保留前 14 张'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('超过 4 枚'))).toBe(true);
  });

  it('round-trips recognition tiles into the quick-score import hash', () => {
    const hash = recognitionTilesToHash(['m1', 'm2', 'm5r', 'z7']);
    expect(hash).toBe('#/quick-score?tiles=m1%2Cm2%2Cm5r%2Cz7');
    expect(parseQuickScoreTileImport(hash)).toEqual(['m1', 'm2', 'm5r', 'z7']);
    expect(parseQuickScoreTileImport('#/quick-score?tiles=m1,bad,z7')).toEqual(['m1', 'z7']);
    expect(recognitionTilesToHash(['m1', 'z7'], 'legacy-score')).toBe('#/legacy-score?tiles=m1%2Cz7');
  });

  it('sorts detections only by horizontal position', () => {
    const sorted = sortDetectionsForHand([
      detection('p1', 0.4),
      { ...detection('m2', 0.2), box: { x: 0.2, y: 0.62, width: 0.1, height: 0.2 } },
      detection('m1', 0.1),
    ]);

    expect(sorted.map((entry) => entry.tile)).toEqual(['m1', 'm2', 'p1']);
  });
});
