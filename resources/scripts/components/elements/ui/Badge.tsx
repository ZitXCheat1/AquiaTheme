import React from 'react';
import styled, { css } from 'styled-components/macro';
import { motion } from 'framer-motion';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'grey' | 'ghost';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    pulse?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const variants: Record<BadgeVariant, string> = {
    green:  'background: rgba(8,205,0,0.12);  border-color: rgba(8,205,0,0.25);  color: #4ade80;',
    red:    'background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.25); color: #f87171;',
    yellow: 'background: rgba(245,158,11,0.12);border-color: rgba(245,158,11,0.25);color: #fbbf24;',
    blue:   'background: rgba(59,130,246,0.12);border-color: rgba(59,130,246,0.25);color: #60a5fa;',
    purple: 'background: rgba(139,92,246,0.12);border-color: rgba(139,92,246,0.25);color: #a78bfa;',
    grey:   'background: rgba(100,116,139,0.12);border-color: rgba(100,116,139,0.25);color: #94a3b8;',
    ghost:  'background: rgba(255,255,255,0.04);border-color: rgba(255,255,255,0.08);color: #94a3b8;',
};

const sizes: Record<BadgeSize, string> = {
    xs: 'font-size: 0.63rem; padding: 1px 6px; border-radius: 5px;',
    sm: 'font-size: 0.72rem; padding: 2px 8px; border-radius: 6px;',
    md: 'font-size: 0.78rem; padding: 3px 10px; border-radius: 7px;',
};

const dotColors: Record<BadgeVariant, string> = {
    green: '#08cd00', red: '#ef4444', yellow: '#f59e0b',
    blue: '#3b82f6', purple: '#8b5cf6', grey: '#64748b', ghost: '#94a3b8',
};

const BadgeEl = styled(motion.span)<{ variant: BadgeVariant; size: BadgeSize }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    letter-spacing: 0.03em;
    border: 1px solid;
    ${p => variants[p.variant]}
    ${p => sizes[p.size]}
    white-space: nowrap;
`;

const Dot = styled.span<{ color: string; pulse?: boolean }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${p => p.color};
    flex-shrink: 0;
    ${p => p.pulse && css`
        animation: pulse-dot 1.5s ease-in-out infinite;
        @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.75); }
        }
    `}
`;

const Badge: React.FC<BadgeProps> = ({
    variant = 'grey', size = 'sm', dot, pulse, icon, children, className,
}) => (
    <BadgeEl
        variant={variant}
        size={size}
        className={className}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
    >
        {dot && <Dot color={dotColors[variant]} pulse={pulse} />}
        {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
        {children}
    </BadgeEl>
);

export default Badge;
export type { BadgeVariant, BadgeSize };
