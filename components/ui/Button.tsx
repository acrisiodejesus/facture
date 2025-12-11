import { cn } from '@/lib/utils';
import { ActivityIndicator, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Text } from './Text';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  label: string;
  loading?: boolean;
  className?: string;
}

export function Button({ 
  variant = 'default', 
  size = 'default', 
  label, 
  loading = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  let containerStyle = 'flex-row items-center justify-center rounded-md';
  let textStyle = 'font-medium';

  // Variant Styles
  switch (variant) {
    case 'default':
      containerStyle += ' bg-primary';
      textStyle += ' text-white';
      break;
    case 'outline':
      containerStyle += ' border border-primary bg-transparent';
      textStyle += ' text-primary';
      break;
    case 'ghost':
      containerStyle += ' bg-transparent';
      textStyle += ' text-primary';
      break;
    case 'destructive':
      containerStyle += ' bg-destructive';
      textStyle += ' text-white';
      break;
  }

  // Size Styles
  switch (size) {
    case 'default':
      containerStyle += ' h-12 px-4 py-2';
      break;
    case 'sm':
      containerStyle += ' h-9 px-3';
      textStyle += ' text-sm';
      break;
    case 'lg':
      containerStyle += ' h-14 px-8';
      textStyle += ' text-lg';
      break;
  }

  if (disabled || loading) {
    containerStyle += ' opacity-50';
  }

  return (
    <TouchableOpacity 
      className={cn(containerStyle, className)} 
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#606c38' : '#fff'} />
      ) : (
        <Text className={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
