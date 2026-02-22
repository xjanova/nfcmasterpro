import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSizes, Radius } from '../utils/theme';

interface NotificationBadgeProps {
  count: number;
  onPress?: () => void;
  size?: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  onPress,
  size = 28,
}) => {
  const badgeSize = Math.floor(size * 0.5);
  const badgeFontSize = Math.floor(badgeSize * 0.6);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.bellIcon,
          {
            fontSize: size * 0.6,
          },
        ]}
      >
        🔔
      </Text>

      {count > 0 && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              minWidth: badgeSize,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                fontSize: badgeFontSize,
              },
            ]}
          >
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    color: Colors.text,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeText: {
    color: Colors.text,
    fontWeight: '700',
  },
});

export default NotificationBadge;
