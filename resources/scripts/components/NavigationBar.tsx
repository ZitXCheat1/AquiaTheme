import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faCog,
    faLayerGroup,
    faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
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
    background: #111118;
    border-bottom: 1px solid rgba(99, 102, 241, 0.14);
    position: sticky;
    top: 0;
    z-index: 9000;
    height: 3.5rem;
    overflow-y: hidden;
`;

const LogoMark = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="7" fill="#6366f1"/>
        <path d="M9 20L14 8L19 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.5 16.5H17.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const LogoText = styled(Link)`
    ${tw`text-base font-semibold px-3 no-underline`};
    color: #e2e8f0;
    letter-spacing: 0.01em;
`;

const NavButton = styled(motion.div)`
    ${tw`flex items-center h-full cursor-pointer`};
    padding: 0 12px;
    color: #64748b;
    transition: color 0.15s;

    &:hover {
        color: #e2e8f0;
    }
`;

const NavDivider = styled.div`
    width: 1px;
    height: 18px;
    background: rgba(99, 102, 241, 0.14);
    margin: 0 2px;
`;

const onTriggerNavButton = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active-nav');
    }
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'mx-auto w-full flex items-center h-[3.5rem] max-w-[1200px]'}>

                {/* Mobile hamburger */}
                {showSidebar && (
                    <div
                        className='navbar-button'
                        onClick={onTriggerNavButton}
                        style={{ cursor: 'pointer', color: '#6366f1', fontSize: '1.1rem', marginLeft: '1rem' }}
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </div>
                )}

                {/* Logo */}
                <div id={'logo'} className={'flex-1 flex items-center pl-4'}>
                    <LogoMark />
                    <LogoText to={'/'}>{name}</LogoText>
                </div>

                {/* Right nav */}
                <div className={'flex h-full items-center'}>
                    <SearchContainer />

                    <NavDivider />

                    <Tooltip placement={'bottom'} content={'Dashboard'}>
                        <NavButton whileTap={{ scale: 0.95 }}>
                            <NavLink to={'/'} exact css={tw`flex items-center h-full no-underline text-current`} activeClassName={'active-link'}>
                                <FontAwesomeIcon icon={faLayerGroup} />
                            </NavLink>
                        </NavButton>
                    </Tooltip>

                    {rootAdmin && (
                        <Tooltip placement={'bottom'} content={'Admin Panel'}>
                            <NavButton whileTap={{ scale: 0.95 }}>
                                <a href={'/admin'} rel={'noreferrer'} css={tw`flex items-center h-full no-underline text-current`}>
                                    <FontAwesomeIcon icon={faCog} />
                                </a>
                            </NavButton>
                        </Tooltip>
                    )}

                    <NavDivider />

                    <Tooltip placement={'bottom'} content={'Account'}>
                        <NavButton whileTap={{ scale: 0.95 }}>
                            <NavLink to={'/account'} css={tw`flex items-center h-full no-underline text-current`}>
                                <span className={'flex items-center w-6 h-6'}>
                                    <Avatar.User />
                                </span>
                            </NavLink>
                        </NavButton>
                    </Tooltip>

                    <Tooltip placement={'bottom'} content={'Sign Out'}>
                        <NavButton whileTap={{ scale: 0.95 }} onClick={onTriggerLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </NavButton>
                    </Tooltip>
                </div>
            </div>
        </NavWrapper>
    );
};
