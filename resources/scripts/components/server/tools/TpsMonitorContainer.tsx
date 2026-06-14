import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTachometerAlt, faMemory, faMicrochip, faCubes,
    faGhost, faPlay, faPause, faSync,
} from '@fortawesome/free-solid-svg-icons';

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`;

const Page = styled.div`
    padding:28px; max-width:980px; color:#e8f5e8;
    font-family:'Inter',sans-serif;
    animation:${fadeUp} 0.4s cubic-bezier(0.22,1,0.36,1) both;
`;
const Heading = styled.h2`font-size:1.05rem;font-weight:700;color:#fff;margin:0 0 4px;letter-spacing:-0.025em;`;
const Sub = styled.p`font-size:0.775rem;color:#94a3b8;margin:0 0 22px;`;
const Bar = styled.div`display:flex;align-items:center;gap:10px;margin-bottom:18px;`;
const Btn = styled.button<{ $active?: boolean }>`
    display:flex;align-items:center;gap:7px;padding:8px 14px;
    background:${p => p.$active ? '#08cd00' : '#0e140e'};
    border:1px solid ${p => p.$active ? '#08cd00' : 'rgba(8,205,0,0.14)'};
    color:${p => p.$active ? '#0a0f0a' : '#e8f5e8'};
    border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;
    font-family:'Inter',sans-serif;transition:all 0.15s;
    &:hover{border-color:rgba(8,205,0,0.35);}
`;
const Grid = styled.div`
    display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
    gap:12px;margin-bottom:14px;
`;
const Stat = styled.div<{ $tone?: string }>`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);
    border-radius:12px;padding:16px 18px;position:relative;overflow:hidden;
    &::before{
        content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
        background:${p => p.$tone || '#08cd00'};
    }
`;
const StatLabel = styled.div`
    font-size:0.65rem;font-weight:700;color:#4d7a4d;
    letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;
    display:flex;align-items:center;gap:6px;
`;
const StatVal = styled.div`font-size:1.6rem;font-weight:700;color:#fff;line-height:1.1;font-variant-numeric:tabular-nums;`;
const StatUnit = styled.span`font-size:0.78rem;color:#64748b;margin-left:4px;font-weight:500;`;
const Card = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);
    border-radius:12px;padding:18px;margin-bottom:12px;
`;
const CardTitle = styled.div`
    font-size:0.72rem;font-weight:700;color:#4d7a4d;
    letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px;
`;
const Graph = styled.div`
    position:relative;height:120px;background:#0a0f0a;
    border-radius:8px;overflow:hidden;border:1px solid rgba(8,205,0,0.06);
`;
const GridLines = styled.div`
    position:absolute;inset:0;background-image:
        linear-gradient(rgba(8,205,0,0.05) 1px,transparent 1px);
    background-size:100% 25%;
`;
const Offline = styled.div`
    text-align:center;padding:24px;color:#3d5c3d;font-size:0.82rem;
    background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.12);
    border-radius:10px;margin-bottom:16px;
`;

const MAX_SAMPLES = 60;

function tpsTone(tps: number): string {
    if (tps >= 19.5) return '#08cd00';
    if (tps >= 17) return '#eab308';
    return '#ef4444';
}

function Sparkline({ data, max, color }: { data: number[]; max: number; color: string }) {
    if (data.length < 2) return null;
    const w = 100; const h = 100;
    const step = w / (MAX_SAMPLES - 1);
    const points = data.map((v, i) => `${(i + (MAX_SAMPLES - data.length)) * step},${h - (Math.min(v, max) / max) * h}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio='none' style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <polyline points={points} fill='none' stroke={color} strokeWidth={1.3} vectorEffect='non-scaling-stroke'/>
            <polyline
                points={`${points} ${w},${h} 0,${h}`}
                fill={color}
                opacity={0.12}
                vectorEffect='non-scaling-stroke'
            />
        </svg>
    );
}

