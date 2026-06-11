import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <div
        css={tw`rounded-xl overflow-hidden`}
        className={className}
        style={{
            background: 'rgba(14, 20, 14, 0.8)',
            border: '1px solid rgba(8, 205, 0, 0.08)',
            backdropFilter: 'blur(8px)',
        }}
    >
        <div
            css={tw`px-4 py-3`}
            style={{
                background: 'rgba(8, 205, 0, 0.03)',
                borderBottom: '1px solid rgba(8, 205, 0, 0.06)',
            }}
        >
            {typeof title === 'string' ? (
                <p css={tw`text-xs font-semibold uppercase tracking-wider`} style={{ color: '#7aab78' }}>
                    {icon && <FontAwesomeIcon icon={icon} css={tw`mr-2 text-neutral-400`} />}
                    {title}
                </p>
            ) : (
                title
            )}
        </div>
        <div css={tw`p-4`}>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
