import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay, faPlus, faTrash, faPen, faCheck, faTimes, faTerminal,
    faClone, faSave, faCircleNotch, faGripVertical, faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

/* ── design tokens ───────────────────────────────────────────────── */
const T = {
    bg: '#0b0f14',
    panel: '#121821',
    panel2: '#171f2a',
    line: 'rgba(255,255,255,0.06)',
    lineH: 'rgba(255,255,255,0.12)',
    text: '#e5e7eb',
    dim: '#8b95a7',
    mute: '#4b5563',
    accent: '#08cd00',
    accentDim: 'rgba(8,205,0,0.12)',
    danger: '#ef4444',
    warn: '#f59e0b',
};

/* ── types ───────────────────────────────────────────────────────── */
interface Variable { key: string; label: string; default?: string; }
interface Macro {
    id: string;
    name: string;
    description: string;
    icon: 'play' | 'bolt' | 'terminal';
    color: 'green' | 'amber' | 'red' | 'blue';
    commands: string[];
    delayMs: number;
    variables: Variable[];
}

const STORAGE_KEY = 'wisk.console-macros.v1';

const DEFAULT_MACROS: Macro[] = [
    {
        id: 'start-event',
        name: 'Start Event',
        description: 'Announce an event and warp everyone in',
        icon: 'bolt',
        color: 'green',
        commands: [
            'broadcast §a§l[EVENT] §r§f{event_name} §7starting in 30s — warp now!',
            'title @a title {"text":"{event_name}","color":"green","bold":true}',
            'title @a subtitle {"text":"Starting in 30s","color":"gray"}',
        ],
        delayMs: 250,
        variables: [{ key: 'event_name', label: 'Event Name', default: 'Sumo Showdown' }],
    },
    {
        id: 'reset-arena',
        name: 'Reset Arena',
        description: 'Clear, regen and notify spectators',
        icon: 'play',
        color: 'amber',
        commands: [
            'duel admin reset {arena_id}',
            'broadcast §6Arena §f{arena_id} §6has been reset.',
        ],
        delayMs: 500,
        variables: [{ key: 'arena_id', label: 'Arena ID', default: 'sumo-1' }],
    },
    {
        id: 'broadcast-restart',
        name: 'Broadcast Restart',
        description: 'Warn players, then trigger a restart',
        icon: 'terminal',
        color: 'red',
        commands: [
            'broadcast §c§lRESTART §r§7in §f{minutes}m §7— please log out safely.',
            'title @a actionbar {"text":"Restart in {minutes}m","color":"red"}',
        ],
        delayMs: 250,
        variables: [{ key: 'minutes', label: 'Minutes until restart', default: '5' }],
    },
];

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
const Title = styled.h2`font-size:1.05rem;font-weight:700;color:${T.text};margin:0;letter-spacing:-.01em;`;
const Subtitle = styled.p`margin:0;font-size:.78rem;color:${T.dim};`;

const Btn = styled.button<{ kind?: 'primary'|'ghost'|'danger' }>`
    display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:8px;
    font-size:.8rem;font-weight:600;cursor:pointer;border:1px solid transparent;
    transition:background .12s, border-color .12s, color .12s;
    font-family:'Inter',sans-serif;line-height:1;
    ${p=>p.kind==='primary'?`background:${T.accent};color:#06200a;&:hover{background:#0ee300;}`
        :p.kind==='danger'?`background:rgba(239,68,68,0.08);color:${T.danger};border-color:rgba(239,68,68,0.3);&:hover{background:rgba(239,68,68,0.16);}`
        :`background:transparent;color:${T.dim};border-color:${T.lineH};&:hover{color:${T.text};border-color:rgba(255,255,255,0.22);}`}
    &:disabled{opacity:.4;cursor:default;}
`;

const Grid = styled.div`display:grid;grid-template-columns:340px 1fr;gap:18px;align-items:start;
    @media (max-width:1100px){grid-template-columns:1fr;}
`;

const List = styled.div`background:${T.panel};border:1px solid ${T.line};border-radius:12px;overflow:hidden;`;
const ListHead = styled.div`
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 16px;border-bottom:1px solid ${T.line};
    font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${T.dim};
