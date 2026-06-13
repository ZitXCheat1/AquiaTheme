import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { Combobox } from '@/components/elements/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSync, faUser, faHeart, faSkull, faBan, faShieldAlt,
    faGamepad, faExclamationTriangle, faStar, faCrosshairs,
    faPaintBrush, faMap, faEye, faKick, faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';

/* ── MC texture CDN ──────────────────────────────────────────────── */
const MC_BASE = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/textures';

const ITEM_TEX: Record<string, string> = {
    'Diamond Sword':  `${MC_BASE}/item/diamond_sword.png`,
    'Iron Pickaxe':   `${MC_BASE}/item/iron_pickaxe.png`,
    'Bread':          `${MC_BASE}/item/bread.png`,
    'Oak Log':        `${MC_BASE}/block/oak_log.png`,
    'Arrow':          `${MC_BASE}/item/arrow.png`,
    'Torch':          `${MC_BASE}/block/torch.png`,
    'Diamond':        `${MC_BASE}/item/diamond.png`,
    'Cooked Beef':    `${MC_BASE}/item/cooked_beef.png`,
    'Golden Apple':   `${MC_BASE}/item/golden_apple.png`,
    'Ender Pearl':    `${MC_BASE}/item/ender_pearl.png`,
    'TNT':            `${MC_BASE}/block/tnt_side.png`,
    'Iron Sword':     `${MC_BASE}/item/iron_sword.png`,
};

/* ── types ───────────────────────────────────────────────────────── */
interface Player { name: string; health?: number; maxHealth?: number; gamemode?: string; level?: number; online: boolean; }
interface InvItem { n: string; q: number; }

/* ── styled ──────────────────────────────────────────────────────── */
const Page = styled.div`padding: 24px; color: #fff; font-family: 'Inter', sans-serif;`;
const Header = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;`;
const Title = styled.h2`font-size:1rem;font-weight:700;color:#f1f5f9;margin:0;display:flex;align-items:center;gap:8px;`;
const Toolbar = styled.div`display:flex;align-items:center;gap:8px;flex-wrap:wrap;`;

const Btn = styled.button<{ variant?: 'primary'|'danger'|'ghost'|'warn' }>`
    display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;
    font-size:.8rem;font-weight:500;cursor:pointer;border:2px solid transparent;
    transition:all .15s;white-space:nowrap;font-family:'Inter',sans-serif;
    ${p=>p.variant==='primary'?`background:#08cd00;border-color:#08cd00;color:#050d05;&:hover{background:#07b300;}`
    :p.variant==='danger'?`background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.4);color:#ef4444;&:hover{background:rgba(239,68,68,0.18);}`
    :p.variant==='warn'?`background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.4);color:#f59e0b;&:hover{background:rgba(245,158,11,0.18);}`
    :`background:#0e140e;border-color:rgba(8,205,0,0.3);color:#94a3b8;&:hover{border-color:rgba(8,205,0,0.6);color:#fff;}`}
    &:disabled{opacity:.4;cursor:default;}
`;

const StatsRow = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:20px;`;
const StatCard = styled.div`background:#0e140e;border:2px solid rgba(8,205,0,0.18);border-radius:10px;padding:14px 16px;`;
const StatLabel = styled.div`font-size:.68rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#4b5a72;margin-bottom:4px;`;
const StatValue = styled.div`font-size:1.4rem;font-weight:700;color:#08cd00;font-variant-numeric:tabular-nums;`;

const PlayerGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;`;

const PlayerCard = styled(motion.div)<{ $selected?: boolean }>`
    background:#0e140e;
    border:2px solid ${p=>p.$selected?'rgba(8,205,0,0.6)':'rgba(8,205,0,0.18)'};
    border-radius:12px;padding:16px;cursor:pointer;transition:border-color .15s;
    box-shadow:${p=>p.$selected?'0 0 16px rgba(8,205,0,0.12)':'none'};
    &:hover{border-color:rgba(8,205,0,0.45);}
`;

const PlayerTop = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:12px;`;
const Avatar = styled.div`
    width:46px;height:46px;border-radius:8px;
    background:rgba(8,205,0,0.08);border:2px solid rgba(8,205,0,0.3);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;
`;
const PlayerInfo = styled.div`flex:1;min-width:0;`;
const PlayerName = styled.div`font-size:.9rem;font-weight:700;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const PlayerMeta = styled.div`font-size:.72rem;color:#4b5a72;margin-top:2px;display:flex;gap:8px;flex-wrap:wrap;`;

