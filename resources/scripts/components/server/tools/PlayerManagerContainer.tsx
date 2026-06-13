import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { Combobox } from '@/components/elements/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSync, faUser, faHeart, faSkull, faBan, faShieldAlt,
    faGamepad, faExclamationTriangle, faStar, faCrosshairs,
    faPaintBrush, faMap, faEye, faBolt, faUsers, faSearch,
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

/* ── MC texture CDN ──────────────────────────────────────────────── */
const MC_BASE = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/textures';
const ITEM_TEX: Record<string, string> = {
    'Diamond Sword':`${MC_BASE}/item/diamond_sword.png`, 'Iron Pickaxe':`${MC_BASE}/item/iron_pickaxe.png`,
    'Bread':`${MC_BASE}/item/bread.png`, 'Oak Log':`${MC_BASE}/block/oak_log.png`,
    'Arrow':`${MC_BASE}/item/arrow.png`, 'Torch':`${MC_BASE}/block/torch.png`,
    'Diamond':`${MC_BASE}/item/diamond.png`, 'Cooked Beef':`${MC_BASE}/item/cooked_beef.png`,
    'Golden Apple':`${MC_BASE}/item/golden_apple.png`, 'Ender Pearl':`${MC_BASE}/item/ender_pearl.png`,
    'TNT':`${MC_BASE}/block/tnt_side.png`, 'Iron Sword':`${MC_BASE}/item/iron_sword.png`,
};

interface Player {
    /** real Minecraft username — used in commands and head lookups */
    username: string;
    /** raw entry from /list with ANSI codes intact, rendered as colored spans */
    ansiRaw: string;
    /** stripped display string for search/sort */
    displayName: string;
    health?: number;
    maxHealth?: number;
    gamemode?: string;
    level?: number;
    online: boolean;
}
interface InvItem { n: string; q: number; }

