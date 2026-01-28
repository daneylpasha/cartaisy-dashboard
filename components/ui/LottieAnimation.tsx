'use client';

import Lottie, { LottieComponentProps } from 'lottie-react';

interface LottieAnimationProps extends Omit<LottieComponentProps, 'animationData'> {
  animationData: object;
  className?: string;
}

export default function LottieAnimation({
  animationData,
  className = '',
  loop = true,
  autoplay = true,
  ...props
}: LottieAnimationProps) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      {...props}
    />
  );
}
