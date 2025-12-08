import { TextInput, TextInputProps, View } from 'react-native';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({ label, error, containerClassName = '', className = '', ...props }: InputProps) {
  return (
    <View className={`w-full mb-4 ${containerClassName}`}>
      {label && <Text className="mb-1.5 font-medium text-secondary">{label}</Text>}
      <TextInput
        className={`w-full h-12 px-3 rounded-md border border-gray-300 bg-white text-secondary focus:border-primary ${error ? 'border-red-500' : ''} ${className}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text variant="error" className="mt-1">{error}</Text>}
    </View>
  );
}
