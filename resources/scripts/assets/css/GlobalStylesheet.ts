import tw from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';
export default createGlobalStyle`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after {
        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    }

    body {
        ${tw`text-gray-200`};
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background: #0a0f0a;
        letter-spacing: -0.01em;
    }

    h1, h2, h3, h4, h5, h6 {
        ${tw`font-medium tracking-normal font-header`};
    }

    p {
        ${tw`text-gray-200 leading-snug font-sans`};
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Page transition */
    .fade-appear, .fade-enter {
        opacity: 0;
        transform: translateY(12px);
    }
    .fade-appear-active, .fade-enter-active {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 300ms cubic-bezier(0.22,1,0.36,1), transform 300ms cubic-bezier(0.22,1,0.36,1);
    }
    .fade-exit {
        opacity: 1;
    }
    .fade-exit-active {
        opacity: 0;
        transition: opacity 150ms ease;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
        background: none;
        width: 8px;
        height: 8px;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(8, 205, 0, 0.2);
        border-radius: 8px;
        border: 2px solid transparent;
        background-clip: content-box;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(8, 205, 0, 0.4);
        background-clip: content-box;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }

    /* Selection */
    ::selection {
        background: rgba(8, 205, 0, 0.25);
        color: white;
    }
`;
