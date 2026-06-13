import React, { useState } from 'react';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired, faPlayCircle, faCogs, faUser, faServer } from '@fortawesome/free-solid-svg-icons';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import UsersContainer from '@/components/server/users/UsersContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import tw from 'twin.macro';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import isEqual from 'react-fast-compare';

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
    background: rgba(10, 15, 10, 0.6);
    position: sticky;
    top: 3.5rem;
    z-index: 10;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
`;

const Tab = styled.button<{ $active?: boolean }>`
    display: flex; align-items: center; gap: 7px;
    padding: 10px 18px;
    font-size: 0.8rem; font-weight: ${p => p.$active ? 600 : 500};
    font-family: 'Inter', sans-serif;
    cursor: pointer; border: none; background: transparent;
    color: ${p => p.$active ? '#e8f5e8' : '#3d5c3d'};
    border-bottom: 2px solid ${p => p.$active ? '#08cd00' : 'transparent'};
    margin-bottom: -1px;
    transition: all 0.15s;
    border-radius: 6px 6px 0 0;
    &:hover { color: #7aab78; background: rgba(8,205,0,0.04); }
    svg { font-size: 0.75rem; }
`;

const Content = styled.div`
    animation: none;
`;

type TabId = 'general' | 'network' | 'users' | 'startup';

const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'general', label: 'General', icon: faServer },
    { id: 'network', label: 'Network', icon: faNetworkWired },
    { id: 'users',   label: 'Users',   icon: faUser },
    { id: 'startup', label: 'Startup', icon: faPlayCircle },
];

function GeneralSettings() {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    return (
        <>
            <FlashMessageRender byKey={'settings'} css={tw`mb-4`} />
            <div css={tw`md:flex gap-6`}>
                <div css={tw`w-full md:flex-1`}>
                    <Can action={'file.sftp'}>
                        <TitledGreyBox title={'SFTP Details'} css={tw`mb-6`}>
                            <div>
                                <Label>Server Address</Label>
                                <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                    <Input type={'text'} value={`sftp://${ip(sftp.ip)}:${sftp.port}`} readOnly />
                                </CopyOnClick>
                            </div>
                            <div css={tw`mt-4`}>
                                <Label>Username</Label>
                                <CopyOnClick text={`${username}.${id}`}>
                                    <Input type={'text'} value={`${username}.${id}`} readOnly />
                                </CopyOnClick>
                            </div>
                            <div css={tw`mt-4 flex items-center`}>
                                <div css={tw`flex-1`}>
                                    <div css={tw`border-l-4 border-cyan-500 p-3`}>
                                        <p css={tw`text-xs text-neutral-200`}>
                                            Your SFTP password is the same as the password you use to access this panel.
                                        </p>
                                    </div>
                                </div>
                                <div css={tw`ml-4`}>
                                    <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                        <Button.Text variant={Button.Variants.Secondary}>Launch SFTP</Button.Text>
                                    </a>
                                </div>
                            </div>
                        </TitledGreyBox>
                    </Can>
                    <TitledGreyBox title={'Debug Information'} css={tw`mb-6`}>
                        <div css={tw`flex items-center justify-between text-sm`}>
                            <p>Node</p>
                            <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{node}</code>
                        </div>
                        <CopyOnClick text={uuid}>
                            <div css={tw`flex items-center justify-between mt-2 text-sm`}>
                                <p>Server ID</p>
                                <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{uuid}</code>
                            </div>
                        </CopyOnClick>
                    </TitledGreyBox>
                </div>
                <div css={tw`w-full md:flex-1`}>
                    <Can action={'settings.rename'}>
                        <div css={tw`mb-6`}>
                            <RenameServerBox />
                        </div>
                    </Can>
                    <Can action={'settings.reinstall'}>
                        <ReinstallServerBox />
                    </Can>
                </div>
            </div>
        </>
    );
}

export default () => {
    const [active, setActive] = useState<TabId>('general');

    return (
        <ServerContentBlock title={'Settings'}>
            <Wrap>
                <TabStrip>
                    {TABS.map(t => (
                        <Tab key={t.id} $active={active === t.id} onClick={() => setActive(t.id)}>
                            <FontAwesomeIcon icon={t.icon}/>
                            {t.label}
                        </Tab>
                    ))}
                </TabStrip>
                <Content key={active} className='aq-tab-content'>
                    {active === 'general' && <GeneralSettings />}
                    {active === 'network'  && <NetworkContainer/>}
                    {active === 'users'    && <UsersContainer/>}
                    {active === 'startup'  && <StartupContainer/>}
                </Content>
            </Wrap>
        </ServerContentBlock>
    );
};
