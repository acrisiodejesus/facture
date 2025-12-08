import { View, ViewProps } from 'react-native';

export function Separator({ className = '', ...props }: ViewProps) {
  return (
    <View 
      className={`h-[1px] w-full bg-gray-200 my-4 ${className}`} 
      {...props} 
    />
  );
}
