import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBullhorn, faPlus, faTrash, faClone, faCircleNotch, faClock,
    faPlay, faPause, faTimes, faCheckCircle, faExclamationTriangle, faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';

/* ── tokens ──────────────────────────────────────────────────────── */
const T = {
    bg:'#0b0f14', panel:'#121821', panel2:'#171f2a',
    line:'rgba(255,255,255,0.06)', lineH:'rgba(255,255,255,0.12)',
    text:'#e5e7eb', dim:'#8b95a7', mute:'#4b5563',
    accent:'#08cd00', accentDim:'rgba(8,205,0,0.12)',
    danger:'#ef4444', warn:'#f59e0b', blue:'#3b82f6',
};

/* ── types ───────────────────────────────────────────────────────── */
type CmdMode = 'say' | 'broadcast' | 'tellraw' | 'title';
interface Broadcast {
    id: string;
    name: string;
    enabled: boolean;
    cron: string;
    mode: CmdMode;
    message: string;
    titleColor?: string;
    lastFiredAt?: number;
}

const STORAGE_KEY = 'wisk.scheduled-broadcasts.v1';

const DEFAULT_BROADCASTS: Broadcast[] = [
    {
        id: 'tip-rotation', name: 'Tip Rotation', enabled: true,
        cron: '*/10 * * * *', mode: 'broadcast',
        message: '§b§lTIP §r§7» §fJoin our Discord at §a/discord §7for events & support!',
    },
    {
        id: 'restart-reminder', name: 'Daily Restart Reminder', enabled: false,
        cron: '0 23 * * *', mode: 'broadcast',
        message: '§c§lRESTART §r§7» §fServer restarts in §c1 hour§f. Save your progress!',
    },
    {
        id: 'welcome-prime', name: 'Prime-Time Welcome', enabled: false,
        cron: '0 18 * * *', mode: 'title',
        message: '{online} players online — peak hours!',
        titleColor: 'gold',
    },
];

const MODE_LABELS: Record<CmdMode,string> = {
    say:'/say', broadcast:'/broadcast', tellraw:'/tellraw @a', title:'/title @a',
};
const TITLE_COLORS = ['white','gray','green','aqua','blue','gold','yellow','red','light_purple','dark_red'];

/* ── styled ──────────────────────────────────────────────────────── */
const Page = styled.div`padding:24px;color:${T.text};font-family:'Inter',sans-serif;display:flex;flex-direction:column;gap:18px;`;

const Header = styled.div`display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;`;
const TitleBlock = styled.div`display:flex;align-items:center;gap:12px;`;
const TitleIcon = styled.div<{ $bg?: string; $fg?: string }>`
    width:36px;height:36px;border-radius:9px;
    background:${p=>p.$bg ?? T.accentDim};color:${p=>p.$fg ?? T.accent};
    display:flex;align-items:center;justify-content:center;font-size:.95rem;
`;
const TitleText = styled.div`display:flex;flex-direction:column;gap:2px;`;
const Title = styled.h2`font-size:1.05rem;font-weight:700;margin:0;letter-spacing:-.01em;color:${T.text};`;
const Subtitle = styled.p`margin:0;font-size:.78rem;color:${T.dim};`;

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

const StatsRow = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;`;
const StatCard = styled.div`
    background:${T.panel};border:1px solid ${T.line};border-radius:10px;padding:12px 16px;
    display:flex;align-items:center;gap:12px;
`;
const StatIcon = styled.div<{ $color:string }>`
    width:36px;height:36px;border-radius:9px;
    background:${p=>p.$color}1a;color:${p=>p.$color};
    display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;
`;
const StatBody = styled.div`min-width:0;`;
const StatLabel = styled.div`font-size:.66rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${T.mute};`;
const StatValue = styled.div`font-size:1.05rem;font-weight:700;color:${T.text};font-variant-numeric:tabular-nums;margin-top:2px;`;

const Grid = styled.div`display:grid;grid-template-columns:380px 1fr;gap:18px;align-items:start;
    @media (max-width:1100px){grid-template-columns:1fr;}
`;

const Panel = styled.div`background:${T.panel};border:1px solid ${T.line};border-radius:12px;overflow:hidden;`;
const PanelHead = styled.div`
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 16px;border-bottom:1px solid ${T.line};
    font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${T.dim};
