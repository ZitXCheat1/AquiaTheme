import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import styles from './style.module.css';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

export default ({ title, copyOnClick, icon, color, className, children }: StatBlockProps) => {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });

    const isWarning = color === 'bg-yellow-500';
    const isDanger = color === 'bg-red-500';

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames(styles.stat_block, className)}>
                <div className={classNames(styles.icon)}>
                    <Icon
                        icon={icon}
                        className={classNames({
                            'text-gray-400':  !isWarning && !isDanger,
                            'text-yellow-400': isWarning,
                            'text-red-400':    isDanger,
                        })}
                    />
                </div>
                <div className={'flex flex-col justify-center overflow-hidden w-full'}>
                    <p
                        className={'font-medium leading-tight mb-0.5'}
                        style={{ fontSize: '0.68rem', letterSpacing: '0.03em', color: '#6b7280', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}
                    >
                        {title}
                    </p>
                    <div
                        ref={ref}
                        className={'h-[1.6rem] w-full font-semibold truncate'}
                        style={{ fontSize, color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
