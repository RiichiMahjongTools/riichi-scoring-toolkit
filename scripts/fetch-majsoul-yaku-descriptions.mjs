import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const BASE_URL = 'https://game.maj-soul.com/1';
const DEFAULT_OUTPUT = 'src/data/majsoul-yaku-descriptions.json';
const textDecoder = new TextDecoder();

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchBytes(url, attempts = 5) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'accept-encoding': 'identity',
          'user-agent': 'mahjong-3-yaku-fetcher/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      const expectedLength = Number(response.headers.get('content-length'));
      if (Number.isFinite(expectedLength) && expectedLength > 0 && bytes.length !== expectedLength) {
        throw new Error(`incomplete response: received ${bytes.length} of ${expectedLength} bytes`);
      }

      return bytes;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(attempt * 750);
      }
    }
  }

  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? lastError}`);
}

async function fetchJson(url) {
  return JSON.parse(textDecoder.decode(await fetchBytes(url)));
}

function readVarint(buffer, state) {
  let value = 0n;
  let shift = 0n;

  while (state.offset < buffer.length) {
    const byte = BigInt(buffer[state.offset]);
    state.offset += 1;
    value |= (byte & 0x7fn) << shift;

    if ((byte & 0x80n) === 0n) {
      return value;
    }

    shift += 7n;
    if (shift > 70n) {
      throw new Error('Invalid protobuf varint');
    }
  }

  throw new Error('Unexpected end of protobuf varint');
}

function decodeMessage(buffer) {
  const state = { offset: 0 };
  const fields = new Map();

  while (state.offset < buffer.length) {
    const tag = Number(readVarint(buffer, state));
    const fieldNumber = tag >>> 3;
    const wireType = tag & 0x07;
    let value;

    if (fieldNumber === 0) {
      throw new Error('Invalid protobuf field number 0');
    }

    if (wireType === 0) {
      value = readVarint(buffer, state);
    } else if (wireType === 1) {
      const end = state.offset + 8;
      if (end > buffer.length) throw new Error('Unexpected end of fixed64 field');
      value = buffer.subarray(state.offset, end);
      state.offset = end;
    } else if (wireType === 2) {
      const length = Number(readVarint(buffer, state));
      const end = state.offset + length;
      if (end > buffer.length) throw new Error('Unexpected end of length-delimited field');
      value = buffer.subarray(state.offset, end);
      state.offset = end;
    } else if (wireType === 5) {
      const end = state.offset + 4;
      if (end > buffer.length) throw new Error('Unexpected end of fixed32 field');
      value = buffer.subarray(state.offset, end);
      state.offset = end;
    } else {
      throw new Error(`Unsupported protobuf wire type ${wireType}`);
    }

    const values = fields.get(fieldNumber) ?? [];
    values.push({ wireType, value });
    fields.set(fieldNumber, values);
  }

  return fields;
}

function valuesAt(message, fieldNumber) {
  return message.get(fieldNumber) ?? [];
}

function firstValue(message, fieldNumber) {
  return valuesAt(message, fieldNumber)[0]?.value;
}

function decodeString(value) {
  return value ? textDecoder.decode(value) : '';
}

function decodeUnsigned(value) {
  return value === undefined ? 0 : Number(value);
}

function parseFieldSchema(buffer) {
  const message = decodeMessage(buffer);
  return {
    name: decodeString(firstValue(message, 1)),
    arrayLength: decodeUnsigned(firstValue(message, 2)),
    protobufType: decodeString(firstValue(message, 3)),
    protobufIndex: decodeUnsigned(firstValue(message, 4)),
  };
}

function parseSheetSchema(buffer) {
  const message = decodeMessage(buffer);
  return {
    name: decodeString(firstValue(message, 1)),
    fields: valuesAt(message, 3).map(({ value }) => parseFieldSchema(value)),
  };
}

function parseTableSchema(buffer) {
  const message = decodeMessage(buffer);
  return {
    name: decodeString(firstValue(message, 1)),
    sheets: valuesAt(message, 2).map(({ value }) => parseSheetSchema(value)),
  };
}

function parseSheetData(buffer) {
  const message = decodeMessage(buffer);
  return {
    table: decodeString(firstValue(message, 1)),
    sheet: decodeString(firstValue(message, 2)),
    rows: valuesAt(message, 3).map(({ value }) => value),
  };
}

function decodeFixedNumber(value, byteLength, method) {
  if (!value || value.length !== byteLength) return 0;
  return new DataView(value.buffer, value.byteOffset, value.byteLength)[method](0, true);
}

function decodeSchemaValue(field, wireValue) {
  const { protobufType } = field;
  const value = wireValue?.value;

  if (protobufType === 'string') return decodeString(value);
  if (protobufType === 'bytes') return value ? Buffer.from(value).toString('base64') : '';
  if (protobufType === 'bool') return Boolean(decodeUnsigned(value));
  if (protobufType === 'float') return decodeFixedNumber(value, 4, 'getFloat32');
  if (protobufType === 'double') return decodeFixedNumber(value, 8, 'getFloat64');
  return decodeUnsigned(value);
}

function decodeRow(buffer, schema) {
  const message = decodeMessage(buffer);
  const row = {};

  for (const field of schema.fields) {
    const values = valuesAt(message, field.protobufIndex);
    row[field.name] = field.arrayLength
      ? values.map((value) => decodeSchemaValue(field, value))
      : decodeSchemaValue(field, values[0]);
  }

  return row;
}

function modeName(mode) {
  if (mode === 0) return 'riichi';
  if (mode === 1) return 'sichuan';
  return `mode-${mode}`;
}

function categoryName(tag, mode) {
  if (mode === 1) {
    return {
      1: 'one-han',
      2: 'two-han',
      3: 'three-han',
      4: 'four-han',
      5: 'five-han',
      6: 'six-han',
    }[tag] ?? `tag-${tag}`;
  }

  return {
    1: 'one-han',
    2: 'two-han',
    3: 'three-han',
    4: 'six-han',
    5: 'mangan',
    6: 'yakuman',
    7: 'double-yakuman',
    8: 'draw',
  }[tag] ?? `tag-${tag}`;
}

async function main() {
  const outputPath = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_OUTPUT);
  const versionInfo = await fetchJson(`${BASE_URL}/version.json`);
  const manifestUrl = `${BASE_URL}/resversion${versionInfo.version}.json`;
  const manifest = await fetchJson(manifestUrl);
  const configResource = manifest.res?.['res/config/lqc.lqbin'];

  if (!configResource?.prefix) {
    throw new Error('res/config/lqc.lqbin is missing from the official resource manifest');
  }

  const configUrl = `${BASE_URL}/${configResource.prefix}/res/config/lqc.lqbin`;
  const configMessage = decodeMessage(await fetchBytes(configUrl));
  const schemas = valuesAt(configMessage, 3).map(({ value }) => parseTableSchema(value));
  const sheets = valuesAt(configMessage, 4).map(({ value }) => parseSheetData(value));
  const fanDescSchema = schemas
    .find(({ name }) => name === 'fandesc')
    ?.sheets.find(({ name }) => name === 'fandesc');
  const fanDescData = sheets.find(({ table, sheet }) => table === 'fandesc' && sheet === 'fandesc');

  if (!fanDescSchema || !fanDescData) {
    throw new Error('fandesc.fandesc was not found in the official config bundle');
  }

  const entries = fanDescData.rows
    .map((row) => decodeRow(row, fanDescSchema))
    .map((row) => ({
      id: row.id,
      tag: row.tag,
      category: categoryName(row.tag, row.mode),
      mode: modeName(row.mode),
      name: row.name_chs,
      description: row.desc_chs,
      note: row.desc2_chs,
      example: row.case,
      visible: Boolean(row.show),
    }));

  const ids = new Set(entries.map(({ id }) => id));
  const malformedEntry = entries.find(({ id, name, description }) => (
    !Number.isInteger(id) || !name || !description
  ));
  if (entries.length === 0 || ids.size !== entries.length || malformedEntry) {
    throw new Error('The decoded fandesc table failed integrity checks');
  }

  const result = {
    source: {
      provider: '雀魂',
      clientVersion: versionInfo.version,
      resourceVersion: configResource.prefix,
      manifestUrl,
      configUrl,
      table: 'fandesc.fandesc',
      fetchedAt: new Date().toISOString(),
    },
    summary: {
      total: entries.length,
      riichi: entries.filter(({ mode }) => mode === 'riichi').length,
      sichuan: entries.filter(({ mode }) => mode === 'sichuan').length,
    },
    entries,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${entries.length} descriptions to ${outputPath}`);
}

await main();
