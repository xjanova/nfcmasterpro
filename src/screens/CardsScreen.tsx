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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NFCCardVisual, StatusBadge, EmptyState } from '../components';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';
import { DEFAULT_CURRENCY } from '../utils/constants';
import * as cardService from '../services/cardService';
import { CardInfo } from '../types';

const CardsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardInfo[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'disabled' | 'lost'>(
    'all'
  );
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    try {
      const allCards = await cardService.getCards();
      setCards(allCards);
      applyFilters(allCards, filter, searchText);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchText]);

  const applyFilters = (
    cardsToFilter: CardInfo[],
    activeFilter: string,
    search: string
  ) => {
    let result = cardsToFilter;

    // Apply status filter
    if (activeFilter !== 'all') {
      result = result.filter(c => c.status === activeFilter);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        c =>
          c.uid.toLowerCase().includes(searchLower) ||
          (c.memberName && c.memberName.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCards(result);
  };

  useEffect(() => {
    loadCards();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCards();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    applyFilters(cards, newFilter, searchText);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(cards, filter, text);
  };

  const handleCardPress = (cardUID: string) => {
    navigation.navigate('CardDetail', { cardUID });
  };

  const renderCard = ({ item }: { item: CardInfo }) => (
    <TouchableOpacity
      style={styles.cardItemContainer}
      onPress={() => handleCardPress(item.uid)}>
      <View style={styles.cardItem}>
        <View style={styles.cardVisualWrapper}>
          <NFCCardVisual
            uid={item.uid}
            memberName={item.memberName || 'Unregistered'}
            balance={item.balance}
            compact={true}
          />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardUID} numberOfLines={1}>
              {item.uid}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          {item.memberName && (
            <Text style={styles.memberName}>{item.memberName}</Text>
          )}
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Balance:</Text>
              <Text style={styles.statValue}>
                {DEFAULT_CURRENCY}
                {item.balance}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>PV:</Text>
              <Text style={styles.statValue}>{item.pvPoints}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filterOptions: Array<{
    key: 'all' | 'active' | 'disabled' | 'lost';
    label: string;
  }> = [
    { key: 'all', label: t('cards.allCards') },
    { key: 'active', label: t('cards.activeCards') },
    { key: 'disabled', label: t('cards.disabledCards') },
    { key: 'lost', label: 'Lost' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('cards.cardManagement')}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}>
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterTab,
              filter === option.key && styles.filterTabActive,
            ]}
            onPress={() => handleFilterChange(option.key)}>
            <Text
              style={[
                styles.filterTabText,
                filter === option.key && styles.filterTabTextActive,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cards List */}
      {filteredCards.length > 0 ? (
        <FlatList
          data={filteredCards}
          renderItem={renderCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="💳"
            title="No Cards"
            message={
              filter === 'all' && !searchText
                ? 'Start by registering a new card'
                : 'No cards found'
            }
          />
        </View>
      )}

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CardDetail', { cardUID: '' })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...TextStyles.headingLarge,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSizes.md,
  },
  clearIcon: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  filterScroll: {
    maxHeight: 50,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterContent: {
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    ...TextStyles.labelMedium,
    color: Colors.textMuted,
  },
  filterTabTextActive: {
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cardItemContainer: {
    marginBottom: Spacing.md,
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardVisualWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  cardInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardUID: {
    ...TextStyles.monoSmall,
    flex: 1,
  },
  memberName: {
    ...TextStyles.bodyMedium,
    marginBottom: Spacing.sm,
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...TextStyles.labelSmall,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...TextStyles.bodyMedium,
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: Colors.text,
    fontWeight: 'bold',
  },
});

export default CardsScreen;
