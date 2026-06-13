import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import { useField } from 'formik';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { keyframes } from 'styled-components/macro';

/* Keyframe must be defined via styled-components keyframes helper — NOT raw @keyframes inside template */
const inputCaretBlink = keyframes`
    0%, 65%  { caret-color: #08cd00; }
    66%, 100% { caret-color: transparent; }
`;

interface Values {
    username: string;
    password: string;
}

/* ─── Cursor blink with delay ───────────────────────────────────── */
const blinkDelay = keyframes`
    0%, 60%  { opacity: 1; }
    61%, 100% { opacity: 0; }
`;

/* ─── Eye icon paths ─────────────────────────────────────────────── */
const EyeOpen = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const EyeClosed = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
);

/* ─── Field wrapper ──────────────────────────────────────────────── */
const FieldLabel = styled.label`
    display: block;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 7px;
    font-family: 'Inter', sans-serif;
`;

const InputWrap = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

const StyledInput = styled.input<{ $hasError?: boolean }>`
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid ${p => p.$hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'};
    border-radius: 9px;
    padding: 11px 44px 11px 14px;
    font-size: 0.875rem;
    color: #f1f5f9;
    font-family: 'Inter', sans-serif;

    /* Kill ALL browser default outlines — no blue ring ever */
    outline: none !important;
    box-shadow: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;

    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;

    /* Green cursor — stays visible 65% of the cycle, blinks off for 35% */
    caret-color: #08cd00;
    animation: ${inputCaretBlink} 1.3s step-end infinite;

    &:focus {
        outline: none !important;
        border-color: rgba(8, 205, 0, 0.45);
        background: rgba(8, 205, 0, 0.02);
        box-shadow: 0 0 0 3px rgba(8, 205, 0, 0.06) !important;
    }

    /* Replace blue selection rect with subtle green tint — no blue ever */
    &::selection {
        background: rgba(8, 205, 0, 0.18);
        color: #fff;
    }
    &::-moz-selection {
        background: rgba(8, 205, 0, 0.18);
        color: #fff;
    }

    &::placeholder {
        color: rgba(255,255,255,0.15);
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;

const EyeBtn = styled.button`
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.25);
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    transition: color 0.15s, background 0.15s;
    &:hover {
        color: rgba(255,255,255,0.7);
        background: rgba(255,255,255,0.05);
    }
    &:focus { outline: none; }
`;

const FieldError = styled(motion.p)`
    font-size: 0.72rem;
    color: #f87171;
    margin-top: 5px;
    font-family: 'Inter', sans-serif;
`;

/* Standalone password field with eye toggle */
const PasswordField = ({ disabled }: { disabled: boolean }) => {
    const [field, meta] = useField('password');
    const [visible, setVisible] = useState(false);
    const [eyeAnim, setEyeAnim] = useState(false);

    const toggle = () => {
        setEyeAnim(true);
        setTimeout(() => setEyeAnim(false), 300);
        setVisible(v => !v);
    };

    return (
        <div>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputWrap>
                <StyledInput
                    {...field}
                    id="password"
                    type={visible ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={disabled}
                    $hasError={!!(meta.touched && meta.error)}
                    autoComplete="current-password"
                />
                <EyeBtn type="button" onClick={toggle} tabIndex={-1} aria-label="Toggle password">
                    <motion.span
                        animate={eyeAnim ? { scale: [1, 1.35, 1], rotate: visible ? [0, -15, 0] : [0, 15, 0] } : {}}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex' }}
                    >
                        {visible ? <EyeOpen /> : <EyeClosed />}
                    </motion.span>
                </EyeBtn>
            </InputWrap>
            <AnimatePresence>
                {meta.touched && meta.error && (
                    <FieldError
                        key="err"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        {meta.error}
                    </FieldError>
                )}
            </AnimatePresence>
        </div>
    );
};

/* Standalone username field */
const UsernameField = ({ disabled }: { disabled: boolean }) => {
    const [field, meta] = useField('username');
    return (
        <div>
            <FieldLabel htmlFor="username">Username or Email</FieldLabel>
            <InputWrap>
                <StyledInput
                    {...field}
                    id="username"
                    type="text"
                    placeholder="you@example.com"
                    disabled={disabled}
                    $hasError={!!(meta.touched && meta.error)}
                    autoComplete="username"
                />
            </InputWrap>
            <AnimatePresence>
                {meta.touched && meta.error && (
                    <FieldError
                        key="err"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        {meta.error}
                    </FieldError>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Sign In button ─────────────────────────────────────────────── */
const SignInBtn = styled(motion.button)`
    width: 100%;
    padding: 12px;
    background: #08cd00;
    border: none;
    border-radius: 9px;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #021402;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(8, 205, 0, 0.2);
    transition: background 0.15s, box-shadow 0.15s;

    &:hover:not(:disabled) {
        background: #06b800;
        box-shadow: 0 6px 28px rgba(8, 205, 0, 0.3);
    }
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const Spinner = styled.span`
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(2,20,2,0.3);
    border-top-color: #021402;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    @keyframes spin { to { transform: rotate(360deg); } }
    vertical-align: middle;
    margin-right: 6px;
`;

/* ─── Divider with text ──────────────────────────────────────────── */
const OrDivider = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;

    &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255,255,255,0.07);
    }

    span {
        font-size: 0.68rem;
        color: #4b5563;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-family: 'Inter', sans-serif;
    }
`;

const fieldVariants = {
    hidden:  { opacity: 0, y: 10 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.07, duration: 0.38, ease: [0.22, 1, 0.36, 1] },
    }),
};

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => { clearFlashes(); }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }
                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);
                setToken('');
                if (ref.current) ref.current.reset();
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer css={tw`w-full flex flex-col`}>

                    <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                        <UsernameField disabled={isSubmitting} />
                    </motion.div>

                    <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" css={tw`mt-4`}>
                        <PasswordField disabled={isSubmitting} />
                    </motion.div>

                    {/* Forgot password inline */}
                    <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible"
                        css={tw`mt-2 flex justify-end`}>
                        <Link
                            to={'/auth/password'}
                            style={{
                                fontSize: '0.72rem',
                                color: 'rgba(8,205,0,0.4)',
                                textDecoration: 'none',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#08cd00')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(8,205,0,0.4)')}
                        >
                            Forgot password?
                        </Link>
                    </motion.div>

                    <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" css={tw`mt-5`}>
                        <SignInBtn
                            type="submit"
                            disabled={isSubmitting}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isSubmitting && <Spinner />}
                            {isSubmitting ? 'Signing in…' : 'Sign In'}
                        </SignInBtn>
                    </motion.div>

                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}

                    <OrDivider><span>or</span></OrDivider>

                    <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                        <Link
                            to='/auth/register'
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                padding: '11px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '9px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: '#94a3b8',
                                fontFamily: 'Inter, sans-serif',
                                textDecoration: 'none',
                                letterSpacing: '0.03em',
                                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
                                (e.currentTarget as HTMLElement).style.color = '#f1f5f9';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                            }}
                        >
                            Create Account
                        </Link>
                    </motion.div>

                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
