/**
 * NFC Service — ครบเครื่องสำหรับ NDEF อ่าน/เขียน, Raw Data, Clone
 * ใช้ react-native-nfc-manager library
 */
import NfcManager, {
  NfcTech,
  Ndef,
  NdefRecord,
  TagEvent,
  NfcError,
} from 'react-native-nfc-manager';
import { NFCTag, NDEFRecord, NFCScanResult, WritePayload, CloneOperation } from '../types';
import { bytesToHex, hexToBytes, formatUID, parseNDEFRecords } from '../utils/hexUtils';

// ============================================================
//  Initialization
// ============================================================

export const initNFC = async (): Promise<boolean> => {
  try {
    const supported = await NfcManager.isSupported();
    if (!supported) return false;
    await NfcManager.start();
    return true;
  } catch (err) {
    console.error('NFC init error:', err);
    return false;
  }
};

export const isNFCEnabled = async (): Promise<boolean> => {
  try {
    return await NfcManager.isEnabled();
  } catch {
    return false;
  }
};

export const cancelNFC = async (): Promise<void> => {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {}
};

// ============================================================
//  Read Tag (NDEF + Raw info)
// ============================================================

export const readNFCTag = async (): Promise<NFCScanResult> => {
  const timestamp = Date.now();
  try {
    // Request NDEF technology first
    await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA, NfcTech.NfcB], {
      alertMessage: 'แตะการ์ด NFC เพื่ออ่านข้อมูล',
    });

    const rawTag = await NfcManager.getTag() as TagEvent;
    if (!rawTag) throw new Error('ไม่พบ Tag');

    // Build tag info
    const tag: NFCTag = {
      id: formatUID(rawTag.id),
      techTypes: rawTag.techTypes || [],
      type: detectTagType(rawTag),
      isWritable: false,
    };

    // Try to read NDEF
    let ndefRecords: NDEFRecord[] = [];
    let rawHex = '';

    try {
      const ndefStatus = await (NfcManager as any).ndefHandler.getNdefStatus();
      tag.maxSize = ndefStatus.maxSize;
      tag.isWritable = ndefStatus.isWritable;

      const ndefMsg = await (NfcManager as any).ndefHandler.readNdefMessage();
      if (ndefMsg && ndefMsg.records) {
        ndefRecords = parseNDEFRecords(ndefMsg.records);
      }
    } catch (_) {
      // Tag may not support NDEF — that's ok
    }

    // Try ATQA/SAK for NFC-A
    try {
      const nfcATag = rawTag as any;
      if (nfcATag.atqa) tag.atqa = bytesToHex(nfcATag.atqa);
      if (nfcATag.sak !== undefined) tag.sak = '0x' + nfcATag.sak.toString(16).toUpperCase().padStart(2, '0');
    } catch (_) {}

    // Get MIFARE Classic sector size if applicable
    if (tag.techTypes.includes('android.nfc.tech.MifareClassic')) {
      try {
        const mifareTag = rawTag as any;
        tag.size = mifareTag.size || 1024;
        tag.maxSize = mifareTag.size || 1024;
      } catch (_) {}
    }

    // Build hex representation from UID + known bytes
    rawHex = buildRawHexFromTag(rawTag, ndefRecords);

    await NfcManager.cancelTechnologyRequest();

    return {
      id: `scan_${timestamp}`,
      timestamp,
      tag,
      ndefRecords,
      rawHex,
      operation: 'read',
      success: true,
    };
  } catch (err: any) {
    await cancelNFC();
    return {
      id: `scan_${timestamp}`,
      timestamp,
      tag: { id: 'N/A', techTypes: [] },
      ndefRecords: [],
      operation: 'read',
      success: false,
      errorMessage: err?.message || 'อ่านไม่สำเร็จ',
    };
  }
};

// ============================================================
//  Write Tag (NDEF)
// ============================================================

export const writeNFCTag = async (payload: WritePayload): Promise<{ success: boolean; tag?: NFCTag; error?: string }> => {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: 'แตะการ์ด NFC เพื่อเขียนข้อมูล',
    });

    const rawTag = await NfcManager.getTag() as TagEvent;
    const tag: NFCTag = {
      id: formatUID(rawTag?.id || ''),
      techTypes: rawTag?.techTypes || [],
      type: detectTagType(rawTag),
    };

    const ndefMessage = buildNDEFMessage(payload);

    await NfcManager.ndefHandler.writeNdefMessage(ndefMessage);
    await NfcManager.cancelTechnologyRequest();

    return { success: true, tag };
  } catch (err: any) {
    await cancelNFC();
    return { success: false, error: err?.message || 'เขียนไม่สำเร็จ' };
  }
};

