import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { Combobox } from '@/components/elements/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faUser, faHeart, faSkull, faBan, faShieldAlt, faGamepad, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';

/* ── types ───────────────────────────────────────────────────────── */
interface Player {
    name: string;
    health?: number;
    maxHealth?: number;
    gamemode?: string;
    level?: number;
    online: boolean;
}

/* ── styled ──────────────────────────────────────────────────────── */
const Page = styled.div`padding: 24px; color: #fff; font-family: 'Inter', sans-serif;`;

const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
`;

const Title = styled.h2`font-size: 1rem; font-weight: 700; color: #f1f5f9; margin: 0; display:flex;align-items:center;gap:8px;`;

const Toolbar = styled.div`display:flex;align-items:center;gap:8px;flex-wrap:wrap;`;

const Btn = styled.button<{ variant?: 'primary'|'danger'|'ghost'|'warn' }>`
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px;
    font-size: .8rem; font-weight: 500; cursor: pointer;
    border: 1px solid transparent; transition: all .15s;
    white-space: nowrap; font-family: 'Inter', sans-serif;

    ${p => p.variant === 'primary' ? `
        background:#08cd00;border-color:#08cd00;color:#050d05;&:hover{background:#07b300;}
    ` : p.variant === 'danger' ? `
        background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25);color:#ef4444;&:hover{background:rgba(239,68,68,0.18);}
    ` : p.variant === 'warn' ? `
        background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.25);color:#f59e0b;&:hover{background:rgba(245,158,11,0.18);}
    ` : `
        background:#0e140e;border-color:rgba(8,205,0,0.18);color:#94a3b8;&:hover{border-color:rgba(8,205,0,0.35);color:#fff;}
    `}
    &:disabled{opacity:.4;cursor:default;}
`;

const StatsRow = styled.div`
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap:10px; margin-bottom:20px;
`;

const StatCard = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);border-radius:10px;padding:14px 16px;
`;

const StatLabel = styled.div`font-size:.68rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#4b5a72;margin-bottom:4px;`;
const StatValue = styled.div`font-size:1.4rem;font-weight:700;color:#08cd00;font-variant-numeric:tabular-nums;`;

const PlayerGrid = styled.div`
    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap:12px;
`;

const PlayerCard = styled(motion.div)<{ selected?: boolean }>`
    background: #0e140e;
    border: 1px solid ${p => p.selected ? 'rgba(8,205,0,0.45)' : 'rgba(8,205,0,0.1)'};
    border-radius: 12px; padding: 16px;
    cursor: pointer; transition: border-color .15s;
    &:hover { border-color: rgba(8,205,0,0.3); }
`;

const PlayerTop = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:12px;`;

const Avatar = styled.div`
    width:42px;height:42px;border-radius:8px;
    background:rgba(8,205,0,0.08);border:1px solid rgba(8,205,0,0.18);
    display:flex;align-items:center;justify-content:center;
    font-size:1.2rem;flex-shrink:0;overflow:hidden;
`;

const PlayerInfo = styled.div`flex:1;min-width:0;`;
const PlayerName = styled.div`font-size:.9rem;font-weight:700;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const PlayerMeta = styled.div`font-size:.72rem;color:#4b5a72;margin-top:2px;display:flex;gap:8px;flex-wrap:wrap;`;

const HealthBar = styled.div`margin-bottom:10px;`;
const HealthLabel = styled.div`font-size:.65rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#4b5a72;margin-bottom:4px;display:flex;justify-content:space-between;`;
const HealthTrack = styled.div`height:6px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;`;
const HealthFill = styled.div<{ pct:number }>`
    height:100%;border-radius:999px;
    width:${p=>p.pct}%;
    background:${p=>p.pct>50?'#08cd00':p.pct>25?'#f59e0b':'#ef4444'};
    transition:width .3s ease;
`;

const ActionRow = styled.div`display:flex;flex-wrap:wrap;gap:6px;`;

const ActionBtn = styled.button<{ variant?: 'danger'|'warn'|'ghost' }>`
    display:flex;align-items:center;gap:5px;
    padding:5px 10px;border-radius:6px;
    font-size:.72rem;font-weight:600;cursor:pointer;
    border:1px solid transparent;transition:all .12s;
    font-family:'Inter',sans-serif;

    ${p=>p.variant==='danger'?`
        background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.2);color:#ef4444;&:hover{background:rgba(239,68,68,0.16);}
    `:p.variant==='warn'?`
        background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.2);color:#f59e0b;&:hover{background:rgba(245,158,11,0.16);}
    `:`
        background:rgba(8,205,0,0.06);border-color:rgba(8,205,0,0.15);color:#4ade80;&:hover{background:rgba(8,205,0,0.12);}
    `}
`;

const DetailPanel = styled(motion.div)`
    background:#0e140e;border:1px solid rgba(8,205,0,0.2);border-radius:12px;padding:20px;margin-top:20px;
`;

