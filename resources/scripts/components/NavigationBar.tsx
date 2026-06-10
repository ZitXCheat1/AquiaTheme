import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faCog,
    faLayerGroup,
    faSignOutAlt,
    faTint,
    faBell,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled, { keyframes } from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';
import { motion } from 'framer-motion';

const glowPulse = keyframes`
    0%, 100% { text-shadow: 0 0 8px rgba(0,212,255,0.4); }
    50%       { text-shadow: 0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.3); }
`;

const NavWrapper = styled(motion.div)`
    background: rgba(6, 11, 24, 0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(0, 212, 255, 0.1);
    box-shadow: 0 1px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.04);
    position: sticky;
    top: 0;
    z-index: 9000;
    height: 3.5rem;
    overflow-y: hidden;
`;

const LogoText = styled(Link)`
    ${tw`text-xl font-medium px-4 no-underline transition-colors duration-200`};
    background: linear-gradient(90deg, #00d4ff, #7c3aed, #00d4ff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmerText 4s linear infinite, ${glowPulse} 3s ease-in-out infinite;
    font-weight: 700;
    letter-spacing: 0.02em;

    @keyframes shimmerText {
        0%   { background-position: 0% center; }
        100% { background-position: 200% center; }
    }
`;

const LogoIcon = styled(motion.span)`
    color: #00d4ff;
    margin-right: 8px;
    display: inline-flex;
    align-items: center;
`;

const NavButton = styled(motion.div)`
    ${tw`flex items-center h-full cursor-pointer`};
    padding: 0 14px;
    color: #64748b;
    position: relative;
    transition: color 0.2s;

    &:hover {
        color: #e2e8f0;
    }

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, #00d4ff, #7c3aed);
        border-radius: 2px 2px 0 0;
        transition: width 0.2s cubic-bezier(0.22,1,0.36,1);
    }

    &:hover::after,
    &.active-link::after {
        width: 70%;
    }

    svg {
        transition: transform 0.2s, color 0.2s;
    }

    &:hover svg {
        transform: scale(1.15);
        color: #00d4ff;
    }
`;

const NavDivider = styled.div`
    width: 1px;
    height: 20px;
    background: rgba(0, 212, 255, 0.12);
    margin: 0 4px;
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'mx-auto w-full flex items-center h-[3.5rem] max-w-[1200px]'}>

                {/* Mobile hamburger */}
                {showSidebar && (
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        className='navbar-button'
                        onClick={onTriggerNavButton}
                        style={{ cursor: 'pointer', color: '#00d4ff', fontSize: '1.2rem', marginLeft: '1rem' }}
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </motion.div>
                )}

                {/* Logo */}
                <div id={'logo'} className={'flex-1 flex items-center'}>
                    <LogoIcon
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <FontAwesomeIcon icon={faTint} />
                    </LogoIcon>
                    <LogoText to={'/'}>{name}</LogoText>
                </div>

                {/* Right nav */}
                <div className={'flex h-full items-center'}>
                    <SearchContainer />

                    <NavDivider />

                    <Tooltip placement={'bottom'} content={'Dashboard'}>
                        <NavButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                            <NavLink to={'/'} exact css={tw`flex items-center h-full no-underline`} activeClassName={'active-link'}>
                                <FontAwesomeIcon icon={faLayerGroup} />
                            </NavLink>
                        </NavButton>
                    </Tooltip>

                    {rootAdmin && (
                        <Tooltip placement={'bottom'} content={'Admin Panel'}>
                            <NavButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                                <a href={'/admin'} rel={'noreferrer'} css={tw`flex items-center h-full no-underline text-current`}>
                                    <FontAwesomeIcon icon={faCog} />
                                </a>
                            </NavButton>
                        </Tooltip>
                    )}

                    <NavDivider />

                    <Tooltip placement={'bottom'} content={'Account'}>
                        <NavButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                            <NavLink to={'/account'} css={tw`flex items-center h-full no-underline text-current`}>
                                <span className={'flex items-center w-6 h-6'}>
                                    <Avatar.User />
                                </span>
                            </NavLink>
                        </NavButton>
                    </Tooltip>

                    <Tooltip placement={'bottom'} content={'Sign Out'}>
                        <NavButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={onTriggerLogout}
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </NavButton>
                    </Tooltip>
                </div>
            </div>
        </NavWrapper>
    );
};
