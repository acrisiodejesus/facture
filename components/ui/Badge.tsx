import { View, ViewProps } from 'react-native';
import { Text } from './Text';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  className?: string;
}

export function Badge({ label, variant = 'default', className = '', ...props }: BadgeProps) {
  let containerStyle = 'px-2.5 py-0.5 rounded-full self-start';
  let textStyle = 'text-xs font-semibold';

  switch (variant) {
    case 'default':
      containerStyle += ' bg-primary';
      textStyle += ' text-white';
      break;
    case 'secondary':
      containerStyle += ' bg-secondary';
      textStyle += ' text-white';
      break;
    case 'outline':
      containerStyle += ' border border-gray-200';
      textStyle += ' text-gray-800';
      break;
    case 'destructive':
      containerStyle += ' bg-red-500';
      textStyle += ' text-white';
      break;
  }

  return (
    <View className={`${containerStyle} ${className}`} {...props}>
      <Text className={textStyle}>{label}</Text>
    </View>
  );
}