export default function TpsMonitorContainer() {
    const instance = ServerContext.useStoreState(s => s.socket.instance);
    const connected = ServerContext.useStoreState(s => s.socket.connected);
    const status = ServerContext.useStoreState(s => s.status.value);
    const instanceRef = useRef<any>(null);
    useEffect(() => { instanceRef.current = instance; }, [instance]);

    const [tps, setTps] = useState(20);
    const [mspt, setMspt] = useState(0);
    const [chunks, setChunks] = useState(0);
    const [entities, setEntities] = useState(0);
    const [cpu, setCpu] = useState(0);
    const [mem, setMem] = useState(0);
    const [tpsHistory, setTpsHistory] = useState<number[]>([]);
    const [msptHistory, setMsptHistory] = useState<number[]>([]);
    const [running, setRunning] = useState(true);

    const sample = useCallback(() => {
        if (!instanceRef.current || !connected || status !== 'running') return;
        instanceRef.current.send('send command', 'tps');
        instanceRef.current.send('send command', 'forge tps');
        instanceRef.current.send('send command', 'mspt');
    }, [connected, status]);

    useEffect(() => {
        if (!running) return;
        sample();
        const id = setInterval(sample, 5000);
        return () => clearInterval(id);
    }, [running, sample]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        try {
            const v = JSON.parse(data);
            setCpu(Math.round(v.cpu_absolute || 0));
            setMem(Math.round((v.memory_bytes || 0) / 1024 / 1024));
        } catch { /* ignore */ }
    });

    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (line: string) => {
        const tpsMatch = line.match(/TPS from last \d+s.*?:\s*\D*([\d.]+),\s*([\d.]+),\s*([\d.]+)/i)
            || line.match(/§a([\d.]+)§?\s*,\s*§?[a-z]?([\d.]+)§?\s*,\s*§?[a-z]?([\d.]+)/i);
        if (tpsMatch) {
            const v = Math.min(20, parseFloat(tpsMatch[1]));
            setTps(v);
            setTpsHistory(h => [...h.slice(-(MAX_SAMPLES - 1)), v]);
        }

        const msptMatch = line.match(/MSPT[^\d]*([\d.]+)/i)
            || line.match(/average tick time:\s*([\d.]+)/i);
        if (msptMatch) {
            const v = parseFloat(msptMatch[1]);
            setMspt(v);
            setMsptHistory(h => [...h.slice(-(MAX_SAMPLES - 1)), v]);
        }

        const chunkMatch = line.match(/(\d+)\s+(?:loaded\s+)?chunks?/i);
        if (chunkMatch) setChunks(parseInt(chunkMatch[1], 10));

        const entMatch = line.match(/(\d+)\s+entit(?:y|ies)/i);
        if (entMatch) setEntities(parseInt(entMatch[1], 10));
    });

    return (
        <Page>
            <Heading>Performance Monitor</Heading>
            <Sub>Live TPS, MSPT, chunk and entity counts polled via the server console every 5 seconds.</Sub>

            <Bar>
                <Btn $active={running} onClick={() => setRunning(r => !r)}>
                    <FontAwesomeIcon icon={running ? faPause : faPlay}/>
                    {running ? 'Polling' : 'Paused'}
                </Btn>
                <Btn onClick={sample}><FontAwesomeIcon icon={faSync}/> Refresh now</Btn>
            </Bar>

            {status !== 'running' && (
                <Offline>Server is not running — stats are unavailable. Start the server to begin sampling.</Offline>
            )}

            <Grid>
                <Stat $tone={tpsTone(tps)}>
                    <StatLabel><FontAwesomeIcon icon={faTachometerAlt}/> TPS</StatLabel>
                    <StatVal>{tps.toFixed(2)}<StatUnit>/ 20</StatUnit></StatVal>
                </Stat>
                <Stat $tone='#eab308'>
                    <StatLabel><FontAwesomeIcon icon={faMicrochip}/> MSPT</StatLabel>
                    <StatVal>{mspt.toFixed(1)}<StatUnit>ms</StatUnit></StatVal>
                </Stat>
                <Stat $tone='#a855f7'>
                    <StatLabel><FontAwesomeIcon icon={faCubes}/> Chunks</StatLabel>
                    <StatVal>{chunks.toLocaleString()}</StatVal>
                </Stat>
                <Stat $tone='#06b6d4'>
                    <StatLabel><FontAwesomeIcon icon={faGhost}/> Entities</StatLabel>
                    <StatVal>{entities.toLocaleString()}</StatVal>
                </Stat>
                <Stat $tone='#f59e0b'>
                    <StatLabel><FontAwesomeIcon icon={faMicrochip}/> CPU</StatLabel>
                    <StatVal>{cpu}<StatUnit>%</StatUnit></StatVal>
                </Stat>
                <Stat $tone='#3b82f6'>
                    <StatLabel><FontAwesomeIcon icon={faMemory}/> Memory</StatLabel>
                    <StatVal>{mem.toLocaleString()}<StatUnit>MiB</StatUnit></StatVal>
                </Stat>
            </Grid>

            <Card>
                <CardTitle>TPS — last {Math.min(tpsHistory.length, MAX_SAMPLES)} samples</CardTitle>
                <Graph>
                    <GridLines/>
                    <Sparkline data={tpsHistory} max={20} color={tpsTone(tps)}/>
                </Graph>
            </Card>

            <Card>
                <CardTitle>MSPT — last {Math.min(msptHistory.length, MAX_SAMPLES)} samples</CardTitle>
                <Graph>
                    <GridLines/>
                    <Sparkline data={msptHistory} max={Math.max(50, ...msptHistory)} color='#eab308'/>
                </Graph>
            </Card>
        </Page>
    );
}
