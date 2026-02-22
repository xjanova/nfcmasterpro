import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NFCCardVisual, StatusBadge, EmptyState } from '../components';
import { useLanguage } from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import { DEFAULT_CURRENCY } from '../utils/constants';
import * as cardService from '../services/cardService';
import { CardInfo } from '../types';

const CardsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const ts = createTextStyles(colors);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardInfo[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'disabled' | 'lost'>('all');
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    try {
      const allCards = await cardService.getCards();
      setCards(allCards);
      applyFilters(allCards, filter, searchText);
    } catch (error) { console.error('Error loading cards:', error); }
    finally { setLoading(false); }
  }, [filter, searchText]);

  const applyFilters = (data: CardInfo[], f: string, search: string) => {
    let result = data;
    if (f !== 'all') result = result.filter(c => c.status === f);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => c.uid.toLowerCase().includes(s) || c.memberName?.toLowerCase().includes(s));
    }
    setFilteredCards(result);
  };

  useEffect(() => { loadCards(); }, []);
  useFocusEffect(useCallback(() => { loadCards(); }, [loadCards]));

  const onRefresh = async () => { setRefreshing(true); await loadCards(); setRefreshing(false); };

  const handleFilterChange = (newFilter: typeof filter) => { setFilter(newFilter); applyFilters(cards, newFilter, searchText); };
  const handleSearch = (text: string) => { setSearchText(text); applyFilters(cards, filter, text); };

  const renderCard = ({ item }: { item: CardInfo }) => (
    <TouchableOpacity style={styles.cardItemContainer} onPress={() => navigation.navigate('CardDetail', { cardUID: item.uid })}>
      <View style={[styles.cardItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
        <View style={[styles.cardVisualWrapper, { backgroundColor: colors.surface }]}>
          <NFCCardVisual uid={item.uid} memberName={item.memberName || 'Unregistered'} balance={item.balance} compact={true} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={[{ fontFamily: 'monospace', fontSize: FontSizes.sm, color: colors.textMuted, flex: 1 }]} numberOfLines={1}>{item.uid}</Text>
            <StatusBadge status={item.status} />
          </View>
          {item.memberName && <Text style={[ts.bodyMedium, { fontWeight: '600', marginBottom: 4 }]}>{item.memberName}</Text>}
          <View style={styles.cardStats}>
            <View style={{ flex: 1 }}>
              <Text style={ts.labelSmall}>Balance</Text>
              <Text style={[ts.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>{DEFAULT_CURRENCY}{item.balance}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ts.labelSmall}>PV</Text>
              <Text style={[ts.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>{item.pvPoints}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filterOptions: { key: typeof filter; label: string }[] = [
    { key: 'all', label: t['cards.allCards'] },
    { key: 'active', label: t['cards.activeCards'] },
    { key: 'disabled', label: t['cards.disabledCards'] },
    { key: 'lost', label: 'Lost' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={[ts.headingLarge, { fontWeight: '800' }]}>{t['cards.cardManagement']}</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 16, marginRight: Spacing.sm }}>{'🔍'}</Text>
          <TextInput style={[styles.searchInput, { color: colors.text }]}
            placeholder={t['common.search']} placeholderTextColor={colors.textMuted}
            value={searchText} onChangeText={handleSearch} />
          {searchText ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={{ fontSize: 16, color: colors.textMuted }}>{'✕'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {filterOptions.map(option => (
          <TouchableOpacity key={option.key}
            style={[styles.filterTab, { borderColor: colors.border }, filter === option.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => handleFilterChange(option.key)}>
            <Text style={[styles.filterTabText, { color: colors.textMuted }, filter === option.key && { color: '#fff' }]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredCards.length > 0 ? (
        <FlatList data={filteredCards} renderItem={renderCard} keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState icon="💳" title="No Cards" message={filter === 'all' && !searchText ? 'Start by registering a new card' : 'No cards found'} />
        </View>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }, Shadow.lg]}
        onPress={() => navigation.navigate('CardDetail', { cardUID: '' })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  searchSection: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, height: 44, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: FontSizes.md },
  filterScroll: { maxHeight: 50, marginHorizontal: Spacing.xl, marginBottom: Spacing.md },
  filterContent: { gap: Spacing.sm },
  filterTab: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1,
  },
  filterTabText: { fontSize: FontSizes.sm, fontWeight: '600' },
  listContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  cardItemContainer: { marginBottom: Spacing.md },
  cardItem: { flexDirection: 'row', borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1 },
  cardVisualWrapper: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  cardStats: { flexDirection: 'row', gap: Spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fab: {
    position: 'absolute', bottom: 90, right: Spacing.xl,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
});

export default CardsScreen;
