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

const pulse1 = keyframes`
    0%, 80%, 100% { transform: scaleY(0.4); opacity: 0.3; }
    40%            { transform: scaleY(1.0); opacity: 1; }
`;

const pulse2 = keyframes`
    0%, 80%, 100% { transform: scaleY(0.4); opacity: 0.3; }
    40%            { transform: scaleY(1.0); opacity: 1; }
`;

const Wrapper = styled.div<{ size?: SpinnerSize }>`
    display: flex;
    align-items: center;
    gap: ${(p) => (p.size === 'small' ? '2px' : p.size === 'large' ? '5px' : '3px')};
`;

const Bar = styled.div<{ delay: number; size?: SpinnerSize; isBlue?: boolean }>`
    width:  ${(p) => (p.size === 'small' ? '3px' : p.size === 'large' ? '7px' : '4px')};
    height: ${(p) => (p.size === 'small' ? '12px' : p.size === 'large' ? '36px' : '20px')};
    border-radius: 3px;
    background: ${(p) => (p.isBlue ? 'hsl(212, 92%, 55%)' : '#08cd00')};
    box-shadow: 0 0 ${(p) => (p.size === 'large' ? '8px' : '4px')} ${(p) => (p.isBlue ? 'hsla(212,92%,55%,0.5)' : 'rgba(8,205,0,0.5)')};
    animation: ${pulse1} 1.1s ease-in-out ${(p) => p.delay}ms infinite;
    transform-origin: center bottom;
`;

const SpinnerComponent: React.FC<Props> = ({ size, isBlue }) => (
    <Wrapper size={size}>
        <Bar size={size} isBlue={isBlue} delay={0} />
        <Bar size={size} isBlue={isBlue} delay={110} />
        <Bar size={size} isBlue={isBlue} delay={220} />
        <Bar size={size} isBlue={isBlue} delay={330} />
        <Bar size={size} isBlue={isBlue} delay={440} />
    </Wrapper>
);

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
