import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Clipboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { readMifareHex } from '../services/nfcService';
import { formatHexDump, HexDumpLine } from '../utils/hexUtils';
import { NFCScanResult } from '../types';
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';

type HexView = 'hex_ascii' | 'hex_only' | 'ndef_parse' | 'sector_map';

const HexViewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const result: NFCScanResult | undefined = route.params?.result;
  const { colors } = useTheme();
  const ts = createTextStyles(colors);

  const [view, setView] = useState<HexView>('hex_ascii');
  const [loading, setLoading] = useState(false);
  const [hexLines, setHexLines] = useState<HexDumpLine[]>([]);
  const [mifareError, setMifareError] = useState<string | null>(null);

  useEffect(() => {
    if (result?.rawHex) {
      const bytes: number[] = [];
      result.rawHex.split('\n').forEach(line => {
        const parts = line.split('  ');
        if (parts.length >= 2) {
          parts[1].split(' ').forEach(h => { const b = parseInt(h, 16); if (!isNaN(b)) bytes.push(b); });
        }
      });
      if (bytes.length > 0) setHexLines(formatHexDump(bytes));
    }
  }, [result]);

  const loadMifareHex = async () => {
    setLoading(true);
    setMifareError(null);
    try {
      const res = await readMifareHex();
      if (res.error) { setMifareError(res.error); }
      else {
        const bytes = res.hex.split('\n').flatMap(line => line.trim().split(' ').map(h => parseInt(h, 16)).filter(b => !isNaN(b)));
        setHexLines(formatHexDump(bytes));
      }
    } catch (err: any) { setMifareError(err.message); }
    finally { setLoading(false); }
  };

  const copyHex = () => {
    const text = hexLines.map(l => `${l.offset}  ${l.hexPart}  |${l.asciiPart}|`).join('\n');
    Clipboard.setString(text);
    Toast.show({ type: 'success', text1: 'Hex copied' });
  };

  const viewOptions: { key: HexView; label: string }[] = [
    { key: 'hex_ascii', label: 'Hex+ASCII' },
    { key: 'hex_only', label: 'Hex Only' },
    { key: 'ndef_parse', label: 'NDEF Parse' },
    { key: 'sector_map', label: 'Sector Map' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: colors.text }}>{'<'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[ts.headingMedium, { fontWeight: '700' }]}>Hex / Raw Data</Text>
          <Text style={ts.bodySmall}>{result?.tag.type || 'NFC Tag'}</Text>
        </View>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={copyHex}>
          <Text style={{ fontSize: 14 }}>{'📋'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Technical Info */}
        {result && (
          <View style={styles.techGrid}>
            {[
              ['UID', result.tag.id],
              ['Type', result.tag.type || 'Unknown'],
              result.tag.atqa ? ['ATQA', result.tag.atqa] : ['Tech', result.tag.techTypes[0]?.split('.').pop() || '-'],
              result.tag.sak ? ['SAK', result.tag.sak] : ['Size', result.tag.size ? `${result.tag.size}B` : '-'],
            ].map(([key, val]) => (
              <View key={key as string} style={[styles.techCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{key as string}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.secondary, fontFamily: 'monospace' }}>{val as string}</Text>
              </View>
            ))}
          </View>
        )}

        {/* View Mode Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewModeScroll}>
          {viewOptions.map(opt => (
            <TouchableOpacity key={opt.key}
              style={[styles.viewBtn, { backgroundColor: colors.card, borderColor: colors.border }, view === opt.key && { borderColor: colors.primary }]}
              onPress={() => setView(opt.key)}>
              <Text style={[styles.viewBtnText, { color: colors.textMuted }, view === opt.key && { color: colors.primary }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hex Dump */}
        {(view === 'hex_ascii' || view === 'hex_only') && (
          <>
            {hexLines.length === 0 && !result?.rawHex && (
              <TouchableOpacity style={[styles.loadBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={loadMifareHex} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.secondary} /> : <Text style={{ fontSize: 14, fontWeight: '600', color: colors.secondary }}>Load Raw Hex Data</Text>}
              </TouchableOpacity>
            )}
            {mifareError && (
              <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{mifareError}</Text>
              </View>
            )}
            {hexLines.length > 0 && (
              <ScrollView horizontal style={[styles.hexDump, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View>
                  {hexLines.map((line, i) => (
                    <View key={i} style={styles.hexRow}>
                      <Text style={{ color: colors.textMuted, fontSize: 11, width: 40, fontFamily: 'monospace' }}>{line.offset}</Text>
                      {view === 'hex_ascii' ? (
                        <>
                          <View style={styles.hexBytesRow}>
                            {line.hexBytes.map((b, j) => (
                              <Text key={j} style={[{ fontSize: 11, color: colors.secondary, fontFamily: 'monospace' },
                                b.highlight && { color: colors.warning },
                                b.value === '00' && { color: colors.textMuted },
                              ]}>{b.value}{' '}</Text>
                            ))}
                          </View>
                          <Text style={{ fontSize: 11, color: colors.textDim, fontFamily: 'monospace', marginLeft: 8 }}>|{line.asciiPart}|</Text>
                        </>
                      ) : (
                        <View style={styles.hexBytesRow}>
                          {line.hexBytes.map((b, j) => (
                            <Text key={j} style={[{ fontSize: 11, color: colors.secondary, fontFamily: 'monospace' },
                              b.highlight && { color: colors.warning },
                            ]}>{b.value}{' '}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </>
        )}

        {/* NDEF Parse */}
        {view === 'ndef_parse' && result && (
          <View>
            {result.ndefRecords.length === 0 ? (
              <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>No NDEF records found</Text>
              </View>
            ) : (
              result.ndefRecords.map((r, i) => (
                <View key={i} style={[styles.ndefCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[ts.bodyMedium, { fontWeight: '700', marginBottom: 10 }]}>Record {i + 1}: {r.recordType.toUpperCase()}</Text>
                  {[['TNF', String(r.tnf)], ['Type', r.type], ['Payload Size', `${r.payloadSize} bytes`], ['Decoded', r.decodedData]].map(([k, v]) => (
                    <View key={k} style={[styles.ndefRow, { borderBottomColor: colors.border }]}>
                      <Text style={{ fontSize: 11, color: colors.textMuted, width: 90 }}>{k}</Text>
                      <Text style={{ fontSize: 11, color: colors.textDim, fontFamily: 'monospace', flex: 1, flexWrap: 'wrap' }}>{v}</Text>
                    </View>
                  ))}
                  {r.language && (
                    <View style={[styles.ndefRow, { borderBottomColor: colors.border }]}>
                      <Text style={{ fontSize: 11, color: colors.textMuted, width: 90 }}>Language</Text>
                      <Text style={{ fontSize: 11, color: colors.textDim, fontFamily: 'monospace' }}>{r.language}</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 10, marginBottom: 4 }}>Raw Payload:</Text>
                  <Text style={{ fontSize: 10, color: colors.secondary, fontFamily: 'monospace', lineHeight: 16 }}>
                    {r.payload.slice(0, 32).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                    {r.payload.length > 32 ? ` ... +${r.payload.length - 32} more` : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Sector Map */}
        {view === 'sector_map' && (
          <View>
            <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>MIFARE Classic Sector Map - Tap below to load</Text>
            </View>
            <TouchableOpacity style={[styles.loadBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={loadMifareHex} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.secondary} /> : <Text style={{ fontSize: 14, fontWeight: '600', color: colors.secondary }}>Load Sector Data</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.primary }]} onPress={copyHex}>
            <Text style={styles.btnPrimaryText}>Copy Hex</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Toast.show({ type: 'info', text1: 'Export coming soon' })}>
            <Text style={[{ fontSize: 13, fontWeight: '600', color: colors.text }]}>Export</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  techCard: { width: '47%', borderRadius: 12, padding: 12, borderWidth: 1 },
  viewModeScroll: { marginBottom: 14 },
  viewBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, marginRight: 8,
  },
  viewBtnText: { fontSize: 11, fontWeight: '600' },
  hexDump: { borderRadius: 14, padding: 16, borderWidth: 1 },
  hexRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  hexBytesRow: { flexDirection: 'row' },
  loadBtn: {
    borderRadius: 12, padding: 16, alignItems: 'center',
    borderWidth: 1, marginBottom: 12,
  },
  errorBox: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  ndefCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  ndefRow: { flexDirection: 'row', gap: 10, paddingVertical: 4, borderBottomWidth: 1 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btnPrimary: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnPrimaryText: { fontSize: 13, fontWeight: '600', color: 'white' },
  btnSecondary: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1 },
});

export default HexViewScreen;
