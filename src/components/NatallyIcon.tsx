import React from 'react';
import { NatallyAvatar } from './NatallyAvatar';

interface NatallyIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'header';
  isSpeaking?: boolean;
  className?: string;
  allowUploadOnClick?: boolean;
}

export const NatallyIcon: React.FC<NatallyIconProps> = ({
  size = 'md',
  isSpeaking = false,
  className = '',
  allowUploadOnClick = false,
}) => {
  const pixelSizes = {
    header: Math.min(112, Math.max(48, Number(import.meta.env?.VITE_NATALLY_HEADER_SIZE) || 72)),
    sm: 36,
    md: 48,
    lg: 64,
    xl: 84,
  }[size];

  return (
    <NatallyAvatar
      size={pixelSizes}
      isAnimated={true}
      isSpeaking={isSpeaking}
      className={size === 'header' ? `natally-header-avatar ${className}` : className}
      allowUploadOnClick={allowUploadOnClick}
    />
  );
};