`;

const Row = styled.button<{ $active?: boolean; $enabled?: boolean }>`
    width:100%;text-align:left;display:flex;align-items:center;gap:12px;
    padding:12px 16px;border:0;background:transparent;cursor:pointer;
    border-left:3px solid ${p=>p.$active?(p.$enabled?T.accent:T.mute):'transparent'};
    color:${T.text};font-family:'Inter',sans-serif;
    transition:background .1s;
    &:hover{background:rgba(255,255,255,0.025);}
    ${p=>p.$active&&`background:rgba(255,255,255,0.03);`}
    & + & {border-top:1px solid ${T.line};}
`;
const Toggle = styled.div<{ $on:boolean }>`
    width:32px;height:18px;border-radius:999px;
    background:${p=>p.$on?'rgba(8,205,0,0.4)':'rgba(255,255,255,0.08)'};
    border:1px solid ${p=>p.$on?'rgba(8,205,0,0.6)':T.line};
    position:relative;flex-shrink:0;cursor:pointer;transition:all .12s;
    &::after{content:'';position:absolute;top:1px;left:${p=>p.$on?'15px':'1px'};
        width:14px;height:14px;border-radius:50%;background:${p=>p.$on?T.accent:'#6b7280'};
        transition:left .14s;}
`;

const RowBody = styled.div`flex:1;min-width:0;`;
const RowName = styled.div`font-size:.85rem;font-weight:600;color:${T.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const RowMeta = styled.div`font-size:.72rem;color:${T.dim};margin-top:2px;display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono','Menlo',monospace;`;
const NextChip = styled.span`font-size:.66rem;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,0.04);color:${T.dim};border:1px solid ${T.line};`;

const Editor = styled.div`background:${T.panel};border:1px solid ${T.line};border-radius:12px;overflow:hidden;`;
const EditorHead = styled.div`display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid ${T.line};flex-wrap:wrap;`;
const EditorName = styled.input`
    background:transparent;border:0;color:${T.text};font-size:1rem;font-weight:700;
    padding:4px 6px;border-radius:6px;outline:none;min-width:220px;
    &:focus{background:rgba(255,255,255,0.04);}
`;
const EditorBody = styled.div`padding:18px;display:flex;flex-direction:column;gap:18px;`;

const Section = styled.div`display:flex;flex-direction:column;gap:8px;`;
const SectionLabel = styled.label`
    display:flex;align-items:center;gap:8px;
    font-size:.7rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${T.dim};
`;
const SectionHelp = styled.span`font-size:.7rem;color:${T.mute};font-weight:500;letter-spacing:0;text-transform:none;`;

const TextInput = styled.input`
    width:100%;background:${T.panel2};border:1px solid ${T.line};border-radius:8px;
    padding:9px 12px;font-size:.82rem;color:${T.text};font-family:'Inter',sans-serif;outline:none;
    transition:border-color .12s;
    &:focus{border-color:${T.lineH};}
    &::placeholder{color:${T.mute};}
`;
const TextArea = styled.textarea`
    width:100%;background:${T.panel2};border:1px solid ${T.line};border-radius:8px;
    padding:10px 12px;font-size:.82rem;color:${T.text};font-family:'Inter',sans-serif;outline:none;
    transition:border-color .12s;resize:vertical;min-height:64px;
    &:focus{border-color:${T.lineH};}
    &::placeholder{color:${T.mute};}
`;
const CodeInput = styled(TextInput)`font-family:'JetBrains Mono','Menlo',monospace;`;

const ModeRow = styled.div`display:flex;gap:6px;flex-wrap:wrap;`;
const ModeBtn = styled.button<{ $on:boolean }>`
    padding:8px 12px;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;font-family:'JetBrains Mono','Menlo',monospace;
    border:1px solid ${p=>p.$on?T.accent:T.line};
    background:${p=>p.$on?T.accentDim:T.panel2};
    color:${p=>p.$on?T.accent:T.dim};
    transition:all .12s;
    &:hover{color:${T.text};border-color:${p=>p.$on?T.accent:T.lineH};}
`;

const PresetRow = styled.div`display:flex;gap:6px;flex-wrap:wrap;`;
const PresetChip = styled.button<{ $on:boolean }>`
    padding:6px 11px;border-radius:999px;font-size:.72rem;font-weight:600;cursor:pointer;
    border:1px solid ${p=>p.$on?T.accent:T.line};
    background:${p=>p.$on?T.accentDim:'transparent'};
    color:${p=>p.$on?T.accent:T.dim};
    &:hover{color:${T.text};}
`;

const Preview = styled.div`
    background:#0a0e14;border:1px solid ${T.line};border-radius:10px;padding:14px 16px;
    font-family:'Minecraft','JetBrains Mono','Menlo',monospace;
    font-size:.95rem;color:#bbb;
    white-space:pre-wrap;word-break:break-word;line-height:1.5;
    border-left:3px solid ${T.accent};
`;

const ColorPickerRow = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px;`;
const ColorChip = styled.button<{ $on:boolean; $color:string }>`
    padding:6px 8px;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;
    border:1px solid ${p=>p.$on?p.$color:T.line};
    background:${p=>p.$on?`${p.$color}22`:T.panel2};
    color:${p=>p.$color};
    text-align:left;
`;

const Empty = styled.div`
    text-align:center;padding:80px 24px;color:${T.mute};font-size:.85rem;
    display:flex;flex-direction:column;align-items:center;gap:10px;
`;

const ConnDot = styled.span<{ ok:boolean }>`
    display:inline-flex;align-items:center;gap:6px;font-size:.72rem;color:${p=>p.ok?'#a7f3a7':'#fca5a5'};font-weight:600;
    padding:4px 10px;border-radius:999px;background:${p=>p.ok?'rgba(8,205,0,0.1)':'rgba(239,68,68,0.1)'};
    border:1px solid ${p=>p.ok?'rgba(8,205,0,0.25)':'rgba(239,68,68,0.25)'};
    & span.dot{width:6px;height:6px;border-radius:50%;background:${p=>p.ok?'#08cd00':'#ef4444'};}
`;

/* ── cron eval ───────────────────────────────────────────────────── */
// Supports: m h dom mon dow (each: *, n, a-b, */n, comma list). Range 0-59 / 0-23 / 1-31 / 1-12 / 0-6.
function parseField(field: string, min: number, max: number): Set<number> | null {
    const result = new Set<number>();
    for (const part of field.split(',')) {
        const m = part.match(/^(\*|\d+|\d+-\d+)(?:\/(\d+))?$/);
        if (!m) return null;
        const [, range, stepStr] = m;
        const step = stepStr ? Number(stepStr) : 1;
        if (step <= 0) return null;
        let a: number, b: number;
        if (range === '*') { a = min; b = max; }
        else if (range.includes('-')) { const [x,y] = range.split('-').map(Number); a = x; b = y; }
        else { a = b = Number(range); }
        if (a < min || b > max || a > b) return null;
        for (let v = a; v <= b; v += step) result.add(v);
    }
    return result;
}
interface ParsedCron { m: Set<number>; h: Set<number>; dom: Set<number>; mon: Set<number>; dow: Set<number>; }
function parseCron(expr: string): ParsedCron | null {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    const m = parseField(parts[0], 0, 59);
    const h = parseField(parts[1], 0, 23);
    const dom = parseField(parts[2], 1, 31);
    const mon = parseField(parts[3], 1, 12);
    const dow = parseField(parts[4], 0, 6);
    if (!m || !h || !dom || !mon || !dow) return null;
    return { m, h, dom, mon, dow };
}
function matchesCron(p: ParsedCron, d: Date): boolean {
    return p.m.has(d.getMinutes()) && p.h.has(d.getHours())
        && p.dom.has(d.getDate()) && p.mon.has(d.getMonth()+1) && p.dow.has(d.getDay());
}
function nextFireAt(p: ParsedCron, from = new Date()): Date | null {
    // brute-force scan next 7 days at minute granularity, starting next minute
    const d = new Date(from); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
    for (let i = 0; i < 60 * 24 * 7; i++) {
        if (matchesCron(p, d)) return new Date(d);
        d.setMinutes(d.getMinutes() + 1);
    }
    return null;
}
function describeCron(expr: string): string {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return 'Invalid cron';
    const [m, h, dom, mon, dow] = parts;
    if (m.startsWith('*/') && h === '*' && dom === '*' && mon === '*' && dow === '*') return `Every ${m.slice(2)} minutes`;
    if (m === '0' && h.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') return `Every ${h.slice(2)} hours`;
    if (h === '*' && dom === '*' && mon === '*' && dow === '*' && /^\d+$/.test(m)) return `At minute ${m} of every hour`;
    if (dom === '*' && mon === '*' && dow === '*' && /^\d+$/.test(m) && /^\d+$/.test(h)) return `Daily at ${h.padStart(2,'0')}:${m.padStart(2,'0')}`;
    return `m=${m} h=${h} dom=${dom} mon=${mon} dow=${dow}`;
}
function formatRelative(target: Date): string {
    const diff = Math.max(0, target.getTime() - Date.now());
    const s = Math.floor(diff / 1000);
    if (s < 60) return `in ${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `in ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `in ${h}h ${m%60}m`;
    return `in ${Math.floor(h/24)}d ${h%24}h`;
}

/* ── helpers ─────────────────────────────────────────────────────── */
const PRESETS: { label: string; cron: string }[] = [
    { label:'Every 5m',  cron:'*/5 * * * *' },
    { label:'Every 10m', cron:'*/10 * * * *' },
    { label:'Every 30m', cron:'*/30 * * * *' },
    { label:'Hourly',    cron:'0 * * * *' },
    { label:'Daily 12pm', cron:'0 12 * * *' },
    { label:'Daily 11pm', cron:'0 23 * * *' },
];

function uid() { return Math.random().toString(36).slice(2, 10); }
function load(): Broadcast[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_BROADCASTS;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : DEFAULT_BROADCASTS;
    } catch { return DEFAULT_BROADCASTS; }
}
function save(b: Broadcast[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch {} }

function buildCommand(b: Broadcast, ctx: { online: number; serverName: string }): string {
    const now = new Date();
    const msg = b.message
        .replace(/\{online\}/g, String(ctx.online))
        .replace(/\{server\}/g, ctx.serverName)
        .replace(/\{time\}/g, now.toLocaleTimeString())
        .replace(/\{date\}/g, now.toLocaleDateString());
    if (b.mode === 'tellraw') {
        return `tellraw @a {"text":"${msg.replace(/"/g,'\\"')}"}`;
    }
    if (b.mode === 'title') {
        return `title @a title {"text":"${msg.replace(/"/g,'\\"')}","color":"${b.titleColor ?? 'white'}"}`;
    }
    return `${b.mode} ${msg}`;
}

