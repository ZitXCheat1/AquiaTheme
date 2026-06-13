import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSync, faUser, faHeart, faSkull, faBan, faShieldAlt,
    faGamepad, faExclamationTriangle, faStar, faCrosshairs,
    faPaintBrush, faMap, faEye, faBolt, faUsers, faSearch, faBoxOpen,
    faTachometerAlt, faMagic, faUtensils, faLevelUpAlt, faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';

/* ── design tokens ───────────────────────────────────────────────── */
const T = {
    bg:'#0b0f14', panel:'#121821', panel2:'#171f2a',
    line:'rgba(255,255,255,0.06)', lineH:'rgba(255,255,255,0.12)',
    text:'#e5e7eb', dim:'#8b95a7', mute:'#4b5563',
    accent:'#08cd00', accentDim:'rgba(8,205,0,0.12)',
    danger:'#ef4444', warn:'#f59e0b', blue:'#3b82f6', purple:'#a855f7',
};

const delayedCaret = keyframes`
    0%, 58% { caret-color: transparent; }
    59%, 100% { caret-color: #a7f3a7; }
`;

const terminalTextInput = css`
    caret-color:#a7f3a7;
    animation:${delayedCaret} 1.05s step-end infinite;

    &::selection {
        background:transparent;
        color:#a7f3a7;
    }

    &::-moz-selection {
        background:transparent;
        color:#a7f3a7;
    }
`;

interface Player {
    username: string;
    ansiRaw: string;
    displayName: string;
    gamemode?: string;
    health?: number;
    level?: number;
    inventory?: InventoryItem[];
    echest?: InventoryItem[];
    inventoryStatus?: string;
    echestStatus?: string;
    online: boolean;
    op?: boolean;
}

interface InventoryItem {
    slot: number;
    id: string;
    count: number;
    tag?: any;
}

/* ── helpers ─────────────────────────────────────────────────────── */

