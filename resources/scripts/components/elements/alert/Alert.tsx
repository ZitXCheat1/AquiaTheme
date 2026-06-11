import { ExclamationIcon, ShieldExclamationIcon } from '@heroicons/react/outline';
import React from 'react';
import classNames from 'classnames';

interface AlertProps {
    type: 'warning' | 'danger';
    className?: string;
    children: React.ReactNode;
}

export default ({ type, className, children }: AlertProps) => {
    return (
        <div
            className={classNames(
                'flex items-center rounded-xl text-gray-50 px-4 py-3',
                {
                    ['border border-red-500/20 bg-red-500/10']: type === 'danger',
                    ['border border-yellow-500/20 bg-yellow-500/10']: type === 'warning',
                },
                className
            )}
            style={{ backdropFilter: 'blur(8px)' }}
        >
            {type === 'danger' ? (
                <ShieldExclamationIcon className={'w-5 h-5 text-red-400 mr-3 flex-shrink-0'} />
            ) : (
                <ExclamationIcon className={'w-5 h-5 text-yellow-400 mr-3 flex-shrink-0'} />
            )}
            <span className={'text-sm'}>{children}</span>
        </div>
    );
};
