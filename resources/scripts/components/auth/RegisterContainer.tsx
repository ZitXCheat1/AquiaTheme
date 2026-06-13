import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Formik, FormikHelpers } from 'formik';
import { object, string, boolean, ref } from 'yup';
import tw from 'twin.macro';
import styled, { keyframes } from 'styled-components/macro';
import { motion } from 'framer-motion';
import http from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import useFlash from '@/plugins/useFlash';

const blink = keyframes`
    0%, 65%  { caret-color: #08cd00; }
    66%, 100% { caret-color: transparent; }
`;

const StyledInput = styled.input`
    ${tw`w-full px-4 py-3 text-sm font-mono outline-none`};
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 9px;
    color: #f1f5f9;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    transition: border-color 0.15s, background 0.15s;
    caret-color: #08cd00;
    animation: ${blink} 1.1s step-end infinite;

    &:focus {
        border-color: rgba(8, 205, 0, 0.4);
        background: rgba(255,255,255,0.06);
        outline: none;
    }

    &::placeholder { color: rgba(255,255,255,0.18); }
`;

const Label = styled.label`
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #4b5a72;
    margin-bottom: 6px;
    font-family: 'Inter', sans-serif;
`;

const ErrorMsg = styled.p`
    color: #ef4444;
    font-size: 0.75rem;
    margin-top: 4px;
    font-family: 'Inter', sans-serif;
`;

interface Values {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    agree: boolean;
}

const fieldVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] } }),
};

const RegisterContainer = () => {
    const history = useHistory();
    const { addFlash, clearFlashes } = useFlash();
    const [success, setSuccess] = useState(false);

    const submit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        try {
            await http.post('/api/client/account', {
                username: values.username,
                email: values.email,
                password: values.password,
                password_confirmation: values.confirmPassword,
            });
            setSuccess(true);
        } catch (err: any) {
            const msg = err?.response?.data?.errors?.[0]?.detail || 'Registration is currently disabled on this server.';
            addFlash({ type: 'error', key: 'auth:register', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: 360, margin: '0 auto', textAlign: 'center', padding: '40px 24px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(8,205,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#08cd00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Account Requested</h2>
                <p style={{ color: '#6b7a96', fontSize: '0.85rem', marginBottom: 24 }}>Your account request has been submitted. An admin will review and activate it shortly.</p>
                <Link to='/auth/login' style={{ color: '#08cd00', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>← Back to Login</Link>
            </div>
        );
    }

    return (
        <Formik
            initialValues={{ username: '', email: '', password: '', confirmPassword: '', agree: false }}
            validationSchema={object({
                username: string().min(3, 'Username must be at least 3 characters.').max(32).required('Username is required.'),
                email: string().email('A valid email address is required.').required('Email is required.'),
                password: string().min(8, 'Password must be at least 8 characters.').required('Password is required.'),
                confirmPassword: string()
                    .oneOf([ref('password')], 'Passwords do not match.')
                    .required('Please confirm your password.'),
                agree: boolean().oneOf([true], 'You must agree to the terms.'),
            })}
            onSubmit={submit}
        >
            {({ isSubmitting, values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
                <LoginFormContainer title={'Create Account'} css={tw`w-full flex`}>

                    <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" style={{ marginBottom: 14 }}>
                        <Label>Username</Label>
                        <StyledInput
                            name="username"
                            type="text"
                            placeholder="yourcoolname"
                            value={values.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="username"
                        />
                        {touched.username && errors.username && <ErrorMsg>{errors.username}</ErrorMsg>}
                    </motion.div>

                    <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" style={{ marginBottom: 14 }}>
                        <Label>Email Address</Label>
                        <StyledInput
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="email"
                        />
                        {touched.email && errors.email && <ErrorMsg>{errors.email}</ErrorMsg>}
                    </motion.div>

                    <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" style={{ marginBottom: 14 }}>
                        <Label>Password</Label>
                        <StyledInput
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                        />
                        {touched.password && errors.password && <ErrorMsg>{errors.password}</ErrorMsg>}
                    </motion.div>

                    <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" style={{ marginBottom: 18 }}>
                        <Label>Confirm Password</Label>
                        <StyledInput
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                        />
                        {touched.confirmPassword && errors.confirmPassword && <ErrorMsg>{errors.confirmPassword}</ErrorMsg>}
                    </motion.div>

                    <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" style={{ marginBottom: 22 }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            <div
                                onClick={() => setFieldValue('agree', !values.agree)}
                                style={{
                                    width: 18, height: 18, minWidth: 18,
                                    borderRadius: 5,
                                    border: `1.5px solid ${values.agree ? '#08cd00' : 'rgba(255,255,255,0.15)'}`,
                                    background: values.agree ? 'rgba(8,205,0,0.18)' : 'rgba(255,255,255,0.04)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                    cursor: 'pointer',
                                    marginTop: 1,
                                }}
                            >
                                {values.agree && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#08cd00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#6b7a96', lineHeight: 1.5 }}>
                                I agree to the{' '}
                                <a href="#" style={{ color: '#08cd00', textDecoration: 'none' }}>Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" style={{ color: '#08cd00', textDecoration: 'none' }}>Privacy Policy</a>
                            </span>
                        </label>
                        {touched.agree && errors.agree && <ErrorMsg style={{ marginTop: 6 }}>{errors.agree}</ErrorMsg>}
                    </motion.div>

                    <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            onClick={() => handleSubmit()}
                            style={{
                                width: '100%',
                                padding: '11px',
                                background: '#08cd00',
                                border: 'none',
                                borderRadius: '9px',
                                color: '#050d05',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                fontFamily: 'Inter, sans-serif',
                                letterSpacing: '0.02em',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.6 : 1,
                                transition: 'opacity 0.15s, transform 0.15s',
                            }}
                        >
                            {isSubmitting ? 'Creating Account…' : 'Create Account'}
                        </button>
                    </motion.div>

                    <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible"
                        style={{ textAlign: 'center', marginTop: 18, fontSize: '0.8rem', color: '#4b5a72', fontFamily: 'Inter, sans-serif' }}
                    >
                        Already have an account?{' '}
                        <Link to='/auth/login' style={{ color: '#08cd00', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                    </motion.div>

                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default RegisterContainer;