/** Complete ANSI/CSI escape sequence stripper */
function stripCodes(s: string): string {
    let result = s;
    // Remove ESC [ sequences
    result = result.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
    // Remove caret-rendered ANSI sequences copied from some console renderers.
    result = result.replace(/\^\[\[[0-9;]*[A-Za-z]/g, '');
    // Remove CSI sequences that start with [ directly (common in Pterodactyl)
    result = result.replace(/\[[0-9;]*m/g, '');
    // Remove Minecraft § codes
    result = result.replace(/§[0-9a-fk-or]/gi, '');
    // Remove any remaining control characters
    result = result.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim();
    return result;
}

/** Extract clean username from ANSI-coded string */
function extractUsername(raw: string): string {
    const cleaned = stripCodes(raw);
    const matches = cleaned.match(/[A-Za-z0-9_]{3,16}/g);
    return matches?.[matches.length - 1] ?? cleaned;
}

function commandTarget(raw: string): string {
    return extractUsername(raw).replace(/[^A-Za-z0-9_]/g, '');
}

/** Parse ANSI SGR codes into CSS colors */
function parseAnsiToStyle(codeStr: string): { color?: string; bold?: boolean } {
    const codes = codeStr.split(';').map(Number);
    const result: { color?: string; bold?: boolean } = {};
    
    const ANSI_MAP: Record<number, string> = {
        30: '#3b3b3b', 31: '#cc4444', 32: '#3fb950', 33: '#d29922',
        34: '#3b82f6', 35: '#bf5af2', 36: '#39c5cf', 37: '#dcdcdc',
        90: '#8b95a7', 91: '#ff6b6b', 92: '#7ee787', 93: '#f0c674',
        94: '#79b8ff', 95: '#d2a8ff', 96: '#56d4dd', 97: '#ffffff',
    };
    
    for (const code of codes) {
        if (code === 0) {
            result.color = undefined;
            result.bold = false;
        } else if (code === 1) {
            result.bold = true;
        } else if (code === 22) {
            result.bold = false;
        } else if (ANSI_MAP[code]) {
            result.color = ANSI_MAP[code];
        }
    }
    return result;
}

/** Render ANSI-coded string to React elements */
function renderAnsi(raw: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    let currentStyle: { color?: string; bold?: boolean } = {};
    let buffer = '';
    let i = 0;
    let key = 0;
    
    const flushBuffer = () => {
        if (!buffer) return;
        parts.push(
            <span key={key++} style={{ 
                color: currentStyle.color || 'inherit',
                fontWeight: currentStyle.bold ? 'bold' : 'normal'
            }}>
                {buffer}
            </span>
        );
        buffer = '';
    };
    
    while (i < raw.length) {
        // Handle ESC[ sequences
        if (raw.charCodeAt(i) === 0x1b && raw[i+1] === '[') {
            flushBuffer();
            const endIdx = raw.indexOf('m', i + 2);
            if (endIdx !== -1) {
                const codes = raw.slice(i + 2, endIdx);
                currentStyle = parseAnsiToStyle(codes);
                i = endIdx + 1;
                continue;
            }
        }
        // Handle direct [ sequences (no ESC)
        if (raw[i] === '[' && i + 1 < raw.length && /\d/.test(raw[i+1])) {
            flushBuffer();
            const endIdx = raw.indexOf('m', i);
            if (endIdx !== -1) {
                const codes = raw.slice(i + 1, endIdx);
                currentStyle = parseAnsiToStyle(codes);
                i = endIdx + 1;
                continue;
            }
        }
        // Handle Minecraft § codes
        if (raw[i] === '§' && i + 1 < raw.length) {
            flushBuffer();
            const code = raw[i+1].toLowerCase();
            const mcColors: Record<string, string> = {
                '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
                '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
                '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
                'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
            };
            if (mcColors[code]) {
                currentStyle = { color: mcColors[code], bold: false };
            } else if (code === 'l') {
                currentStyle = { ...currentStyle, bold: true };
            } else if (code === 'r') {
                currentStyle = { color: undefined, bold: false };
            }
            i += 2;
            continue;
        }
        buffer += raw[i];
        i++;
    }
    flushBuffer();
    return parts;
}

function itemLabel(id: string): string {
    return id
        .replace(/^minecraft:/, '')
        .replace(/_/g, ' ')
        .split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

/** Parse NBT inventory data */
function parseInventoryOutput(raw: string): InventoryItem[] | null {
    const normalized = stripCodes(raw);
    
    // Check for error conditions
    if (/No entity was found|Unknown or incomplete command|Incorrect argument|Cannot get/i.test(normalized)) {
        return null;
    }
    
    const dataIndex = normalized.indexOf('entity data:');
    if (dataIndex < 0) return null;
    
    const payload = normalized.slice(dataIndex + 'entity data:'.length);
    if (payload.trim() === '[]') return [];
    
    const items: InventoryItem[] = [];
    // Improved regex for NBT parsing
    const itemPattern = /Slot:\s*(-?\d+)[bBsS]?[\s\S]*?id:\s*"?(minecraft:[a-z0-9_\/]+|[a-z0-9_]+)"?[\s\S]*?(?:Count|count):\s*(\d+)[bBsS]?/gi;
    
    let match: RegExpExecArray | null;
    while ((match = itemPattern.exec(payload)) !== null) {
        items.push({
            slot: Number(match[1]),
            id: match[2],
            count: Number(match[3]),
        });
    }
    
    return items.sort((a, b) => a.slot - b.slot);
}

/** Parse Ender Chest inventory */
function parseEnderChestOutput(raw: string): InventoryItem[] | null {
    const normalized = stripCodes(raw);
    
    if (/No entity was found|Unknown/i.test(normalized)) return null;
    
    // Look for EnderItems in the NBT data
    const enderIndex = normalized.indexOf('EnderItems:');
    if (enderIndex < 0) return null;
    
    const payload = normalized.slice(enderIndex);
    const items: InventoryItem[] = [];
    const itemPattern = /Slot:\s*(-?\d+)[bBsS]?[\s\S]*?id:\s*"?(minecraft:[a-z0-9_\/]+|[a-z0-9_]+)"?[\s\S]*?(?:Count|count):\s*(\d+)[bBsS]?/gi;
    
    let match: RegExpExecArray | null;
    while ((match = itemPattern.exec(payload)) !== null) {
        items.push({
            slot: Number(match[1]),
            id: match[2],
            count: Number(match[3]),
        });
    }
    
    return items.sort((a, b) => a.slot - b.slot);
}

/** Parse player health */
function parseHealthOutput(raw: string): number | null {
    const normalized = stripCodes(raw);
    const healthMatch = normalized.match(/Health:\s*([\d.]+)/i);
    if (healthMatch) {
        return parseFloat(healthMatch[1]);
    }
    return null;
}

const GAMEMODES = [
    { value:'survival',  label:'Survival'  },
    { value:'creative',  label:'Creative'  },
    { value:'adventure', label:'Adventure' },
    { value:'spectator', label:'Spectator' },
];

const gmFaIcon: Record<string, any> = { 
    survival: faCrosshairs, 
    creative: faPaintBrush, 
    adventure: faMap, 
    spectator: faEye 
};

/* ── styled components ── */
const Page = styled.div`padding:24px;color:${T.text};font-family:'Inter',sans-serif;display:flex;flex-direction:column;gap:18px;`;
const Header = styled.div`display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;`;
const TitleBlock = styled.div`display:flex;align-items:center;gap:12px;`;
const TitleIcon = styled.div`width:36px;height:36px;border-radius:9px;background:${T.accentDim};color:${T.accent};display:flex;align-items:center;justify-content:center;font-size:.95rem;`;
const TitleText = styled.div`display:flex;flex-direction:column;gap:2px;`;
const Title = styled.h2`font-size:1.05rem;font-weight:700;margin:0;letter-spacing:-.01em;color:${T.text};`;
const Subtitle = styled.p`margin:0;font-size:.78rem;color:${T.dim};`;
const Toolbar = styled.div`display:flex;align-items:center;gap:8px;flex-wrap:wrap;`;
const Btn = styled.button<{ kind?: 'primary'|'ghost'|'danger'|'warn' }>`
    display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:8px;
    font-size:.8rem;font-weight:600;cursor:pointer;border:1px solid transparent;
    transition:background .12s, border-color .12s, color .12s;font-family:'Inter',sans-serif;line-height:1;
    ${p=>p.kind==='primary'?`background:${T.accent};color:#06200a;&:hover{background:#0ee300;}`
        :p.kind==='danger'?`background:rgba(239,68,68,0.08);color:${T.danger};border-color:rgba(239,68,68,0.3);&:hover{background:rgba(239,68,68,0.16);}`
        :p.kind==='warn'?`background:rgba(245,158,11,0.08);color:${T.warn};border-color:rgba(245,158,11,0.3);&:hover{background:rgba(245,158,11,0.16);}`
        :`background:transparent;color:${T.dim};border-color:${T.lineH};&:hover{color:${T.text};border-color:rgba(255,255,255,0.22);}`}
    &:disabled{opacity:.4;cursor:default;}
`;
const SearchWrap = styled.div`position:relative;display:flex;align-items:center;background:${T.panel};border:1px solid ${T.line};border-radius:8px;padding:0 12px;min-width:240px;transition:border-color .12s;&:focus-within{border-color:${T.lineH};}`;
const SearchInput = styled.input`flex:1;background:transparent;border:0;outline:none;padding:9px 0 9px 8px;color:${T.text};font-size:.8rem;font-family:'Inter',sans-serif;${terminalTextInput}&::placeholder{color:${T.mute};}`;
const StatsRow = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;`;
const StatCard = styled.div`background:${T.panel};border:1px solid ${T.line};border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px;`;
const StatIcon = styled.div<{ $color:string }>`width:38px;height:38px;border-radius:9px;background:${p=>p.$color}1a;color:${p=>p.$color};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;`;
const StatLabel = styled.div`font-size:.66rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${T.mute};`;
const StatValue = styled.div`font-size:1.15rem;font-weight:700;color:${T.text};font-variant-numeric:tabular-nums;margin-top:2px;`;
const PlayerGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:12px;`;
const PlayerCard = styled(motion.div)<{ $selected?: boolean; $accent: string }>`
    position:relative;background:${T.panel};border:1px solid ${p=>p.$selected?p.$accent+'66':T.line};
    border-radius:12px;padding:16px;cursor:pointer;transition:border-color .15s, background .15s;
    box-shadow:${p=>p.$selected?`0 0 0 1px ${p.$accent}33`:'none'};
    &:hover{border-color:${T.lineH};}
    &::before{content:'';position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:0 3px 3px 0;background:${p=>p.$accent};opacity:${p=>p.$selected?1:0.7};}
`;
const PlayerTop = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:14px;`;
const Avatar = styled.div<{ $ring:string }>`width:46px;height:46px;border-radius:10px;background:${T.panel2};border:1.5px solid ${p=>p.$ring};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;box-shadow:0 0 0 3px ${p=>p.$ring}1a;`;
const PlayerInfo = styled.div`flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;`;
const PlayerNameRow = styled.div`display:flex;align-items:center;gap:6px;flex-wrap:wrap;`;
const PlayerName = styled.div`font-size:.95rem;font-weight:700;color:${T.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;font-family:'Inter','JetBrains Mono','Menlo',monospace;letter-spacing:.01em;& > span{font-weight:inherit;}`;
const PlayerMeta = styled.div`font-size:.7rem;color:${T.dim};display:flex;gap:10px;flex-wrap:wrap;align-items:center;`;
const PlayerMetaItem = styled.span`display:inline-flex;align-items:center;gap:4px;`;
const HealthBar = styled.div<{ health: number }>`
    width:60px;height:4px;background:${T.mute};border-radius:2px;overflow:hidden;
    &::after{content:'';display:block;width:${p=>Math.min(100, Math.max(0, (p.health / 20) * 100))}%;height:100%;background:${p=>p.health > 10 ? T.accent : T.warn};border-radius:2px;}
`;
const ActionRow = styled.div`display:flex;flex-wrap:wrap;gap:6px;`;
const ActionBtn = styled.button<{ variant?: 'danger'|'warn'|'green' }>`
    display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:7px;
    font-size:.72rem;font-weight:600;cursor:pointer;border:1px solid ${T.line};
    transition:all .12s;font-family:'Inter',sans-serif;background:${T.panel2};
    ${p=>p.variant==='danger'?`color:${T.danger};&:hover{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);}`
        :p.variant==='warn'?`color:${T.warn};&:hover{background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.3);}`
        :`color:#a7f3a7;&:hover{background:rgba(8,205,0,0.08);border-color:rgba(8,205,0,0.3);}`}
`;
const SectionHead = styled.div`font-size:.66rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${T.mute};margin-bottom:8px;display:flex;align-items:center;gap:6px;`;
const QuickGrid = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;`;
const QuickBtn = styled.button<{ $color?: string }>`
    display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 6px;
    border-radius:7px;font-size:.74rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;
    border:1px solid ${T.line};background:${T.panel2};color:${p=>p.$color ?? T.dim};
    transition:all .12s;&:hover{color:${T.text};border-color:${T.lineH};background:#1d2532;}
`;
const InvGrid = styled.div`display:grid;grid-template-columns:repeat(9,1fr);gap:4px;margin-bottom:8px;`;
const InvSlot = styled.div<{ filled?: boolean }>`
    aspect-ratio:1;border-radius:5px;background:${p=>p.filled?'#10171f':'#0a0d12'};
    border:1px solid ${p=>p.filled?'rgba(8,205,0,0.28)':T.line};
    display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:2px;
    color:${p=>p.filled?'#a7f3a7':T.mute};font-family:'JetBrains Mono','Menlo',monospace;
    font-size:.58rem;text-align:center;line-height:1.05;
`;
const InvQty = styled.div`position:absolute;bottom:1px;right:3px;font-size:.54rem;color:#fff;font-weight:700;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;`;
const InvStatus = styled.div`font-size:.7rem;color:${T.mute};margin-bottom:10px;line-height:1.35;`;
const CommandRow = styled.div`display:flex;gap:6px;align-items:stretch;`;
const CommandInput = styled.input`
    flex:1;background:${T.panel2};border:1px solid ${T.line};border-radius:7px;
    padding:9px 12px;font-size:.78rem;color:#a7f3a7;
    font-family:'JetBrains Mono','Menlo',monospace;outline:none;
    transition:border-color .12s;${terminalTextInput}
    &:focus{border-color:${T.lineH};}
    &::placeholder{color:${T.mute};}
`;
const SendBtn = styled.button`background:${T.accent};color:#06200a;border:0;border-radius:7px;padding:0 14px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;&:hover{background:#0ee300;}&:disabled{opacity:.4;cursor:default;}`;
const ResolvedTag = styled.div`display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(8,205,0,0.06);border:1px solid rgba(8,205,0,0.18);border-radius:7px;font-size:.72rem;color:${T.dim};margin-bottom:12px;& code{color:${T.accent};font-family:'JetBrains Mono','Menlo',monospace;font-weight:700;}`;
const Note = styled.div`padding:9px 11px;border-radius:7px;margin-bottom:12px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.16);color:${T.dim};font-size:.72rem;line-height:1.4;`;
const Empty = styled.div`background:${T.panel};border:1px solid ${T.line};border-radius:12px;text-align:center;padding:80px 24px;color:${T.mute};font-size:.875rem;display:flex;flex-direction:column;align-items:center;gap:12px;`;
const ConnDot = styled.span<{ ok:boolean }>`display:inline-flex;align-items:center;gap:6px;font-size:.72rem;color:${p=>p.ok?'#a7f3a7':'#fca5a5'};font-weight:600;padding:5px 10px;border-radius:999px;background:${p=>p.ok?'rgba(8,205,0,0.1)':'rgba(239,68,68,0.1)'};border:1px solid ${p=>p.ok?'rgba(8,205,0,0.25)':'rgba(239,68,68,0.25)'};& span.dot{width:6px;height:6px;border-radius:50%;background:${p=>p.ok?T.accent:T.danger};}`;
const LogSection = styled.div`background:${T.panel};border:1px solid ${T.line};border-radius:12px;overflow:hidden;`;
const LogHead = styled.div`display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid ${T.line};font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${T.dim};`;
const LogList = styled.div`max-height:180px;overflow-y:auto;padding:8px 0;`;
const LogLine = styled.div<{ ok:boolean }>`padding:4px 16px;font-family:'JetBrains Mono','Menlo',monospace;font-size:.72rem;color:${p=>p.ok?'#a3e635':'#fca5a5'};`;
const TabRow = styled.div`display:flex;gap:8px;margin-bottom:12px;border-bottom:1px solid ${T.line};`;
const Tab = styled.button<{ active: boolean }>`
    padding:8px 12px;background:transparent;border:none;color:${p=>p.active?T.accent:T.dim};
    font-size:.75rem;font-weight:600;cursor:pointer;border-bottom:2px solid ${p=>p.active?T.accent:'transparent'};
    transition:all .12s;&:hover{color:${T.text};}
`;

function CustomCommandBox({ username, send }: { username: string; send: (command: string) => void }) {
    const [value, setValue] = useState('');
    const run = () => {
        const command = value.trim();
        if (!command) return;
        send(command.split('{player}').join(commandTarget(username)));
        setValue('');
    };
    return (
        <CommandRow>
            <CommandInput
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); run(); } }}
                placeholder={`say Hello {player}`}
            />
            <SendBtn onClick={run} disabled={!value.trim()}>Send</SendBtn>
        </CommandRow>
    );
}

