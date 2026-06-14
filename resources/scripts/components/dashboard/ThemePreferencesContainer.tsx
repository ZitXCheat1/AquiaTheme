import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPalette, faTextHeight, faExpandArrowsAlt, faUndo } from '@fortawesome/free-solid-svg-icons';

const STORAGE_KEY = 'aquia-theme-prefs';

const ACCENTS = [
    { id: 'green',  label: 'Green',  hex: '#08cd00' },
    { id: 'blue',   label: 'Blue',   hex: '#3b82f6' },
    { id: 'purple', label: 'Purple', hex: '#a855f7' },
    { id: 'amber',  label: 'Amber',  hex: '#f59e0b' },
    { id: 'rose',   label: 'Rose',   hex: '#f43f5e' },
    { id: 'cyan',   label: 'Cyan',   hex: '#06b6d4' },
] as const;

const FONT_SIZES = [
    { id: 'sm', label: 'Compact', mult: 0.93 },
    { id: 'md', label: 'Default', mult: 1.0 },
    { id: 'lg', label: 'Large',   mult: 1.08 },
] as const;

const DENSITIES = [
    { id: 'tight', label: 'Tight',   mult: 0.85 },
    { id: 'cozy',  label: 'Cozy',    mult: 1.0 },
    { id: 'roomy', label: 'Roomy',   mult: 1.18 },
] as const;

type AccentId = typeof ACCENTS[number]['id'];
type FontSizeId = typeof FONT_SIZES[number]['id'];
type DensityId = typeof DENSITIES[number]['id'];

interface Prefs {
    accent: AccentId;
    fontSize: FontSizeId;
    density: DensityId;
}

const DEFAULT_PREFS: Prefs = { accent: 'green', fontSize: 'md', density: 'cozy' };

function load(): Prefs {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_PREFS;
}