/* ── MOTD-style preview ──────────────────────────────────────────── */
const MC_COLORS: Record<string,string> = {
    '0':'#000','1':'#00A','2':'#0A0','3':'#0AA','4':'#A00','5':'#A0A',
    '6':'#FA0','7':'#AAA','8':'#555','9':'#55F','a':'#5F5','b':'#5FF',
    'c':'#F55','d':'#F5F','e':'#FF5','f':'#FFF',
};
function renderMC(s: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    let buf = '', color = '#AAA', bold=false, italic=false, underline=false, strike=false;
    const flush = (key:number)=>{
        if (!buf) return;
        const style: React.CSSProperties = { color };
        if (bold) style.fontWeight = 'bold';
        if (italic) style.fontStyle = 'italic';
        if (underline) style.textDecoration = (style.textDecoration ? style.textDecoration + ' ' : '') + 'underline';
        if (strike) style.textDecoration = (style.textDecoration ? style.textDecoration + ' ' : '') + 'line-through';
        parts.push(<span key={key} style={style}>{buf}</span>);
        buf = '';
    };
    let k = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '§' && i+1 < s.length) {
            flush(k++);
            const c = s[++i].toLowerCase();
            if (MC_COLORS[c]) { color = MC_COLORS[c]; bold=italic=underline=strike=false; }
            else if (c === 'l') bold = true;
            else if (c === 'o') italic = true;
            else if (c === 'n') underline = true;
            else if (c === 'm') strike = true;
            else if (c === 'r') { color='#AAA'; bold=italic=underline=strike=false; }
        } else {
            buf += s[i];
        }
    }
    flush(k);
    return parts;
}