/* ── main component ───────────────────────────────────────────────── */
export default function PlayerManagerContainer() {
    const instanceRef = useRef<any>(null);
    const connectedRef = useRef(false);
    const instance = ServerContext.useStoreState(s => s.socket.instance);
    const connected = ServerContext.useStoreState(s => s.socket.connected);
    
    useEffect(() => { instanceRef.current = instance; }, [instance]);
    useEffect(() => { connectedRef.current = connected; }, [connected]);

    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [cmdLog, setCmdLog] = useState<{ text:string; ok:boolean }[]>([]);
    const [gmTarget, setGmTarget] = useState<Record<string,string>>({});
    const [inventoryLoading, setInventoryLoading] = useState<Record<string, boolean>>({});
    const [echestLoading, setEchestLoading] = useState<Record<string, boolean>>({});
    const [healthLoading, setHealthLoading] = useState<Record<string, boolean>>({});
    const pendingRequestsRef = useRef<Map<string, string>>(new Map());

    const log = useCallback((text: string, ok = true) =>
        setCmdLog(l => [{ text:`[${new Date().toLocaleTimeString()}] ${text}`, ok }, ...l.slice(0,24)]), []);

    const cmd = useCallback((command: string) => {
        if (!instanceRef.current || !connectedRef.current) {
            log('Not connected — make sure server is running', false);
            return;
        }
        instanceRef.current.send('send command', command);
        log(`→ ${command}`);
    }, [log]);

    // Handle all console output
    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data: string) => {
        const cleaned = stripCodes(data);
        const pendingKey = Array.from(pendingRequestsRef.current.entries())[0];
        
        if (pendingKey) {
            const [requestId, username] = pendingKey;
            
            if (requestId.startsWith('inventory_')) {
                const inventory = parseInventoryOutput(data);
                const failed = /No entity was found|Unknown or incomplete command|Incorrect argument|Cannot get/i.test(cleaned);
                
                if (inventory !== null || failed) {
                    pendingRequestsRef.current.delete(requestId);
                    setInventoryLoading(state => ({ ...state, [username]: false }));
                    setPlayers(prev => prev.map(p => {
                        if (p.username !== username) return p;
                        if (inventory !== null) {
                            return { ...p, inventory, inventoryStatus: `Loaded ${inventory.length} item stacks.` };
                        }
                        return { ...p, inventoryStatus: 'Could not read inventory. Use a plugin like OpenInv.' };
                    }));
                }
            }
            
            if (requestId.startsWith('echest_')) {
                const echest = parseEnderChestOutput(data);
                const failed = /No entity was found|Unknown/i.test(cleaned);
                
                if (echest !== null || failed) {
                    pendingRequestsRef.current.delete(requestId);
                    setEchestLoading(state => ({ ...state, [username]: false }));
                    setPlayers(prev => prev.map(p => {
                        if (p.username !== username) return p;
                        if (echest !== null) {
                            return { ...p, echest, echestStatus: `Loaded ${echest.length} ender chest items.` };
                        }
                        return { ...p, echestStatus: 'Could not read ender chest.' };
                    }));
                }
            }
            
            if (requestId.startsWith('health_')) {
                const health = parseHealthOutput(data);
                if (health !== null) {
                    pendingRequestsRef.current.delete(requestId);
                    setHealthLoading(state => ({ ...state, [username]: false }));
                    setPlayers(prev => prev.map(p => 
                        p.username === username ? { ...p, health } : p
                    ));
                } else if (/No entity was found/i.test(cleaned)) {
                    pendingRequestsRef.current.delete(requestId);
                    setHealthLoading(state => ({ ...state, [username]: false }));
                }
            }
        }
        
        // Parse player list
        if (/There are \d+ of a max of \d+ players online:/.test(cleaned)) {
            const listMatch = cleaned.match(/There are \d+ of a max of \d+ players online:\s*(.*)$/);
            const rawList = listMatch?.[1] ?? '';
            const rawEntries = rawList.split(',').map(s => s.trim()).filter(s => s.length > 0);
            
            const parsed = rawEntries.map(r => ({
                ansiRaw: r,
                displayName: r,
                username: extractUsername(r),
            })).filter(p => /^[A-Za-z0-9_]{3,16}$/.test(p.username));
            
            setPlayers(prev => {
                const byUser = new Map(prev.map(p => [p.username, p]));
                return parsed.map(p => {
                    const ex = byUser.get(p.username);
                    return ex ? { ...ex, ansiRaw: p.ansiRaw, displayName: p.displayName, online: true } 
                              : { ...p, online: true };
                });
            });
            setLoading(false);
        }
    });

    const fetchPlayers = useCallback(() => {
        setLoading(true);
        cmd('list');
        setTimeout(() => setLoading(false), 3000);
    }, [cmd]);

    const fetchPlayerHealth = useCallback((username: string) => {
        const target = commandTarget(username);
        const reqId = `health_${target}_${Date.now()}`;
        pendingRequestsRef.current.set(reqId, target);
        setHealthLoading(state => ({ ...state, [target]: true }));
        cmd(`minecraft:data get entity ${target} Health`);
        setTimeout(() => {
            if (pendingRequestsRef.current.has(reqId)) {
                pendingRequestsRef.current.delete(reqId);
                setHealthLoading(state => ({ ...state, [target]: false }));
            }
        }, 5000);
    }, [cmd]);

    const fetchInventory = useCallback((username: string) => {
        const target = commandTarget(username);
        const reqId = `inventory_${target}_${Date.now()}`;
        pendingRequestsRef.current.set(reqId, target);
        setInventoryLoading(state => ({ ...state, [target]: true }));
        setPlayers(prev => prev.map(p => p.username === target ? {
            ...p, inventoryStatus: 'Reading inventory from server data...'
        } : p));
        cmd(`minecraft:data get entity ${target} Inventory`);
        setTimeout(() => {
            if (pendingRequestsRef.current.has(reqId)) {
                pendingRequestsRef.current.delete(reqId);
                setInventoryLoading(state => ({ ...state, [target]: false }));
                setPlayers(prev => prev.map(p => p.username === target ? {
                    ...p, inventoryStatus: 'No inventory response. Check permissions.'
                } : p));
            }
        }, 5000);
    }, [cmd]);

    const fetchEnderChest = useCallback((username: string) => {
        const target = commandTarget(username);
        const reqId = `echest_${target}_${Date.now()}`;
        pendingRequestsRef.current.set(reqId, target);
        setEchestLoading(state => ({ ...state, [target]: true }));
        setPlayers(prev => prev.map(p => p.username === target ? {
            ...p, echestStatus: 'Reading ender chest...'
        } : p));
        cmd(`minecraft:data get entity ${target} EnderItems`);
        setTimeout(() => {
            if (pendingRequestsRef.current.has(reqId)) {
                pendingRequestsRef.current.delete(reqId);
                setEchestLoading(state => ({ ...state, [target]: false }));
            }
        }, 5000);
    }, [cmd]);

    const changeGamemode = useCallback((username: string, gamemode: string) => {
        const target = commandTarget(username);
        cmd(`gamemode ${gamemode} ${target}`);
        setPlayers(pl => pl.map(p => p.username === target ? { ...p, gamemode } : p));
    }, [cmd]);

    const healPlayer = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`minecraft:effect give ${target} minecraft:instant_health 1 255`);
        cmd(`minecraft:effect clear ${target} minecraft:poison`);
        cmd(`minecraft:effect clear ${target} minecraft:wither`);
        setTimeout(() => fetchPlayerHealth(target), 500);
        log(`Healed ${target}`);
    }, [cmd, fetchPlayerHealth]);

    const feedPlayer = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`minecraft:effect give ${target} minecraft:saturation 1 255`);
        log(`Fed ${target}`);
    }, [cmd]);

    const killPlayer = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`minecraft:kill ${target}`);
        setPlayers(pl => pl.map(p => p.username === target ? { ...p, health: 0 } : p));
    }, [cmd]);

    const kickPlayer = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`kick ${target} Kicked by administrator`);
        setTimeout(() => {
            setPlayers(pl => pl.filter(p => p.username !== target));
        }, 500);
    }, [cmd]);

    const banPlayer = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`ban ${target} Banned by administrator`);
        setTimeout(() => {
            setPlayers(pl => pl.filter(p => p.username !== target));
        }, 500);
    }, [cmd]);

    const opPlayer = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`op ${target}`);
        setPlayers(pl => pl.map(p => p.username === target ? { ...p, op: true } : p));
    }, [cmd]);

    const deopPlayer = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`deop ${target}`);
        setPlayers(pl => pl.map(p => p.username === target ? { ...p, op: false } : p));
    }, [cmd]);

    const clearInventory = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`clear ${target}`);
        setPlayers(pl => pl.map(p => p.username === target ? { ...p, inventory: [], inventoryStatus: 'Inventory cleared' } : p));
    }, [cmd]);

    const addExperience = useCallback((username: string, levels: number) => {
        const target = commandTarget(username);
        cmd(`minecraft:experience add ${target} ${levels} levels`);
    }, [cmd]);

    const resetExperience = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`minecraft:experience set ${target} 0 levels`);
    }, [cmd]);

    const clearEffects = useCallback((username: string) => {
        const target = commandTarget(username);
        cmd(`minecraft:effect clear ${target}`);
    }, [cmd]);

    const hasFetchedRef = useRef(false);
    useEffect(() => {
        if (connected && instance && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchPlayers();
        }
    }, [connected, instance, fetchPlayers]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return players;
        return players.filter(p => p.username.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q));
    }, [players, query]);

    const onlineCount = players.filter(p => p.online).length;

    return (
        <Page>
            <Header>
                <TitleBlock>
                    <TitleIcon><FontAwesomeIcon icon={faUsers}/></TitleIcon>
                    <TitleText>
                        <Title>Player Manager</Title>
                        <Subtitle>Live player management with inventory, health, and moderation tools</Subtitle>
                    </TitleText>
                </TitleBlock>
                <Toolbar>
                    <SearchWrap>
                        <FontAwesomeIcon icon={faSearch} style={{color:T.mute,fontSize:'.75rem'}}/>
                        <SearchInput placeholder='Search players...' value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setQuery(e.target.value)}/>
                    </SearchWrap>
                    <ConnDot ok={connected}><span className='dot'/>{connected ? 'Connected' : 'Not connected'}</ConnDot>
                    <Btn onClick={fetchPlayers} disabled={loading || !connected}>
                        <FontAwesomeIcon icon={faSync} spin={loading}/> Refresh
                    </Btn>
                    <Btn kind='warn' onClick={() => cmd('say §6[Server] §fServer management active!')}>
                        <FontAwesomeIcon icon={faExclamationTriangle}/> Broadcast
                    </Btn>
                </Toolbar>
            </Header>

            <StatsRow>
                <StatCard>
                    <StatIcon $color={T.accent}><FontAwesomeIcon icon={faUser}/></StatIcon>
                    <div><StatLabel>Online Players</StatLabel><StatValue>{onlineCount}</StatValue></div>
                </StatCard>
                <StatCard>
                    <StatIcon $color={T.danger}><FontAwesomeIcon icon={faHeart}/></StatIcon>
                    <div><StatLabel>Actions Performed</StatLabel><StatValue>{cmdLog.length}</StatValue></div>
                </StatCard>
                <StatCard>
                    <StatIcon $color={T.blue}><FontAwesomeIcon icon={faTachometerAlt}/></StatIcon>
                    <div><StatLabel>Server Status</StatLabel><StatValue>{connected ? 'Online' : 'Offline'}</StatValue></div>
                </StatCard>
            </StatsRow>

            {filtered.length === 0 ? (
                <Empty>
                    <FontAwesomeIcon icon={faUser} style={{fontSize:'2rem'}}/>
                    {players.length === 0 ? (connected ? <>No players online. Click Refresh to fetch the list.</> : <>Server is not connected.</>) : <>No players match "{query}".</>}
                </Empty>
            ) : (
                <PlayerGrid>
                    {filtered.map(player => {
                        const accent = player.op ? T.warn : T.accent;
                        return (
                            <PlayerCard
                                key={player.username}
                                $selected={selected===player.username}
                                $accent={accent}
                                onClick={() => {
                                    setSelected(s => s===player.username ? null : player.username);
                                    if (!player.health && player.online) fetchPlayerHealth(player.username);
                                }}
                                initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} layout
                            >
                                <PlayerTop>
                                    <Avatar $ring={accent}>
                                        <img src={`https://mc-heads.net/avatar/${player.username}/46`} alt={player.username} style={{width:'100%',height:'100%',objectFit:'cover',imageRendering:'pixelated'}} onError={e=>{(e.target as HTMLImageElement).src='https://mc-heads.net/avatar/Steve/46';}}/>
                                    </Avatar>
                                    <PlayerInfo>
                                        <PlayerName title={player.displayName}>{renderAnsi(player.ansiRaw)}</PlayerName>
                                        <PlayerMeta>
                                            {player.gamemode && <PlayerMetaItem><FontAwesomeIcon icon={gmFaIcon[player.gamemode]??faGamepad}/>{player.gamemode}</PlayerMetaItem>}
                                            {player.health !== undefined && (
                                                <PlayerMetaItem>
                                                    <FontAwesomeIcon icon={faHeart} style={{color:T.danger}}/>
                                                    {Math.floor(player.health * 10) / 10} ❤️
                                                    <HealthBar health={player.health}/>
                                                </PlayerMetaItem>
                                            )}
                                            {player.level !== undefined && <PlayerMetaItem><FontAwesomeIcon icon={faStar} style={{color:T.warn}}/>Lvl {player.level}</PlayerMetaItem>}
                                            {player.op && <PlayerMetaItem><RankChip $color={T.warn}>OP</RankChip></PlayerMetaItem>}
                                        </PlayerMeta>
                                    </PlayerInfo>
                                </PlayerTop>

                                <ActionRow>
                                    <ActionBtn onClick={(e: React.MouseEvent)=>{e.stopPropagation();healPlayer(player.username);}}><FontAwesomeIcon icon={faHeart}/> Heal</ActionBtn>
                                    <ActionBtn onClick={(e: React.MouseEvent)=>{e.stopPropagation();feedPlayer(player.username);}}><FontAwesomeIcon icon={faUtensils}/> Feed</ActionBtn>
                                    <ActionBtn variant='warn' onClick={(e: React.MouseEvent)=>{e.stopPropagation();kickPlayer(player.username);}}><FontAwesomeIcon icon={faBolt}/> Kick</ActionBtn>
                                    <ActionBtn variant='danger' onClick={(e: React.MouseEvent)=>{e.stopPropagation();killPlayer(player.username);}}><FontAwesomeIcon icon={faSkull}/> Kill</ActionBtn>
                                    <ActionBtn variant='danger' onClick={(e: React.MouseEvent)=>{e.stopPropagation();banPlayer(player.username);}}><FontAwesomeIcon icon={faBan}/> Ban</ActionBtn>
                                    <ActionBtn onClick={(e: React.MouseEvent)=>{e.stopPropagation();opPlayer(player.username);}}><FontAwesomeIcon icon={faShieldAlt}/> OP</ActionBtn>
                                </ActionRow>

                                <AnimatePresence>
                                    {selected===player.username && (
                                        <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden'}} onClick={(e: React.MouseEvent)=>e.stopPropagation()}>
                                            <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.line}`}}>
                                                <ResolvedTag><FontAwesomeIcon icon={faUser} style={{fontSize:'.7rem'}}/>Target: <code>{player.username}</code></ResolvedTag>

                                                <SectionHead><FontAwesomeIcon icon={faGamepad}/> Change Gamemode</SectionHead>
                                                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:14}}>
                                                    {GAMEMODES.map(gm => {
                                                        const active = (gmTarget[player.username] ?? player.gamemode) === gm.value;
                                                        return (
                                                            <button key={gm.value} onClick={()=>{setGmTarget(g=>({...g,[player.username]:gm.value}));changeGamemode(player.username, gm.value);}} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'8px 6px',borderRadius:7,fontSize:'.72rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',border:`1px solid ${active?T.accent:T.line}`,background:active?T.accentDim:T.panel2,color:active?T.accent:T.dim}}>
                                                                <FontAwesomeIcon icon={gmFaIcon[gm.value]}/> {gm.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <SectionHead><FontAwesomeIcon icon={faBoxOpen}/> Inventory & Ender Chest</SectionHead>
                                                <div style={{display:'flex',gap:6,marginBottom:10}}>
                                                    <QuickBtn onClick={()=>fetchInventory(player.username)} disabled={!!inventoryLoading[player.username]} style={{flex:1}}>
                                                        <FontAwesomeIcon icon={faSync} spin={!!inventoryLoading[player.username]}/>
                                                        {inventoryLoading[player.username] ? 'Loading...' : 'Inventory'}
                                                    </QuickBtn>
                                                    <QuickBtn onClick={()=>fetchEnderChest(player.username)} disabled={!!echestLoading[player.username]} style={{flex:1}}>
                                                        <FontAwesomeIcon icon={faSync} spin={!!echestLoading[player.username]}/>
                                                        {echestLoading[player.username] ? 'Loading...' : 'Ender Chest'}
                                                    </QuickBtn>
                                                </div>
                                                
                                                {player.inventory && (
                                                    <>
                                                        <InvGrid>
                                                            {Array.from({length:36}).map((_, i) => {
                                                                const item = player.inventory?.find(stack => stack.slot === i);
                                                                return (
                                                                    <InvSlot key={i} filled={!!item} title={item ? `${itemLabel(item.id)} x${item.count}` : `Empty slot ${i}`}>
                                                                        {item ? itemLabel(item.id).slice(0, 3).toUpperCase() : ''}
                                                                        {item && item.count > 1 && <InvQty>{item.count}</InvQty>}
                                                                    </InvSlot>
                                                                );
                                                            })}
                                                        </InvGrid>
                                                        <InvStatus>{player.inventoryStatus ?? `${player.inventory.length} items in inventory`}</InvStatus>
                                                    </>
                                                )}
                                                
                                                {player.echest && (
                                                    <>
                                                        <InvGrid>
                                                            {Array.from({length:27}).map((_, i) => {
                                                                const item = player.echest?.find(stack => stack.slot === i);
                                                                return (
                                                                    <InvSlot key={i} filled={!!item} title={item ? `${itemLabel(item.id)} x${item.count}` : `Empty slot ${i}`}>
                                                                        {item ? itemLabel(item.id).slice(0, 3).toUpperCase() : ''}
                                                                        {item && item.count > 1 && <InvQty>{item.count}</InvQty>}
                                                                    </InvSlot>
                                                                );
                                                            })}
                                                        </InvGrid>
                                                        <InvStatus>{player.echestStatus ?? `${player.echest.length} items in ender chest`}</InvStatus>
                                                    </>
                                                )}

                                                <SectionHead><FontAwesomeIcon icon={faMagic}/> Quick Actions</SectionHead>
                                                <QuickGrid>
                                                    <QuickBtn onClick={()=>fetchPlayerHealth(player.username)} disabled={!!healthLoading[player.username]}>
                                                        <FontAwesomeIcon icon={faHeart}/> Check Health
                                                    </QuickBtn>
                                                    <QuickBtn onClick={()=>clearEffects(player.username)}>
                                                        <FontAwesomeIcon icon={faBolt}/> Clear FX
                                                    </QuickBtn>
                                                    <QuickBtn onClick={()=>clearInventory(player.username)}>
                                                        <FontAwesomeIcon icon={faTrash}/> Clear Inv
                                                    </QuickBtn>
                                                    <QuickBtn onClick={()=>addExperience(player.username, 100)}>
                                                        <FontAwesomeIcon icon={faLevelUpAlt}/> +100 Lvl
                                                    </QuickBtn>
                                                    <QuickBtn onClick={()=>resetExperience(player.username)}>
                                                        <FontAwesomeIcon icon={faStar}/> Reset XP
                                                    </QuickBtn>
                                                    <QuickBtn onClick={()=>deopPlayer(player.username)} $color={T.warn}>
                                                        <FontAwesomeIcon icon={faShieldAlt}/> De-OP
                                                    </QuickBtn>
                                                </QuickGrid>

                                                <SectionHead><FontAwesomeIcon icon={faGamepad}/> Custom Command</SectionHead>
                                                <CustomCommandBox username={player.username} send={cmd}/>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </PlayerCard>
                        );
                    })}
                </PlayerGrid>
            )}

            {cmdLog.length > 0 && (
                <LogSection>
                    <LogHead><span>Command Log</span><Btn onClick={()=>setCmdLog([])} style={{padding:'4px 10px',fontSize:'.7rem'}}>Clear</Btn></LogHead>
                    <LogList>{cmdLog.map((l,i)=><LogLine key={i} ok={l.ok}>{l.text}</LogLine>)}</LogList>
                </LogSection>
            )}
        </Page>
    );
}

const RankChip = styled.span<{ $color:string }>`
    font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
    padding:2px 7px;border-radius:999px;
    color:${p=>p.$color};background:${p=>p.$color}1a;
    border:1px solid ${p=>p.$color}40;
    font-family:'Inter',sans-serif;
    white-space:nowrap;
`;