function hexToRgba(hex: string, a: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function applyPrefs(prefs: Prefs) {
    const accent = ACCENTS.find(a => a.id === prefs.accent) || ACCENTS[0];
    const size = FONT_SIZES.find(f => f.id === prefs.fontSize) || FONT_SIZES[1];
    const density = DENSITIES.find(d => d.id === prefs.density) || DENSITIES[1];
    const root = document.documentElement;
    root.style.setProperty('--aq-accent', accent.hex);
    root.style.setProperty('--aq-accent-15', hexToRgba(accent.hex, 0.15));
    root.style.setProperty('--aq-accent-25', hexToRgba(accent.hex, 0.25));
    root.style.setProperty('--aq-accent-08', hexToRgba(accent.hex, 0.08));
    root.style.setProperty('--aq-font-scale', String(size.mult));
    root.style.setProperty('--aq-density-scale', String(density.mult));
    root.style.fontSize = `${16 * size.mult}px`;
    root.setAttribute('data-aq-density', density.id);
    root.setAttribute('data-aq-accent', accent.id);
}

// Apply on first script load so themed pages render with the user's choice from the start.
applyPrefs(load());

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`;

const Page = styled.div`
    padding:28px;max-width:920px;margin:0 auto;color:#e8f5e8;
    font-family:'Inter',sans-serif;
    animation:${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
`;
const Heading = styled.h1`font-size:1.4rem;font-weight:700;color:#fff;margin:0 0 4px;letter-spacing:-0.025em;`;
const Sub = styled.p`font-size:0.85rem;color:#94a3b8;margin:0 0 28px;`;
const Section = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);
    border-radius:12px;padding:22px;margin-bottom:14px;
`;
const SectionTitle = styled.div`
    font-size:0.72rem;font-weight:700;color:#4d7a4d;
    letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px;
    display:flex;align-items:center;gap:8px;
`;
const AccentGrid = styled.div`
    display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;
`;
const Swatch = styled.button<{ $hex: string; $selected?: boolean }>`
    display:flex;align-items:center;gap:10px;padding:12px;
    background:${p => p.$selected ? 'rgba(8,205,0,0.06)' : '#0a0f0a'};
    border:1.5px solid ${p => p.$selected ? p.$hex : 'rgba(8,205,0,0.1)'};
    border-radius:10px;cursor:pointer;transition:all 0.18s;
    font-family:'Inter',sans-serif;
    &:hover{border-color:${p => p.$hex};transform:translateY(-2px);}
`;
const Dot = styled.div<{ $hex: string }>`
    width:22px;height:22px;border-radius:50%;flex-shrink:0;
    background:${p => p.$hex};box-shadow:0 0 0 3px ${p => p.$hex}22;
`;
const SwLabel = styled.div`flex:1;text-align:left;`;
const SwName = styled.div`font-size:0.82rem;font-weight:600;color:#fff;`;
const Check = styled.div<{ $hex: string }>`
    width:18px;height:18px;border-radius:50%;
    background:${p => p.$hex};color:#0a0f0a;
    display:flex;align-items:center;justify-content:center;font-size:0.55rem;
`;
const PillRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const Pill = styled.button<{ $selected?: boolean }>`
    padding:9px 18px;border-radius:8px;cursor:pointer;
    background:${p => p.$selected ? '#08cd00' : '#0a0f0a'};
    border:1px solid ${p => p.$selected ? '#08cd00' : 'rgba(8,205,0,0.14)'};
    color:${p => p.$selected ? '#0a0f0a' : '#e8f5e8'};
    font-size:0.8rem;font-weight:600;font-family:'Inter',sans-serif;
    transition:all 0.15s;
    &:hover{border-color:rgba(8,205,0,0.35);}
`;
const Preview = styled.div`
    background:#0a0f0a;border:1px solid rgba(8,205,0,0.1);border-radius:10px;
    padding:18px;margin-top:14px;
`;
const PreviewLabel = styled.div`
    font-size:0.62rem;font-weight:700;color:#4d7a4d;
    letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;
`;
const PreviewTxt = styled.div`font-size:0.95rem;color:#fff;margin-bottom:6px;`;
const PreviewSub = styled.div`font-size:0.78rem;color:#94a3b8;`;
const Footer = styled.div`display:flex;align-items:center;justify-content:space-between;margin-top:18px;`;
const Reset = styled.button`
    display:flex;align-items:center;gap:8px;background:none;border:none;
    color:#94a3b8;cursor:pointer;font-size:0.82rem;font-family:'Inter',sans-serif;
    transition:color 0.15s;
    &:hover{color:#ef4444;}
`;
const Saved = styled.div<{ $visible: boolean }>`
    font-size:0.78rem;color:#08cd00;opacity:${p => p.$visible ? 1 : 0};
    transition:opacity 0.3s;display:flex;align-items:center;gap:6px;
`;

export default function ThemePreferencesContainer() {
    const [prefs, setPrefs] = useState<Prefs>(load);
    const [savedFlash, setSavedFlash] = useState(false);

    useEffect(() => {
        applyPrefs(prefs);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
        setSavedFlash(true);
        const id = setTimeout(() => setSavedFlash(false), 1500);
        return () => clearTimeout(id);
    }, [prefs]);

    const reset = () => setPrefs(DEFAULT_PREFS);
    const accent = ACCENTS.find(a => a.id === prefs.accent) || ACCENTS[0];

    return (
        <PageContentBlock title='Theme Preferences'>
            <Page>
                <Heading>Theme Preferences</Heading>
                <Sub>Customize how AquiaTheme looks for your account. Changes are saved instantly to this browser.</Sub>

                <Section>
                    <SectionTitle><FontAwesomeIcon icon={faPalette}/> Accent color</SectionTitle>
                    <AccentGrid>
                        {ACCENTS.map(a => (
                            <Swatch key={a.id} $hex={a.hex} $selected={prefs.accent === a.id} onClick={() => setPrefs(p => ({ ...p, accent: a.id }))}>
                                <Dot $hex={a.hex}/>
                                <SwLabel><SwName>{a.label}</SwName></SwLabel>
                                {prefs.accent === a.id && <Check $hex={a.hex}><FontAwesomeIcon icon={faCheck}/></Check>}
                            </Swatch>
                        ))}
                    </AccentGrid>
                </Section>

                <Section>
                    <SectionTitle><FontAwesomeIcon icon={faTextHeight}/> Font size</SectionTitle>
                    <PillRow>
                        {FONT_SIZES.map(f => (
                            <Pill key={f.id} $selected={prefs.fontSize === f.id} onClick={() => setPrefs(p => ({ ...p, fontSize: f.id }))}>
                                {f.label}
                            </Pill>
                        ))}
                    </PillRow>
                </Section>

                <Section>
                    <SectionTitle><FontAwesomeIcon icon={faExpandArrowsAlt}/> Density</SectionTitle>
                    <PillRow>
                        {DENSITIES.map(d => (
                            <Pill key={d.id} $selected={prefs.density === d.id} onClick={() => setPrefs(p => ({ ...p, density: d.id }))}>
                                {d.label}
                            </Pill>
                        ))}
                    </PillRow>

                    <Preview>
                        <PreviewLabel>Preview</PreviewLabel>
                        <PreviewTxt style={{ color: accent.hex }}>The quick green fox jumps over the lazy server.</PreviewTxt>
                        <PreviewSub>Body copy renders at the chosen size and density.</PreviewSub>
                    </Preview>
                </Section>

                <Footer>
                    <Reset onClick={reset}><FontAwesomeIcon icon={faUndo}/> Reset to defaults</Reset>
                    <Saved $visible={savedFlash}><FontAwesomeIcon icon={faCheck}/> Saved</Saved>
                </Footer>
            </Page>
        </PageContentBlock>
    );
}