const HealthBar = styled.div`margin-bottom:10px;`;
const HealthLabel = styled.div`font-size:.65rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#4b5a72;margin-bottom:4px;display:flex;justify-content:space-between;`;
const HealthTrack = styled.div`height:7px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.04);`;
const HealthFill = styled.div<{ pct:number }>`
    height:100%;border-radius:999px;
    width:${p=>p.pct}%;
    background:${p=>p.pct>50?'#08cd00':p.pct>25?'#f59e0b':'#ef4444'};
    transition:width .3s ease;
`;

const ActionRow = styled.div`display:flex;flex-wrap:wrap;gap:6px;`;
const ActionBtn = styled.button<{ variant?: 'danger'|'warn'|'green' }>`
    display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;
    font-size:.72rem;font-weight:600;cursor:pointer;border:2px solid transparent;
    transition:all .12s;font-family:'Inter',sans-serif;
    ${p=>p.variant==='danger'?`background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.35);color:#ef4444;&:hover{background:rgba(239,68,68,0.16);}`
    :p.variant==='warn'?`background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.35);color:#f59e0b;&:hover{background:rgba(245,158,11,0.16);}`
    :`background:rgba(8,205,0,0.06);border-color:rgba(8,205,0,0.3);color:#4ade80;&:hover{background:rgba(8,205,0,0.12);}`}
`;

const InvGrid = styled.div`display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin-bottom:6px;`;
const InvSlot = styled.div<{ filled?:boolean }>`
    aspect-ratio:1;border-radius:4px;
    background:${p=>p.filled?'#1a1a1a':'#111'};
    border:2px solid ${p=>p.filled?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.06)'};
    display:flex;align-items:center;justify-content:center;
    position:relative;overflow:hidden;
    &:hover{border-color:rgba(8,205,0,0.4);}
    transition:border-color .1s;
`;
const InvQty = styled.div`
    position:absolute;bottom:1px;right:2px;
    font-size:.5rem;color:#fff;font-weight:700;
    text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;
    font-family:monospace;
`;

const Empty = styled.div`text-align:center;padding:60px;color:#374151;font-size:.875rem;`;
const OnlineDot = styled.span`display:inline-block;width:7px;height:7px;border-radius:50%;background:#08cd00;box-shadow:0 0 6px #08cd00;margin-right:5px;`;

