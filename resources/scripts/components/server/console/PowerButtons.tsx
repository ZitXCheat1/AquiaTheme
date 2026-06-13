import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components/macro';
import { keyframes } from 'styled-components/macro';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@/components/server/console/ServerConsoleContainer';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRedo, faStop, faBolt } from '@fortawesome/free-solid-svg-icons';

const pulse = keyframes`
    0%, 100% { box-shadow: 0 0 0 0 rgba(8, 205, 0, 0.3); }
    50%       { box-shadow: 0 0 0 6px rgba(8, 205, 0, 0); }
`;

const Wrap = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const Btn = styled.button<{ variant: 'start' | 'restart' | 'stop' | 'kill' }>`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.775rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);

    svg { font-size: 0.68rem; }

    ${p => p.variant === 'start' && css`
        background: rgba(34, 197, 94, 0.18);
        border-color: rgba(34, 197, 94, 0.35);
        color: #4ade80;
        font-weight: 600;
        box-shadow: 0 2px 12px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255,255,255,0.08);
        &:hover:not(:disabled) {
            background: rgba(34, 197, 94, 0.28);
            border-color: rgba(34, 197, 94, 0.5);
            box-shadow: 0 4px 20px rgba(34, 197, 94, 0.25);
            transform: translateY(-1px);
            animation: ${pulse} 1.2s ease-in-out 1;
        }
    `}

    ${p => p.variant === 'restart' && css`
        background: rgba(245, 158, 11, 0.16);
        border-color: rgba(245, 158, 11, 0.32);
        color: #fbbf24;
        font-weight: 600;
        box-shadow: 0 2px 12px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255,255,255,0.08);
        &:hover:not(:disabled) {
            background: rgba(245, 158, 11, 0.26);
            border-color: rgba(245, 158, 11, 0.48);
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.22);
            transform: translateY(-1px);
        }
    `}

    ${p => p.variant === 'stop' && css`
        background: rgba(239, 68, 68, 0.16);
        border-color: rgba(239, 68, 68, 0.32);
        color: #f87171;
        font-weight: 600;
        box-shadow: 0 2px 12px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255,255,255,0.08);
        &:hover:not(:disabled) {
            background: rgba(239, 68, 68, 0.26);
            border-color: rgba(239, 68, 68, 0.48);
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.22);
            transform: translateY(-1px);
        }
    `}

    ${p => p.variant === 'kill' && css`
        background: rgba(220, 38, 38, 0.18);
        border-color: rgba(220, 38, 38, 0.35);
        color: #fca5a5;
        font-weight: 600;
        box-shadow: 0 2px 12px rgba(220, 38, 38, 0.15), inset 0 1px 0 rgba(255,255,255,0.08);
        &:hover:not(:disabled) {
            background: rgba(220, 38, 38, 0.28);
            border-color: rgba(220, 38, 38, 0.5);
            box-shadow: 0 4px 20px rgba(220, 38, 38, 0.25);
            transform: translateY(-1px);
        }
    `}

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        transform: none !important;
    }
`;

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';

    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        if (action === 'kill') return setOpen(true);
        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') setOpen(false);
    }, [status]);

    return (
        <Wrap className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={'Forcibly Stop Process'}
                confirm={'Continue'}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                Forcibly stopping a server can lead to data corruption.
            </Dialog.Confirm>

            <Can action={'control.start'}>
                <Btn
                    variant='start'
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                >
                    <FontAwesomeIcon icon={faPlay} />
                    Start
                </Btn>
            </Can>

            <Can action={'control.restart'}>
                <Btn
                    variant='restart'
                    disabled={!status}
                    onClick={onButtonClick.bind(this, 'restart')}
                >
                    <FontAwesomeIcon icon={faRedo} />
                    Restart
                </Btn>
            </Can>

            <Can action={'control.stop'}>
                <Btn
                    variant={killable ? 'kill' : 'stop'}
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                >
                    <FontAwesomeIcon icon={killable ? faBolt : faStop} />
                    {killable ? 'Kill' : 'Stop'}
                </Btn>
            </Can>
        </Wrap>
    );
};
