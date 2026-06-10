import React, { ReactNode } from 'react';
import '@/assets/css/sidebar.css';
import { motion } from 'framer-motion';

type ParentProps = {
    children: ReactNode;
};

const sidebarVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.055,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden:  { x: -12, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export const SidebarItem = ({ children }: { children: ReactNode }) => (
    <motion.div variants={itemVariants}>{children}</motion.div>
);

export default ({ children }: Omit<ParentProps, 'render'>) => (
    <motion.div
        className='sidebar'
        id='sidebar'
        variants={sidebarVariants}
        initial='hidden'
        animate='visible'
    >
        {children}
    </motion.div>
);
