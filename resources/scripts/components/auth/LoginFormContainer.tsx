import React, { forwardRef } from 'react';
import { Form } from 'formik';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import styled, { keyframes } from 'styled-components/macro';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faShieldHalved, faServer, faGlobe } from '@fortawesome/free-solid-svg-icons';

/* ── animated background orbs ── */
const orbFloat = keyframes`
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(40px, -30px) scale(1.08); }
    66%  { transform: translate(-25px, 20px) scale(0.94); }
    100% { transform: translate(0, 0) scale(1); }
`;

const gridShimmer = keyframes`
    0%   { opacity: 0.03; }
    50%  { opacity: 0.07; }
    100% { opacity: 0.03; }
`;

const Scene = styled.div`
    min-height: 100vh;
    width: 100%;
    background: #060b18;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    /* dot grid overlay */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(0,212,255,0.18) 1px, transparent 1px);
        background-size: 28px 28px;
        animation: ${gridShimmer} 5s ease-in-out infinite;
        pointer-events: none;
    }
`;

const Orb = styled.div<{ size: number; top: string; left: string; color: string; delay: string; duration: string }>`
    position: absolute;
    width: ${p => p.size}px;
    height: ${p => p.size}px;
    top: ${p => p.top};
    left: ${p => p.left};
    background: radial-gradient(circle at 40% 40%, ${p => p.color}, transparent 70%);
    border-radius: 50%;
    filter: blur(${p => Math.floor(p.size * 0.28)}px);
    animation: ${orbFloat} ${p => p.duration} ease-in-out infinite;
    animation-delay: ${p => p.delay};
    pointer-events: none;
    opacity: 0.55;
`;

const GlassCard = styled(motion.div)`
    position: relative;
    z-index: 10;
    background: rgba(13, 21, 48, 0.75);
    border: 1px solid rgba(0, 212, 255, 0.18);
    border-radius: 20px;
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
        0 24px 64px rgba(0,0,0,0.6),
        0 0 0 1px rgba(0,212,255,0.06),
        inset 0 1px 0 rgba(255,255,255,0.06);
    width: 100%;
    max-width: 440px;
    padding: 40px 36px;
    margin: 16px;
`;

const LogoBadge = styled(motion.div)`
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2));
    border: 1px solid rgba(0,212,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    color: #00d4ff;
    box-shadow: 0 0 24px rgba(0,212,255,0.25);
    margin: 0 auto 20px;
`;

const Title = styled.h1`
    text-align: center;
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0 0 4px;
    background: linear-gradient(90deg, #00d4ff, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const Subtitle = styled.p`
    text-align: center;
    color: #64748b;
    font-size: 0.82rem;
    margin: 0 0 28px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
`;

const Divider = styled.div`
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,212,255,0.25), transparent);
    margin: 24px 0;
`;

const FeatureRow = styled.div`
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 24px;
`;

const FeaturePill = styled(motion.div)`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: #475569;
    letter-spacing: 0.03em;

    svg {
        color: rgba(0,212,255,0.5);
        font-size: 0.75rem;
    }
`;

const Footer = styled.p`
    text-align: center;
    color: #334155;
    font-size: 0.72rem;
    margin-top: 24px;

    a {
        color: rgba(0,212,255,0.5);
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            color: #00d4ff;
        }
    }
`;

/* Layout container for breakpoints */
const Container = styled.div`
    width: 100%;
    ${breakpoint('xl')`
        max-width: 460px;
    `};
`;

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Scene>
        {/* Background orbs */}
        <Orb size={500} top={'-10%'}  left={'-15%'} color={'rgba(0,212,255,0.35)'}  delay={'0s'}    duration={'18s'} />
        <Orb size={400} top={'60%'}   left={'70%'}  color={'rgba(124,58,237,0.4)'}  delay={'-6s'}   duration={'22s'} />
        <Orb size={300} top={'30%'}   left={'55%'}  color={'rgba(0,212,255,0.2)'}   delay={'-12s'}  duration={'15s'} />
        <Orb size={250} top={'75%'}   left={'-5%'}  color={'rgba(124,58,237,0.25)'} delay={'-3s'}   duration={'20s'} />

        <Container>
            <GlassCard
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Logo */}
                <LogoBadge
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <FontAwesomeIcon icon={faDroplet} />
                </LogoBadge>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.4 }}
                >
                    <Title>Aquia Panel</Title>
                    <Subtitle>Game Server Management</Subtitle>
                </motion.div>

                <FlashMessageRender css={tw`mb-4`} />

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <Form {...props} ref={ref}>
                        {props.children}
                    </Form>
                </motion.div>

                <Divider />

                <FeatureRow>
                    {[
                        { icon: faShieldHalved, label: 'Secure' },
                        { icon: faServer,       label: 'Managed' },
                        { icon: faGlobe,        label: 'Online' },
                    ].map(({ icon, label }, i) => (
                        <FeaturePill
                            key={label}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.07, duration: 0.35 }}
                        >
                            <FontAwesomeIcon icon={icon} />
                            {label}
                        </FeaturePill>
                    ))}
                </FeatureRow>
            </GlassCard>

            <Footer>
                &copy; {new Date().getFullYear()}&nbsp;
                <a rel={'noopener nofollow noreferrer'} href={'https://wiskcraft.com'} target={'_blank'}>
                    Aquia Theme
                </a>
                &nbsp;&mdash;&nbsp;
                <a rel={'noopener nofollow noreferrer'} href={'https://pterodactyl.io'} target={'_blank'}>
                    Pterodactyl
                </a>
            </Footer>
        </Container>
    </Scene>
));
