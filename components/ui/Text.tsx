import { cn } from '@/lib/utils';
import { Text as RNText, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  variant?: 'default' | 'heading' | 'subheading' | 'muted' | 'error';
  className?: string;
}

export function Text({ variant = 'default', className = '', ...props }: ThemedTextProps) {
  let baseStyle = 'text-base text-secondary dark:text-white font-sans';

  switch (variant) {
    case 'heading':
      baseStyle = 'text-2xl font-bold text-primary dark:text-accent';
      break;
    case 'subheading':
      baseStyle = 'text-lg font-semibold text-secondary/80 dark:text-white/80';
      break;
    case 'muted':
      baseStyle = 'text-sm text-gray-500 dark:text-gray-400';
      break;
    case 'error':
      baseStyle = 'text-sm text-red-500';
      break;
  }

  return <RNText className={cn(baseStyle, className)} {...props} />;
}