`;

const Row = styled.button<{ $active?: boolean; $color: string }>`
    width:100%;text-align:left;display:flex;align-items:center;gap:12px;
    padding:12px 16px;border:0;background:transparent;cursor:pointer;
    border-left:3px solid ${p=>p.$active?p.$color:'transparent'};
    color:${T.text};font-family:'Inter',sans-serif;
    transition:background .1s;
    &:hover{background:rgba(255,255,255,0.025);}
    ${p=>p.$active&&`background:rgba(255,255,255,0.03);`}
    & + & {border-top:1px solid ${T.line};}
`;
const RowIcon = styled.div<{ $color: string }>`
    width:32px;height:32px;border-radius:8px;
    background:${p=>p.$color}1a;color:${p=>p.$color};
    display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;
`;
const RowText = styled.div`flex:1;min-width:0;`;
const RowName = styled.div`font-size:.85rem;font-weight:600;color:${T.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const RowDesc = styled.div`font-size:.72rem;color:${T.dim};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;`;
const RowCount = styled.div`font-size:.7rem;color:${T.mute};font-variant-numeric:tabular-nums;flex-shrink:0;`;

const Editor = styled.div`background:${T.panel};border:1px solid ${T.line};border-radius:12px;overflow:hidden;`;
const EditorHead = styled.div`
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:16px 18px;border-bottom:1px solid ${T.line};flex-wrap:wrap;
`;
const EditorTitle = styled.div`display:flex;align-items:center;gap:10px;`;
const EditorName = styled.input`
    background:transparent;border:0;color:${T.text};font-size:1rem;font-weight:700;
    padding:4px 6px;border-radius:6px;outline:none;min-width:200px;
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

const CommandList = styled.div`display:flex;flex-direction:column;gap:6px;`;
const CommandRow = styled.div`display:flex;align-items:stretch;gap:6px;`;
const CmdHandle = styled.div`
    width:28px;display:flex;align-items:center;justify-content:center;
    color:${T.mute};font-size:.7rem;background:${T.panel2};border:1px solid ${T.line};
    border-right:0;border-radius:8px 0 0 8px;
`;
const CmdInput = styled.input`
    flex:1;background:${T.panel2};border:1px solid ${T.line};border-radius:0;
    padding:9px 12px;font-size:.78rem;color:${T.text};font-family:'JetBrains Mono','Menlo',monospace;outline:none;
    transition:border-color .12s;
    &:focus{border-color:${T.lineH};}
    &::placeholder{color:${T.mute};}
`;
const CmdDelBtn = styled.button`
    width:32px;background:${T.panel2};border:1px solid ${T.line};border-left:0;border-radius:0 8px 8px 0;
    color:${T.mute};cursor:pointer;font-size:.75rem;
    &:hover{color:${T.danger};background:rgba(239,68,68,0.06);}
`;

const VarRow = styled.div`display:grid;grid-template-columns:1fr 1.5fr 1fr 28px;gap:6px;`;
const SmallInput = styled(TextInput)`padding:8px 10px;font-size:.76rem;`;
const VarDelBtn = styled.button`
    background:${T.panel2};border:1px solid ${T.line};border-radius:8px;
    color:${T.mute};cursor:pointer;font-size:.7rem;
    &:hover{color:${T.danger};background:rgba(239,68,68,0.06);}
`;

const Runner = styled.div`
    background:${T.panel2};border:1px solid ${T.line};border-radius:10px;padding:14px;
    display:flex;flex-direction:column;gap:10px;
`;
const RunnerTitle = styled.div`font-size:.72rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${T.dim};display:flex;align-items:center;gap:6px;`;
const RunnerVars = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;`;
const VarField = styled.div`display:flex;flex-direction:column;gap:4px;`;
const VarLabel = styled.label`font-size:.7rem;color:${T.dim};font-weight:600;`;

const LogBox = styled.div`
    background:#070b10;border:1px solid ${T.line};border-radius:8px;padding:10px 12px;
    max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;
    font-family:'JetBrains Mono','Menlo',monospace;font-size:.72rem;
`;
const LogLine = styled.div<{ kind?: 'ok'|'err'|'sent' }>`
    color:${p=>p.kind==='err'?'#fca5a5':p.kind==='sent'?'#a3e635':T.dim};
    white-space:pre-wrap;word-break:break-all;
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

/* ── helpers ─────────────────────────────────────────────────────── */
const COLOR_HEX: Record<Macro['color'], string> = { green:'#08cd00', amber:'#f59e0b', red:'#ef4444', blue:'#3b82f6' };
const ICON_MAP = { play:faPlay, bolt:faBolt, terminal:faTerminal };

function uid() { return Math.random().toString(36).slice(2, 10); }
function loadMacros(): Macro[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_MACROS;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : DEFAULT_MACROS;
    } catch { return DEFAULT_MACROS; }
}
function saveMacros(m: Macro[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch {} }
function applyVars(cmd: string, vars: Record<string,string>): string {
    return cmd.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

/* ── component ───────────────────────────────────────────────────── */
export default function ConsoleMacrosContainer() {
    const instance  = ServerContext.useStoreState(s => s.socket.instance);
    const connected = ServerContext.useStoreState(s => s.socket.connected);
    const instanceRef = useRef<any>(null);
    useEffect(() => { instanceRef.current = instance; }, [instance]);

    const [macros, setMacros] = useState<Macro[]>(loadMacros);
    const [selectedId, setSelectedId] = useState<string | null>(macros[0]?.id ?? null);
    const [varValues, setVarValues] = useState<Record<string,string>>({});
    const [logs, setLogs] = useState<{ kind:'ok'|'err'|'sent'; text:string; t:string }[]>([]);
    const [running, setRunning] = useState(false);

    useEffect(() => { saveMacros(macros); }, [macros]);
    const selected = useMemo(() => macros.find(m => m.id === selectedId) ?? null, [macros, selectedId]);

    useEffect(() => {
        if (!selected) { setVarValues({}); return; }
        const v: Record<string,string> = {};
        selected.variables.forEach(va => { v[va.key] = va.default ?? ''; });
        setVarValues(v);
    }, [selectedId]); // intentionally not depending on full selected obj

    const log = useCallback((kind: 'ok'|'err'|'sent', text: string) => {
        setLogs(l => [{ kind, text, t: new Date().toLocaleTimeString() }, ...l].slice(0, 50));
    }, []);

    const update = (patch: Partial<Macro>) => {
        if (!selected) return;
        setMacros(m => m.map(x => x.id === selected.id ? { ...x, ...patch } : x));
    };

    const addMacro = () => {
        const m: Macro = {
            id: uid(), name: 'New Macro', description: '', icon: 'terminal', color: 'green',
            commands: ['say Hello {name}'], delayMs: 250,
            variables: [{ key: 'name', label: 'Name', default: 'world' }],
        };
        setMacros(prev => [m, ...prev]);
        setSelectedId(m.id);
    };
    const cloneMacro = () => {
        if (!selected) return;
        const m: Macro = { ...selected, id: uid(), name: `${selected.name} (copy)` };
        setMacros(prev => [m, ...prev]);
        setSelectedId(m.id);
    };
    const deleteMacro = () => {
        if (!selected) return;
        if (!confirm(`Delete macro "${selected.name}"?`)) return;
        setMacros(prev => prev.filter(x => x.id !== selected.id));
        setSelectedId(macros.find(x => x.id !== selected.id)?.id ?? null);
    };

    const run = useCallback(async () => {
        if (!selected || !instanceRef.current || !connected) {
            log('err', 'Not connected — make sure the server is running.');
            return;
        }
        setRunning(true);
        try {
            for (const raw of selected.commands) {
                const cmd = applyVars(raw, varValues).trim();
                if (!cmd) continue;
                instanceRef.current.send('send command', cmd);
                log('sent', `→ ${cmd}`);
                if (selected.delayMs > 0) await new Promise(r => setTimeout(r, selected.delayMs));
            }
            log('ok', `✓ Ran "${selected.name}" (${selected.commands.length} cmd${selected.commands.length===1?'':'s'})`);
        } finally {
            setRunning(false);
        }
    }, [selected, varValues, connected, log]);

    return (
        <Page>
            <Header>
                <TitleBlock>
                    <TitleIcon><FontAwesomeIcon icon={faTerminal}/></TitleIcon>
                    <TitleText>
                        <Title>Console Macros</Title>
                        <Subtitle>Run saved command groups with variables. Stored per browser.</Subtitle>
                    </TitleText>
                </TitleBlock>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <ConnDot ok={connected}><span className='dot'/>{connected ? 'Connected' : 'Disconnected'}</ConnDot>
                    <Btn onClick={addMacro}><FontAwesomeIcon icon={faPlus}/> New Macro</Btn>
                </div>
            </Header>

            <Grid>
                <List>
                    <ListHead>
                        <span>Saved Macros</span>
                        <span style={{color:T.mute,fontWeight:600}}>{macros.length}</span>
                    </ListHead>
                    {macros.length === 0 ? (
                        <Empty>
                            <FontAwesomeIcon icon={faTerminal} style={{fontSize:'1.5rem'}}/>
                            No macros yet
                        </Empty>
                    ) : macros.map(m => (
                        <Row key={m.id} $active={m.id===selectedId} $color={COLOR_HEX[m.color]} onClick={()=>setSelectedId(m.id)}>
                            <RowIcon $color={COLOR_HEX[m.color]}><FontAwesomeIcon icon={ICON_MAP[m.icon]}/></RowIcon>
                            <RowText>
                                <RowName>{m.name}</RowName>
                                <RowDesc>{m.description || `${m.commands.length} command${m.commands.length===1?'':'s'}`}</RowDesc>
                            </RowText>
                            <RowCount>{m.commands.length}</RowCount>
                        </Row>
                    ))}
                </List>

                {selected ? (
                    <Editor>
                        <EditorHead>
                            <EditorTitle>
                                <TitleIcon style={{background:`${COLOR_HEX[selected.color]}1a`,color:COLOR_HEX[selected.color]}}>
                                    <FontAwesomeIcon icon={ICON_MAP[selected.icon]}/>
                                </TitleIcon>
                                <EditorName value={selected.name} onChange={e=>update({name:e.target.value})}/>
                            </EditorTitle>
                            <div style={{display:'flex',gap:6}}>
                                <Btn onClick={cloneMacro}><FontAwesomeIcon icon={faClone}/> Clone</Btn>
                                <Btn kind='danger' onClick={deleteMacro}><FontAwesomeIcon icon={faTrash}/> Delete</Btn>
                            </div>
                        </EditorHead>
                        <EditorBody>
                            <Section>
                                <SectionLabel>Description</SectionLabel>
                                <TextInput value={selected.description} placeholder='What this macro does'
                                    onChange={e=>update({description:e.target.value})}/>
                            </Section>

                            <Section>
                                <SectionLabel>
                                    Commands <SectionHelp>— one per line, run top→bottom. Use {'{name}'} for variables.</SectionHelp>
                                </SectionLabel>
                                <CommandList>
                                    {selected.commands.map((c, i) => (
                                        <CommandRow key={i}>
                                            <CmdHandle><FontAwesomeIcon icon={faGripVertical}/></CmdHandle>
                                            <CmdInput value={c} placeholder='say hello' onChange={e=>{
                                                const next=[...selected.commands]; next[i]=e.target.value; update({commands:next});
                                            }}/>
                                            <CmdDelBtn onClick={()=>{
                                                const next=selected.commands.filter((_,idx)=>idx!==i); update({commands:next});
                                            }}><FontAwesomeIcon icon={faTimes}/></CmdDelBtn>
                                        </CommandRow>
                                    ))}
                                </CommandList>
                                <Btn onClick={()=>update({commands:[...selected.commands,'']})} style={{alignSelf:'flex-start'}}>
                                    <FontAwesomeIcon icon={faPlus}/> Add Command
                                </Btn>
                            </Section>

                            <Section>
                                <SectionLabel>
                                    Variables <SectionHelp>— referenced as {'{key}'} in commands</SectionHelp>
                                </SectionLabel>
                                {selected.variables.length > 0 && (
                                    <div style={{display:'grid',gridTemplateColumns:'1fr',gap:6}}>
                                        <VarRow style={{fontSize:'.66rem',color:T.mute,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase'}}>
                                            <div style={{padding:'0 4px'}}>Key</div>
                                            <div style={{padding:'0 4px'}}>Label</div>
                                            <div style={{padding:'0 4px'}}>Default</div>
                                            <div/>
                                        </VarRow>
                                        {selected.variables.map((v, i) => (
                                            <VarRow key={i}>
                                                <SmallInput value={v.key} onChange={e=>{
                                                    const next=[...selected.variables]; next[i]={...v,key:e.target.value.replace(/[^a-z0-9_]/gi,'')};
                                                    update({variables:next});
                                                }}/>
                                                <SmallInput value={v.label} placeholder='Display label' onChange={e=>{
                                                    const next=[...selected.variables]; next[i]={...v,label:e.target.value};
                                                    update({variables:next});
                                                }}/>
                                                <SmallInput value={v.default ?? ''} placeholder='Default value' onChange={e=>{
                                                    const next=[...selected.variables]; next[i]={...v,default:e.target.value};
                                                    update({variables:next});
                                                }}/>
                                                <VarDelBtn onClick={()=>{
                                                    const next=selected.variables.filter((_,idx)=>idx!==i); update({variables:next});
                                                }}><FontAwesomeIcon icon={faTimes}/></VarDelBtn>
                                            </VarRow>
                                        ))}
                                    </div>
                                )}
                                <Btn onClick={()=>update({variables:[...selected.variables,{key:`var${selected.variables.length+1}`,label:'',default:''}]})}
                                    style={{alignSelf:'flex-start'}}>
                                    <FontAwesomeIcon icon={faPlus}/> Add Variable
                                </Btn>
                            </Section>

                            <Section>
                                <SectionLabel>Delay Between Commands</SectionLabel>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                    <SmallInput type='number' min={0} max={5000} step={50} value={selected.delayMs}
                                        onChange={e=>update({delayMs:Math.max(0,Number(e.target.value)||0)})}
                                        style={{width:120}}/>
                                    <span style={{fontSize:'.75rem',color:T.dim}}>ms</span>
                                </div>
                            </Section>

                            <Runner>
                                <RunnerTitle><FontAwesomeIcon icon={faPlay}/> Run</RunnerTitle>
                                {selected.variables.length > 0 && (
                                    <RunnerVars>
                                        {selected.variables.map(v => (
                                            <VarField key={v.key}>
                                                <VarLabel>{v.label || v.key}</VarLabel>
                                                <SmallInput value={varValues[v.key] ?? ''} placeholder={v.default}
                                                    onChange={e=>setVarValues(s=>({...s,[v.key]:e.target.value}))}/>
                                            </VarField>
                                        ))}
                                    </RunnerVars>
                                )}
                                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                    <Btn kind='primary' onClick={run} disabled={!connected || running}>
                                        {running ? <><FontAwesomeIcon icon={faCircleNotch} spin/> Running…</>
                                                : <><FontAwesomeIcon icon={faPlay}/> Run Macro</>}
                                    </Btn>
                                    <span style={{fontSize:'.72rem',color:T.mute}}>
                                        {selected.commands.length} command{selected.commands.length===1?'':'s'} · {selected.delayMs}ms gap
                                    </span>
                                </div>
                                {logs.length > 0 && (
                                    <LogBox>
                                        {logs.map((l, i) => (
                                            <LogLine key={i} kind={l.kind}>[{l.t}] {l.text}</LogLine>
                                        ))}
                                    </LogBox>
                                )}
                            </Runner>
                        </EditorBody>
                    </Editor>
                ) : (
                    <Editor>
                        <Empty>
                            <FontAwesomeIcon icon={faTerminal} style={{fontSize:'2rem'}}/>
                            Select a macro to edit, or create a new one.
                            <Btn kind='primary' onClick={addMacro}><FontAwesomeIcon icon={faPlus}/> New Macro</Btn>
                        </Empty>
                    </Editor>
                )}
            </Grid>
        </Page>
    );
}
