import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEthernet,
    faHdd,
    faMemory,
    faMicrochip,
    faServer,
    faPlay,
    faStop,
    faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import styled, { keyframes, css } from 'styled-components/macro';
import Spinner from '@/components/elements/Spinner';
import isEqual from 'react-fast-compare';
import { motion } from 'framer-motion';

const pulseGreen = keyframes`
    0%, 100% { box-shadow: 0 0 6px rgba(34,197,94,0.5); }
    50%       { box-shadow: 0 0 16px rgba(34,197,94,0.9), 0 0 30px rgba(34,197,94,0.3); }
`;
const pulseRed = keyframes`
    0%, 100% { box-shadow: 0 0 6px rgba(239,68,68,0.5); }
    50%       { box-shadow: 0 0 16px rgba(239,68,68,0.9), 0 0 30px rgba(239,68,68,0.2); }
`;
const pulseYellow = keyframes`
    0%, 100% { box-shadow: 0 0 6px rgba(234,179,8,0.5); }
    50%       { box-shadow: 0 0 16px rgba(234,179,8,0.9), 0 0 30px rgba(234,179,8,0.2); }
`;

const isAlarmState = (current: number, limit: number): boolean =>
    limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

/* ── card wrapper ── */
const Card = styled(motion.div)<{ $status: ServerPowerState | undefined }>`
    position: relative;
    background: rgba(13, 21, 48, 0.7);
    border: 1px solid rgba(0, 212, 255, 0.1);
    border-radius: 14px;
    backdrop-filter: blur(10px);
    overflow: hidden;
    text-decoration: none;
    display: grid;
    grid-template-columns: 1fr;
    cursor: pointer;
    transition: border-color 0.25s, box-shadow 0.25s;

    &:hover {
        border-color: rgba(0, 212, 255, 0.28);
        box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.15);
        text-decoration: none;
    }

    /* top accent line */
    &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: ${({ $status }) =>
            !$status || $status === 'offline'
                ? 'linear-gradient(90deg, rgba(239,68,68,0.8), transparent)'
                : $status === 'running'
                ? 'linear-gradient(90deg, rgba(34,197,94,0.8), transparent)'
                : 'linear-gradient(90deg, rgba(234,179,8,0.8), transparent)'};
        opacity: 0.9;
    }
`;

const CardInner = styled.div`
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;

    @media (min-width: 768px) {
        grid-template-columns: minmax(0, 2fr) auto minmax(0, 2fr);
    }
`;

const ServerIconWrap = styled.div<{ $status: ServerPowerState | undefined }>`
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    background: ${({ $status }) =>
        !$status || $status === 'offline'
            ? 'rgba(239,68,68,0.1)'
            : $status === 'running'
            ? 'rgba(34,197,94,0.1)'
            : 'rgba(234,179,8,0.1)'};
    color: ${({ $status }) =>
        !$status || $status === 'offline'
            ? 'rgba(239,68,68,0.8)'
            : $status === 'running'
            ? 'rgba(34,197,94,0.8)'
            : 'rgba(234,179,8,0.8)'};
    border: 1px solid ${({ $status }) =>
        !$status || $status === 'offline'
            ? 'rgba(239,68,68,0.2)'
            : $status === 'running'
            ? 'rgba(34,197,94,0.2)'
            : 'rgba(234,179,8,0.2)'};
    transition: all 0.3s;
    flex-shrink: 0;
`;

const StatusDot = styled.div<{ $status: ServerPowerState | undefined }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    ${({ $status }) =>
        !$status || $status === 'offline'
            ? css`background: #ef4444; animation: ${pulseRed} 2.5s ease-in-out infinite;`
            : $status === 'running'
            ? css`background: #22c55e; animation: ${pulseGreen} 2s ease-in-out infinite;`
            : css`background: #eab308; animation: ${pulseYellow} 1.8s ease-in-out infinite;`}
