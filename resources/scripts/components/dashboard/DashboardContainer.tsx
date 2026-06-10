import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faLayerGroup } from '@fortawesome/free-solid-svg-icons';

const DashHeader = styled(motion.div)`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
`;

const DashTitle = styled.h2`
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(90deg, #e2e8f0, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const DashIconBadge = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2));
    border: 1px solid rgba(0,212,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #00d4ff;
    font-size: 0.95rem;
`;

const ServerCount = styled.span`
    margin-left: auto;
    font-size: 0.75rem;
    color: #475569;
    background: rgba(0,212,255,0.06);
    border: 1px solid rgba(0,212,255,0.1);
    border-radius: 20px;
    padding: 3px 10px;
    letter-spacing: 0.05em;
`;

const EmptyState = styled(motion.div)`
    text-align: center;
    padding: 64px 32px;
    color: #334155;

    svg {
        font-size: 3rem;
        margin-bottom: 16px;
        opacity: 0.3;
    }

    p {
        color: #334155;
        font-size: 0.9rem;
    }
`;

const listVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
};

const itemVariants = {
    hidden:  { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: { duration: 0.2 },
    },
};

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => { setPage(1); }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) setPage(1);
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock className='content-dashboard' title={'Dashboard'} showFlashKey={'dashboard'}>

            {/* Header */}
            <DashHeader
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}
            >
                <DashIconBadge>
                    <FontAwesomeIcon icon={faLayerGroup} />
                </DashIconBadge>
                <DashTitle>My Servers</DashTitle>
                {servers && (
                    <ServerCount>{servers.pagination.total} server{servers.pagination.total !== 1 ? 's' : ''}</ServerCount>
                )}
            </DashHeader>

            {/* Admin toggle */}
            {rootAdmin && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    css={tw`mb-4 flex justify-end items-center`}
                >
                    <p css={tw`uppercase text-xs mr-3`} style={{ color: '#475569' }}>
                        {showOnlyAdmin ? "Others' servers" : 'Your servers'}
                    </p>
                    <Switch
                        name={'show_all_servers'}
                        defaultChecked={showOnlyAdmin}
                        onChange={() => setShowOnlyAdmin((s) => !s)}
                    />
                </motion.div>
            )}

            {/* Content */}
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            <motion.div
                                variants={listVariants}
                                initial={'hidden'}
                                animate={'visible'}
                            >
                                <AnimatePresence>
                                    {items.map((server) => (
                                        <motion.div
                                            key={server.uuid}
                                            variants={itemVariants}
                                            layout
                                            css={tw`mb-3`}
                                        >
                                            <ServerRow server={server} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <EmptyState
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <FontAwesomeIcon icon={faServer} />
                                <p>
                                    {showOnlyAdmin
                                        ? 'There are no other servers to display.'
                                        : 'No servers are associated with your account.'}
                                </p>
                            </EmptyState>
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};
