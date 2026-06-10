import React, { useState } from 'react';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired, faPlayCircle, faCogs, faUser } from '@fortawesome/free-solid-svg-icons';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import UsersContainer from '@/components/server/users/UsersContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';

const fadeUp = keyframes`from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}`;

const Wrap = styled.div`
    animation: ${fadeUp} 0.35s cubic-bezier(0.22,1,0.36,1) both;
    font-family: 'Inter', sans-serif;
`;

const TabStrip = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 12px 24px 0;
    border-bottom: 1px solid rgba(8,205,0,0.1);
    background: #0a0f0a;
    position: sticky;
    top: 3.5rem;
    z-index: 10;
`;

const Tab = styled.button<{ $active?: boolean }>`
    display: flex; align-items: center; gap: 7px;
    padding: 9px 16px;
    font-size: 0.8rem; font-weight: ${p => p.$active ? 600 : 500};
    font-family: 'Inter', sans-serif;
    cursor: pointer; border: none; background: transparent;
    color: ${p => p.$active ? '#e8f5e8' : '#3d5c3d'};
    border-bottom: 2px solid ${p => p.$active ? '#08cd00' : 'transparent'};
    margin-bottom: -1px;
    transition: all 0.15s;
    &:hover { color: #7aab78; }
    svg { font-size: 0.75rem; }
`;

const Content = styled.div``;

type TabId = 'network' | 'users' | 'startup' | 'settings';

const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'network',  label: 'Network',  icon: faNetworkWired },
    { id: 'users',    label: 'Users',    icon: faUser },
    { id: 'startup',  label: 'Startup',  icon: faPlayCircle },
    { id: 'settings', label: 'Settings', icon: faCogs },
];

export default function ServerConfigHub() {
    const [active, setActive] = useState<TabId>('network');

    return (
        <Wrap>
            <TabStrip>
                {TABS.map(t => (
                    <Tab key={t.id} $active={active === t.id} onClick={() => setActive(t.id)}>
                        <FontAwesomeIcon icon={t.icon}/>
                        {t.label}
                    </Tab>
                ))}
            </TabStrip>
            <Content>
                {active === 'network'  && <NetworkContainer/>}
                {active === 'users'    && <UsersContainer/>}
                {active === 'startup'  && <StartupContainer/>}
                {active === 'settings' && <SettingsContainer/>}
            </Content>
        </Wrap>
    );
}
