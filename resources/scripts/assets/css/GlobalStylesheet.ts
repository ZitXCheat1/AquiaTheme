import tw from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';
// @ts-expect-error untyped font file
import font from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2';

export default createGlobalStyle`
    @font-face {
        font-family: 'IBM Plex Sans';
        font-style: normal;
        font-display: swap;
        font-weight: 100 700;
        src: url(${font}) format('woff2-variations');
        unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
    }

    body {
        ${tw`font-sans text-gray-200`};
        background: #0d0d17;
        letter-spacing: 0.015em;
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
        background: rgba(99, 102, 241, 0.2);
        border-radius: 8px;
        border: 2px solid transparent;
        background-clip: content-box;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(99, 102, 241, 0.4);
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
        background: rgba(99, 102, 241, 0.3);
        color: white;
    }
`;
