import React from 'react';
import styled from 'styled-components/macro';
import { motion } from 'framer-motion';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

const sizes = {
    sm: { track: { width: 32, height: 18 }, thumb: 14, off: 2 },
    md: { track: { width: 42, height: 24 }, thumb: 18, off: 3 },
    lg: { track: { width: 52, height: 30 }, thumb: 24, off: 3 },
};

const Wrap = styled.div<{ disabled?: boolean }>`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
    opacity: ${p => p.disabled ? 0.5 : 1};
    font-family: 'Inter', sans-serif;
    user-select: none;
`;

const Track = styled(motion.div)<{ size: 'sm' | 'md' | 'lg'; checked: boolean; color: string }>`
    flex-shrink: 0;
    width: ${p => sizes[p.size].track.width}px;
    height: ${p => sizes[p.size].track.height}px;
    border-radius: 9999px;
    background: ${p => p.checked ? p.color : 'rgba(255,255,255,0.1)'};
    border: 1.5px solid ${p => p.checked ? p.color : 'rgba(255,255,255,0.08)'};
    position: relative;
    transition: background 0.2s, border-color 0.2s;
    box-shadow: ${p => p.checked ? `0 0 12px ${p.color}40` : 'none'};
`;

const Thumb = styled(motion.div)<{ size: 'sm' | 'md' | 'lg' }>`
    position: absolute;
    top: ${p => sizes[p.size].off}px;
    width: ${p => sizes[p.size].thumb}px;
    height: ${p => sizes[p.size].thumb}px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
`;

const TextWrap = styled.div`flex: 1; margin-top: 1px;`;
const LabelEl = styled.p`margin: 0; font-size: 0.85rem; color: #e2e8f0; font-weight: 500;`;
const Desc = styled.p`margin: 2px 0 0; font-size: 0.76rem; color: rgba(255,255,255,0.3); line-height: 1.4;`;

const Toggle: React.FC<ToggleProps> = ({
    checked, onChange, label, description, disabled = false, size = 'md', color = '#08cd00',
}) => {
    const s = sizes[size];
    const thumbX = checked ? s.track.width - s.thumb - s.off * 2 : 0;

    return (
        <Wrap disabled={disabled} onClick={() => !disabled && onChange(!checked)}>
            <Track size={size} checked={checked} color={color} layout>
                <Thumb
                    size={size}
                    animate={{ x: thumbX }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    style={{ left: s.off }}
                />
            </Track>
            {(label || description) && (
                <TextWrap>
                    {label && <LabelEl>{label}</LabelEl>}
                    {description && <Desc>{description}</Desc>}
                </TextWrap>
            )}
        </Wrap>
    );
};

export default Toggle;