/* ── component ───────────────────────────────────────────────────── */
export default function ScheduledBroadcastsContainer() {
    const instance  = ServerContext.useStoreState(s => s.socket.instance);
    const connected = ServerContext.useStoreState(s => s.socket.connected);
    const serverName = ServerContext.useStoreState(s => s.server.data?.name ?? 'server');
    const instanceRef = useRef<any>(null);
    const connectedRef = useRef(false);
    useEffect(() => { instanceRef.current = instance; }, [instance]);
    useEffect(() => { connectedRef.current = connected; }, [connected]);

    const [broadcasts, setBroadcasts] = useState<Broadcast[]>(load);
    const [selectedId, setSelectedId] = useState<string | null>(broadcasts[0]?.id ?? null);
    const [onlineCount, setOnlineCount] = useState(0);
    const [history, setHistory] = useState<{ id:string; name:string; t:string }[]>([]);

    // persist
    useEffect(() => { save(broadcasts); }, [broadcasts]);

    // track online count (from any list output)
    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data: string) => {
        const m = data.match(/There are (\d+) of a max of \d+ players online/);
        if (m) setOnlineCount(Number(m[1]));
    });

    // tick once per minute (aligned to top of minute)
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            if (now.getSeconds() !== 0) return; // only at top of minute
            if (!instanceRef.current || !connectedRef.current) return;
            setBroadcasts(prev => {
                let changed = false;
                const next = prev.map(b => {
                    if (!b.enabled) return b;
                    const p = parseCron(b.cron);
                    if (!p || !matchesCron(p, now)) return b;
                    // fire
                    const cmd = buildCommand(b, { online: onlineCount, serverName });
                    instanceRef.current?.send('send command', cmd);
                    setHistory(h => [{ id: b.id, name: b.name, t: now.toLocaleTimeString() }, ...h].slice(0, 30));
                    changed = true;
                    return { ...b, lastFiredAt: now.getTime() };
                });
                return changed ? next : prev;
            });
        };
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [onlineCount, serverName]);

    const selected = useMemo(() => broadcasts.find(b => b.id === selectedId) ?? null, [broadcasts, selectedId]);
    const parsedSelected = useMemo(() => selected ? parseCron(selected.cron) : null, [selected]);
    const nextFire = useMemo(() => parsedSelected ? nextFireAt(parsedSelected) : null, [parsedSelected]);

    const update = (patch: Partial<Broadcast>) => {
        if (!selected) return;
        setBroadcasts(b => b.map(x => x.id === selected.id ? { ...x, ...patch } : x));
    };

    const addBroadcast = () => {
        const b: Broadcast = {
            id: uid(), name: 'New Broadcast', enabled: false,
            cron: '*/30 * * * *', mode: 'broadcast',
            message: '§b§lINFO §r§7» §fYour message here',
        };
        setBroadcasts(prev => [b, ...prev]);
        setSelectedId(b.id);
    };
    const cloneBroadcast = () => {
        if (!selected) return;
        const b: Broadcast = { ...selected, id: uid(), name: `${selected.name} (copy)`, enabled: false };
        setBroadcasts(prev => [b, ...prev]);
        setSelectedId(b.id);
    };
    const deleteBroadcast = () => {
        if (!selected) return;
        if (!confirm(`Delete broadcast "${selected.name}"?`)) return;
        setBroadcasts(prev => prev.filter(x => x.id !== selected.id));
        setSelectedId(broadcasts.find(x => x.id !== selected.id)?.id ?? null);
    };
    const sendNow = () => {
        if (!selected || !instanceRef.current || !connected) return;
        const cmd = buildCommand(selected, { online: onlineCount, serverName });
        instanceRef.current.send('send command', cmd);
        setHistory(h => [{ id: selected.id, name: `${selected.name} (manual)`, t: new Date().toLocaleTimeString() }, ...h].slice(0, 30));
    };

    const enabledCount = broadcasts.filter(b => b.enabled).length;
    const nextOverall = useMemo(() => {
        let best: { name:string; at:Date } | null = null;
        for (const b of broadcasts) {
            if (!b.enabled) continue;
            const p = parseCron(b.cron); if (!p) continue;
            const n = nextFireAt(p); if (!n) continue;
            if (!best || n < best.at) best = { name: b.name, at: n };
        }
        return best;
    }, [broadcasts]);

    return (
        <Page>
            <Header>
                <TitleBlock>
                    <TitleIcon><FontAwesomeIcon icon={faBullhorn}/></TitleIcon>
                    <TitleText>
                        <Title>Scheduled Broadcasts</Title>
                        <Subtitle>Send <code style={{color:T.dim}}>say</code> / <code style={{color:T.dim}}>broadcast</code> / <code style={{color:T.dim}}>tellraw</code> on a cron schedule.</Subtitle>
                    </TitleText>
                </TitleBlock>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <ConnDot ok={connected}><span className='dot'/>{connected ? 'Connected' : 'Disconnected'}</ConnDot>
                    <Btn onClick={addBroadcast}><FontAwesomeIcon icon={faPlus}/> New Broadcast</Btn>
                </div>
            </Header>

            <StatsRow>
                <StatCard>
                    <StatIcon $color={T.accent}><FontAwesomeIcon icon={faCheckCircle}/></StatIcon>
                    <StatBody>
                        <StatLabel>Enabled</StatLabel>
                        <StatValue>{enabledCount} / {broadcasts.length}</StatValue>
                    </StatBody>
                </StatCard>
                <StatCard>
                    <StatIcon $color={T.blue}><FontAwesomeIcon icon={faClock}/></StatIcon>
                    <StatBody>
                        <StatLabel>Next Fire</StatLabel>
                        <StatValue style={{fontSize:'.9rem'}}>
                            {nextOverall ? `${nextOverall.name} · ${formatRelative(nextOverall.at)}` : '—'}
                        </StatValue>
                    </StatBody>
                </StatCard>
                <StatCard>
                    <StatIcon $color={T.warn}><FontAwesomeIcon icon={faPaperPlane}/></StatIcon>
                    <StatBody>
                        <StatLabel>Fired This Session</StatLabel>
                        <StatValue>{history.length}</StatValue>
                    </StatBody>
                </StatCard>
            </StatsRow>

            <Grid>
                <Panel>
                    <PanelHead>
                        <span>Broadcasts</span>
                        <span style={{color:T.mute,fontWeight:600}}>{broadcasts.length}</span>
                    </PanelHead>
                    {broadcasts.length === 0 ? (
                        <Empty>
                            <FontAwesomeIcon icon={faBullhorn} style={{fontSize:'1.5rem'}}/>
                            No broadcasts yet
                        </Empty>
                    ) : broadcasts.map(b => {
                        const p = parseCron(b.cron);
                        const n = p ? nextFireAt(p) : null;
                        return (
                            <Row key={b.id} $active={b.id===selectedId} $enabled={b.enabled} onClick={()=>setSelectedId(b.id)}>
                                <Toggle $on={b.enabled} onClick={(e)=>{
                                    e.stopPropagation();
                                    setBroadcasts(prev => prev.map(x => x.id === b.id ? { ...x, enabled: !x.enabled } : x));
                                }}/>
                                <RowBody>
                                    <RowName>{b.name}</RowName>
                                    <RowMeta>
                                        <span>{b.cron}</span>
                                        {b.enabled && n && <NextChip>{formatRelative(n)}</NextChip>}
                                    </RowMeta>
                                </RowBody>
                            </Row>
                        );
                    })}
                </Panel>

                {selected ? (
                    <Editor>
                        <EditorHead>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <TitleIcon $bg={selected.enabled?T.accentDim:'rgba(255,255,255,0.04)'} $fg={selected.enabled?T.accent:T.mute}>
                                    <FontAwesomeIcon icon={selected.enabled?faPlay:faPause}/>
                                </TitleIcon>
                                <EditorName value={selected.name} onChange={e=>update({name:e.target.value})}/>
                            </div>
                            <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                <Btn onClick={sendNow} disabled={!connected}><FontAwesomeIcon icon={faPaperPlane}/> Send Now</Btn>
                                <Btn onClick={cloneBroadcast}><FontAwesomeIcon icon={faClone}/> Clone</Btn>
                                <Btn kind='danger' onClick={deleteBroadcast}><FontAwesomeIcon icon={faTrash}/> Delete</Btn>
                            </div>
                        </EditorHead>
                        <EditorBody>
                            <Section>
                                <SectionLabel>Command Mode</SectionLabel>
                                <ModeRow>
                                    {(['say','broadcast','tellraw','title'] as CmdMode[]).map(m => (
                                        <ModeBtn key={m} $on={selected.mode===m} onClick={()=>update({mode:m})}>
                                            {MODE_LABELS[m]}
                                        </ModeBtn>
                                    ))}
                                </ModeRow>
                            </Section>

                            <Section>
                                <SectionLabel>
                                    Message
                                    <SectionHelp>— §-codes supported. Placeholders: {'{online}'} {'{server}'} {'{time}'} {'{date}'}</SectionHelp>
                                </SectionLabel>
                                <TextArea value={selected.message} onChange={e=>update({message:e.target.value})}
                                    placeholder='§b§lINFO §r§7» §fYour message here'/>
                                <Preview>{renderMC(selected.message
                                    .replace(/\{online\}/g, String(onlineCount))
                                    .replace(/\{server\}/g, serverName)
                                    .replace(/\{time\}/g, new Date().toLocaleTimeString())
                                    .replace(/\{date\}/g, new Date().toLocaleDateString())
                                )}</Preview>
                            </Section>

                            {selected.mode === 'title' && (
                                <Section>
                                    <SectionLabel>Title Color</SectionLabel>
                                    <ColorPickerRow>
                                        {TITLE_COLORS.map(c => (
                                            <ColorChip key={c} $on={(selected.titleColor??'white')===c}
                                                $color={c==='light_purple'?'#F5F':c==='dark_red'?'#A00':c==='gold'?'#FA0':c==='aqua'?'#5FF':c==='gray'?'#AAA':c==='green'?'#5F5':c==='blue'?'#55F':c==='yellow'?'#FF5':c==='red'?'#F55':'#FFF'}
                                                onClick={()=>update({titleColor:c})}>
                                                {c}
                                            </ColorChip>
                                        ))}
                                    </ColorPickerRow>
                                </Section>
                            )}

                            <Section>
                                <SectionLabel>
                                    Schedule (cron)
                                    <SectionHelp>— minute hour day-of-month month day-of-week</SectionHelp>
                                </SectionLabel>
                                <CodeInput value={selected.cron} onChange={e=>update({cron:e.target.value})} placeholder='*/10 * * * *'/>
                                <PresetRow>
                                    {PRESETS.map(p => (
                                        <PresetChip key={p.cron} $on={selected.cron===p.cron} onClick={()=>update({cron:p.cron})}>
                                            {p.label}
                                        </PresetChip>
                                    ))}
                                </PresetRow>
                                <div style={{display:'flex',gap:14,marginTop:4,fontSize:'.75rem',color:T.dim,flexWrap:'wrap'}}>
                                    <span><FontAwesomeIcon icon={parsedSelected?faCheckCircle:faExclamationTriangle}
                                        style={{color:parsedSelected?T.accent:T.danger,marginRight:6}}/>
                                        {parsedSelected ? describeCron(selected.cron) : 'Invalid cron expression'}
                                    </span>
                                    {nextFire && <span><FontAwesomeIcon icon={faClock} style={{marginRight:6}}/>Next: {nextFire.toLocaleString()} ({formatRelative(nextFire)})</span>}
                                </div>
                            </Section>
                        </EditorBody>
                    </Editor>
                ) : (
                    <Editor>
                        <Empty>
                            <FontAwesomeIcon icon={faBullhorn} style={{fontSize:'2rem'}}/>
                            Select a broadcast to edit, or create a new one.
                            <Btn kind='primary' onClick={addBroadcast}><FontAwesomeIcon icon={faPlus}/> New Broadcast</Btn>
                        </Empty>
                    </Editor>
                )}
            </Grid>

            {history.length > 0 && (
                <Panel>
                    <PanelHead>
                        <span>Recent Fires</span>
                        <Btn onClick={()=>setHistory([])} style={{padding:'4px 10px',fontSize:'.7rem'}}>Clear</Btn>
                    </PanelHead>
                    <div style={{display:'flex',flexDirection:'column'}}>
                        {history.map((h, i) => (
                            <div key={i} style={{
                                display:'flex',alignItems:'center',gap:10,padding:'10px 16px',
                                borderTop: i===0 ? 'none' : `1px solid ${T.line}`, fontSize:'.78rem',
                            }}>
                                <FontAwesomeIcon icon={faPaperPlane} style={{color:T.accent,fontSize:'.7rem'}}/>
                                <span style={{color:T.text,fontWeight:600}}>{h.name}</span>
                                <span style={{color:T.mute,marginLeft:'auto',fontFamily:'JetBrains Mono,Menlo,monospace'}}>{h.t}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            )}
        </Page>
    );
}
