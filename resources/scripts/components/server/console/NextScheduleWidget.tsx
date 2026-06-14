import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import getServerSchedules, { Schedule } from '@/api/server/schedules/getServerSchedules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faPowerOff } from '@fortawesome/free-solid-svg-icons';

const pulse = keyframes`0%,100%{opacity:1;}50%{opacity:0.55;}`;

const Wrap = styled.div`
    background:#0e140e;border:1px solid rgba(8,205,0,0.1);
    border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:14px;
    font-family:'Inter',sans-serif;
`;
const IconBox = styled.div<{ $imminent?: boolean }>`
    width:38px;height:38px;border-radius:9px;flex-shrink:0;
    background:rgba(8,205,0,0.12);color:#08cd00;
    display:flex;align-items:center;justify-content:center;font-size:0.95rem;
    ${p => p.$imminent && `animation:${pulse} 1.5s ease-in-out infinite;`}
`;
const Body = styled.div`flex:1;min-width:0;`;
const Label = styled.div`
    font-size:0.62rem;font-weight:700;color:#4d7a4d;
    letter-spacing:0.08em;text-transform:uppercase;margin-bottom:3px;
    display:flex;align-items:center;gap:6px;
`;
const Title = styled.div`
    font-size:0.88rem;font-weight:600;color:#fff;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
`;
const Countdown = styled.div<{ $imminent?: boolean }>`
    font-size:0.74rem;color:${p => p.$imminent ? '#eab308' : '#94a3b8'};
    font-variant-numeric:tabular-nums;margin-top:2px;
`;
const Empty = styled.div`font-size:0.78rem;color:#64748b;`;

function fmtDelta(ms: number): { text: string; imminent: boolean } {
    if (ms <= 0) return { text: 'running now…', imminent: true };
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const imminent = s < 60;
    if (days > 0) return { text: `in ${days}d ${hours}h ${mins}m`, imminent: false };
    if (hours > 0) return { text: `in ${hours}h ${mins}m`, imminent: false };
    if (mins > 0) return { text: `in ${mins}m ${secs}s`, imminent };
    return { text: `in ${secs}s`, imminent: true };
}

export default function NextScheduleWidget() {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const [next, setNext] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        let stopped = false;
        const load = () => {
            getServerSchedules(uuid).then(list => {
                if (stopped) return;
                const upcoming = list
                    .filter(s => s.isActive && s.nextRunAt)
                    .sort((a, b) => (a.nextRunAt!.getTime() - b.nextRunAt!.getTime()))[0];
                setNext(upcoming || null);
            }).catch(() => setNext(null))
              .finally(() => { if (!stopped) setLoading(false); });
        };
        load();
        const reload = setInterval(load, 60_000);
        return () => { stopped = true; clearInterval(reload); };
    }, [uuid]);

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    if (loading) {
        return (
            <Wrap>
                <IconBox><FontAwesomeIcon icon={faCalendarAlt}/></IconBox>
                <Body><Label><FontAwesomeIcon icon={faClock}/> Next scheduled task</Label><Empty>Checking schedules…</Empty></Body>
            </Wrap>
        );
    }

    if (!next || !next.nextRunAt) {
        return (
            <Wrap>
                <IconBox><FontAwesomeIcon icon={faPowerOff}/></IconBox>
                <Body><Label><FontAwesomeIcon icon={faClock}/> Next scheduled task</Label><Empty>No active schedules.</Empty></Body>
            </Wrap>
        );
    }

    const { text, imminent } = fmtDelta(next.nextRunAt.getTime() - now);

    return (
        <Wrap>
            <IconBox $imminent={imminent}><FontAwesomeIcon icon={faCalendarAlt}/></IconBox>
            <Body>
                <Label><FontAwesomeIcon icon={faClock}/> Next scheduled task</Label>
                <Title>{next.name}</Title>
                <Countdown $imminent={imminent}>
                    {text} · {next.nextRunAt.toLocaleString()}
                </Countdown>
            </Body>
        </Wrap>
    );
}
