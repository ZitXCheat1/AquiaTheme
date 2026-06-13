import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckCircle, faExclamationTriangle, faSave, faSync, 
    faRandom, faCopy, faUndo, faEye, faEdit, faPalette,
    faBold, faItalic, faUnderline, faStrikethrough, faEraser,
    faArrowLeft, faArrowRight, faList, faGamepad
} from '@fortawesome/free-solid-svg-icons';

/* ────────────────────────────────────────────────────────────── */
/* Type Definitions                                              */
/* ────────────────────────────────────────────────────────────── */

interface Segment {
    text: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    obfuscated?: boolean;
}

interface ColorPreset {
    code: string;
    color: string;
    name: string;
    rgb: string;
}

/* ────────────────────────────────────────────────────────────── */
/* Minecraft Formatting Constants                                 */
/* ────────────────────────────────────────────────────────────── */

const MC_COLORS: ColorPreset[] = [
    { code: '§0', color: '#000000', name: 'Black', rgb: '0,0,0' },
    { code: '§1', color: '#0000AA', name: 'Dark Blue', rgb: '0,0,170' },
    { code: '§2', color: '#00AA00', name: 'Dark Green', rgb: '0,170,0' },
    { code: '§3', color: '#00AAAA', name: 'Dark Aqua', rgb: '0,170,170' },
    { code: '§4', color: '#AA0000', name: 'Dark Red', rgb: '170,0,0' },
    { code: '§5', color: '#AA00AA', name: 'Dark Purple', rgb: '170,0,170' },
    { code: '§6', color: '#FFAA00', name: 'Gold', rgb: '255,170,0' },
    { code: '§7', color: '#AAAAAA', name: 'Gray', rgb: '170,170,170' },
    { code: '§8', color: '#555555', name: 'Dark Gray', rgb: '85,85,85' },
    { code: '§9', color: '#5555FF', name: 'Blue', rgb: '85,85,255' },
    { code: '§a', color: '#55FF55', name: 'Green', rgb: '85,255,85' },
    { code: '§b', color: '#55FFFF', name: 'Aqua', rgb: '85,255,255' },
    { code: '§c', color: '#FF5555', name: 'Red', rgb: '255,85,85' },
    { code: '§d', color: '#FF55FF', name: 'Light Purple', rgb: '255,85,255' },
    { code: '§e', color: '#FFFF55', name: 'Yellow', rgb: '255,255,85' },
    { code: '§f', color: '#FFFFFF', name: 'White', rgb: '255,255,255' },
];

const MC_FORMATS = [
    { code: '§l', label: 'Bold', icon: faBold, css: 'font-weight:bold' },
    { code: '§o', label: 'Italic', icon: faItalic, css: 'font-style:italic' },
    { code: '§n', label: 'Underline', icon: faUnderline, css: 'text-decoration:underline' },
    { code: '§m', label: 'Strikethrough', icon: faStrikethrough, css: 'text-decoration:line-through' },
    { code: '§k', label: 'Obfuscated', icon: faRandom, css: '' },
    { code: '§r', label: 'Reset', icon: faEraser, css: '' },
];

const PRESETS = [
    { name: 'Welcome', value: '§6§lWelcome §r§7to §f§lMyServer', description: 'Friendly welcome message' },
    { name: 'Minimal', value: '§f§l◆ §r§7A Minecraft Server', description: 'Clean and simple' },
    { name: 'SMP', value: '§2§l⚡ §r§aSurvival §8| §71.21 §8| §aJava + Bedrock', description: 'Survival server' },
    { name: 'Minigames', value: '§c§l⚔ §r§6Minigames §8| §eParty Games §8| §bPlay Now', description: 'Minigames server' },
    { name: 'Creative', value: '§b§l✧ §r§3Creative §8| §7Free Build §8| §aClaim Land', description: 'Creative server' },
    { name: 'Network', value: '§5§l❖ §r§dNetwork §8| §7Hub §8| §aSkyBlock §8| §eFactions', description: 'Multi-server network' },
    { name: 'Roleplay', value: '§d§l✦ §r§5FantasyRP §8| §7Custom Classes §8| §aLore', description: 'Roleplay server' },
    { name: 'Competitive', value: '§c§l🏆 §r§6Ranked §8| §71v1 Duels §8| §bTournaments', description: 'Competitive gameplay' },
];

/* ────────────────────────────────────────────────────────────── */
/* Parser Functions                                              */
/* ────────────────────────────────────────────────────────────── */