/* ── helpers ─────────────────────────────────────────────────────── */
/** Strip ANSI escape sequences (with or without ESC byte) and MC color codes. */
function stripCodes(s: string): string {
    return s
        .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')      // ANSI escape sequences
        .replace(/\[[0-9;]*[A-Za-z]/g, '')     // same, redundant safety
        .replace(/\[(\d+;?)+m/g, '')                  // bare CSI-stripped color codes that survived
        .replace(/§[0-9a-fk-or]/gi, '')               // MC formatting codes
        .replace(/\s+/g, ' ')
        .trim();
}

/** Pull the real Minecraft username out of an ANSI/§-tagged entry. */
function extractUsername(raw: string): string {
    const cleaned = stripCodes(raw);
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    return tokens[tokens.length - 1] ?? cleaned;
}

/** ANSI SGR color palette (xterm bright + standard). */
const ANSI_COLORS: Record<number,string> = {
    30:'#3b3b3b', 31:'#cc4444', 32:'#3fb950', 33:'#d29922', 34:'#3b82f6', 35:'#bf5af2', 36:'#39c5cf', 37:'#dcdcdc',
    90:'#8b95a7', 91:'#ff6b6b', 92:'#7ee787', 93:'#f0c674', 94:'#79b8ff', 95:'#d2a8ff', 96:'#56d4dd', 97:'#ffffff',
};

/** Parse an ANSI-coded string (with or without ESC bytes) into colored React spans. */
function renderAnsi(raw: string): React.ReactNode[] {
    const out: React.ReactNode[] = [];
    let i = 0, k = 0, buf = '';
    let color: string | undefined;
    let bold = false;
    const flush = () => {
        if (!buf) return;
        out.push(
            <span key={k++} style={{ color: color ?? 'inherit', fontWeight: bold ? 800 : undefined }}>
                {buf}
            </span>
        );
        buf = '';
    };
    const apply = (codeStr: string) => {
        const codes = codeStr ? codeStr.split(';').map(Number) : [0];
        for (const c of codes) {
            if (c === 0) { color = undefined; bold = false; }
            else if (c === 1) bold = true;
            else if (c === 22) bold = false;
            else if (ANSI_COLORS[c]) color = ANSI_COLORS[c];
        }
    };
    while (i < raw.length) {
        // \x1b[…m
        if (raw.charCodeAt(i) === 0x1b && raw[i+1] === '[') {
            const m = raw.slice(i+2).match(/^([\d;]*)m/);
            if (m) { flush(); apply(m[1]); i += 2 + m[0].length; continue; }
        }
        // bare CSI: [97m   (no ESC byte — appears in Pterodactyl websocket output)
        if (raw[i] === '[') {
            const m = raw.slice(i+1).match(/^(\d+(?:;\d+)*)m/);
            if (m) { flush(); apply(m[1]); i += 1 + m[0].length; continue; }
        }
        // MC § code → translate to closest ANSI
        if (raw[i] === '§' && i+1 < raw.length) {
            const c = raw[i+1].toLowerCase();
            const mc: Record<string,string> = {
                '0':'#000000','1':'#0000AA','2':'#00AA00','3':'#00AAAA','4':'#AA0000','5':'#AA00AA',
                '6':'#FFAA00','7':'#AAAAAA','8':'#555555','9':'#5555FF','a':'#55FF55','b':'#55FFFF',
                'c':'#FF5555','d':'#FF55FF','e':'#FFFF55','f':'#FFFFFF',
            };
            if (mc[c]) { flush(); color = mc[c]; bold = false; i += 2; continue; }
            if (c === 'l') { flush(); bold = true; i += 2; continue; }
            if (c === 'r') { flush(); color = undefined; bold = false; i += 2; continue; }
            if (/[k-o]/.test(c)) { i += 2; continue; }
        }
        buf += raw[i++];
    }
    flush();
    return out;
}

/* ── styled ──────────────────────────────────────────────────────── */
const Page = styled.div`padding:24px;color:${T.text};font-family:'Inter',sans-serif;display:flex;flex-direction:column;gap:18px;`;

const Header = styled.div`display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;`;
const TitleBlock = styled.div`display:flex;align-items:center;gap:12px;`;
const TitleIcon = styled.div`
    width:36px;height:36px;border-radius:9px;
    background:${T.accentDim};color:${T.accent};
    display:flex;align-items:center;justify-content:center;font-size:.95rem;
`;
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

const SearchWrap = styled.div`
    position:relative;display:flex;align-items:center;
    background:${T.panel};border:1px solid ${T.line};border-radius:8px;
    padding:0 12px;min-width:240px;
    transition:border-color .12s;
    &:focus-within{border-color:${T.lineH};}
`;
const SearchInput = styled.input`
    flex:1;background:transparent;border:0;outline:none;padding:9px 0 9px 8px;
    color:${T.text};font-size:.8rem;font-family:'Inter',sans-serif;
    &::placeholder{color:${T.mute};}
`;

const StatsRow = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;`;
const StatCard = styled.div`
    background:${T.panel};border:1px solid ${T.line};border-radius:10px;padding:14px 16px;
    display:flex;align-items:center;gap:12px;
`;
const StatIcon = styled.div<{ $color:string }>`
    width:38px;height:38px;border-radius:9px;
    background:${p=>p.$color}1a;color:${p=>p.$color};
    display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;
`;
const StatLabel = styled.div`font-size:.66rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${T.mute};`;
const StatValue = styled.div`font-size:1.15rem;font-weight:700;color:${T.text};font-variant-numeric:tabular-nums;margin-top:2px;`;

const PlayerGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px;`;

const PlayerCard = styled(motion.div)<{ $selected?: boolean; $accent: string }>`
    position:relative;background:${T.panel};
    border:1px solid ${p=>p.$selected?p.$accent+'66':T.line};
    border-radius:12px;padding:16px;cursor:pointer;transition:border-color .15s, background .15s;
    box-shadow:${p=>p.$selected?`0 0 0 1px ${p.$accent}33`:'none'};
    &:hover{border-color:${T.lineH};}
    &::before{
        content:'';position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:0 3px 3px 0;
        background:${p=>p.$accent};opacity:${p=>p.$selected?1:0.7};
    }
`;

const PlayerTop = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:14px;`;
const Avatar = styled.div<{ $ring:string }>`
    width:46px;height:46px;border-radius:10px;
    background:${T.panel2};border:1.5px solid ${p=>p.$ring};
    display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;
    box-shadow:0 0 0 3px ${p=>p.$ring}1a;
`;
const PlayerInfo = styled.div`flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;`;
const PlayerNameRow = styled.div`display:flex;align-items:center;gap:6px;flex-wrap:wrap;`;
const RankChip = styled.span<{ $color:string }>`
    font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
    padding:2px 7px;border-radius:999px;
    color:${p=>p.$color};background:${p=>p.$color}1a;
    border:1px solid ${p=>p.$color}40;
    font-family:'Inter',sans-serif;
    white-space:nowrap;
`;
const PlayerName = styled.div`
    font-size:.95rem;font-weight:700;color:${T.text};
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;
    font-family:'Inter','JetBrains Mono','Menlo',monospace;
    letter-spacing:.01em;
    & > span{font-weight:inherit;}
`;
const PlayerMeta = styled.div`font-size:.7rem;color:${T.dim};display:flex;gap:10px;flex-wrap:wrap;align-items:center;`;
const PlayerMetaItem = styled.span`display:inline-flex;align-items:center;gap:4px;`;

const HealthBar = styled.div`margin-bottom:12px;`;
const HealthLabel = styled.div`font-size:.66rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${T.mute};margin-bottom:5px;display:flex;justify-content:space-between;align-items:center;`;
const HealthTrack = styled.div`height:6px;background:rgba(255,255,255,0.04);border-radius:999px;overflow:hidden;`;
const HealthFill = styled.div<{ pct:number }>`
    height:100%;border-radius:999px;
    width:${p=>p.pct}%;
    background:${p=>p.pct>50?T.accent:p.pct>25?T.warn:T.danger};
    transition:width .3s ease;
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

const InvGrid = styled.div`display:grid;grid-template-columns:repeat(9,1fr);gap:4px;margin-bottom:6px;`;
const InvSlot = styled.div<{ filled?:boolean }>`
    aspect-ratio:1;border-radius:5px;
    background:${p=>p.filled?'#0f1318':'#0a0d12'};
    border:1px solid ${p=>p.filled?T.lineH:T.line};
    display:flex;align-items:center;justify-content:center;
    position:relative;overflow:hidden;
    transition:border-color .1s;
`;
const InvQty = styled.div`
    position:absolute;bottom:1px;right:2px;font-size:.5rem;color:#fff;font-weight:700;
    text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;
    font-family:monospace;
`;

const Empty = styled.div`
    background:${T.panel};border:1px solid ${T.line};border-radius:12px;
    text-align:center;padding:80px 24px;color:${T.mute};font-size:.875rem;
    display:flex;flex-direction:column;align-items:center;gap:12px;
`;

const ConnDot = styled.span<{ ok:boolean }>`
    display:inline-flex;align-items:center;gap:6px;font-size:.72rem;color:${p=>p.ok?'#a7f3a7':'#fca5a5'};font-weight:600;
    padding:5px 10px;border-radius:999px;background:${p=>p.ok?'rgba(8,205,0,0.1)':'rgba(239,68,68,0.1)'};
    border:1px solid ${p=>p.ok?'rgba(8,205,0,0.25)':'rgba(239,68,68,0.25)'};
    & span.dot{width:6px;height:6px;border-radius:50%;background:${p=>p.ok?T.accent:T.danger};}
`;

const GAMEMODES = [
    { value:'survival',  label:'Survival'  },
    { value:'creative',  label:'Creative'  },
    { value:'adventure', label:'Adventure' },
    { value:'spectator', label:'Spectator' },
];
const gmFaIcon: Record<string,any> = { survival:faCrosshairs, creative:faPaintBrush, adventure:faMap, spectator:faEye };

const MOCK_INV: InvItem[] = [
    {n:'Diamond Sword',q:1},{n:'Iron Pickaxe',q:1},{n:'Bread',q:32},
    {n:'Oak Log',q:64},{n:'Arrow',q:64},{n:'Torch',q:24},
    {n:'Diamond',q:8},{n:'Cooked Beef',q:16},{n:'Golden Apple',q:2},
    {n:'Ender Pearl',q:4},{n:'Iron Sword',q:1},{n:'TNT',q:10},
];

/* ── command log ──── */
const LogSection = styled.div`background:${T.panel};border:1px solid ${T.line};border-radius:12px;overflow:hidden;`;
const LogHead = styled.div`
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 16px;border-bottom:1px solid ${T.line};
    font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${T.dim};
`;
const LogList = styled.div`max-height:180px;overflow-y:auto;padding:8px 0;`;
const LogLine = styled.div<{ ok:boolean }>`
    padding:4px 16px;font-family:'JetBrains Mono','Menlo',monospace;font-size:.72rem;
    color:${p=>p.ok?'#a3e635':'#fca5a5'};
`;

/* ── component ───────────────────────────────────────────────────── */
export default function PlayerManagerContainer() {
    const instanceRef = useRef<any>(null);
    const connectedRef = useRef(false);
    const instance  = ServerContext.useStoreState(s => s.socket.instance);
    const connected = ServerContext.useStoreState(s => s.socket.connected);
    useEffect(() => { instanceRef.current  = instance;  }, [instance]);
    useEffect(() => { connectedRef.current = connected; }, [connected]);

    const [players,  setPlayers]  = useState<Player[]>([]);
    const [loading,  setLoading]  = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [query,    setQuery]    = useState('');
    const [cmdLog,   setCmdLog]   = useState<{ text:string; ok:boolean }[]>([]);
    const [gmTarget, setGmTarget] = useState<Record<string,string>>({});

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

    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data: string) => {
        // Match the "There are X of a max of Y players online:" line. The colon and the
        // text after it can include ANSI codes — match against the stripped form to find
        // it, but operate on the raw data so we can split with codes preserved.
        const cleaned = stripCodes(data);
        if (!/There are \d+ of a max of \d+ players online:/.test(cleaned)) return;

        // Find where the player list starts in the RAW string (after the first ":")
        const colonIdx = data.indexOf(':');
        const rawList = colonIdx >= 0 ? data.slice(colonIdx + 1) : '';

        // Entries are comma-separated; commas only appear between players (ANSI codes
        // don't contain commas), so a plain split is safe.
        const rawEntries = rawList.split(',').map(s => s.trim()).filter(s => stripCodes(s).length > 0);

        const parsed = rawEntries.map(r => ({
            ansiRaw: r,
            displayName: stripCodes(r),
            username: extractUsername(r),
        }));

        setPlayers(prev => {
            const byUser = new Map(prev.map(p => [p.username, p]));
            return parsed.map(p => {
                const ex = byUser.get(p.username);
                return ex
                    ? { ...ex, ansiRaw: p.ansiRaw, displayName: p.displayName }
                    : { ...p, online: true };
            });
        });
        setLoading(false);
    });

    const fetchPlayers = useCallback(() => {
        setLoading(true);
        cmd('list');
        setTimeout(() => setLoading(false), 3000);
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
        return players.filter(p =>
            p.username.toLowerCase().includes(q) ||
            p.displayName.toLowerCase().includes(q)
        );
    }, [players, query]);

    const onlineCount = players.filter(p => p.online).length;

    const doKill = (u: string) => cmd(`kill ${u}`);
    const doHeal = (u: string) => cmd(`effect give ${u} minecraft:instant_health 1 255`);
    const doKick = (u: string) => { cmd(`kick ${u} Kicked by admin`); setPlayers(pl => pl.filter(p => p.username !== u)); };
    const doBan  = (u: string) => { cmd(`ban ${u}`); setPlayers(pl => pl.filter(p => p.username !== u)); };
    const doOp   = (u: string) => cmd(`op ${u}`);
    const doGm   = (u: string, gm: string) => {
        cmd(`gamemode ${gm} ${u}`);
        setPlayers(pl => pl.map(p => p.username === u ? { ...p, gamemode: gm } : p));
    };

    return (
        <Page>
            <Header>
                <TitleBlock>
                    <TitleIcon><FontAwesomeIcon icon={faUsers}/></TitleIcon>
                    <TitleText>
                        <Title>Player Manager</Title>
                        <Subtitle>Live roster, gamemode and moderation actions.</Subtitle>
                    </TitleText>
                </TitleBlock>
                <Toolbar>
                    <SearchWrap>
                        <FontAwesomeIcon icon={faSearch} style={{color:T.mute,fontSize:'.75rem'}}/>
                        <SearchInput placeholder='Search by name or rank…' value={query} onChange={e=>setQuery(e.target.value)}/>
                    </SearchWrap>
                    <ConnDot ok={connected}><span className='dot'/>{connected ? 'Connected' : 'Not connected'}</ConnDot>
                    <Btn onClick={fetchPlayers} disabled={loading || !connected}>
                        <FontAwesomeIcon icon={faSync} spin={loading}/> Refresh
                    </Btn>
                    <Btn kind='warn' onClick={() => cmd('broadcast §cServer restarting soon!')}>
                        <FontAwesomeIcon icon={faExclamationTriangle}/> Broadcast
                    </Btn>
                </Toolbar>
            </Header>

            <StatsRow>
                <StatCard>
                    <StatIcon $color={T.accent}><FontAwesomeIcon icon={faUser}/></StatIcon>
                    <div>
                        <StatLabel>Online</StatLabel>
                        <StatValue>{onlineCount}</StatValue>
                    </div>
                </StatCard>
                <StatCard>
                    <StatIcon $color={T.danger}><FontAwesomeIcon icon={faHeart}/></StatIcon>
                    <div>
                        <StatLabel>Avg Health</StatLabel>
                        <StatValue>
                            {players.length > 0
                                ? Math.round(players.reduce((a,p)=>a+(p.health??20),0)/players.length)
                                : '—'}
                        </StatValue>
                    </div>
                </StatCard>
                <StatCard>
                    <StatIcon $color={T.blue}><FontAwesomeIcon icon={faBolt}/></StatIcon>
                    <div>
                        <StatLabel>Commands</StatLabel>
                        <StatValue>{cmdLog.length}</StatValue>
                    </div>
                </StatCard>
            </StatsRow>

            {filtered.length === 0 ? (
                <Empty>
                    <FontAwesomeIcon icon={faUser} style={{fontSize:'2rem'}}/>
                    {players.length === 0
                        ? (connected
                            ? <>Click <strong style={{color:T.text}}>Refresh</strong> to fetch the player list.</>
                            : <>Server is offline or not connected.</>)
                        : <>No players match "{query}".</>}
                </Empty>
            ) : (
                <PlayerGrid>
                    {filtered.map(player => {
                        const hpPct = player.health != null && player.maxHealth
                            ? Math.round((player.health/player.maxHealth)*100) : 100;
                        const accent = T.accent;
                        return (
                            <PlayerCard
                                key={player.username}
                                $selected={selected===player.username}
                                $accent={accent}
                                onClick={() => setSelected(s => s===player.username ? null : player.username)}
                                initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} layout
                            >
                                <PlayerTop>
                                    <Avatar $ring={accent}>
                                        <img
                                            src={`https://mc-heads.net/avatar/${player.username}/46`}
                                            alt={player.username}
                                            style={{width:'100%',height:'100%',objectFit:'cover',imageRendering:'pixelated'}}
                                            onError={e=>{(e.target as HTMLImageElement).src='https://mc-heads.net/avatar/Steve/46';}}
                                        />
                                    </Avatar>
                                    <PlayerInfo>
                                        <PlayerName title={player.displayName}>
                                            {renderAnsi(player.ansiRaw)}
                                        </PlayerName>
                                        <PlayerMeta>
                                            {player.gamemode && (
                                                <PlayerMetaItem>
                                                    <FontAwesomeIcon icon={gmFaIcon[player.gamemode]??faGamepad}/>
                                                    {player.gamemode}
                                                </PlayerMetaItem>
                                            )}
                                            {player.level != null && (
                                                <PlayerMetaItem>
                                                    <FontAwesomeIcon icon={faStar} style={{color:T.warn}}/>
                                                    Lvl {player.level}
                                                </PlayerMetaItem>
                                            )}
                                            <PlayerMetaItem style={{color:T.mute,fontVariantNumeric:'tabular-nums'}}>
                                                <span style={{
                                                    display:'inline-block',width:6,height:6,borderRadius:'50%',
                                                    background:player.online?T.accent:T.mute,
                                                    boxShadow:player.online?`0 0 6px ${T.accent}`:undefined,
                                                }}/>
                                                {player.online ? 'Online' : 'Offline'}
                                            </PlayerMetaItem>
                                        </PlayerMeta>
                                    </PlayerInfo>
                                </PlayerTop>

                                {player.health != null && (
                                    <HealthBar>
                                        <HealthLabel>
                                            <span>Health</span>
                                            <span style={{color:T.text}}>{player.health}/{player.maxHealth??20}</span>
                                        </HealthLabel>
                                        <HealthTrack><HealthFill pct={hpPct}/></HealthTrack>
                                    </HealthBar>
                                )}

                                <ActionRow>
                                    <ActionBtn onClick={e=>{e.stopPropagation();doHeal(player.username);}}>
                                        <FontAwesomeIcon icon={faHeart}/> Heal
                                    </ActionBtn>
                                    <ActionBtn variant='warn' onClick={e=>{e.stopPropagation();doKick(player.username);}}>
                                        <FontAwesomeIcon icon={faBolt}/> Kick
                                    </ActionBtn>
                                    <ActionBtn variant='danger' onClick={e=>{e.stopPropagation();doKill(player.username);}}>
                                        <FontAwesomeIcon icon={faSkull}/> Kill
                                    </ActionBtn>
                                    <ActionBtn variant='danger' onClick={e=>{e.stopPropagation();doBan(player.username);}}>
                                        <FontAwesomeIcon icon={faBan}/> Ban
                                    </ActionBtn>
                                    <ActionBtn onClick={e=>{e.stopPropagation();doOp(player.username);}}>
                                        <FontAwesomeIcon icon={faShieldAlt}/> OP
                                    </ActionBtn>
                                </ActionRow>

                                <AnimatePresence>
                                    {selected===player.username && (
                                        <motion.div
                                            initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                                            style={{overflow:'hidden'}} onClick={e=>e.stopPropagation()}
                                        >
                                            <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.line}`}}>
                                                <div style={{marginBottom:14}}>
                                                    <div style={{fontSize:'.66rem',fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:T.mute,marginBottom:6}}>
                                                        <FontAwesomeIcon icon={faGamepad} style={{marginRight:5}}/> Change Gamemode
                                                    </div>
                                                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                                                        {GAMEMODES.map(gm => {
                                                            const active = (gmTarget[player.username] ?? player.gamemode) === gm.value;
                                                            return (
                                                                <button key={gm.value} onClick={()=>{
                                                                    setGmTarget(g=>({...g,[player.username]:gm.value}));
                                                                    doGm(player.username, gm.value);
                                                                }} style={{
                                                                    display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                                                                    padding:'8px 6px',borderRadius:7,fontSize:'.72rem',fontWeight:600,
                                                                    cursor:'pointer',fontFamily:'Inter,sans-serif',
                                                                    border:`1px solid ${active?T.accent:T.line}`,
                                                                    background:active?T.accentDim:T.panel2,
                                                                    color:active?T.accent:T.dim,
                                                                }}>
                                                                    <FontAwesomeIcon icon={gmFaIcon[gm.value]}/> {gm.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div style={{fontSize:'.66rem',fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:T.mute,marginBottom:8}}>
                                                    Inventory (simulated)
                                                </div>
                                                <InvGrid>
                                                    {Array.from({length:36}).map((_,i)=>{
                                                        const item: InvItem|null = i < MOCK_INV.length ? MOCK_INV[i] : null;
                                                        const tex = item ? ITEM_TEX[item.n] : null;
                                                        return (
                                                            <InvSlot key={i} filled={!!item} title={item?.n}>
                                                                {item && tex && (
                                                                    <img src={tex} alt={item.n}
                                                                        style={{width:'80%',height:'80%',imageRendering:'pixelated',objectFit:'contain'}}
                                                                        onError={e=>{(e.target as HTMLImageElement).style.display='none';}}
                                                                    />
                                                                )}
                                                                {item && <InvQty>{item.q > 1 ? item.q : ''}</InvQty>}
                                                            </InvSlot>
                                                        );
                                                    })}
                                                </InvGrid>
                                                <div style={{fontSize:'.7rem',color:T.mute,marginTop:6}}>
                                                    Live inventory requires a server-side plugin
                                                </div>
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
                    <LogHead>
                        <span>Command Log</span>
                        <Btn onClick={()=>setCmdLog([])} style={{padding:'4px 10px',fontSize:'.7rem'}}>Clear</Btn>
                    </LogHead>
                    <LogList>
                        {cmdLog.map((l,i)=>(
                            <LogLine key={i} ok={l.ok}>{l.text}</LogLine>
                        ))}
                    </LogList>
                </LogSection>
            )}
        </Page>
    );
}
