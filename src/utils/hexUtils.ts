/**
 * Hex and NFC Utility Functions
 */
import { Ndef } from 'react-native-nfc-manager';
import { NDEFRecord } from '../types';

// ============================================================
//  Bytes / Hex Conversion
// ============================================================

export const bytesToHex = (bytes: number[], separator = ':'): string => {
  return bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(separator);
};

export const hexToBytes = (hex: string): number[] => {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
  const result: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    result.push(parseInt(clean.substring(i, i + 2), 16));
  }
  return result;
};

export const formatUID = (id: number[] | string): string => {
  if (typeof id === 'string') return id;
  return bytesToHex(id, ':');
};

// ============================================================
//  Hex Dump Formatter
// ============================================================

export interface HexDumpLine {
  offset: string;
  hexPart: string;
  hexBytes: Array<{ value: string; highlight: boolean }>;
  asciiPart: string;
}

export const formatHexDump = (bytes: number[], highlightOffsets?: number[]): HexDumpLine[] => {
  const lines: HexDumpLine[] = [];
  const highlightSet = new Set(highlightOffsets || []);

  for (let offset = 0; offset < bytes.length; offset += 16) {
    const chunk = bytes.slice(offset, offset + 16);
    const hexBytes = chunk.map((b, i) => ({
      value: b.toString(16).toUpperCase().padStart(2, '0'),
      highlight: highlightSet.has(offset + i),
    }));

    // Pad to 16
    while (hexBytes.length < 16) hexBytes.push({ value: '  ', highlight: false });

    const hexPart = hexBytes.map(h => h.value).join(' ');
    const asciiPart = chunk
      .map(b => (b >= 0x20 && b < 0x7F) ? String.fromCharCode(b) : '.')
      .join('');

    lines.push({
      offset: offset.toString(16).toUpperCase().padStart(4, '0'),
      hexPart,
      hexBytes,
      asciiPart,
    });
  }
  return lines;
};

// ============================================================
//  NDEF Record Parser
// ============================================================

export const parseNDEFRecords = (records: any[]): NDEFRecord[] => {
  return records.map(record => parseNDEFRecord(record)).filter(Boolean) as NDEFRecord[];
};

export const parseNDEFRecord = (record: any): NDEFRecord | null => {
  try {
    const tnf: number = record.tnf;
    const type: number[] = record.type || [];
    const payload: number[] = record.payload || [];
    const id: number[] = record.id || [];

    const typeStr = bytesToString(type);
    const idStr = bytesToString(id);

    let recordType: NDEFRecord['recordType'] = 'unknown';
    let decodedData = '';
    let language: string | undefined;

    if (tnf === 1 /* WELL_KNOWN */ && typeStr === 'U') {
      // URL record
      recordType = 'url';
      const prefix = URL_PREFIXES[payload[0]] || '';
      decodedData = prefix + bytesToString(payload.slice(1));
    } else if (tnf === 1 && typeStr === 'T') {
      // Text record
      recordType = 'text';
      const statusByte = payload[0];
      const langLength = statusByte & 0x3F;
      const isUTF16 = (statusByte & 0x80) !== 0;
      language = bytesToString(payload.slice(1, 1 + langLength));
      const textBytes = payload.slice(1 + langLength);
      decodedData = isUTF16
        ? decodeUtf16(textBytes)
        : decodeUtf8(textBytes);
    } else if (tnf === 1 && typeStr === 'Sp') {
      // Smart Poster
      recordType = 'smartposter';
      decodedData = '[Smart Poster]';
    } else if (tnf === 2 /* MIME */) {
      // MIME record
      if (typeStr.toLowerCase().includes('vcard')) {
        recordType = 'vcard';
      } else {
        recordType = 'mime';
      }
      decodedData = decodeUtf8(payload);
    } else {
      decodedData = bytesToHex(payload, ' ');
    }

    return {
      tnf,
      type: typeStr,
      id: idStr,
      payload,
      recordType,
      decodedData,
      language,
      payloadSize: payload.length,
    };
  } catch {
    return null;
  }
};

// ============================================================
//  String Encoding
// ============================================================

const decodeUtf8 = (bytes: number[]): string => {
  try {
    return decodeURIComponent(
      bytes.map(b => '%' + b.toString(16).padStart(2, '0')).join('')
    );
  } catch {
    return bytes.map(b => String.fromCharCode(b)).join('');
  }
};

const decodeUtf16 = (bytes: number[]): string => {
  let result = '';
  for (let i = 0; i < bytes.length - 1; i += 2) {
    result += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
  }
  return result;
};

const bytesToString = (bytes: number[]): string => {
  return bytes.map(b => String.fromCharCode(b)).join('');
};

// ============================================================
//  URL Prefixes (NDEF URI Record)
// ============================================================

const URL_PREFIXES: { [key: number]: string } = {
  0x00: '',
  0x01: 'http://www.',
  0x02: 'https://www.',
  0x03: 'http://',
  0x04: 'https://',
  0x05: 'tel:',
  0x06: 'mailto:',
  0x07: 'ftp://anonymous:anonymous@',
  0x08: 'ftp://ftp.',
  0x09: 'ftps://',
  0x0A: 'sftp://',
  0x0B: 'smb://',
  0x0C: 'nfs://',
  0x0D: 'ftp://',
  0x0E: 'dav://',
  0x0F: 'news:',
  0x10: 'telnet://',
  0x11: 'imap:',
  0x12: 'rtsp://',
  0x13: 'urn:',
  0x14: 'pop:',
  0x15: 'sip:',
  0x16: 'sips:',
  0x17: 'tftp:',
  0x18: 'btspp://',
  0x19: 'btl2cap://',
  0x1A: 'btgoep://',
  0x1B: 'tcpobex://',
  0x1C: 'irdaobex://',
  0x1D: 'file://',
  0x1E: 'urn:epc:id:',
  0x1F: 'urn:epc:tag:',
  0x20: 'urn:epc:pat:',
  0x21: 'urn:epc:raw:',
  0x22: 'urn:epc:',
  0x23: 'urn:nfc:',
};

// ============================================================
//  MIFARE Sector Map
// ============================================================

export interface SectorInfo {
  sectorIndex: number;
  blockStart: number;
  blockCount: number;
  keyA: string;
  keyB: string;
  accessBits: string;
}

export const parseMifareAccessBits = (trailer: number[]): string => {
  if (trailer.length < 4) return '??';
  const c1 = (trailer[7] >> 4) & 0x0F;
  const c2 = (trailer[8]) & 0x0F;
  const c3 = (trailer[8] >> 4) & 0x0F;
  return `C1:${c1.toString(2).padStart(4,'0')} C2:${c2.toString(2).padStart(4,'0')} C3:${c3.toString(2).padStart(4,'0')}`;
};

// ============================================================
//  Copy to Clipboard helper
// ============================================================

export const formatTagForClipboard = (tag: any, records: NDEFRecord[]): string => {
  let text = `=== NFC Tag Info ===\n`;
  text += `UID: ${tag.id}\n`;
  text += `Type: ${tag.type || 'Unknown'}\n`;
  if (tag.atqa) text += `ATQA: ${tag.atqa}\n`;
  if (tag.sak) text += `SAK: ${tag.sak}\n`;
  text += `\n=== NDEF Records (${records.length}) ===\n`;
  records.forEach((r, i) => {
    text += `\n[Record ${i + 1}]\n`;
    text += `Type: ${r.recordType.toUpperCase()}\n`;
    text += `Data: ${r.decodedData}\n`;
    text += `Size: ${r.payloadSize} bytes\n`;
  });
  return text;
};
