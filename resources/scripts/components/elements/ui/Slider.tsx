import React, { useRef, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components/macro';
import { motion, AnimatePresence } from 'framer-motion';

/* ── types ─────────────────────────────────────────────────────────────── */
interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    unit?: string;
    disabled?: boolean;
    showTicks?: boolean;
    markers?: { value: number; label: string }[];
    color?: string;
}

/* ── styles ─────────────────────────────────────────────────────────────── */
const Wrap = styled.div`width: 100%; font-family: 'Inter', sans-serif; user-select: none;`;

const Header = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;`;

const LabelEl = styled.span`font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #4b5a72;`;

const ValueBadge = styled(motion.span)`
    font-size: 0.78rem;
    font-weight: 700;
    color: #08cd00;
    background: rgba(8,205,0,0.12);
    border-radius: 6px;
    padding: 2px 8px;
    font-variant-numeric: tabular-nums;
`;

const Track = styled.div<{ disabled?: boolean }>`
    position: relative;
    height: 6px;
    background: rgba(255,255,255,0.08);
    border-radius: 9999px;
    cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
    opacity: ${p => p.disabled ? 0.4 : 1};
`;

const Fill = styled.div<{ color: string }>`
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 9999px;
    background: ${p => p.color};
    transition: width 0.05s linear;
    pointer-events: none;
`;

const Thumb = styled(motion.div)<{ color: string; dragging: boolean }>`
    position: absolute;
    top: 50%;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${p => p.color};
    border: 2px solid rgba(0,0,0,0.3);
    transform: translate(-50%, -50%);
    cursor: grab;
    box-shadow: 0 0 0 ${p => p.dragging ? '5px' : '0px'} rgba(8,205,0,0.2);
    transition: box-shadow 0.15s;
    z-index: 1;

    &:active { cursor: grabbing; }
`;

const Tooltip = styled(motion.div)`
    position: absolute;
    bottom: 26px;
    transform: translateX(-50%);
    background: #1e2938;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 0.74rem;
    color: #f1f5f9;
    white-space: nowrap;
    pointer-events: none;
    font-weight: 600;

    &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: rgba(255,255,255,0.1);
    }
`;

const MarkersRow = styled.div`position: relative; margin-top: 8px; height: 16px;`;
const Marker = styled.span<{ left: number }>`
    position: absolute;
    left: ${p => p.left}%;
    transform: translateX(-50%);
    font-size: 0.65rem;
    color: rgba(255,255,255,0.25);
`;

/* ── component ──────────────────────────────────────────────────────────── */
const Slider: React.FC<SliderProps> = ({
    value, onChange, min = 0, max = 100, step = 1,
    label, unit = '', disabled = false, markers, color = '#08cd00',
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [hovering, setHovering] = useState(false);

    const clamp = (v: number) => Math.min(max, Math.max(min, v));
    const snap = (v: number) => Math.round(v / step) * step;
    const pct = ((value - min) / (max - min)) * 100;

    const getValueFromEvent = useCallback((clientX: number) => {
        if (!trackRef.current) return value;
        const rect = trackRef.current.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return snap(clamp(min + ratio * (max - min)));
    }, [min, max, step, value]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        setDragging(true);
        onChange(getValueFromEvent(e.clientX));
    };

    useEffect(() => {
        if (!dragging) return;
        const onMove = (e: MouseEvent) => onChange(getValueFromEvent(e.clientX));
        const onUp = () => setDragging(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [dragging, getValueFromEvent]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(clamp(snap(value + step)));
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(clamp(snap(value - step)));
        if (e.key === 'Home') onChange(min);
        if (e.key === 'End') onChange(max);
    };

    return (
        <Wrap>
            {(label || unit) && (
                <Header>
                    {label && <LabelEl>{label}</LabelEl>}
                    <ValueBadge layout>{value}{unit}</ValueBadge>
                </Header>
            )}
            <Track
                ref={trackRef}
                disabled={disabled}
                onMouseDown={handleMouseDown}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={handleKeyDown}
                role="slider"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
            >
                <Fill color={color} style={{ width: `${pct}%` }} />
                <Thumb
                    color={color}
                    dragging={dragging}
                    style={{ left: `${pct}%` }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 1.1 }}
                >
                    <AnimatePresence>
                        {(dragging || hovering) && (
                            <Tooltip
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.1 }}
                            >
                                {value}{unit}
                            </Tooltip>
                        )}
                    </AnimatePresence>
                </Thumb>
            </Track>
            {markers && (
                <MarkersRow>
                    {markers.map(m => (
                        <Marker key={m.value} left={((m.value - min) / (max - min)) * 100}>
                            {m.label}
                        </Marker>
                    ))}
                </MarkersRow>
            )}
        </Wrap>
    );
};

export default Slider;
