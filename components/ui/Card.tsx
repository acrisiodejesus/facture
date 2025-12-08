import { cn } from '@/lib/utils';
import { View, ViewProps } from 'react-native';

export function Card({ className = '', ...props }: ViewProps) {
  return (
    <View 
      className={cn('bg-white rounded-lg p-4 shadow-sm border border-gray-100', className)} 
      {...props} 
    />
  );
}
