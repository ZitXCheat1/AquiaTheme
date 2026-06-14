import React, {
    forwardRef, useCallback, useEffect, useLayoutEffect,
    useRef, useState,
} from 'react';
import styled, { keyframes } from 'styled-components/macro';
import Input, { Props as BaseProps } from '@/components/elements/Input';

/**
 * SmoothInput is an opt-in drop-in for <Input> that hides the native text
 * caret and renders its own wider, glowing caret. The custom caret animates
 * between positions with a cubic-bezier ease so it visibly trails the actual
 * selection while typing or arrow-key navigating.
 *
 * NOT wired into <Field> by default — opt-in per textbox to avoid breaking
 * legacy callers that pass non-input children or unusual ref shapes.
 */

const blink = keyframes`
    0%, 45% { opacity: 1; }
    55%, 100% { opacity: 0.15; }
`;

const Wrap = styled.div`
    position: relative;
    display: block;
    width: 100%;
`;

const StyledInput = styled(Input)`
    caret-color: transparent;
`;

const Mirror = styled.span`
    position: absolute;
    left: -99999px;
    top: 0;
    visibility: hidden;
    white-space: pre;
    pointer-events: none;
`;

const Caret = styled.div<{ $visible: boolean; $typing: boolean }>`
    position: absolute;
    pointer-events: none;
    width: 3px;
    border-radius: 2px;
    background: #08cd00;
    box-shadow: 0 0 6px rgba(8, 205, 0, 0.55), 0 0 12px rgba(8, 205, 0, 0.25);
    opacity: ${p => (p.$visible ? 1 : 0)};
    transition:
        transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.18s ease;
    will-change: transform, opacity;
    animation: ${blink} 1.1s ease-in-out infinite;
    ${p => p.$typing && 'animation: none;'}
`;

interface SmoothInputProps extends BaseProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {}

interface CaretState {
    x: number;
    y: number;
    height: number;
    visible: boolean;
}

const INITIAL_CARET: CaretState = { x: 0, y: 0, height: 16, visible: false };

const SmoothInput = forwardRef<HTMLInputElement, SmoothInputProps>((props, forwardedRef) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mirrorRef = useRef<HTMLSpanElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    const [caret, setCaret] = useState<CaretState>(INITIAL_CARET);
    const [typing, setTyping] = useState(false);
    const typingTimeout = useRef<number | null>(null);

    // Safely merge our internal ref with whatever the parent passed.
    const setInputRef = useCallback((node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof forwardedRef === 'function') {
            forwardedRef(node);
        } else if (forwardedRef && typeof forwardedRef === 'object') {
            (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
    }, [forwardedRef]);

    const update = useCallback(() => {
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        const wrap = wrapRef.current;
        if (!input || !mirror || !wrap) return;

        if (input.readOnly || input.disabled) {
            setCaret(c => (c.visible ? { ...c, visible: false } : c));
            return;
        }

        const pos = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? pos;
        if (pos !== end || document.activeElement !== input) {
            setCaret(c => (c.visible ? { ...c, visible: false } : c));
            return;
        }

        let cs: CSSStyleDeclaration;
        try {
            cs = window.getComputedStyle(input);
        } catch {
            return;
        }

        mirror.style.font = cs.font;
        mirror.style.letterSpacing = cs.letterSpacing;
        mirror.style.textTransform = cs.textTransform;
        mirror.textContent = (input.value || '').slice(0, pos);

        const inputRect = input.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        const padLeft = parseFloat(cs.paddingLeft) || 0;
        const padTop = parseFloat(cs.paddingTop) || 0;
        const fontSize = parseFloat(cs.fontSize) || 14;
        const caretHeight = Math.round(fontSize * 1.15);

        const inputLeftInWrap = inputRect.left - wrapRect.left;
        const inputRightInWrap = inputLeftInWrap + inputRect.width;
        const x = inputLeftInWrap + padLeft + mirror.offsetWidth - input.scrollLeft;
        const y = (inputRect.top - wrapRect.top) + padTop + (fontSize * 0.05);

        const visible = x >= inputLeftInWrap + padLeft - 2 && x <= inputRightInWrap - padLeft + 2;

        setCaret({ x, y, height: caretHeight, visible });
    }, []);

    useLayoutEffect(() => {
        update();
    }, [update, props.value]);

    useEffect(() => {
        const onResize = () => update();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [update]);

    useEffect(() => () => {
        if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    }, []);

    const flashTyping = () => {
        setTyping(true);
        if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
        typingTimeout.current = window.setTimeout(() => setTyping(false), 450);
    };

    const scheduleUpdate = () => requestAnimationFrame(update);

    return (
        <Wrap ref={wrapRef}>
            <StyledInput
                ref={setInputRef}
                {...props}
                onFocus={(e) => { scheduleUpdate(); if (typeof props.onFocus === 'function') props.onFocus(e); }}
                onBlur={(e) => { setCaret(c => ({ ...c, visible: false })); if (typeof props.onBlur === 'function') props.onBlur(e); }}
                onChange={(e) => { flashTyping(); if (typeof props.onChange === 'function') props.onChange(e); scheduleUpdate(); }}
                onKeyDown={(e) => { flashTyping(); if (typeof props.onKeyDown === 'function') props.onKeyDown(e); scheduleUpdate(); }}
                onKeyUp={(e) => { if (typeof props.onKeyUp === 'function') props.onKeyUp(e); scheduleUpdate(); }}
                onClick={(e) => { if (typeof props.onClick === 'function') props.onClick(e); scheduleUpdate(); }}
                onSelect={(e) => { if (typeof props.onSelect === 'function') props.onSelect(e); scheduleUpdate(); }}
                onScroll={(e) => { if (typeof props.onScroll === 'function') props.onScroll(e); scheduleUpdate(); }}
            />
            <Mirror ref={mirrorRef} aria-hidden='true' />
            <Caret
                $visible={caret.visible}
                $typing={typing}
                style={{
                    transform: `translate(${caret.x}px, ${caret.y}px)`,
                    height: `${caret.height}px`,
                }}
                aria-hidden='true'
            />
        </Wrap>
    );
});

SmoothInput.displayName = 'SmoothInput';

export default SmoothInput;
