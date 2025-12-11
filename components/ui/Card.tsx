import { cn } from '@/lib/utils';
import { View, ViewProps } from 'react-native';

export function Card({ className = '', ...props }: ViewProps) {
  return (
    <View 
      className={cn('bg-card rounded-lg p-4 shadow-sm border border-border', className)} 
      {...props} 
    />
  );
}
