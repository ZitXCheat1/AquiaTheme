import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto`};
    background: rgba(12, 15, 20, 0.65);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px);

    & > div {
        ${tw`flex items-center text-sm mx-auto px-4 gap-1`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`inline-flex items-center py-3 px-4 text-neutral-400 no-underline whitespace-nowrap transition-all duration-150 rounded-lg relative`};
            font-weight: 500;

            &:hover {
                ${tw`text-neutral-100`};
                background: rgba(255, 255, 255, 0.04);
            }

            &:active,
            &.active {
                ${tw`text-neutral-50`};
                background: rgba(8, 205, 0, 0.08);
            }

            &.active::after {
                content: '';
                position: absolute;
                left: 16px;
                right: 16px;
                bottom: -1px;
                height: 2px;
                border-radius: 2px;
                background: ${theme`colors.cyan.500`.toString()};
                box-shadow: 0 0 12px ${theme`colors.cyan.500`.toString()};
            }
        }
    }
`;

export default SubNavigation;
