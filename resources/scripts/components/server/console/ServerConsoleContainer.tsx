import React, { memo, useMemo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import NextScheduleWidget from '@/components/server/console/NextScheduleWidget';
import { Alert } from '@/components/elements/alert';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeaturesRaw = ServerContext.useStoreState((state) => state.server.data!.eggFeatures);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);

    const eggFeatures = useMemo(() => eggFeaturesRaw || [], [eggFeaturesRaw]);

    return (
        <ServerContentBlock title={'Console'}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                        : isInstalling
                        ? 'This server is currently running its installation process and most actions are unavailable.'
                        : 'This server is currently being transferred to another node and all actions are unavailable.'}
                </Alert>
            )}
            {/* Header row: server name left, power buttons right */}
            <div className={'flex items-center justify-between mb-4'}>
                <div className={'hidden sm:block min-w-0 mr-4'}>
                    <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.35rem', color: '#f1f5f9', lineHeight: 1.3, letterSpacing: '-0.02em' }} className={'line-clamp-1'}>
                        {name}
                    </h1>
                    {description && (
                        <p style={{ fontSize: '0.78rem', color: '#6b7280', fontFamily: 'Inter, sans-serif', marginTop: '2px' }} className={'line-clamp-1'}>{description}</p>
                    )}
                </div>
                <div className={'flex-shrink-0'}>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className={'flex space-x-2'} />
                    </Can>
                </div>
            </div>
            {/* Main area: console left, stats right */}
            <div className={'flex gap-4 mb-4'}>
                <div className={'flex-1 min-w-0'}>
                    <Spinner.Suspense>
                        <Console />
                    </Spinner.Suspense>
                </div>
                <ServerDetailsBlock className={'w-52 flex-shrink-0 hidden lg:flex'} />
            </div>
            {/* Next scheduled task widget */}
            <div className={'mb-3'}>
                <NextScheduleWidget />
            </div>
            {/* Charts row */}
            <div className={'grid grid-cols-1 md:grid-cols-3 gap-3'}>
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
            {eggFeatures.length > 0 && <Features enabled={eggFeatures} />}
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
