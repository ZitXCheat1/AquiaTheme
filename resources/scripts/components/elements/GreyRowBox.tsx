import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded-xl no-underline text-neutral-200 items-center p-4 transition-all duration-150 overflow-hidden`};
    background: rgba(17, 22, 30, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(8px);

    ${(props) =>
        props.$hoverable !== false &&
        css`
            &:hover {
                background: rgba(22, 28, 38, 0.75);
                border-color: rgba(255, 255, 255, 0.09);
                transform: translateY(-1px);
            }
        `};

    & .icon {
        ${tw`rounded-xl w-14 h-14 flex items-center justify-center p-3`};
        background: rgba(255, 255, 255, 0.04);
    }
`;
