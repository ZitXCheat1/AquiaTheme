import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components/macro';
import Input, { Props as BaseProps } from '@/components/elements/Input';

/**
 * SmoothInput is a drop-in replacement for the styled <Input> that hides the
 * native text caret and renders its own. The custom caret is wider, glowing,
 * and animates between positions with a cubic-bezier ease so it visibly trails
 * the actual selection while typing or arrow-key navigating.
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
    /* Hide the native caret — we draw our own. */
    caret-color: transparent;
`;

const Mirror = styled.span`
    /* Off-screen text-width measurement element. Must match the input's font. */
    position: absolute;
    left: -99999px;
    top: 0;
    visibility: hidden;
    white-space: pre;
    pointer-events: none;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem; /* matches tw text-sm in Input */
`;

const Caret = styled.div<{ $visible: boolean; $typing: boolean }>`
    position: absolute;
    pointer-events: none;
    width: 3px;
    border-radius: 2px;
    background: #08cd00;
    box-shadow: 0 0 6px rgba(8, 205, 0, 0.55), 0 0 12px rgba(8, 205, 0, 0.25);
    opacity: ${p => p.$visible ? 1 : 0};
    transition:
        transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.18s ease,
        width 0.15s ease;
    will-change: transform, opacity;
    animation: ${blink} 1.1s ease-in-out infinite;
    /* While typing/moving, suspend the blink so the trail stays solid. */
    ${p => p.$typing && 'animation: none;'}
`;

interface SmoothInputProps extends BaseProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {}

const SmoothInput = forwardRef<HTMLInputElement, SmoothInputProps>((props, forwardedRef) => {
    const localRef = useRef<HTMLInputElement>(null);
    const inputRef = (forwardedRef as React.MutableRefObject<HTMLInputElement>) || localRef;
    const mirrorRef = useRef<HTMLSpanElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    const [caret, setCaret] = useState({ x: 0, y: 0, height: 16, visible: false });
    const [typing, setTyping] = useState(false);
    const typingTimeout = useRef<number | null>(null);

    const update = useCallback(() => {
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        const wrap = wrapRef.current;
        if (!input || !mirror || !wrap) return;

        // Don't render a caret when not editable or selection is a range.
        if (input.readOnly || input.disabled) {
            setCaret(c => ({ ...c, visible: false }));
            return;
        }

        const pos = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? pos;
        if (pos !== end) {
            // The user has highlighted a range — hide our caret and let the native
            // selection box do its thing.
            setCaret(c => ({ ...c, visible: false }));
            return;
        }

        // Mirror the font properties so offsetWidth matches the input's render.
        const cs = window.getComputedStyle(input);
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

        // Hide if the caret has scrolled outside the visible input area.
        const visible = document.activeElement === input
            && x >= inputLeftInWrap + padLeft - 2
            && x <= inputRightInWrap - padLeft + 2;

        setCaret({ x, y, height: caretHeight, visible });
    }, [inputRef]);

    // Re-measure on every layout-affecting change.
    useLayoutEffect(() => { update(); }, [update, props.value]);

    useEffect(() => {
        const onResize = () => update();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [update]);

    const flashTyping = () => {
        setTyping(true);
        if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
        typingTimeout.current = window.setTimeout(() => setTyping(false), 450);
    };

    return (
        <Wrap ref={wrapRef}>
            <StyledInput
                ref={inputRef as React.Ref<HTMLInputElement>}
                {...props}
                onFocus={(e) => { update(); props.onFocus?.(e); }}
                onBlur={(e) => { setCaret(c => ({ ...c, visible: false })); props.onBlur?.(e); }}
                onChange={(e) => { flashTyping(); props.onChange?.(e); requestAnimationFrame(update); }}
                onKeyDown={(e) => { flashTyping(); props.onKeyDown?.(e); requestAnimationFrame(update); }}
                onKeyUp={(e) => { props.onKeyUp?.(e); update(); }}
                onClick={(e) => { props.onClick?.(e); update(); }}
                onSelect={(e) => { props.onSelect?.(e as any); update(); }}
                onScroll={(e) => { props.onScroll?.(e); update(); }}
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