`;

const ServerName = styled.p`
    ${tw`text-base font-medium`};
    color: #e2e8f0;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ServerDesc = styled.p`
    ${tw`text-xs`};
    color: #475569;
    margin: 2px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const AddressChip = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #475569;
    background: rgba(0,212,255,0.05);
    border: 1px solid rgba(0,212,255,0.1);
    border-radius: 8px;
    padding: 4px 10px;
    white-space: nowrap;

    svg { color: rgba(0,212,255,0.5); font-size: 0.7rem; }
`;

const StatItem = styled.div<{ $alarm?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;

    .val {
        font-size: 0.8rem;
        font-weight: 600;
        color: ${p => p.$alarm ? '#ef4444' : '#e2e8f0'};
        display: flex;
        align-items: center;
        gap: 4px;

        svg { color: ${p => p.$alarm ? '#ef4444' : 'rgba(0,212,255,0.55)'}; font-size: 0.7rem; }
    }

    .lim {
        font-size: 0.65rem;
        color: #334155;
        margin-top: 2px;
    }
`;

const StatusBadge = styled.span<{ $color: string }>`
    background: ${p => p.$color};
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 0.7rem;
    color: white;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 600;
`;

type Timer = ReturnType<typeof setInterval>;

export default memo(({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended) return;
        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });
        return () => { interval.current && clearInterval(interval.current); };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu    = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk   = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit   = server.limits.disk   !== 0 ? bytesToString(mbToBytes(server.limits.disk))   : '∞';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : '∞';
    const cpuLimit    = server.limits.cpu    !== 0 ? server.limits.cpu + '%' : '∞';

    const powerStatus = stats?.status;

    return (
        <Card
            as={Link}
            to={`/server/${server.id}`}
            className={className}
            $status={powerStatus}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
            <CardInner>
                {/* Left: icon + name + address */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <ServerIconWrap $status={powerStatus}>
                        <FontAwesomeIcon icon={faServer} />
                    </ServerIconWrap>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <StatusDot $status={powerStatus} />
                            <ServerName>{server.name}</ServerName>
                        </div>
                        {!!server.description && <ServerDesc>{server.description}</ServerDesc>}
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {server.allocations
                                .filter(a => a.isDefault)
                                .map(a => (
                                    <AddressChip key={a.ip + a.port}>
                                        <FontAwesomeIcon icon={faEthernet} />
                                        {a.alias || ip(a.ip)}:{a.port}
                                    </AddressChip>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Right: stats or status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {!stats || isSuspended ? (
                        isSuspended ? (
                            <StatusBadge $color={'rgba(239,68,68,0.25)'} style={{ border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                                {server.status === 'suspended' ? 'Suspended' : 'Error'}
                            </StatusBadge>
                        ) : server.isTransferring || server.status ? (
                            <StatusBadge $color={'rgba(100,116,139,0.2)'} style={{ border: '1px solid rgba(100,116,139,0.3)', color: '#94a3b8' }}>
                                {server.isTransferring ? 'Transferring'
                                    : server.status === 'installing' ? 'Installing'
                                    : server.status === 'restoring_backup' ? 'Restoring'
                                    : 'Unavailable'}
                            </StatusBadge>
                        ) : (
                            <Spinner size={'small'} />
                        )
                    ) : (
                        <>
                            <StatItem $alarm={alarms.cpu}>
                                <div className='val'>
                                    <FontAwesomeIcon icon={faMicrochip} />
                                    {stats.cpuUsagePercent.toFixed(1)}%
                                </div>
                                <div className='lim'>of {cpuLimit}</div>
                            </StatItem>
                            <StatItem $alarm={alarms.memory}>
                                <div className='val'>
                                    <FontAwesomeIcon icon={faMemory} />
                                    {bytesToString(stats.memoryUsageInBytes)}
                                </div>
                                <div className='lim'>of {memoryLimit}</div>
                            </StatItem>
                            <StatItem $alarm={alarms.disk} style={{ display: 'none' }} className={'sm-show'}>
                                <div className='val'>
                                    <FontAwesomeIcon icon={faHdd} />
                                    {bytesToString(stats.diskUsageInBytes)}
                                </div>
                                <div className='lim'>of {diskLimit}</div>
                            </StatItem>
                        </>
                    )}
                </div>
            </CardInner>
        </Card>
    );
}, isEqual);
