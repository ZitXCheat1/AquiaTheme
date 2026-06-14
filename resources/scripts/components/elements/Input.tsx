import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export interface Props {
    isLight?: boolean;
    hasError?: boolean;
}

const light = css<Props>`
    background: rgba(8,205,0,0.05);
    border-color: rgba(8,205,0,0.18);
    color: #e8f5e8;
    &:focus {
        border-color: rgba(8,205,0,0.45);
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
    ${tw`rounded text-sm transition-all duration-150`};
    padding: 9px 12px;
    font-family: 'Inter', sans-serif;
    background: #0a0f0a;
    border: 1px solid rgba(8, 205, 0, 0.14);
    color: #e8f5e8;
    box-shadow: none;

    &::placeholder {
        color: #2a3d2a;
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
        border-color: rgba(8, 205, 0, 0.3);
        background: #0e140e;
    }

    &:not(:disabled):not(:read-only):focus {
        border-color: rgba(8, 205, 0, 0.45);
        background: #0e140e;
        box-shadow: 0 0 0 3px rgba(8, 205, 0, 0.12);
        ${(props) => props.hasError && 'border-color: rgba(239,68,68,0.6); box-shadow: 0 0 0 3px rgba(239,68,68,0.1);'};
    }

    &:read-only {
        background: #0a0f0a;
        color: #94a3b8;
        cursor: text;
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
