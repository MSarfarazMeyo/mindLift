import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex flex-row items-center justify-center rounded-md text-sm font-medium transition-opacity',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white',
        destructive: 'bg-red-600 text-white',
        outline: 'border border-gray-300 bg-transparent text-gray-700',
        secondary: 'bg-gray-600 text-white',
        ghost: 'bg-transparent text-gray-700',
        link: 'text-blue-600 underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-12 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  onPress,
  children,
  disabled,
  loading,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={
        cn(buttonVariants({ variant, size })) + (disabled ? ' opacity-50' : '')
      }
      style={{ opacity: disabled || loading ? 0.5 : 1 }}
    >
      {loading ? <ActivityIndicator color="white" /> : <Text>{children}</Text>}
    </TouchableOpacity>
  );
};

export { Button, buttonVariants };
