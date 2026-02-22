import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Gradient, Radius, FontSizes } from '../utils/theme';

interface MemberAvatarProps {
  name: string;
  photo?: string;
  size?: number;
  style?: ViewStyle;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({
  name,
  photo,
  size = 48,
  style,
}) => {
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBackgroundColor = (name: string): string => {
    // Generate a color based on the name
    const colors = [
      Colors.primary,
      Colors.secondary,
      Colors.success,
      Colors.warning,
      Colors.danger,
      Colors.gold,
    ];
    const hash = name.charCodeAt(0);
    return colors[hash % colors.length];
  };

  const initials = getInitials(name);
  const backgroundColor = getBackgroundColor(name);
  const textSize = Math.floor(size * 0.4);

  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: textSize,
          fontWeight: '700',
          color: Colors.text,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

export default MemberAvatar;
