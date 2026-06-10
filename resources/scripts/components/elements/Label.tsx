import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Label = styled.label<{ isLight?: boolean }>`
    ${tw`block text-xs uppercase mb-1 sm:mb-2`};
    color: rgba(148, 163, 184, 0.8);
    letter-spacing: 0.08em;
    font-weight: 500;
`;

export default Label;