function parseMOTD(raw: string): Segment[] {
    const segments: Segment[] = [];
    let current: Segment = { text: '', color: '#AAAAAA', bold: false, italic: false, underline: false, strike: false, obfuscated: false };
    let i = 0;
    
    const flush = () => {
        if (current.text) {
            segments.push({ ...current });
            current.text = '';
        }
    };
    
    while (i < raw.length) {
        // Handle Minecraft formatting codes
        if (raw[i] === '§' && i + 1 < raw.length) {
            flush();
            const code = raw[i + 1].toLowerCase();
            const colorEntry = MC_COLORS.find(c => c.code === `§${code}`);
            
            if (colorEntry) {
                current.color = colorEntry.color;
                current.bold = false;
                current.italic = false;
                current.underline = false;
                current.strike = false;
                current.obfuscated = false;
            } else {
                switch (code) {
                    case 'l': current.bold = true; break;
                    case 'o': current.italic = true; break;
                    case 'n': current.underline = true; break;
                    case 'm': current.strike = true; break;
                    case 'k': current.obfuscated = true; break;
                    case 'r': 
                        current.color = '#AAAAAA';
                        current.bold = false;
                        current.italic = false;
                        current.underline = false;
                        current.strike = false;
                        current.obfuscated = false;
                        break;
                }
            }
            i += 2;
        } 
        // Handle newline escapes
        else if (raw[i] === '\\' && raw[i + 1] === 'n') {
            flush();
            segments.push({ text: '\n', color: current.color });
            i += 2;
        } 
        // Regular text
        else {
            current.text += raw[i];
            i++;
        }
    }
    
    flush();
    return segments;
}

function stripMinecraftCodes(text: string): string {
    return text.replace(/§[0-9a-fk-or]/gi, '').replace(/\\n/g, '\n');
}

function getCharacterLimit(text: string): number {
    const stripped = stripMinecraftCodes(text);
    return stripped.length;
}

/* ────────────────────────────────────────────────────────────── */
/* Styled Components                                             */
/* ────────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
`;

const Container = styled.div`
    padding: 28px 32px;
    max-width: 900px;
    margin: 0 auto;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    animation: ${fadeIn} 0.4s ease-out;
`;

const Header = styled.div`
    margin-bottom: 28px;
`;

const Title = styled.h1`
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #08cd00, #00ff88);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const Subtitle = styled.p`
    color: #94a3b8;
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.5;
`;

const Card = styled.div<{ $noPadding?: boolean }>`
    background: rgba(18, 24, 18, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(8, 205, 0, 0.15);
    border-radius: 16px;
    margin-bottom: 20px;
    overflow: hidden;
    animation: ${slideIn} 0.3s ease-out;
    transition: all 0.2s ease;
    
    &:hover {
        border-color: rgba(8, 205, 0, 0.25);
    }
`;

const CardHeader = styled.div`
    padding: 16px 20px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(8, 205, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 10px;
`;

const CardTitle = styled.h3`
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #08cd00;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const CardBody = styled.div`
    padding: 20px;
`;

/* Minecraft Preview Styles */
const PreviewContainer = styled.div`
    background: #1a1d21;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const PreviewHeader = styled.div`
    background: #25282e;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #33373f;
    
    &::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff5f56;
        box-shadow: 12px 0 0 #ffbd2e, 24px 0 0 #27c93f;
    }
`;

const PreviewContent = styled.div`
    padding: 16px;
`;

const ServerEntry = styled.div`
    display: flex;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    transition: background 0.2s;
    
    &:hover {
        background: rgba(255, 255, 255, 0.06);
    }
`;

const ServerIcon = styled.div`
    width: 64px;
    height: 64px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    background: #0a0e0a;
    border: 1px solid rgba(8, 205, 0, 0.2);
    
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        image-rendering: pixelated;
    }
`;

const ServerInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const ServerName = styled.div`
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 6px;
    text-shadow: 2px 2px 0 #3f3f3f;
`;

const ServerMOTD = styled.div`
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.4;
    margin-bottom: 6px;
`;

const Line = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
`;

const StyledSpan = styled.span<{
    $color?: string;
    $bold?: boolean;
    $italic?: boolean;
    $underline?: boolean;
    $strike?: boolean;
    $obfuscated?: boolean;
}>`
    color: ${p => p.$color || '#AAAAAA'};
    font-weight: ${p => p.$bold ? 'bold' : 'normal'};
    font-style: ${p => p.$italic ? 'italic' : 'normal'};
    text-decoration: ${p => [
        p.$underline && 'underline',
        p.$strike && 'line-through'
    ].filter(Boolean).join(' ') || 'none'};
    animation: ${p => p.$obfuscated ? css`${pulse} 0.5s infinite` : 'none'};
    white-space: pre-wrap;
    word-break: break-word;
`;

