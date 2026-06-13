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
import { faServer } from '@fortawesome/free-solid-svg-icons';

const Header = styled(motion.div)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
`;

const Title = styled.h2`
    font-size: 0.68rem;
    font-weight: 600;
    margin: 0;
    color: #6b7280;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Inter', sans-serif;
`;

const Count = styled.span`
    font-size: 0.68rem;
    color: #374151;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 2px 10px;
    letter-spacing: 0.04em;
    font-family: 'Inter', sans-serif;
`;

const EmptyState = styled(motion.div)`
    text-align: center;
    padding: 80px 32px;
    color: #374151;
    font-family: 'Inter', sans-serif;

    svg { font-size: 2.5rem; margin-bottom: 14px; opacity: 0.2; display: block; margin-left: auto; margin-right: auto; }
    p { font-size: 0.85rem; color: #374151; }
`;

const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};

const itemVariants = {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit:    { opacity: 0, y: -6, transition: { duration: 0.18 } },
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

            <Header
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
            >
                <Title>My Servers</Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {servers && <Count>{servers.pagination.total} server{servers.pagination.total !== 1 ? 's' : ''}</Count>}
                    {rootAdmin && (
                        <div css={tw`flex items-center`} style={{ gap: 8 }}>
                            <span style={{ fontSize: '0.68rem', color: '#4b5563', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {showOnlyAdmin ? "Others'" : 'Yours'}
                            </span>
                            <Switch
                                name={'show_all_servers'}
                                defaultChecked={showOnlyAdmin}
                                onChange={() => setShowOnlyAdmin((s) => !s)}
                            />
                        </div>
                    )}
                </div>
            </Header>

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
                                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                            >
                                <AnimatePresence>
                                    {items.map((server) => (
                                        <motion.div key={server.uuid} variants={itemVariants} layout>
                                            <ServerRow server={server} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <EmptyState
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35 }}
                            >
                                <FontAwesomeIcon icon={faServer} />
                                <p>
                                    {showOnlyAdmin
                                        ? 'No other servers to display.'
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
