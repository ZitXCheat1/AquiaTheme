import React, { Suspense } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import tw from 'twin.macro';
import ErrorBoundary from '@/components/elements/ErrorBoundary';

export type SpinnerSize = 'small' | 'base' | 'large';

interface Props {
    size?: SpinnerSize;
    centered?: boolean;
    isBlue?: boolean;
}

interface Spinner extends React.FC<Props> {
    Size: Record<'SMALL' | 'BASE' | 'LARGE', SpinnerSize>;
    Suspense: React.FC<Props>;
}

const orbit = keyframes`
    0%   { transform: rotate(0deg)   translateX(var(--r)) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); }
`;

const trail = keyframes`
    0%   { transform: rotate(0deg)   translateX(var(--r)) rotate(0deg);   opacity: 0.12; }
    100% { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); opacity: 0.12; }
`;

const breathe = keyframes`
    0%, 100% { transform: scale(0.85); opacity: 0.4; }
    50%       { transform: scale(1.15); opacity: 0.9; }
`;

const Ring = styled.div<{ size: number }>`
    position: relative;
    width:  ${(p) => p.size}px;
    height: ${(p) => p.size}px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Core = styled.div<{ d: number; blue?: boolean }>`
    width:  ${(p) => p.d}px;
    height: ${(p) => p.d}px;
    border-radius: 50%;
    background: ${(p) => (p.blue ? 'hsl(212,92%,55%)' : '#08cd00')};
    box-shadow: 0 0 ${(p) => p.d * 1.4}px ${(p) => (p.blue ? 'hsla(212,92%,55%,0.7)' : 'rgba(8,205,0,0.7)')};
    animation: ${breathe} 1.6s ease-in-out infinite;
    position: absolute;
`;

const Dot = styled.div<{ delay: number; radius: number; d: number; blue?: boolean }>`
    --r: ${(p) => p.radius}px;
    position: absolute;
    width:  ${(p) => p.d}px;
    height: ${(p) => p.d}px;
    border-radius: 50%;
    background: ${(p) => (p.blue ? 'hsl(212,92%,55%)' : '#08cd00')};
    box-shadow: 0 0 ${(p) => p.d * 2}px ${(p) => (p.blue ? 'hsla(212,92%,55%,0.8)' : 'rgba(8,205,0,0.8)')};
    animation: ${orbit} 1.8s linear ${(p) => p.delay}ms infinite;
`;

const TrailDot = styled.div<{ delay: number; radius: number; d: number; blue?: boolean }>`
    --r: ${(p) => p.radius}px;
    position: absolute;
    width:  ${(p) => p.d * 0.6}px;
    height: ${(p) => p.d * 0.6}px;
    border-radius: 50%;
    background: ${(p) => (p.blue ? 'hsl(212,92%,55%)' : '#08cd00')};
    opacity: 0.2;
    animation: ${trail} 1.8s linear ${(p) => p.delay}ms infinite;
`;

const sizes = {
    small: { ring: 28, core: 5, dot: 4, radius: 9 },
    base:  { ring: 44, core: 7, dot: 6, radius: 14 },
    large: { ring: 72, core: 11, dot: 9, radius: 23 },
};

const SpinnerComponent: React.FC<Props> = ({ size = 'base', isBlue }) => {
    const s = sizes[size];
    const delays = [0, 600, 1200];
    return (
        <Ring size={s.ring}>
            <Core d={s.core} blue={isBlue} />
            {delays.map((d, i) => (
                <React.Fragment key={i}>
                    <TrailDot delay={d - 120} radius={s.radius} d={s.dot} blue={isBlue} />
                    <Dot delay={d} radius={s.radius} d={s.dot} blue={isBlue} />
                </React.Fragment>
            ))}
        </Ring>
    );
};

const Spinner: Spinner = ({ centered, ...props }) =>
    centered ? (
        <div css={[tw`flex justify-center items-center`, props.size === 'large' ? tw`m-20` : tw`m-6`]}>
            <SpinnerComponent {...props} />
        </div>
    ) : (
        <SpinnerComponent {...props} />
    );
Spinner.displayName = 'Spinner';

Spinner.Size = {
    SMALL: 'small',
    BASE: 'base',
    LARGE: 'large',
};

Spinner.Suspense = ({ children, centered = true, size = Spinner.Size.LARGE, ...props }) => (
    <Suspense fallback={<Spinner centered={centered} size={size} {...props} />}>
        <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
);
Spinner.Suspense.displayName = 'Spinner.Suspense';

export default Spinner;