const DPTitle = styled.div`font-size:.8rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#4b5a72;margin-bottom:14px;`;

const InvGrid = styled.div`display:grid;grid-template-columns:repeat(9,1fr);gap:4px;margin-bottom:10px;`;
const InvSlot = styled.div<{ filled?:boolean }>`
    aspect-ratio:1;border-radius:5px;
    background:${p=>p.filled?'rgba(8,205,0,0.08)':'rgba(255,255,255,0.03)'};
    border:1px solid ${p=>p.filled?'rgba(8,205,0,0.2)':'rgba(255,255,255,0.05)'};
    display:flex;align-items:center;justify-content:center;
    font-size:.6rem;color:#4b5a72;text-align:center;line-height:1.1;padding:2px;
    position:relative;
`;

const InvQty = styled.div`position:absolute;bottom:1px;right:3px;font-size:.55rem;color:#08cd00;font-weight:700;`;

const Empty = styled.div`text-align:center;padding:60px;color:#374151;font-size:.875rem;`;

const OnlineDot = styled.span`
    display:inline-block;width:7px;height:7px;border-radius:50%;
    background:#08cd00;box-shadow:0 0 6px #08cd00;margin-right:5px;
`;

const GAMEMODES = [
    { value: 'survival', label: 'Survival' },
    { value: 'creative', label: 'Creative' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'spectator', label: 'Spectator' },
];

/* ── helpers ─────────────────────────────────────────────────────── */
const gmIcon: Record<string,string> = { survival:'⚔️', creative:'🎨', adventure:'🗺️', spectator:'👁️' };

const parsePlayerList = (output: string): string[] => {
    const match = output.match(/: (.+)$/m);
    if (!match) return [];
    return match[1].split(',').map(s => s.trim()).filter(Boolean);
};