// ============================================================
//  Clone Tag (NDEF copy)
// ============================================================

export const readSourceForClone = async (): Promise<CloneOperation> => {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: 'แตะการ์ดต้นทางที่ต้องการโคลน',
    });

    const rawTag = await NfcManager.getTag() as TagEvent;
    const tag: NFCTag = {
      id: formatUID(rawTag?.id || ''),
      techTypes: rawTag?.techTypes || [],
      type: detectTagType(rawTag),
    };

    let records: NDEFRecord[] = [];
    try {
      const ndefMsg = await (NfcManager as any).ndefHandler.readNdefMessage();
      if (ndefMsg?.records) records = parseNDEFRecords(ndefMsg.records);
    } catch (_) {}

    await NfcManager.cancelTechnologyRequest();

    return {
      sourceTag: tag,
      sourceRecords: records,
      status: 'waiting_target',
    };
  } catch (err: any) {
    await cancelNFC();
    return {
      sourceTag: { id: 'N/A', techTypes: [] },
      sourceRecords: [],
      status: 'error',
    };
  }
};

export const writeCloneToTarget = async (operation: CloneOperation): Promise<CloneOperation> => {
  if (!operation.sourceRecords.length) {
    return { ...operation, status: 'error' };
  }
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: 'แตะการ์ดปลายทางเพื่อโคลนข้อมูล',
    });

    const rawTag = await NfcManager.getTag() as TagEvent;
    const targetTag: NFCTag = {
      id: formatUID(rawTag?.id || ''),
      techTypes: rawTag?.techTypes || [],
      type: detectTagType(rawTag),
    };

    // Rebuild NDEF message from source records
    const ndefMessage = rebuildNDEFFromRecords(operation.sourceRecords);
    await NfcManager.ndefHandler.writeNdefMessage(ndefMessage);
    await NfcManager.cancelTechnologyRequest();

    return { ...operation, targetTag, status: 'done' };
  } catch (err: any) {
    await cancelNFC();
    return { ...operation, status: 'error' };
  }
};

// ============================================================
//  Raw Hex Read (MifareClassic sector dump)
// ============================================================

