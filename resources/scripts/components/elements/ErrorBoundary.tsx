import React from 'react';
import tw from 'twin.macro';
import Icon from '@/components/elements/Icon';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface State {
    hasError: boolean;
    error: Error | null;
}

// eslint-disable-next-line @typescript-eslint/ban-types
class ErrorBoundary extends React.Component<{}, State> {
    state: State = {
        hasError: false,
        error: null,
    };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        console.error(error);
    }

    render() {
        return this.state.hasError ? (
            <div css={tw`flex items-center justify-center w-full my-6 px-4`}>
                <div
                    css={tw`flex items-start gap-3 max-w-lg w-full rounded-xl p-4`}
                    style={{
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                    }}
                >
                    <div
                        css={tw`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5`}
                        style={{ background: 'rgba(239, 68, 68, 0.12)' }}
                    >
                        <Icon icon={faExclamationTriangle} css={tw`h-4 w-4 text-red-400`} />
                    </div>
                    <div css={tw`flex-1 min-w-0`}>
                        <p css={tw`text-sm font-semibold text-red-400 mb-1`}>Something went wrong</p>
                        <p css={tw`text-xs text-neutral-400 leading-relaxed`}>
                            An error was encountered while rendering this view. Try refreshing the page.
                        </p>
                        {this.state.error?.message && (
                            <p
                                css={tw`text-xs mt-2 font-mono truncate`}
                                style={{ color: 'rgba(239, 68, 68, 0.5)' }}
                                title={this.state.error.message}
                            >
                                {this.state.error.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            this.props.children
        );
    }
}

export default ErrorBoundary;