/* ── component ───────────────────────────────────────────────────── */
export default function PlayerManagerContainer() {
    const instance = ServerContext.useStoreState(s => s.socket.instance);
    const connected = ServerContext.useStoreState(s => s.socket.connected);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [cmdLog, setCmdLog] = useState<string[]>([]);
    const [gmTarget, setGmTarget] = useState<Record<string, string>>({});

    const log = (msg: string) => setCmdLog(l => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 19)]);

    const cmd = useCallback((command: string) => {
        if (!instance || !connected) { log('✗ Not connected to server'); return; }
        instance.send('send command', command);
        log(`→ ${command}`);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data: string) => {
        const listMatch = data.match(/There are \d+ of a max of \d+ players online: (.+)/);
        if (listMatch) {
            const names = listMatch[1].split(',').map(s => s.trim()).filter(Boolean);
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

    const addMockPlayers = () => {
        setPlayers([
            { name: 'Steve', health: 18, maxHealth: 20, gamemode: 'survival', level: 12, online: true },
            { name: 'Alex', health: 10, maxHealth: 20, gamemode: 'creative', level: 30, online: true },
            { name: 'Notch', health: 4, maxHealth: 20, gamemode: 'adventure', level: 5, online: true },
        ]);
    };

    const selectedPlayer = players.find(p => p.name === selected);
    const onlineCount = players.filter(p => p.online).length;

    const doKill = (name: string) => { cmd(`kill ${name}`); };
    const doHeal = (name: string) => { cmd(`effect give ${name} minecraft:instant_health 1 10`); };
    const doKick = (name: string) => { cmd(`kick ${name} Kicked by admin`); setPlayers(pl => pl.filter(p => p.name !== name)); };
    const doBan = (name: string) => { cmd(`ban ${name}`); setPlayers(pl => pl.filter(p => p.name !== name)); };
    const doOp = (name: string) => { cmd(`op ${name}`); };
    const doGm = (name: string, gm: string) => {
        cmd(`gamemode ${gm} ${name}`);
        setPlayers(pl => pl.map(p => p.name === name ? { ...p, gamemode: gm } : p));
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
                    <Btn onClick={addMockPlayers} variant='ghost'>
                        <FontAwesomeIcon icon={faUser}/> Load Test Players
                    </Btn>
                    <Btn onClick={fetchPlayers} disabled={loading}>
                        <FontAwesomeIcon icon={faSync} spin={loading}/> Refresh
                    </Btn>
                    <Btn variant='warn' onClick={() => cmd('broadcast §cServer restarting in 5 minutes!')}>
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
                    <StatValue style={{fontSize:'1.1rem'}}>
                        {players.length > 0
                            ? `${Math.round(players.reduce((a,p) => a + (p.health ?? 20), 0) / players.length)} ❤`
                            : '—'}
                    </StatValue>
                </StatCard>
                <StatCard>
                    <StatLabel>Commands Sent</StatLabel>
                    <StatValue>{cmdLog.length}</StatValue>
                </StatCard>
            </StatsRow>

            {players.length === 0 ? (
                <Empty>
                    <FontAwesomeIcon icon={faUser} style={{fontSize:'2rem',marginBottom:12,display:'block',margin:'0 auto 12px'}}/>
                    No players loaded. Click <strong>Refresh</strong> or <strong>Load Test Players</strong>.
                </Empty>
            ) : (
                <PlayerGrid>
                    {players.map(player => {
                        const hpPct = player.health != null && player.maxHealth
                            ? Math.round((player.health / player.maxHealth) * 100)
                            : 100;
                        return (
                            <PlayerCard
                                key={player.name}
                                selected={selected === player.name}
                                onClick={() => setSelected(s => s === player.name ? null : player.name)}
                                initial={{opacity:0,y:10}}
                                animate={{opacity:1,y:0}}
                                layout
                            >
                                <PlayerTop>
                                    <Avatar>
                                        <img
                                            src={`https://mc-heads.net/avatar/${player.name}/40`}
                                            alt={player.name}
                                            style={{width:'100%',height:'100%',objectFit:'cover',imageRendering:'pixelated'}}
                                            onError={e=>{(e.target as HTMLImageElement).style.display='none';}}
                                        />
                                    </Avatar>
                                    <PlayerInfo>
                                        <PlayerName>{player.name}</PlayerName>
                                        <PlayerMeta>
                                            {player.gamemode && <span>{gmIcon[player.gamemode] || '🎮'} {player.gamemode}</span>}
                                            {player.level != null && <span>⭐ Lvl {player.level}</span>}
                                        </PlayerMeta>
                                    </PlayerInfo>
                                </PlayerTop>

                                {player.health != null && (
                                    <HealthBar>
                                        <HealthLabel>
                                            <span>Health</span>
                                            <span>{player.health}/{player.maxHealth ?? 20} ❤</span>
                                        </HealthLabel>
                                        <HealthTrack><HealthFill pct={hpPct}/></HealthTrack>
                                    </HealthBar>
                                )}

                                <ActionRow>
                                    <ActionBtn onClick={e=>{e.stopPropagation();doHeal(player.name);}}>
                                        <FontAwesomeIcon icon={faHeart}/> Heal
                                    </ActionBtn>
                                    <ActionBtn variant='warn' onClick={e=>{e.stopPropagation();doKick(player.name);}}>
                                        Kick
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
                                    {selected === player.name && (
                                        <motion.div
                                            initial={{opacity:0,height:0}}
                                            animate={{opacity:1,height:'auto'}}
                                            exit={{opacity:0,height:0}}
                                            style={{overflow:'hidden'}}
                                            onClick={e=>e.stopPropagation()}
                                        >
                                            <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid rgba(8,205,0,0.1)'}}>
                                                <div style={{marginBottom:10}}>
                                                    <div style={{fontSize:'.68rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#4b5a72',marginBottom:6}}>
                                                        <FontAwesomeIcon icon={faGamepad} style={{marginRight:5}}/> Change Gamemode
                                                    </div>
                                                    <Combobox
                                                        options={GAMEMODES}
                                                        value={gmTarget[player.name] ?? player.gamemode ?? ''}
                                                        onChange={v => {
                                                            setGmTarget(g => ({...g, [player.name]: v}));
                                                            doGm(player.name, v);
                                                        }}
                                                        placeholder='Select gamemode…'
                                                    />
                                                </div>

                                                <div>
                                                    <div style={{fontSize:'.68rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#4b5a72',marginBottom:8}}>
                                                        Inventory (simulated)
                                                    </div>
                                                    <InvGrid>
                                                        {Array.from({length:36}).map((_,i)=>{
                                                            const items = [
                                                                {n:'Diamond Sword',q:1},{n:'Iron Pickaxe',q:1},
                                                                {n:'Bread',q:32},{n:'Oak Log',q:64},
                                                                {n:'Arrow',q:64},{n:'Torch',q:24},
                                                            ];
                                                            const item = i < items.length ? items[i] : null;
                                                            return (
                                                                <InvSlot key={i} filled={!!item} title={item?.n}>
                                                                    {item ? <>
                                                                        <span style={{fontSize:'.58rem',lineHeight:1}}>{item.n.split(' ').map(w=>w[0]).join('')}</span>
                                                                        <InvQty>{item.q}</InvQty>
                                                                    </> : null}
                                                                </InvSlot>
                                                            );
                                                        })}
                                                    </InvGrid>
                                                    <div style={{fontSize:'.68rem',color:'#4b5a72',marginTop:4}}>
                                                        * Live inventory requires a server-side plugin (e.g. WebInventory)
                                                    </div>
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
                    <div style={{background:'#080d08',border:'1px solid rgba(8,205,0,0.1)',borderRadius:8,padding:'10px 14px',maxHeight:140,overflowY:'auto'}}>
                        {cmdLog.map((l,i)=>(
                            <div key={i} style={{fontSize:'.75rem',color:'#4ade80',fontFamily:'monospace',marginBottom:2,opacity:1-i*0.04}}>{l}</div>
                        ))}
                    </div>
                </div>
            )}
        </Page>
    );
}
