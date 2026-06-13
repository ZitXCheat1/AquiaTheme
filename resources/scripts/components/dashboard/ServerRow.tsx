import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import styled, { keyframes, css } from 'styled-components/macro';
import Spinner from '@/components/elements/Spinner';
import isEqual from 'react-fast-compare';
import { motion } from 'framer-motion';

const pulseDot = (color: string) => keyframes`
    0%, 100% { box-shadow: 0 0 0 0 ${color}55; }
    50%       { box-shadow: 0 0 0 4px ${color}00; }
`;
const pulseGreen  = pulseDot('#08cd00');
const pulseRed    = pulseDot('#ef4444');
const pulseYellow = pulseDot('#f59e0b');

const isAlarmState = (current: number, limit: number): boolean =>
    limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Card = styled(motion.div)<{ $status: ServerPowerState | undefined }>`
    position: relative;
    background: #111111;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    overflow: hidden;
    text-decoration: none;
    display: block;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;

    &:hover {
        border-color: rgba(255,255,255,0.12);
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        text-decoration: none;
    }

    &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: ${({ $status }) =>
            !$status || $status === 'offline'
                ? 'linear-gradient(90deg, rgba(239,68,68,0.6), transparent)'
                : $status === 'running'
                ? 'linear-gradient(90deg, rgba(8,205,0,0.6), transparent)'
                : 'linear-gradient(90deg, rgba(245,158,11,0.6), transparent)'};
    }
`;

const CardInner = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    justify-content: space-between;
`;

const StatusDot = styled.div<{ $status: ServerPowerState | undefined }>`
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    ${({ $status }) =>
        !$status || $status === 'offline'
            ? css`background: #ef4444; animation: ${pulseRed} 2.5s ease-in-out infinite;`
            : $status === 'running'
            ? css`background: #08cd00; animation: ${pulseGreen} 2s ease-in-out infinite;`
            : css`background: #f59e0b; animation: ${pulseYellow} 1.8s ease-in-out infinite;`}
`;

const ServerIconWrap = styled.div<{ $status: ServerPowerState | undefined }>`
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    flex-shrink: 0;
    background: ${({ $status }) =>
        !$status || $status === 'offline'
            ? 'rgba(239,68,68,0.08)'
            : $status === 'running'
            ? 'rgba(8,205,0,0.08)'
            : 'rgba(245,158,11,0.08)'};
    color: ${({ $status }) =>
        !$status || $status === 'offline'
            ? 'rgba(239,68,68,0.7)'
            : $status === 'running'
            ? 'rgba(8,205,0,0.8)'
            : 'rgba(245,158,11,0.7)'};
    border: 1px solid ${({ $status }) =>
        !$status || $status === 'offline'
            ? 'rgba(239,68,68,0.15)'
            : $status === 'running'
            ? 'rgba(8,205,0,0.18)'
            : 'rgba(245,158,11,0.15)'};
`;

const ServerName = styled.p`
    font-size: 0.875rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
`;

const ServerDesc = styled.p`
    font-size: 0.72rem;
    color: #4b5563;
    margin: 2px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const AddressChip = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    color: #6b7280;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px;
    padding: 3px 8px;
    white-space: nowrap;
    margin-top: 5px;

    svg { color: #08cd00; opacity: 0.7; font-size: 0.65rem; }
`;

const StatItem = styled.div<{ $alarm?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 56px;

    .val {
        font-size: 0.8rem;
        font-weight: 600;
        color: ${p => p.$alarm ? '#ef4444' : '#e2e8f0'};
        display: flex;
        align-items: center;
        gap: 4px;
        svg { color: ${p => p.$alarm ? '#ef4444' : '#6b7280'}; font-size: 0.65rem; }
    }
    .lim {
        font-size: 0.62rem;
        color: #374151;
        margin-top: 1px;
    }
`;

const StatusBadge = styled.span<{ $offline?: boolean }>`
    background: ${p => p.$offline ? 'rgba(239,68,68,0.08)' : 'rgba(100,116,139,0.1)'};
    border: 1px solid ${p => p.$offline ? 'rgba(239,68,68,0.25)' : 'rgba(100,116,139,0.2)'};
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 0.68rem;
    color: ${p => p.$offline ? '#ef4444' : '#94a3b8'};
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
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
            <CardInner>
                {/* Left: icon + name + address */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <ServerIconWrap $status={powerStatus}>
                        <FontAwesomeIcon icon={faServer} />
                    </ServerIconWrap>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <StatusDot $status={powerStatus} />
                            <ServerName>{server.name}</ServerName>
                        </div>
                        {!!server.description && <ServerDesc>{server.description}</ServerDesc>}
                        {server.allocations.filter(a => a.isDefault).map(a => (
                            <AddressChip key={a.ip + a.port}>
                                <FontAwesomeIcon icon={faEthernet} />
                                {a.alias || ip(a.ip)}:{a.port}
                            </AddressChip>
                        ))}
                    </div>
                </div>

                {/* Right: stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                    {!stats || isSuspended ? (
                        isSuspended ? (
                            <StatusBadge $offline>
                                {server.status === 'suspended' ? 'Suspended' : 'Error'}
                            </StatusBadge>
                        ) : server.isTransferring || server.status ? (
                            <StatusBadge>
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
                                <div className='val'><FontAwesomeIcon icon={faMicrochip} />{stats.cpuUsagePercent.toFixed(1)}%</div>
                                <div className='lim'>/ {cpuLimit}</div>
                            </StatItem>
                            <StatItem $alarm={alarms.memory}>
                                <div className='val'><FontAwesomeIcon icon={faMemory} />{bytesToString(stats.memoryUsageInBytes)}</div>
                                <div className='lim'>/ {memoryLimit}</div>
                            </StatItem>
                            <StatItem $alarm={alarms.disk}>
                                <div className='val'><FontAwesomeIcon icon={faHdd} />{bytesToString(stats.diskUsageInBytes)}</div>
                                <div className='lim'>/ {diskLimit}</div>
                            </StatItem>
                        </>
                    )}
                </div>
            </CardInner>
        </Card>
    );
}, isEqual);
