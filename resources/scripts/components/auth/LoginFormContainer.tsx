import React, { forwardRef } from 'react';
import { Form } from 'formik';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

/* ─── Keyframes ──────────────────────────────────────────────── */
const gridPulse = keyframes`
    0%, 100% { opacity: 0.025; }
    50%       { opacity: 0.055; }
`;
const ledBlink = keyframes`
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
`;
const scanline = keyframes`
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 0.04; }
    90%  { opacity: 0.04; }
    100% { transform: translateY(800%); opacity: 0; }
`;

/* ─── Scene ──────────────────────────────────────────────────── */
const Scene = styled.div`
    min-height: 100vh;
    width: 100%;
    background: #060b06;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(8, 205, 0, 0.045) 1px, transparent 1px);
        background-size: 28px 28px;
        animation: ${gridPulse} 4s ease-in-out infinite;
        pointer-events: none;
    }
`;

/* Scanline sweep */
const Scanline = styled.div`
    position: absolute;
    left: 0; right: 0;
    height: 120px;
    background: linear-gradient(to bottom, transparent, rgba(8,205,0,0.03), transparent);
    animation: ${scanline} 7s linear infinite;
    pointer-events: none;
    z-index: 1;
`;

const Glow = styled.div<{ top: string; left: string; size: number; color: string; delay?: string }>`
    position: absolute;
    width: ${p => p.size}px;
    height: ${p => p.size}px;
    top: ${p => p.top};
    left: ${p => p.left};
    background: radial-gradient(circle, ${p => p.color}, transparent 70%);
    border-radius: 50%;
    filter: blur(${p => Math.round(p.size * 0.4)}px);
    pointer-events: none;
    opacity: 0.35;
`;

/* ─── Card ───────────────────────────────────────────────────── */
const Card = styled(motion.div)`
    position: relative;
    z-index: 10;
    background: rgba(10, 15, 10, 0.92);
    border: 1px solid rgba(8, 205, 0, 0.15);
    border-radius: 18px;
    width: 100%;
    max-width: 420px;
    padding: 38px 34px 30px;
    margin: 16px;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
        0 0 0 1px rgba(8, 205, 0, 0.04),
        0 24px 64px rgba(0, 0, 0, 0.7),
        0 0 40px rgba(8, 205, 0, 0.04) inset;

    &::before {
        content: '';
        position: absolute;
        top: 0; left: 10%; right: 10%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(8,205,0,0.4), transparent);
        border-radius: 50%;
    }
`;

/* ─── Logo / server rack ─────────────────────────────────────── */
const LogoBadge = styled(motion.div)`
    width: 58px;
    height: 58px;
    border-radius: 15px;
    background: rgba(8, 205, 0, 0.07);
    border: 1px solid rgba(8, 205, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    box-shadow: 0 0 20px rgba(8, 205, 0, 0.08);
`;

const Led = styled.circle`
    animation: ${ledBlink} 2s ease-in-out infinite;
`;
const Led2 = styled.circle`
    animation: ${ledBlink} 2s ease-in-out infinite 1s;
`;

const LogoSvg = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="28" height="8" rx="2.5" fill="rgba(8,205,0,0.12)" stroke="#08cd00" strokeWidth="0.9"/>
        <rect x="4" y="8.5" width="12" height="3" rx="1" fill="rgba(8,205,0,0.18)"/>
        <Led cx="22" cy="10" r="2" fill="#08cd00"/>
        <Led2 cx="26.5" cy="10" r="2" fill="#08cd00" opacity="0.45"/>

        <rect x="2" y="17" width="28" height="8" rx="2.5" fill="rgba(8,205,0,0.12)" stroke="#08cd00" strokeWidth="0.9"/>
        <rect x="4" y="19.5" width="12" height="3" rx="1" fill="rgba(8,205,0,0.18)"/>
        <Led cx="22" cy="21" r="2" fill="#08cd00" opacity="0.5" style={{ animationDelay: '0.5s' }}/>
        <Led2 cx="26.5" cy="21" r="2" fill="#08cd00"/>
    </svg>
);

/* ─── Typography ─────────────────────────────────────────────── */
const Title = styled.h1`
    text-align: center;
    font-size: 1.45rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 4px;
    letter-spacing: -0.025em;
`;

const Subtitle = styled.p`
    text-align: center;
    color: #94a3b8;
    font-size: 0.75rem;
    margin: 0 0 26px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
`;

const Divider = styled.div`
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(8,205,0,0.15), transparent);
    margin: 22px 0;
`;

const BadgeRow = styled(motion.div)`
    display: flex;
    justify-content: center;
    gap: 18px;
    margin-bottom: 4px;
`;

const Badge = styled.span`
    font-size: 0.67rem;
    color: #2a3d2a;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 5px;

    &::before {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(8, 205, 0, 0.25);
        display: inline-block;
    }
`;

const Footer = styled.p`
    text-align: center;
    color: #1e2e1e;
    font-size: 0.68rem;
    margin-top: 18px;
    letter-spacing: 0.01em;

    a {
        color: rgba(8, 205, 0, 0.35);
        text-decoration: none;
        transition: color 0.15s;

        &:hover {
            color: rgba(8, 205, 0, 0.7);
        }
    }
`;

const Container = styled.div`
    width: 100%;
    ${breakpoint('xl')`
        max-width: 440px;
    `};
`;

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Scene>
        {/* Ambient glows */}
        <Glow top={'-15%'} left={'-12%'} size={520} color={'rgba(8,205,0,0.22)'}/>
        <Glow top={'55%'}  left={'60%'}  size={420} color={'rgba(8,205,0,0.14)'}/>
        <Glow top={'30%'}  left={'40%'}  size={280} color={'rgba(74,222,128,0.06)'}/>

        {/* Scanline sweep */}
        <Scanline/>

        <Container>
            <Card
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Server rack logo */}
                <LogoBadge
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    <LogoSvg/>
                </LogoBadge>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.35 }}
                >
                    <Title>AquiaTheme</Title>
                    <Subtitle>Game Server Management</Subtitle>
                </motion.div>

                <FlashMessageRender css={tw`mb-4`}/>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26, duration: 0.38 }}
                >
                    <Form {...props} ref={ref}>
                        {props.children}
                    </Form>
                </motion.div>

                <Divider/>

                <BadgeRow
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.42, duration: 0.3 }}
                >
                    {['Secure', 'Managed', 'Always Online'].map(label => (
                        <Badge key={label}>{label}</Badge>
                    ))}
                </BadgeRow>
            </Card>

            <Footer>
                &copy; {new Date().getFullYear()}&nbsp;
                <a rel={'noopener nofollow noreferrer'} href={'https://wiskcraft.com'} target={'_blank'}>
                    AquiaTheme
                </a>
                &nbsp;&mdash;&nbsp;
                <a rel={'noopener nofollow noreferrer'} href={'https://pterodactyl.io'} target={'_blank'}>
                    Pterodactyl
                </a>
            </Footer>
        </Container>
    </Scene>
));
