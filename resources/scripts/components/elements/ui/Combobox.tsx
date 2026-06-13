import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckIcon, SearchIcon, XIcon } from '@heroicons/react/outline';

/* ── types ─────────────────────────────────────────────────────────────── */
export interface ComboboxOption {
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    label?: string;
    disabled?: boolean;
    error?: string;
    clearable?: boolean;
    maxHeight?: number;
}

/* ── styles ─────────────────────────────────────────────────────────────── */
const Wrap = styled.div`position: relative; width: 100%; font-family: 'Inter', sans-serif;`;

const Trigger = styled.button<{ open: boolean; error?: string; disabled?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid ${p => p.error ? 'rgba(239,68,68,0.5)' : p.open ? 'rgba(8,205,0,0.4)' : 'rgba(255,255,255,0.08)'};
    border-radius: 9px;
    color: ${p => p.disabled ? 'rgba(255,255,255,0.25)' : '#f1f5f9'};
    font-size: 0.85rem;
    cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
    transition: border-color 0.15s, background 0.15s;
    text-align: left;
    outline: none;

    &:hover:not(:disabled) {
        background: rgba(255,255,255,0.06);
        border-color: ${p => p.error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.14)'};
    }
`;

const TriggerLabel = styled.span<{ placeholder?: boolean }>`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${p => p.placeholder ? 'rgba(255,255,255,0.22)' : '#f1f5f9'};
`;

const Chevron = styled(ChevronDownIcon)<{ open: boolean }>`
    width: 15px;
    height: 15px;
    color: rgba(255,255,255,0.3);
    flex-shrink: 0;
    transition: transform 0.2s ease;
    transform: ${p => p.open ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const Dropdown = styled(motion.div)`
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: #111827;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    overflow: hidden;
    z-index: 999;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
`;

const SearchWrap = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const SearchInput = styled.input`
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: #f1f5f9;
    font-size: 0.83rem;
    font-family: 'Inter', sans-serif;
    &::placeholder { color: rgba(255,255,255,0.22); }
`;

const List = styled.div<{ maxHeight: number }>`
    overflow-y: auto;
    max-height: ${p => p.maxHeight}px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

const Item = styled.button<{ selected: boolean; disabled?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    background: ${p => p.selected ? 'rgba(8,205,0,0.1)' : 'transparent'};
    border: none;
    color: ${p => p.disabled ? 'rgba(255,255,255,0.25)' : p.selected ? '#08cd00' : '#cbd5e1'};
    font-size: 0.83rem;
    font-family: 'Inter', sans-serif;
    cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
    text-align: left;
    transition: background 0.1s;
    outline: none;

    &:hover:not(:disabled) {
        background: ${p => p.selected ? 'rgba(8,205,0,0.14)' : 'rgba(255,255,255,0.05)'};
    }
`;

const ItemCheck = styled.div<{ visible: boolean }>`
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #08cd00;
    opacity: ${p => p.visible ? 1 : 0};
`;

const ItemDesc = styled.p`
    font-size: 0.72rem;
    color: rgba(255,255,255,0.3);
    margin: 0;
    line-height: 1.3;
`;

const Empty = styled.div`
    padding: 20px 12px;
    text-align: center;
    color: rgba(255,255,255,0.25);
    font-size: 0.8rem;
`;

const ErrorMsg = styled.p`color: #ef4444; font-size: 0.74rem; margin: 4px 0 0; font-family: 'Inter', sans-serif;`;
const LabelEl = styled.label`display: block; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #4b5a72; margin-bottom: 6px; font-family: 'Inter', sans-serif;`;

const dropdownVariants = {
    hidden: { opacity: 0, y: -6, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } },
};

/* ── component ──────────────────────────────────────────────────────────── */
const Combobox: React.FC<ComboboxProps> = ({
    options, value, onChange, placeholder = 'Select an option…', searchPlaceholder = 'Search…',
    label, disabled, error, clearable, maxHeight = 240,
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selected = options.find(o => o.value === value);
    const filtered = query
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()) || o.description?.toLowerCase().includes(query.toLowerCase()))
        : options;

    const toggle = () => { if (!disabled) setOpen(v => !v); };
    const select = (opt: ComboboxOption) => {
        if (opt.disabled) return;
        onChange?.(opt.value);
        setOpen(false);
        setQuery('');
    };
    const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange?.(''); };

    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 50);
        else setQuery('');
    }, [open]);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <Wrap ref={ref}>
            {label && <LabelEl>{label}</LabelEl>}
            <Trigger type="button" open={open} error={error} disabled={disabled} onClick={toggle}>
                <TriggerLabel placeholder={!selected}>
                    {selected ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {selected.icon && <span style={{ opacity: 0.7 }}>{selected.icon}</span>}
                            {selected.label}
                        </span>
                    ) : placeholder}
                </TriggerLabel>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {clearable && selected && (
                        <XIcon onClick={clear} style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }} />
                    )}
                    <Chevron open={open} />
                </span>
            </Trigger>

            <AnimatePresence>
                {open && (
                    <Dropdown variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                        {options.length > 6 && (
                            <SearchWrap>
                                <SearchIcon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                                <SearchInput
                                    ref={searchRef}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder={searchPlaceholder}
                                />
                            </SearchWrap>
                        )}
                        <List maxHeight={maxHeight}>
                            {filtered.length === 0 ? (
                                <Empty>No results found</Empty>
                            ) : filtered.map(opt => (
                                <Item key={opt.value} selected={opt.value === value} disabled={opt.disabled} onClick={() => select(opt)}>
                                    <ItemCheck visible={opt.value === value}>
                                        <CheckIcon style={{ width: 14, height: 14 }} />
                                    </ItemCheck>
                                    <span style={{ flex: 1 }}>
                                        {opt.icon && <span style={{ marginRight: 6, opacity: 0.7 }}>{opt.icon}</span>}
                                        {opt.label}
                                        {opt.description && <ItemDesc>{opt.description}</ItemDesc>}
                                    </span>
                                </Item>
                            ))}
                        </List>
                    </Dropdown>
                )}
            </AnimatePresence>
            {error && <ErrorMsg>{error}</ErrorMsg>}
        </Wrap>
    );
};

export default Combobox;
