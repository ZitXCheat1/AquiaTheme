import React, { useEffect, useState } from 'react';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components';
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
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 0.775rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: 'Inter', sans-serif;
    white-space: nowrap;

    svg { font-size: 0.7rem; }

    ${p => p.variant === 'start' && `
        background: rgba(8, 205, 0, 0.12);
        border-color: rgba(8, 205, 0, 0.3);
        color: #08cd00;
        &:hover:not(:disabled) {
            background: rgba(8, 205, 0, 0.2);
            border-color: rgba(8, 205, 0, 0.55);
            animation: ${pulse} 1.2s ease-in-out 1;
        }
    `}

    ${p => p.variant === 'restart' && `
        background: rgba(234, 179, 8, 0.1);
        border-color: rgba(234, 179, 8, 0.25);
        color: #eab308;
        &:hover:not(:disabled) {
            background: rgba(234, 179, 8, 0.18);
            border-color: rgba(234, 179, 8, 0.5);
        }
    `}

    ${p => p.variant === 'stop' && `
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.25);
        color: #ef4444;
        &:hover:not(:disabled) {
            background: rgba(239, 68, 68, 0.18);
            border-color: rgba(239, 68, 68, 0.5);
        }
    `}

    ${p => p.variant === 'kill' && `
        background: rgba(220, 38, 38, 0.15);
        border-color: rgba(220, 38, 38, 0.4);
        color: #dc2626;
        &:hover:not(:disabled) {
            background: rgba(220, 38, 38, 0.25);
            border-color: rgba(220, 38, 38, 0.65);
        }
    `}

    &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
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
