import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export interface Props {
    isLight?: boolean;
    hasError?: boolean;
}

const light = css<Props>`
    background: rgba(255,255,255,0.07);
    border-color: rgba(0,212,255,0.2);
    color: #e2e8f0;
    &:focus {
        border-color: rgba(0,212,255,0.5);
    }

    &:disabled {
        opacity: 0.5;
    }
`;

const checkboxStyle = css<Props>`
    ${tw`bg-neutral-500 cursor-pointer appearance-none inline-block align-middle select-none flex-shrink-0 w-4 h-4 text-primary-400 border border-neutral-300 rounded-sm`};
    color-adjust: exact;
    background-origin: border-box;
    transition: all 75ms linear, box-shadow 25ms linear;

    &:checked {
        ${tw`border-transparent bg-no-repeat bg-center`};
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-color: currentColor;
        background-size: 100% 100%;
    }

    &:focus {
        ${tw`outline-none border-primary-300`};
        box-shadow: 0 0 0 1px rgba(9, 103, 210, 0.25);
    }
`;

const inputStyle = css<Props>`
    resize: none;
    ${tw`appearance-none outline-none w-full min-w-0`};
    ${tw`p-3 rounded text-sm transition-all duration-150`};
    background: rgba(0, 212, 255, 0.04);
    border: 1.5px solid rgba(0, 212, 255, 0.18);
    color: #e2e8f0;
    box-shadow: none;

    &::placeholder {
        color: rgba(148, 163, 184, 0.5);
    }

    & + .input-help {
        ${tw`mt-1 text-xs`};
        ${(props) => (props.hasError ? tw`text-red-200` : tw`text-neutral-200`)};
    }

    &:required,
    &:invalid {
        box-shadow: none;
    }

    &:hover:not(:disabled):not(:read-only) {
        border-color: rgba(0, 212, 255, 0.35);
        background: rgba(0, 212, 255, 0.07);
    }

    &:not(:disabled):not(:read-only):focus {
        border-color: rgba(0, 212, 255, 0.55);
        background: rgba(0, 212, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.12);
        ${(props) => props.hasError && 'border-color: rgba(239,68,68,0.6); box-shadow: 0 0 0 3px rgba(239,68,68,0.12);'};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    ${(props) => props.isLight && light};
    ${(props) => props.hasError && 'border-color: rgba(239,68,68,0.5); color: #fca5a5;'};
`;

const Input = styled.input<Props>`
    &:not([type='checkbox']):not([type='radio']) {
        ${inputStyle};
    }

    &[type='checkbox'],
    &[type='radio'] {
        ${checkboxStyle};

        &[type='radio'] {
            ${tw`rounded-full`};
        }
    }
`;
const Textarea = styled.textarea<Props>`
    ${inputStyle}
`;

export { Textarea };
export default Input;
