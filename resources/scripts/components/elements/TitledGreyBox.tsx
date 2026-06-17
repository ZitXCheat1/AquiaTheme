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
        css={tw`rounded-2xl overflow-hidden`}
        className={className}
        style={{
            background: 'rgba(17, 22, 30, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 16px 40px -24px rgba(0,0,0,0.6)',
        }}
    >
        <div
            css={tw`px-5 py-3.5 flex items-center justify-between`}
            style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            }}
        >
            {typeof title === 'string' ? (
                <p
                    css={tw`text-2xs font-semibold uppercase text-neutral-300 flex items-center`}
                    style={{ letterSpacing: '0.12em' }}
                >
                    {icon && (
                        <span
                            css={tw`mr-2 w-6 h-6 rounded-md flex items-center justify-center text-neutral-300`}
                            style={{ background: 'rgba(8, 205, 0, 0.1)', color: '#08cd00' }}
                        >
                            <FontAwesomeIcon icon={icon} css={tw`text-2xs`} />
                        </span>
                    )}
                    {title}
                </p>
            ) : (
                title
            )}
        </div>
        <div css={tw`p-5`}>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
