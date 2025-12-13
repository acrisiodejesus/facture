import { cn } from '@/lib/utils';
import { Text as RNText, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  variant?: 'default' | 'heading' | 'subheading' | 'muted' | 'error';
  className?: string;
}

export function Text({ variant = 'default', className = '', ...props }: ThemedTextProps) {
  let baseStyle = 'text-base text-text font-sans';

  switch (variant) {
    case 'heading':
      baseStyle = 'text-2xl font-bold text-primary';
      break;
    case 'subheading':
      baseStyle = 'text-lg font-semibold text-text opacity-80';
      break;
    case 'muted':
      baseStyle = 'text-sm text-text opacity-70';
      break;
    case 'error':
      baseStyle = 'text-sm text-destructive';
      break;
  }

  return <RNText className={cn(baseStyle, className)} {...props} />;
}
