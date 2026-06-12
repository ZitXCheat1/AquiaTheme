import React, { forwardRef } from 'react';
import { Form } from 'formik';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

/* ─── Keyframes ──────────────────────────────────────────────── */
const gridFade = keyframes`
    0%, 100% { opacity: 0.018; }
    50%       { opacity: 0.04; }
`;
const ledBlink = keyframes`
    0%, 45%, 100% { opacity: 1; }
    50%, 95%      { opacity: 0.2; }
`;
const floatUp = keyframes`
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
`;

/* ─── Global cursor override — delayed blink ─────────────────── */
const GlobalStyle = styled.div`
    /* Kill blue focus rings everywhere on this page */
    * {
        outline: none !important;
    }
    *:focus, *:focus-visible, *:focus-within {
        outline: none !important;
        box-shadow: none !important;
    }

    /* Replace every blue selection rect site-wide with green */
    *::selection {
        background: rgba(8, 205, 0, 0.16) !important;
        color: #ffffff !important;
    }
    *::-moz-selection {
        background: rgba(8, 205, 0, 0.16) !important;
        color: #ffffff !important;
    }
`;

/* ─── Scene ──────────────────────────────────────────────────── */
const Scene = styled.div`
    min-height: 100vh;
    width: 100%;
    background: #080808;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;

    /* Subtle dot grid */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 26px 26px;
        animation: ${gridFade} 5s ease-in-out infinite;
        pointer-events: none;
    }
`;

/* Ambient glow blobs */
const Glow = styled.div<{ top: string; left: string; size: number; color: string }>`
    position: absolute;
    width: ${p => p.size}px;
    height: ${p => p.size}px;
    top: ${p => p.top};
    left: ${p => p.left};
    background: radial-gradient(circle, ${p => p.color}, transparent 70%);
    border-radius: 50%;
    filter: blur(${p => Math.round(p.size * 0.38)}px);
    pointer-events: none;
    opacity: 0.45;
`;

/* ─── Card ───────────────────────────────────────────────────── */
const Card = styled(motion.div)`
    position: relative;
    z-index: 10;
    background: #0f0f0f;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    padding: 36px 32px 28px;
    margin: 16px;
    box-shadow:
        0 0 0 1px rgba(255,255,255,0.03),
        0 24px 80px rgba(0,0,0,0.8);

    /* Top edge highlight */
    &::before {
        content: '';
        position: absolute;
        top: 0; left: 12%; right: 12%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(8,205,0,0.35), transparent);
        border-radius: 50%;
    }
`;

/* ─── Logo ───────────────────────────────────────────────────── */
const LogoBadge = styled(motion.div)`
    width: 54px;
    height: 54px;
    border-radius: 14px;
    background: rgba(8, 205, 0, 0.06);
    border: 1px solid rgba(8, 205, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    animation: ${floatUp} 3.5s ease-in-out infinite;
`;

/* Use styled('circle') not styled.circle — SVG elements need string form to avoid keyframe interpolation errors */
const Led = styled('circle')`animation: ${ledBlink} 2.4s ease-in-out infinite;`;
const Led2 = styled('circle')`animation: ${ledBlink} 2.4s ease-in-out infinite 1.2s;`;

const LogoSvg = () => (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="28" height="8" rx="2.5" fill="rgba(8,205,0,0.1)" stroke="rgba(8,205,0,0.7)" strokeWidth="0.8"/>
        <rect x="4" y="8.5" width="11" height="3" rx="1" fill="rgba(8,205,0,0.15)"/>
        <Led cx="22" cy="10" r="2" fill="#08cd00"/>
        <Led2 cx="26.5" cy="10" r="1.5" fill="#08cd00" opacity="0.4"/>
        <rect x="2" y="17" width="28" height="8" rx="2.5" fill="rgba(8,205,0,0.1)" stroke="rgba(8,205,0,0.7)" strokeWidth="0.8"/>
        <rect x="4" y="19.5" width="8" height="3" rx="1" fill="rgba(8,205,0,0.15)"/>
        <Led cx="22" cy="21" r="1.5" fill="#08cd00" opacity="0.45"/>
        <Led2 cx="26.5" cy="21" r="2" fill="#08cd00"/>
    </svg>
);

/* ─── Typography ─────────────────────────────────────────────── */
const Title = styled.h1`
    text-align: center;
    font-size: 1.4rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 3px;
    letter-spacing: -0.03em;
    font-family: 'Inter', sans-serif;
`;

const Subtitle = styled.p`
    text-align: center;
    color: #4b5563;
    font-size: 0.7rem;
    margin: 0 0 24px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Inter', sans-serif;
`;

/* ─── Flash message override ─────────────────────────────────── */
const FlashWrap = styled.div`
    margin-bottom: 16px;

    /* Override default flash colors for dark theme */
    [role='alert'], .flash-message, div[class*='bg-red'], div[class*='bg-yellow'] {
        background: rgba(239,68,68,0.08) !important;
        border: 1px solid rgba(239,68,68,0.25) !important;
        border-radius: 8px !important;
        color: #fca5a5 !important;
        font-size: 0.8rem !important;
        font-family: 'Inter', sans-serif !important;
        padding: 10px 14px !important;
    }
`;

/* ─── Footer ─────────────────────────────────────────────────── */
const Footer = styled.p`
    text-align: center;
    color: #374151;
    font-size: 0.66rem;
    margin-top: 16px;
    letter-spacing: 0.01em;
    font-family: 'Inter', sans-serif;

    a {
        color: rgba(8, 205, 0, 0.3);
        text-decoration: none;
        transition: color 0.15s;
        &:hover { color: rgba(8, 205, 0, 0.65); }
    }
`;

const Container = styled.div`
    width: 100%;
    ${breakpoint('xl')`
        max-width: 400px;
    `};
`;

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <GlobalStyle>
        <Scene>
            {/* Ambient glows */}
            <Glow top={'-20%'} left={'-15%'} size={500} color={'rgba(8,205,0,0.18)'}/>
            <Glow top={'60%'}  left={'65%'}  size={380} color={'rgba(8,205,0,0.10)'}/>

            <Container>
                <Card
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                    <LogoBadge
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <LogoSvg/>
                    </LogoBadge>

                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.32 }}
                    >
                        <Title>AquiaTheme</Title>
                        <Subtitle>Game Server Management</Subtitle>
                    </motion.div>

                    <FlashWrap>
                        <FlashMessageRender/>
                    </FlashWrap>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.22, duration: 0.3 }}
                    >
                        <Form {...props} ref={ref}>
                            {props.children}
                        </Form>
                    </motion.div>
                </Card>

                <Footer>
                    &copy; {new Date().getFullYear()}&nbsp;
                    <a rel={'noopener nofollow noreferrer'} href={'https://wiskcraft.com'} target={'_blank'}>
                        WiskCraft
                    </a>
                    &nbsp;&mdash;&nbsp;
                    <a rel={'noopener nofollow noreferrer'} href={'https://pterodactyl.io'} target={'_blank'}>
                        Pterodactyl
                    </a>
                </Footer>
            </Container>
        </Scene>
    </GlobalStyle>
));
