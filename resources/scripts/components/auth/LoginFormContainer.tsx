import React, { forwardRef } from 'react';
import { Form } from 'formik';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { motion } from 'framer-motion';

const Scene = styled.div`
    min-height: 100vh;
    width: 100%;
    background: #0d0d17;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px);
        background-size: 32px 32px;
        pointer-events: none;
    }
`;

const Glow = styled.div<{ top: string; left: string; size: number; color: string }>`
    position: absolute;
    width: ${p => p.size}px;
    height: ${p => p.size}px;
    top: ${p => p.top};
    left: ${p => p.left};
    background: radial-gradient(circle, ${p => p.color}, transparent 70%);
    border-radius: 50%;
    filter: blur(${p => Math.round(p.size * 0.35)}px);
    pointer-events: none;
    opacity: 0.4;
`;

const Card = styled(motion.div)`
    position: relative;
    z-index: 10;
    background: #13131f;
    border: 1px solid rgba(99, 102, 241, 0.18);
    border-radius: 16px;
    width: 100%;
    max-width: 420px;
    padding: 36px 32px;
    margin: 16px;
`;

const LogoBadge = styled(motion.div)`
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
`;

const LogoSvg = () => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 19L13 7L19 19" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 15.5H17" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
);

const Title = styled.h1`
    text-align: center;
    font-size: 1.4rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0 0 4px;
    letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
    text-align: center;
    color: #4b5563;
    font-size: 0.78rem;
    margin: 0 0 24px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
`;

const Divider = styled.div`
    height: 1px;
    background: rgba(99, 102, 241, 0.12);
    margin: 20px 0;
`;

const Footer = styled.p`
    text-align: center;
    color: #2d2d40;
    font-size: 0.7rem;
    margin-top: 20px;

    a {
        color: rgba(99, 102, 241, 0.5);
        text-decoration: none;
        transition: color 0.15s;

        &:hover {
            color: #6366f1;
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
        <Glow top={'-10%'} left={'-10%'} size={500} color={'rgba(99,102,241,0.3)'} />
        <Glow top={'60%'} left={'65%'} size={400} color={'rgba(129,140,248,0.2)'} />

        <Container>
            <Card
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <LogoBadge
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    <LogoSvg />
                </LogoBadge>

                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.35 }}
                >
                    <Title>AquiaTheme</Title>
                    <Subtitle>Game Server Management</Subtitle>
                </motion.div>

                <FlashMessageRender css={tw`mb-4`} />

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.35 }}
                >
                    <Form {...props} ref={ref}>
                        {props.children}
                    </Form>
                </motion.div>

                <Divider />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}
                >
                    {[
                        { label: 'Secure' },
                        { label: 'Managed' },
                        { label: 'Always Online' },
                    ].map(({ label }) => (
                        <span key={label} style={{ fontSize: '0.7rem', color: '#374151', letterSpacing: '0.04em' }}>
                            {label}
                        </span>
                    ))}
                </motion.div>
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
