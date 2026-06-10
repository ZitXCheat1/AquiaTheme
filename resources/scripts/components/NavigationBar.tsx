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
    background: rgba(10, 15, 10, 0.95);
    border-bottom: 1px solid rgba(8, 205, 0, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 9000;
    height: 3.5rem;
    overflow: hidden;
`;

/* Server-node geometric logo */
const LogoMark = () => (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="30" rx="7" fill="#08cd00"/>
        {/* Server rack slot 1 */}
        <rect x="5" y="8" width="20" height="5.5" rx="1.5" fill="rgba(0,0,0,0.22)"/>
        {/* Rack slot 2 */}
        <rect x="5" y="16.5" width="20" height="5.5" rx="1.5" fill="rgba(0,0,0,0.22)"/>
        {/* LED bar slot 1 */}
        <rect x="7" y="9.5" width="9" height="2.5" rx="1" fill="rgba(255,255,255,0.25)"/>
        {/* LED bar slot 2 */}
        <rect x="7" y="18" width="6" height="2.5" rx="1" fill="rgba(255,255,255,0.15)"/>
        {/* Status dot 1 – on */}
        <circle cx="23" cy="10.75" r="1.75" fill="white" opacity="0.95"/>
        {/* Status dot 2 – dim */}
        <circle cx="23" cy="19.25" r="1.75" fill="white" opacity="0.35"/>
        {/* Top connector line */}
        <rect x="13" y="5.5" width="4" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
        {/* Bottom connector */}
        <rect x="13" y="22.5" width="4" height="2" rx="1" fill="rgba(255,255,255,0.18)"/>
    </svg>
);

const LogoText = styled(Link)`
    ${tw`text-sm font-semibold px-2.5 no-underline`};
    color: #e8f5e8;
    letter-spacing: -0.02em;
    font-family: 'Inter', sans-serif;
`;

const NavButton = styled(motion.div)`
    ${tw`flex items-center h-full cursor-pointer`};
    padding: 0 11px;
    color: #3d6b3d;
    transition: color 0.15s;
    &:hover { color: #e8f5e8; }
`;

const NavDivider = styled.div`
    width: 1px;
    height: 16px;
    background: rgba(8, 205, 0, 0.1);
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

                <div id={'logo'} className={'flex items-center'} style={{ gap: 0 }}>
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
