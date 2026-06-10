import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import { motion } from 'framer-motion';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
        }
    }, [title]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <ContentContainer css={tw`my-4 sm:my-10`} className={className}>
                {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
                {children}
            </ContentContainer>
            <ContentContainer css={tw`mb-4`}>
                <p css={tw`text-center text-xs`} style={{ color: '#1e293b' }}>
                    <a
                        rel={'noopener nofollow noreferrer'}
                        href={'https://wiskcraft.com'}
                        target={'_blank'}
                        style={{ color: '#1e293b', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,212,255,0.5)')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#1e293b')}
                    >
                        Aquia Theme&reg;
                    </a>
                    &nbsp;&copy; 2022 - {new Date().getFullYear()}
                </p>
            </ContentContainer>
        </motion.div>
    );
};

export default PageContentBlock;