const ConnStatus = styled.div<{ ok:boolean }>`
    display:inline-flex;align-items:center;gap:6px;
    font-size:.72rem;font-weight:600;padding:4px 10px;border-radius:6px;
    border:2px solid ${p=>p.ok?'rgba(8,205,0,0.4)':'rgba(239,68,68,0.4)'};
    background:${p=>p.ok?'rgba(8,205,0,0.08)':'rgba(239,68,68,0.08)'};
    color:${p=>p.ok?'#4ade80':'#f87171'};
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

/* ── component ───────────────────────────────────────────────────── */
export default function PlayerManagerContainer() {
    /* Use refs so cmd() never has stale socket values */
    const instanceRef = useRef<any>(null);
    const connectedRef = useRef(false);

    const instance  = ServerContext.useStoreState(s => s.socket.instance);
    const connected = ServerContext.useStoreState(s => s.socket.connected);

    useEffect(() => { instanceRef.current  = instance;  }, [instance]);
    useEffect(() => { connectedRef.current = connected; }, [connected]);

    const [players,  setPlayers]  = useState<Player[]>([]);
    const [loading,  setLoading]  = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
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
        const m = data.match(/There are \d+ of a max of \d+ players online:(.*)/);
        if (m) {
            const raw = m[1].trim();
            const names = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
            setPlayers(prev => {
                const existing = new Map(prev.map(p => [p.name, p]));
                return names.map(name => existing.get(name) ?? { name, online: true });
            });
            setLoading(false);
        }
    });

    const fetchPlayers = useCallback(() => {
        setLoading(true);
        cmd('list');
        setTimeout(() => setLoading(false), 3000);
    }, [cmd]);

    useEffect(() => { fetchPlayers(); }, []);

    const onlineCount = players.filter(p => p.online).length;

    const doKill = (n: string) => cmd(`kill ${n}`);
    const doHeal = (n: string) => cmd(`effect give ${n} minecraft:instant_health 1 255`);
    const doKick = (n: string) => { cmd(`kick ${n} Kicked by admin`); setPlayers(pl => pl.filter(p => p.name !== n)); };
    const doBan  = (n: string) => { cmd(`ban ${n}`); setPlayers(pl => pl.filter(p => p.name !== n)); };
    const doOp   = (n: string) => cmd(`op ${n}`);
    const doGm   = (n: string, gm: string) => {
        cmd(`gamemode ${gm} ${n}`);
        setPlayers(pl => pl.map(p => p.name === n ? { ...p, gamemode: gm } : p));
    };

    return (
        <Page>
            <Header>
                <Title>
                    <OnlineDot/>
                    Player Manager
                    {onlineCount > 0 && <span style={{fontSize:'.75rem',fontWeight:500,color:'#4b5a72'}}>({onlineCount} online)</span>}
                </Title>
                <Toolbar>
                    <ConnStatus ok={connected}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:connected?'#08cd00':'#ef4444',display:'inline-block'}}/>
                        {connected ? 'Connected' : 'Not connected'}
                    </ConnStatus>
                    <Btn onClick={fetchPlayers} disabled={loading || !connected}>
                        <FontAwesomeIcon icon={faSync} spin={loading}/> Refresh
                    </Btn>
                    <Btn variant='warn' onClick={() => cmd('broadcast §cServer restarting soon!')}>
                        <FontAwesomeIcon icon={faExclamationTriangle}/> Broadcast
                    </Btn>
                </Toolbar>
            </Header>

            <StatsRow>
                <StatCard>
                    <StatLabel>Online</StatLabel>
                    <StatValue>{onlineCount}</StatValue>
                </StatCard>
                <StatCard>
                    <StatLabel>Avg Health</StatLabel>
                    <StatValue style={{fontSize:'1.1rem',display:'flex',alignItems:'center',gap:6}}>
                        {players.length > 0
                            ? <><FontAwesomeIcon icon={faHeart} style={{color:'#ef4444',fontSize:'.9rem'}}/>{Math.round(players.reduce((a,p)=>a+(p.health??20),0)/players.length)}</>
                            : '—'}
                    </StatValue>
                </StatCard>
                <StatCard>
                    <StatLabel>Commands</StatLabel>
                    <StatValue>{cmdLog.length}</StatValue>
                </StatCard>
            </StatsRow>

            {players.length === 0 ? (
                <Empty>
                    <FontAwesomeIcon icon={faUser} style={{fontSize:'2rem',display:'block',margin:'0 auto 12px'}}/>
                    {connected
                        ? <>Click <strong>Refresh</strong> — sends <code>list</code> to the server.</>
                        : <>Server is offline or not connected.</>}
                </Empty>
            ) : (
                <PlayerGrid>
                    {players.map(player => {
                        const hpPct = player.health != null && player.maxHealth
                            ? Math.round((player.health/player.maxHealth)*100) : 100;
                        return (
                            <PlayerCard
                                key={player.name}
                                $selected={selected===player.name}
                                onClick={() => setSelected(s => s===player.name ? null : player.name)}
                                initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} layout
                            >
                                <PlayerTop>
                                    <Avatar>
                                        <img
                                            src={`https://mc-heads.net/avatar/${player.name}/46`}
                                            alt={player.name}
                                            style={{width:'100%',height:'100%',objectFit:'cover',imageRendering:'pixelated'}}
                                            onError={e=>{(e.target as HTMLImageElement).src='https://mc-heads.net/avatar/Steve/46';}}
                                        />
                                    </Avatar>
                                    <PlayerInfo>
                                        <PlayerName>{player.name}</PlayerName>
                                        <PlayerMeta>
                                            {player.gamemode && <span><FontAwesomeIcon icon={gmFaIcon[player.gamemode]??faGamepad} style={{marginRight:4}}/>{player.gamemode}</span>}
                                            {player.level   != null && <span><FontAwesomeIcon icon={faStar} style={{marginRight:4,color:'#f59e0b'}}/>Lvl {player.level}</span>}
                                        </PlayerMeta>
                                    </PlayerInfo>
                                </PlayerTop>

                                {player.health != null && (
                                    <HealthBar>
                                        <HealthLabel>
                                            <span>Health</span>
                                            <span><FontAwesomeIcon icon={faHeart} style={{color:'#ef4444',marginRight:4}}/>{player.health}/{player.maxHealth??20}</span>
                                        </HealthLabel>
                                        <HealthTrack><HealthFill pct={hpPct}/></HealthTrack>
                                    </HealthBar>
                                )}

                                <ActionRow>
                                    <ActionBtn onClick={e=>{e.stopPropagation();doHeal(player.name);}}>
                                        <FontAwesomeIcon icon={faHeart}/> Heal
                                    </ActionBtn>
                                    <ActionBtn variant='warn' onClick={e=>{e.stopPropagation();doKick(player.name);}}>
                                        <FontAwesomeIcon icon={faBolt}/> Kick
                                    </ActionBtn>
                                    <ActionBtn variant='danger' onClick={e=>{e.stopPropagation();doKill(player.name);}}>
                                        <FontAwesomeIcon icon={faSkull}/> Kill
                                    </ActionBtn>
                                    <ActionBtn variant='danger' onClick={e=>{e.stopPropagation();doBan(player.name);}}>
                                        <FontAwesomeIcon icon={faBan}/> Ban
                                    </ActionBtn>
                                    <ActionBtn onClick={e=>{e.stopPropagation();doOp(player.name);}}>
                                        <FontAwesomeIcon icon={faShieldAlt}/> OP
                                    </ActionBtn>
                                </ActionRow>

                                <AnimatePresence>
                                    {selected===player.name && (
                                        <motion.div
                                            initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                                            style={{overflow:'hidden'}} onClick={e=>e.stopPropagation()}
                                        >
                                            <div style={{marginTop:14,paddingTop:14,borderTop:'2px solid rgba(8,205,0,0.15)'}}>
                                                <div style={{marginBottom:14}}>
                                                    <div style={{fontSize:'.68rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#4b5a72',marginBottom:6}}>
                                                        <FontAwesomeIcon icon={faGamepad} style={{marginRight:5}}/> Change Gamemode
                                                    </div>
                                                    <Combobox
                                                        options={GAMEMODES}
                                                        value={gmTarget[player.name]??player.gamemode??''}
                                                        onChange={v=>{setGmTarget(g=>({...g,[player.name]:v}));doGm(player.name,v);}}
                                                        placeholder='Select gamemode…'
                                                    />
                                                </div>

                                                <div style={{fontSize:'.68rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#4b5a72',marginBottom:8}}>
                                                    Inventory (simulated)
                                                </div>
                                                <InvGrid>
                                                    {Array.from({length:36}).map((_,i)=>{
                                                        const item: InvItem|null = i < MOCK_INV.length ? MOCK_INV[i] : null;
                                                        const tex = item ? ITEM_TEX[item.n] : null;
                                                        return (
                                                            <InvSlot key={i} filled={!!item} title={item?.n}>
                                                                {item && tex && (
                                                                    <img
                                                                        src={tex}
                                                                        alt={item.n}
                                                                        style={{width:'80%',height:'80%',imageRendering:'pixelated',objectFit:'contain'}}
                                                                        onError={e=>{(e.target as HTMLImageElement).style.display='none';}}
                                                                    />
                                                                )}
                                                                {item && <InvQty>{item.q > 1 ? item.q : ''}</InvQty>}
                                                            </InvSlot>
                                                        );
                                                    })}
                                                </InvGrid>
                                                <div style={{fontSize:'.65rem',color:'#374151',marginTop:4}}>
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
                <div style={{marginTop:20}}>
                    <div style={{fontSize:'.68rem',fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#4b5a72',marginBottom:8}}>Command Log</div>
                    <div style={{background:'#080d08',border:'2px solid rgba(8,205,0,0.18)',borderRadius:8,padding:'10px 14px',maxHeight:150,overflowY:'auto'}}>
                        {cmdLog.map((l,i)=>(
                            <div key={i} style={{fontSize:'.75rem',color:l.ok?'#4ade80':'#f87171',fontFamily:'monospace',marginBottom:2,opacity:Math.max(0.3,1-i*0.04)}}>{l.text}</div>
                        ))}
                    </div>
                </div>
            )}
        </Page>
    );
}
