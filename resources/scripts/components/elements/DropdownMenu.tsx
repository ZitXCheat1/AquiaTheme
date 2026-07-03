import React, { createRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';

interface Props {
    children: React.ReactNode;
    renderToggle: (onClick: (e: React.MouseEvent<any, MouseEvent>) => void) => React.ReactChild;
}

export const DropdownButtonRow = styled.button<{ danger?: boolean }>`
    ${tw`px-3 py-2 flex items-center rounded-md w-full text-neutral-200 text-sm`};
    transition: 150ms all ease;

    &:hover {
        ${(props) => (props.danger ? tw`text-red-200 bg-red-500/20` : tw`text-white bg-neutral-700`)};
    }
`;

interface State {
    posX: number;
    posY: number;
    visible: boolean;
}

class DropdownMenu extends React.PureComponent<Props, State> {
    menu = createRef<HTMLDivElement>();

    state: State = {
        posX: 0,
        posY: 0,
        visible: false,
    };

    componentWillUnmount() {
        this.removeListeners();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const menu = this.menu.current;

        if (this.state.visible && !prevState.visible && menu) {
            document.addEventListener('click', this.windowListener);
            document.addEventListener('contextmenu', this.contextMenuListener);

            const width = menu.clientWidth;
            const height = menu.clientHeight;
            const margin = 8;

            // Right-align the menu to the anchor point, then clamp inside the viewport.
            let left = this.state.posX - width;
            if (left < margin) left = margin;
            if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;

            // Prefer opening below the anchor; flip above if it would overflow.
            let top = this.state.posY + 8;
            if (top + height > window.innerHeight - margin) {
                top = this.state.posY - height - 8;
            }
            if (top < margin) top = margin;

            menu.style.left = `${Math.round(left)}px`;
            menu.style.top = `${Math.round(top)}px`;
        }

        if (!this.state.visible && prevState.visible) {
            this.removeListeners();
        }
    }

    removeListeners = () => {
        document.removeEventListener('click', this.windowListener);
        document.removeEventListener('contextmenu', this.contextMenuListener);
    };

    onClickHandler = (e: React.MouseEvent<any, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        this.triggerMenu(rect.right, rect.bottom);
    };

    contextMenuListener = () => this.setState({ visible: false });

    windowListener = (e: MouseEvent) => {
        const menu = this.menu.current;

        if (e.button === 2 || !this.state.visible || !menu) {
            return;
        }

        if (e.target === menu || menu.contains(e.target as Node)) {
            return;
        }

        if (e.target !== menu && !menu.contains(e.target as Node)) {
            this.setState({ visible: false });
        }
    };

    triggerMenu = (posX: number, posY?: number) =>
        this.setState((s) => ({
            posX: !s.visible ? posX : s.posX,
            // When only a single coordinate is provided (e.g. legacy right-click handlers),
            // fall back to the cursor's vertical position so the menu never lands off-screen.
            posY: !s.visible ? (typeof posY === 'number' ? posY : posX) : s.posY,
            visible: !s.visible,
        }));

    render() {
        return (
            <div>
                {this.props.renderToggle(this.onClickHandler)}
                {ReactDOM.createPortal(
                    <Fade timeout={150} in={this.state.visible} unmountOnExit>
                        <div
                            ref={this.menu}
                            onClick={(e) => {
                                e.stopPropagation();
                                this.setState({ visible: false });
                            }}
                            style={{ width: '13rem', position: 'fixed', top: 0, left: 0 }}
                            css={tw`bg-neutral-800 p-1.5 rounded-lg border border-neutral-700 shadow-2xl text-neutral-200 z-50`}
                        >
                            {this.props.children}
                        </div>
                    </Fade>,
                    document.body
                )}
            </div>
        );
    }
}

export default DropdownMenu;