export const readMifareHex = async (sectorKeys?: string[]): Promise<{ hex: string; sectors: string[][]; error?: string }> => {
  try {
    await NfcManager.requestTechnology(NfcTech.MifareClassic, {
      alertMessage: 'แตะ MIFARE Card เพื่ออ่าน Hex Data',
    });

    const mifareTag = NfcManager.getMifareClassicHandler();
    const sectors: string[][] = [];
    let fullHex = '';

    // Read as many sectors as possible with default key
    const defaultKeyA = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

    for (let sector = 0; sector < 16; sector++) {
      try {
        await mifareTag.authenticateSectorWithKeyA(sector, defaultKeyA);
        const blocks: string[] = [];
        const blockCount = sector < 32 ? 4 : 16;
        for (let block = 0; block < blockCount; block++) {
          const blockIndex = sector < 32
            ? sector * 4 + block
            : 128 + (sector - 32) * 16 + block;
          try {
            const data = await mifareTag.readBlock(blockIndex);
            const hexLine = Array.from(data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            blocks.push(hexLine);
            fullHex += hexLine + '\n';
          } catch {
            blocks.push('?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ??');
          }
        }
        sectors.push(blocks);
      } catch {
        sectors.push(['(Key Auth Failed)']);
      }
    }

    await NfcManager.cancelTechnologyRequest();
    return { hex: fullHex, sectors };
  } catch (err: any) {
    await cancelNFC();
    return { hex: '', sectors: [], error: err?.message };
  }
};

// ============================================================
//  Helpers
// ============================================================

function detectTagType(rawTag: TagEvent | null): string {
  if (!rawTag) return 'Unknown';
  const techs = rawTag.techTypes || [];
  if (techs.includes('android.nfc.tech.MifareClassic')) {
    const size = (rawTag as any).size;
    if (size === 1024) return 'MIFARE Classic 1K';
    if (size === 4096) return 'MIFARE Classic 4K';
    if (size === 2048) return 'MIFARE Classic 2K';
    return 'MIFARE Classic';
  }
  if (techs.includes('android.nfc.tech.MifareUltralight')) {
    const type = (rawTag as any).type;
    if (type === 2) return 'NTAG215';
    if (type === 3) return 'NTAG216';
    return 'MIFARE Ultralight / NTAG213';
  }
  if (techs.includes('android.nfc.tech.IsoDep')) return 'ISO-DEP Tag';
  if (techs.includes('android.nfc.tech.NfcB')) return 'NFC-B Tag';
  if (techs.includes('android.nfc.tech.NfcF')) return 'NFC-F (FeliCa)';
  if (techs.includes('android.nfc.tech.NfcV')) return 'NFC-V (ISO 15693)';
  if (techs.includes('android.nfc.tech.Ndef')) return 'NFC Type 2 Tag';
  return 'NFC Tag';
}

function buildNDEFMessage(payload: WritePayload): NdefRecord[] {
  const records: NdefRecord[] = [];

  if (payload.type === 'url' && payload.url) {
    records.push(Ndef.uriRecord(payload.url));
  } else if (payload.type === 'text' && payload.text) {
    records.push(Ndef.textRecord(payload.text, payload.language || 'th'));
  } else if (payload.type === 'vcard' && payload.vcardData) {
    const vcard = buildVCard(payload.vcardData);
    records.push(Ndef.mimeMediaRecord('text/vcard', vcard));
  } else if (payload.type === 'tp_member' && payload.memberData) {
    const member = payload.memberData;
    records.push(Ndef.uriRecord(member.affiliateUrl || `https://thaiprompt.com/affiliate?ref=${member.memberId}`));
    records.push(Ndef.textRecord(
      `สมาชิก Thaiprompt Affiliate | ${member.rank || ''} | ID: ${member.memberId}`,
      'th'
    ));
    if (member.memberId) {
      // Add custom MIME record with JSON data
      const jsonData = JSON.stringify({
        memberId: member.memberId,
        name: member.name,
        rank: member.rank,
        affiliateCode: member.affiliateCode,
      });
      records.push(Ndef.mimeMediaRecord('application/vnd.thaiprompt.member', jsonData));
    }
  } else if (payload.type === 'smartposter' && payload.url && payload.text) {
    records.push(Ndef.uriRecord(payload.url));
    records.push(Ndef.textRecord(payload.text, payload.language || 'th'));
  }

  return records;
}

function buildVCard(data: { name: string; phone?: string; email?: string; organization?: string; url?: string }): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.name}`,
    data.phone ? `TEL:${data.phone}` : '',
    data.email ? `EMAIL:${data.email}` : '',
    data.organization ? `ORG:${data.organization}` : '',
    data.url ? `URL:${data.url}` : '',
    'END:VCARD',
  ].filter(Boolean).join('\r\n');
}

function rebuildNDEFFromRecords(records: NDEFRecord[]): NdefRecord[] {
  return records.map(r => ({
    tnf: r.tnf,
    type: Ndef.util.stringToBytes(r.type),
    id: Ndef.util.stringToBytes(r.id || ''),
    payload: r.payload,
  }));
}

function buildRawHexFromTag(rawTag: any, ndefRecords: NDEFRecord[]): string {
  if (!rawTag?.id) return '';
  const uidBytes = rawTag.id as number[];
  const hexLines: string[] = [];

  // Address 0000: UID area
  hexLines.push(`0000  ${formatHexRow(uidBytes.concat(Array(16 - uidBytes.length).fill(0)))}`);

  // NDEF payload if available
  if (ndefRecords.length > 0) {
    let offset = 0x10;
    ndefRecords.forEach(record => {
      if (record.payload.length > 0) {
        for (let i = 0; i < record.payload.length; i += 16) {
          const chunk = record.payload.slice(i, i + 16);
          hexLines.push(`${offset.toString(16).toUpperCase().padStart(4, '0')}  ${formatHexRow(chunk)}`);
          offset += 16;
        }
      }
    });
  }

  return hexLines.join('\n');
}

function formatHexRow(bytes: number[]): string {
  const padded = [...bytes];
  while (padded.length < 16) padded.push(0x00);
  const hex = padded.slice(0, 16).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  const ascii = padded.slice(0, 16).map(b => (b >= 0x20 && b < 0x7F) ? String.fromCharCode(b) : '.').join('');
  return `${hex}  |${ascii}|`;
}
