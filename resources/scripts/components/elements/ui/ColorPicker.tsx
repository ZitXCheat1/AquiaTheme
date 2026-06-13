import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components/macro';
import { motion, AnimatePresence } from 'framer-motion';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const hexToHsv = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, max === 0 ? 0 : d / max, max];
};

const hsvToHex = (h: number, s: number, v: number): string => {
    h /= 360;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    let r = 0, g = 0, b = 0;
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
};

const isValidHex = (h: string) => /^#[0-9a-fA-F]{6}$/.test(h);

const SWATCHES = [
    '#08cd00','#6366f1','#ef4444','#f59e0b','#10b981',
    '#3b82f6','#ec4899','#8b5cf6','#f97316','#06b6d4',
    '#64748b','#1e293b','#ffffff','#000000',
];

/* ── types ─────────────────────────────────────────────────────────────── */
interface ColorPickerProps {
    value?: string;
    onChange?: (hex: string) => void;
    label?: string;
    disabled?: boolean;
}

/* ── styles ─────────────────────────────────────────────────────────────── */
const Wrap = styled.div`position: relative; font-family: 'Inter', sans-serif; width: 100%;`;
const LabelEl = styled.label`display: block; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #4b5a72; margin-bottom: 6px;`;

const Trigger = styled.button<{ color: string; disabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 9px;
    color: #f1f5f9;
    font-size: 0.84rem;
    font-family: 'Inter', sans-serif;
    cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
    opacity: ${p => p.disabled ? 0.5 : 1};
    transition: border-color 0.15s, background 0.15s;
    outline: none;
    width: 100%;

    &:hover:not(:disabled) {
        background: rgba(255,255,255,0.06);
        border-color: rgba(255,255,255,0.14);
    }
`;

const Swatch = styled.div<{ color: string }>`
    width: 22px;
    height: 22px;
    border-radius: 5px;
    background: ${p => p.color};
    border: 1px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
`;

const Panel = styled(motion.div)`
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 260px;
    background: #111827;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    overflow: hidden;
    z-index: 999;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
`;

const SatValCanvas = styled.div<{ hue: number }>`
    position: relative;
    width: 100%;
    height: 160px;
    cursor: crosshair;
    background: linear-gradient(to bottom, transparent, #000),
                linear-gradient(to right, #fff, hsl(${p => p.hue}, 100%, 50%));
    flex-shrink: 0;
`;

const Picker = styled.div<{ x: number; y: number }>`
    position: absolute;
    left: ${p => p.x}%;
    top: ${p => p.y}%;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4);
    transform: translate(-50%, -50%);
    pointer-events: none;
`;

const HueTrack = styled.div`
    margin: 12px 14px 0;
    height: 10px;
    border-radius: 9999px;
    cursor: pointer;
    background: linear-gradient(to right,
        #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
    position: relative;
`;

const HueThumb = styled.div<{ left: number }>`
    position: absolute;
    left: ${p => p.left}%;
    top: 50%;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: hsl(${p => p.left * 3.6}, 100%, 50%);
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
    transform: translate(-50%, -50%);
    pointer-events: none;
    transition: left 0.03s;
`;

const HexRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px 12px;
`;

const HexInput = styled.input`
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 7px;
    padding: 6px 10px;
    color: #f1f5f9;
    font-size: 0.82rem;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.05em;
    outline: none;
    transition: border-color 0.15s;

    &:focus { border-color: rgba(8,205,0,0.4); }
`;

const CopyBtn = styled.button`
    padding: 6px 10px;
    background: rgba(8,205,0,0.12);
    border: 1px solid rgba(8,205,0,0.2);
    border-radius: 7px;
    color: #08cd00;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
    font-family: 'Inter', sans-serif;

    &:hover { background: rgba(8,205,0,0.2); }
`;

const SwatchGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
    padding: 0 14px 14px;
`;

const SwatchBtn = styled.button<{ color: string; active: boolean }>`
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: ${p => p.color};
    border: 2px solid ${p => p.active ? '#fff' : 'transparent'};
    cursor: pointer;
    transition: transform 0.1s, border-color 0.1s;
    outline: none;

    &:hover { transform: scale(1.12); }
`;

const Divider = styled.div`height: 1px; background: rgba(255,255,255,0.06); margin: 0 14px 10px;`;

/* ── component ──────────────────────────────────────────────────────────── */
const ColorPicker: React.FC<ColorPickerProps> = ({ value = '#08cd00', onChange, label, disabled }) => {
    const [open, setOpen] = useState(false);
    const [hex, setHex] = useState(value);
    const [hexInput, setHexInput] = useState(value);
    const [copied, setCopied] = useState(false);

    const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(value));
    const [hue, sat, val] = hsv;

    const satValRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<'satval' | 'hue' | null>(null);

    const applyHsv = useCallback((h: number, s: number, v: number) => {
        const newHex = hsvToHex(h, s, v);
        setHsv([h, s, v]);
        setHex(newHex);
        setHexInput(newHex);
        onChange?.(newHex);
    }, [onChange]);

    const getSatValFromEvent = (e: MouseEvent | React.MouseEvent) => {
        if (!satValRef.current) return;
        const rect = satValRef.current.getBoundingClientRect();
        const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
        applyHsv(hue, s, v);
    };

    const getHueFromEvent = (e: MouseEvent | React.MouseEvent) => {
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
        applyHsv(h, sat, val);
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (draggingRef.current === 'satval') getSatValFromEvent(e);
            if (draggingRef.current === 'hue') getHueFromEvent(e);
        };
        const onUp = () => { draggingRef.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [hue, sat, val]);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const copy = () => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1500); };

    return (
        <Wrap ref={panelRef}>
            {label && <LabelEl>{label}</LabelEl>}
            <Trigger color={hex} disabled={disabled} type="button" onClick={() => !disabled && setOpen(v => !v)}>
                <Swatch color={hex} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', fontSize: '0.82rem' }}>{hex.toUpperCase()}</span>
            </Trigger>

            <AnimatePresence>
                {open && (
                    <Panel
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Saturation / Value */}
                        <SatValCanvas
                            ref={satValRef}
                            hue={hue}
                            onMouseDown={e => { draggingRef.current = 'satval'; getSatValFromEvent(e); }}
                        >
                            <Picker x={sat * 100} y={(1 - val) * 100} />
                        </SatValCanvas>

                        {/* Hue */}
                        <HueTrack
                            ref={hueRef}
                            onMouseDown={e => { draggingRef.current = 'hue'; getHueFromEvent(e); }}
                        >
                            <HueThumb left={(hue / 360) * 100} />
                        </HueTrack>

                        {/* Hex Input */}
                        <HexRow>
                            <HexInput
                                value={hexInput}
                                onChange={e => {
                                    setHexInput(e.target.value);
                                    if (isValidHex(e.target.value)) {
                                        setHex(e.target.value);
                                        setHsv(hexToHsv(e.target.value));
                                        onChange?.(e.target.value);
                                    }
                                }}
                                onBlur={() => { if (!isValidHex(hexInput)) setHexInput(hex); }}
                                maxLength={7}
                            />
                            <CopyBtn type="button" onClick={copy}>{copied ? '✓' : 'Copy'}</CopyBtn>
                        </HexRow>

                        <Divider />

                        {/* Swatches */}
                        <SwatchGrid>
                            {SWATCHES.map(s => (
                                <SwatchBtn
                                    key={s}
                                    type="button"
                                    color={s}
                                    active={hex.toLowerCase() === s.toLowerCase()}
                                    onClick={() => { setHex(s); setHexInput(s); setHsv(hexToHsv(s)); onChange?.(s); }}
                                />
                            ))}
                        </SwatchGrid>
                    </Panel>
                )}
            </AnimatePresence>
        </Wrap>
    );
};

export default ColorPicker;