const ServerPlayers = styled.div`
    font-size: 11px;
    color: #7a8a9a;
    font-family: 'Courier New', monospace;
`;

const PingIndicator = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
`;

const PingBars = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 14px;
`;

const PingBar = styled.div<{ $height: number; $active: boolean }>`
    width: 3px;
    height: ${p => p.$height}px;
    background: ${p => p.$active ? '#55ff55' : '#4a4e57'};
    border-radius: 1px;
    transition: all 0.2s;
`;

/* Editor Styles */
const ToolbarSection = styled.div`
    margin-bottom: 20px;
`;

const ToolbarGroup = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
`;

const GroupLabel = styled.div`
    font-size: 0.7rem;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const ColorButton = styled.button<{ $color: string }>`
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: ${p => p.$color};
    border: 2px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    
    &:hover {
        transform: scale(1.1);
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    &::after {
        content: attr(data-color);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1a1e24;
        color: #fff;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        margin-bottom: 4px;
    }
    
    &:hover::after {
        opacity: 1;
    }
`;

const FormatButton = styled.button<{ $active?: boolean }>`
    padding: 6px 12px;
    border-radius: 6px;
    background: ${p => p.$active ? 'rgba(8, 205, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)'};
    border: 1px solid ${p => p.$active ? 'rgba(8, 205, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${p => p.$active ? '#08cd00' : '#cbd5e1'};
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    
    &:hover {
        background: rgba(8, 205, 0, 0.1);
        border-color: rgba(8, 205, 0, 0.3);
        color: #08cd00;
    }
`;

const TextareaWrapper = styled.div`
    position: relative;
    margin-bottom: 8px;
`;

const StyledTextarea = styled.textarea`
    width: 100%;
    min-height: 100px;
    background: #0a0e0a;
    border: 1px solid rgba(8, 205, 0, 0.2);
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 0.875rem;
    font-family: 'Courier New', 'Consolas', monospace;
    padding: 12px;
    resize: vertical;
    outline: none;
    transition: all 0.2s;
    line-height: 1.6;
    
    &:focus {
        border-color: rgba(8, 205, 0, 0.5);
        box-shadow: 0 0 0 2px rgba(8, 205, 0, 0.1);
    }
    
    &::placeholder {
        color: #2a3d2a;
    }
`;

const CharacterCounter = styled.div<{ $warning?: boolean; $danger?: boolean }>`
    font-size: 0.7rem;
    text-align: right;
    color: ${p => p.$danger ? '#ef4444' : p.$warning ? '#f59e0b' : '#6b7280'};
    font-family: 'Courier New', monospace;
`;

const PresetGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
`;

const PresetButton = styled.button`
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(8, 205, 0, 0.15);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    
    &:hover {
        background: rgba(8, 205, 0, 0.05);
        border-color: rgba(8, 205, 0, 0.3);
        transform: translateY(-2px);
    }
    
    .preset-name {
        font-weight: 700;
        color: #08cd00;
        font-size: 0.8125rem;
        margin-bottom: 4px;
    }
    
    .preset-desc {
        font-size: 0.7rem;
        color: #94a3b8;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    
    ${p => {
        switch (p.$variant) {
            case 'primary':
                return css`
                    background: linear-gradient(135deg, #08cd00, #00aa00);
                    border: none;
                    color: #000;
                    
                    &:hover:not(:disabled) {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(8, 205, 0, 0.3);
                    }
                `;
            case 'danger':
                return css`
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    
                    &:hover {
                        background: rgba(239, 68, 68, 0.15);
                        border-color: rgba(239, 68, 68, 0.5);
                    }
                `;
            default:
                return css`
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #cbd5e1;
                    
                    &:hover {
                        background: rgba(255, 255, 255, 0.05);
                        border-color: rgba(255, 255, 255, 0.2);
                    }
                `;
        }
    }}
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const Toast = styled.div<{ $type?: 'success' | 'error' }>`
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.8125rem;
    font-weight: 500;
    animation: ${fadeIn} 0.3s ease-out;
    z-index: 1000;
    
    ${p => p.$type === 'success' && css`
        background: rgba(8, 205, 0, 0.1);
        border: 1px solid rgba(8, 205, 0, 0.3);
        color: #08cd00;
    `}
    
    ${p => p.$type === 'error' && css`
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
    `}
`;

const Divider = styled.hr`
    margin: 16px 0;
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(8, 205, 0, 0.2), transparent);
`;

/* ────────────────────────────────────────────────────────────── */
/* Helper Functions                                              */
/* ────────────────────────────────────────────────────────────── */

const AQUIA_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#0a0f0a"/>
    <rect x="8" y="14" width="48" height="14" rx="3" fill="#111611" stroke="#08cd00" stroke-width="1.2"/>
    <rect x="8" y="33" width="48" height="14" rx="3" fill="#111611" stroke="#08cd00" stroke-width="1.2"/>
    <rect x="12" y="18" width="22" height="6" rx="1.5" fill="#1a2a1a"/>
    <rect x="12" y="37" width="22" height="6" rx="1.5" fill="#1a2a1a"/>
    <circle cx="40" cy="21" r="2.5" fill="#08cd00"/>
    <circle cx="46" cy="21" r="2.5" fill="#08cd00" opacity="0.4"/>
    <circle cx="40" cy="40" r="2.5" fill="#08cd00" opacity="0.7"/>
    <circle cx="46" cy="40" r="2.5" fill="#08cd00"/>
    <rect x="13" y="19.5" width="10" height="3" rx="1" fill="#08cd00" opacity="0.2"/>
    <rect x="13" y="38.5" width="10" height="3" rx="1" fill="#08cd00" opacity="0.2"/>
</svg>`;

const DEFAULT_ICON = `data:image/svg+xml;base64,${btoa(AQUIA_ICON_SVG)}`;

/* ────────────────────────────────────────────────────────────── */
/* Main Component                                                */
/* ────────────────────────────────────────────────────────────── */

export default function MotdContainer() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const [motd, setMotd] = useState('§6§lA Minecraft Server\\n§7Welcome! Join and play.');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [rawProps, setRawProps] = useState('');
    const [serverIcon, setServerIcon] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string>('');

    // Load current MOTD from server.properties
    useEffect(() => {
        loadMOTD();
        loadServerIcon();
    }, [uuid]);

    const loadMOTD = async () => {
        setLoading(true);
        try {
            const raw = await getFileContents(uuid, '/server.properties');
            setRawProps(raw);
            const match = raw.match(/^motd=(.*)$/m);
            if (match) setMotd(match[1]);
        } catch (error) {
            showToast('Failed to load MOTD', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadServerIcon = async () => {
        try {
            const data = await getFileContents(uuid, '/server-icon.png');
            if (data && data.startsWith('data:')) setServerIcon(data);
        } catch (error) {
            // No icon found, use default
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const insertFormat = (code: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setMotd(prev => prev + code);
            return;
        }
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = motd.slice(0, start) + code + motd.slice(end);
        setMotd(newValue);
        
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + code.length;
        }, 0);
    };

    const saveMOTD = async () => {
        if (!rawProps) return;
        
        const charCount = getCharacterLimit(motd);
        if (charCount > 59) {
            showToast(`MOTD exceeds 59 character limit (${charCount} chars)`, 'error');
            return;
        }
        
        setSaving(true);
        try {
            const updated = rawProps.replace(/^motd=.*$/m, `motd=${motd}`);
            await saveFileContents(uuid, '/server.properties', updated);
            showToast('MOTD saved successfully! Restart your server to apply changes.', 'success');
        } catch (error: any) {
            showToast(error?.message || 'Failed to save MOTD', 'error');
        } finally {
            setSaving(false);
        }
    };

    const applyPreset = (value: string) => {
        setMotd(value);
        setSelectedPreset(value);
        showToast('Preset applied', 'success');
    };

    const resetMOTD = () => {
        setMotd('§6§lA Minecraft Server\\n§7Welcome! Join and play.');
        showToast('Reset to default MOTD', 'success');
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(motd);
            showToast('Copied to clipboard!', 'success');
        } catch (error) {
            showToast('Failed to copy', 'error');
        }
    };

    // Render MOTD for preview
    const renderMOTD = () => {
        const lines = motd.split('\\n');
        return lines.map((line, idx) => {
            const segments = parseMOTD(line);
            return (
                <Line key={idx}>
                    {segments.map((segment, segIdx) => (
                        segment.text === '\n' ? <br key={segIdx} /> :
                        <StyledSpan
                            key={segIdx}
                            $color={segment.color}
                            $bold={segment.bold}
                            $italic={segment.italic}
                            $underline={segment.underline}
                            $strike={segment.strike}
                            $obfuscated={segment.obfuscated}
                        >
                            {segment.text}
                        </StyledSpan>
                    ))}
                </Line>
            );
        });
    };

    const charCount = getCharacterLimit(motd);
    const isNearLimit = charCount > 50;
    const isOverLimit = charCount > 59;

    return (
        <Container>
            <Header>
                <Title>
                    <FontAwesomeIcon icon={faGamepad} />
                    MOTD Studio
                </Title>
                <Subtitle>
                    Design your server's Message of the Day with real-time Minecraft preview
                </Subtitle>
            </Header>

            {/* Live Preview Card */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <FontAwesomeIcon icon={faEye} />
                        Live Preview
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    <PreviewContainer>
                        <PreviewHeader />
                        <PreviewContent>
                            <ServerEntry>
                                <ServerIcon>
                                    <img src={serverIcon || DEFAULT_ICON} alt="Server Icon" />
                                </ServerIcon>
                                <ServerInfo>
                                    <ServerName>Your Minecraft Server</ServerName>
                                    <ServerMOTD>{renderMOTD()}</ServerMOTD>
                                    <ServerPlayers>0/20 players</ServerPlayers>
                                </ServerInfo>
                                <PingIndicator>
                                    <PingBars>
                                        {[4, 6, 8, 10, 12].map((height, i) => (
                                            <PingBar key={i} $height={height} $active={i < 4} />
                                        ))}
                                    </PingBars>
                                    <div style={{ fontSize: '10px', color: '#7a8a9a' }}>0ms</div>
                                </PingIndicator>
                            </ServerEntry>
                        </PreviewContent>
                    </PreviewContainer>
                </CardBody>
            </Card>

            {/* Editor Card */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <FontAwesomeIcon icon={faEdit} />
                        MOTD Editor
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    <ToolbarSection>
                        <GroupLabel>Colors</GroupLabel>
                        <ToolbarGroup>
                            {MC_COLORS.map(color => (
                                <ColorButton
                                    key={color.code}
                                    $color={color.color}
                                    data-color={color.name}
                                    onClick={() => insertFormat(color.code)}
                                    title={`${color.name} (${color.code})`}
                                />
                            ))}
                        </ToolbarGroup>
                    </ToolbarSection>

                    <ToolbarSection>
                        <GroupLabel>Formatting</GroupLabel>
                        <ToolbarGroup>
                            {MC_FORMATS.map(format => (
                                <FormatButton
                                    key={format.code}
                                    onClick={() => insertFormat(format.code)}
                                    title={format.label}
                                >
                                    <FontAwesomeIcon icon={format.icon} />
                                    {format.label}
                                </FormatButton>
                            ))}
                            <FormatButton onClick={() => insertFormat('\\n')}>
                                <FontAwesomeIcon icon={faArrowLeft} />
                                <FontAwesomeIcon icon={faArrowRight} />
                                New Line
                            </FormatButton>
                        </ToolbarGroup>
                    </ToolbarSection>

                    <TextareaWrapper>
                        <StyledTextarea
                            ref={textareaRef}
                            value={motd}
                            onChange={(e) => setMotd(e.target.value)}
                            placeholder="§6§lWelcome §r§7to my server! Use §a§lcolors §rand §nformatting§r."
                            spellCheck={false}
                        />
                    </TextareaWrapper>
                    
                    <CharacterCounter $warning={isNearLimit && !isOverLimit} $danger={isOverLimit}>
                        {charCount} / 59 characters {isOverLimit && '(Limit exceeded!)'}
                    </CharacterCounter>
                </CardBody>
            </Card>

            {/* Presets Card */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <FontAwesomeIcon icon={faList} />
                        Quick Presets
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    <PresetGrid>
                        {PRESETS.map(preset => (
                            <PresetButton
                                key={preset.name}
                                onClick={() => applyPreset(preset.value)}
                            >
                                <div className="preset-name">{preset.name}</div>
                                <div className="preset-desc">{preset.description}</div>
                            </PresetButton>
                        ))}
                    </PresetGrid>
                </CardBody>
            </Card>

            {/* Actions */}
            <ActionButtons>
                <Button onClick={copyToClipboard}>
                    <FontAwesomeIcon icon={faCopy} />
                    Copy MOTD
                </Button>
                <Button onClick={resetMOTD}>
                    <FontAwesomeIcon icon={faUndo} />
                    Reset
                </Button>
                <Button
                    $variant="primary"
                    onClick={saveMOTD}
                    disabled={saving || loading || isOverLimit}
                >
                    {saving ? (
                        <><FontAwesomeIcon icon={faSync} spin /> Saving...</>
                    ) : (
                        <><FontAwesomeIcon icon={faSave} /> Save MOTD</>
                    )}
                </Button>
            </ActionButtons>

            {/* Toast Notifications */}
            {toast && (
                <Toast $type={toast.type}>
                    <FontAwesomeIcon icon={toast.type === 'success' ? faCheckCircle : faExclamationTriangle} />
                    {toast.message}
                </Toast>
            )}
        </Container>
    );
}