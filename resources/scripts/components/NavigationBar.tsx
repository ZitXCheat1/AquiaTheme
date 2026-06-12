import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCog, faLayerGroup, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';
import { motion } from 'framer-motion';

const NavWrapper = styled(motion.div)`
    background: rgba(10, 10, 10, 0.97);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    position: sticky;
    top: 0;
    z-index: 9000;
    height: 3.5rem;
    overflow: hidden;
`;

/* Sidebar toggle — collapse to icons-only, persisted on <html> class */
let _sidebarCollapsed = false;
function toggleSidebar() {
    _sidebarCollapsed = !_sidebarCollapsed;
    document.documentElement.classList.toggle('sidebar-collapsed', _sidebarCollapsed);
}

/* Flame logo — matches LaxelHost style, green accent */
const LogoMark = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="7" fill="rgba(8,205,0,0.12)"/>
        <path
            d="M14 3.5C14 3.5 19.5 8.5 19.5 13.5C19.5 15.8 18.2 17.5 16.5 18.5C17.2 16.5 16.3 14.8 15 14C15.5 16 13.5 17.8 12.5 19.5C11 17.8 10.5 15.8 11.5 14C9.8 15.2 9.3 17.2 9.8 19C8.5 17.5 8 15.2 9 12.5C8 13.5 7.5 15 8 16.5C6.5 14 7 10.8 9 8.5C9 11 11 12 11 12C11 9.2 12.5 6 14 3.5Z"
            fill="#08cd00"
            opacity="0.9"
        />
        <path
            d="M14 10C14 10 16.5 12.5 16.5 14.5C16.5 15.8 15.7 16.7 14.8 17.2C15.1 16.2 14.7 15.3 14 14.8C14.2 15.8 13.2 16.8 12.7 17.7C11.9 16.8 11.7 15.7 12.2 14.8C11.4 15.4 11.1 16.4 11.4 17.2C10.8 16.4 10.7 15.1 11.3 13.8C10.9 14.3 10.7 15 11 15.7C10.1 14.3 10.4 12.5 11.5 11.2C11.5 12.4 12.4 13 12.4 13C12.4 11.6 13.2 10.6 14 10Z"
            fill="white"
            opacity="0.6"
        />
    </svg>
);

const LogoText = styled(Link)`
    ${tw`text-sm font-semibold px-2.5 no-underline`};
    color: #f1f5f9;
    letter-spacing: -0.02em;
    font-family: 'Inter', sans-serif;
`;

const NavButton = styled(motion.div)`
    ${tw`flex items-center h-full cursor-pointer`};
    padding: 0 11px;
    color: rgba(255,255,255,0.3);
    transition: color 0.15s;
    &:hover { color: #f1f5f9; }
`;

const NavDivider = styled.div`
    width: 1px;
    height: 16px;
    background: rgba(255,255,255,0.07);
    margin: 0 2px;
`;

const onTriggerNavButton = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active-nav');
};

export default () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const location = useLocation();
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        setShowSidebar(
            location.pathname.startsWith('/server') || location.pathname.startsWith('/account')
        );
    }, [location.pathname]);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <NavWrapper
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'mx-auto w-full flex items-center h-[3.5rem] px-4'}>

                {showSidebar && (
                    <div
                        className='navbar-button'
                        onClick={onTriggerNavButton}
                        style={{ cursor: 'pointer', color: '#08cd00', fontSize: '1rem', marginRight: '0.75rem' }}
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </div>
                )}

                <div
                    id={'logo'}
                    className={'flex items-center'}
                    style={{ gap: 0, cursor: showSidebar ? 'pointer' : 'default' }}
                    onClick={showSidebar ? toggleSidebar : undefined}
                    title={showSidebar ? 'Toggle sidebar' : undefined}
                >
                    <LogoMark />
                    <LogoText to={'/'}>{name}</LogoText>
                </div>

                <div className={'flex-1'} />

                <div className={'flex h-full items-center'}>
                    <SearchContainer />
                    <NavDivider />

                    <Tooltip placement={'bottom'} content={'Dashboard'}>
                        <NavButton whileTap={{ scale: 0.9 }}>
                            <NavLink to={'/'} exact css={tw`flex items-center h-full no-underline text-current`} activeClassName={'active-link'}>
                                <FontAwesomeIcon icon={faLayerGroup} />
                            </NavLink>
                        </NavButton>
                    </Tooltip>

                    {rootAdmin && (
                        <Tooltip placement={'bottom'} content={'Admin Panel'}>
                            <NavButton whileTap={{ scale: 0.9 }}>
                                <a href={'/admin'} rel={'noreferrer'} css={tw`flex items-center h-full no-underline text-current`}>
                                    <FontAwesomeIcon icon={faCog} />
                                </a>
                            </NavButton>
                        </Tooltip>
                    )}

                    <NavDivider />

                    <Tooltip placement={'bottom'} content={'Account'}>
                        <NavButton whileTap={{ scale: 0.9 }}>
                            <NavLink to={'/account'} css={tw`flex items-center h-full no-underline text-current`}>
                                <span className={'flex items-center w-6 h-6'}>
                                    <Avatar.User />
                                </span>
                            </NavLink>
                        </NavButton>
                    </Tooltip>

                    <Tooltip placement={'bottom'} content={'Sign Out'}>
                        <NavButton whileTap={{ scale: 0.9 }} onClick={onTriggerLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </NavButton>
                    </Tooltip>
                </div>
            </div>
        </NavWrapper>
    );
};
