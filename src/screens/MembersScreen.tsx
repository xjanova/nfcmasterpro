import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MemberAvatar, EmptyState } from '../components';
import { useLanguage } from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import * as storageService from '../services/storageService';
import { Member } from '../types';

const MembersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const ts = createTextStyles(colors);
  const [members, setMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    try { setMembers(await storageService.getMembers()); }
    catch (error) { console.error('Error loading members:', error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useFocusEffect(useCallback(() => { loadMembers(); }, [loadMembers]));

  const onRefresh = async () => { setRefreshing(true); await loadMembers(); setRefreshing(false); };

  const renderMember = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={[styles.memberItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}
      onPress={() => navigation.navigate('MemberDetail', { memberId: item.id })}>
      <MemberAvatar uri={item.photo} name={item.name} size={48} />
      <View style={styles.memberInfo}>
        <Text style={[ts.bodyMedium, { fontWeight: '600', marginBottom: 2 }]}>{item.name}</Text>
        {item.position && <Text style={ts.labelSmall}>{item.position}</Text>}
        {item.company && <Text style={ts.labelSmall}>{item.company}</Text>}
      </View>
      <View style={[styles.cardCount, { backgroundColor: colors.primaryGlow }]}>
        <Text style={[{ fontSize: FontSizes.sm, fontWeight: '700', color: colors.primary }]}>{item.cards.length}</Text>
        <Text style={[ts.labelSmall, { color: colors.primary }]}>cards</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={[ts.headingLarge, { fontWeight: '800' }]}>{t['members.memberManagement']}</Text>
      </View>

      {members.length > 0 ? (
        <FlatList data={members} renderItem={renderMember} keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState icon="👤" title="No Members" message="Add your first member to get started" />
        </View>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }, Shadow.lg]}
        onPress={() => navigation.navigate('MemberRegister')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  listContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  memberItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1,
  },
  memberInfo: { flex: 1, marginLeft: Spacing.lg },
  cardCount: {
    alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fab: {
    position: 'absolute', bottom: 90, right: Spacing.xl,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
});

export default MembersScreen;
