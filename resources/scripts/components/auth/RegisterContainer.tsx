import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, FormikHelpers } from 'formik';
import { object, string, boolean, ref } from 'yup';
import styled, { keyframes } from 'styled-components/macro';
import { motion } from 'framer-motion';
import http from '@/api/http';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';

const gridFade = keyframes`0%,100%{opacity:.018}50%{opacity:.04}`;
const ledBlink = keyframes`0%,45%,100%{opacity:1}50%,95%{opacity:.2}`;
const floatUp = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}`;
const blink = keyframes`0%,65%{caret-color:#08cd00}66%,100%{caret-color:transparent}`;

const Scene = styled.div`
    min-height: 100vh;
    width: 100%;
    background: #080808;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
    *::selection { background: rgba(8,205,0,0.16); color:#fff; }
    &::before {
        content: '';
        position: absolute; inset: 0;
        background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 26px 26px;
        animation: ${gridFade} 5s ease-in-out infinite;
        pointer-events: none;
    }
`;

const Glow = styled.div<{ top: string; left: string; size: number; color: string }>`
    position: absolute;
    width: ${p => p.size}px; height: ${p => p.size}px;
    top: ${p => p.top}; left: ${p => p.left};
    background: radial-gradient(circle, ${p => p.color}, transparent 70%);
    border-radius: 50%;
    filter: blur(${p => Math.round(p.size * 0.38)}px);
    pointer-events: none; opacity: .45;
`;

const Card = styled(motion.div)`
    position: relative; z-index: 10;
    background: #0f0f0f;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    width: 100%; max-width: 460px;
    padding: 36px 32px 28px;
    margin: 16px;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 24px 80px rgba(0,0,0,0.8);
    &::before {
        content: '';
        position: absolute; top: 0; left: 12%; right: 12%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(8,205,0,0.35), transparent);
    }
`;

const LogoBadge = styled(motion.div)`
    width: 54px; height: 54px;
    border-radius: 14px;
    background: rgba(8,205,0,0.06);
    border: 1px solid rgba(8,205,0,0.15);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px;
    animation: ${floatUp} 3.5s ease-in-out infinite;
`;

const Led = styled('circle')`animation: ${ledBlink} 2.4s ease-in-out infinite;`;
const Led2 = styled('circle')`animation: ${ledBlink} 2.4s ease-in-out infinite 1.2s;`;

const LogoSvg = () => (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="6" width="28" height="8" rx="2.5" fill="rgba(8,205,0,0.1)" stroke="rgba(8,205,0,0.7)" strokeWidth="0.8"/>
        <rect x="4" y="8.5" width="11" height="3" rx="1" fill="rgba(8,205,0,0.15)"/>
        <Led cx="22" cy="10" r="2" fill="#08cd00"/>
        <Led2 cx="26.5" cy="10" r="1.5" fill="#08cd00" opacity="0.4"/>
        <rect x="2" y="17" width="28" height="8" rx="2.5" fill="rgba(8,205,0,0.1)" stroke="rgba(8,205,0,0.7)" strokeWidth="0.8"/>
        <rect x="4" y="19.5" width="8" height="3" rx="1" fill="rgba(8,205,0,0.15)"/>
        <Led cx="22" cy="21" r="1.5" fill="#08cd00" opacity="0.45"/>
        <Led2 cx="26.5" cy="21" r="2" fill="#08cd00"/>
    </svg>
);

const Title = styled.h1`text-align:center;font-size:1.4rem;font-weight:700;color:#f1f5f9;margin:0 0 3px;letter-spacing:-.03em;`;
const Subtitle = styled.p`text-align:center;color:#4b5563;font-size:.7rem;margin:0 0 22px;letter-spacing:.1em;text-transform:uppercase;`;

const Row = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;`;
const Field = styled.div`margin-bottom:14px;display:flex;flex-direction:column;`;

const Label = styled.label`
    display: block;
    font-size: .68rem; font-weight: 700;
    letter-spacing: .07em; text-transform: uppercase;
    color: #4b5a72; margin-bottom: 6px;
`;

const StyledInput = styled.input`
    width: 100%; padding: 10px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 9px; color: #f1f5f9;
    font-family: 'Inter', sans-serif; font-size: .85rem;
    transition: border-color .15s, background .15s;
    caret-color: #08cd00;
    animation: ${blink} 1.1s step-end infinite;
    box-sizing: border-box;
    &:focus { border-color: rgba(8,205,0,0.4); background: rgba(255,255,255,0.06); outline: none; }
    &::placeholder { color: rgba(255,255,255,0.18); }
`;

const ErrorMsg = styled.p`color:#ef4444;font-size:.73rem;margin:4px 0 0;`;

const CheckRow = styled.label`display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:20px;`;
const CheckBox = styled.div<{ checked: boolean }>`
    width:18px;height:18px;min-width:18px;border-radius:5px;margin-top:1px;
    border: 1.5px solid ${p => p.checked ? '#08cd00' : 'rgba(255,255,255,0.15)'};
    background: ${p => p.checked ? 'rgba(8,205,0,0.18)' : 'rgba(255,255,255,0.04)'};
    display:flex;align-items:center;justify-content:center;
    transition:all .15s ease;cursor:pointer;flex-shrink:0;
`;

const SubmitBtn = styled.button<{ disabled?: boolean }>`
    width:100%;padding:11px;
    background:#08cd00;border:none;border-radius:9px;
    color:#050d05;font-weight:700;font-size:.85rem;
    font-family:'Inter',sans-serif;letter-spacing:.02em;
    cursor:${p => p.disabled ? 'not-allowed' : 'pointer'};
    opacity:${p => p.disabled ? .6 : 1};
    transition:opacity .15s,transform .1s;
    &:hover:not(:disabled){transform:translateY(-1px);}
    &:active:not(:disabled){transform:translateY(0);}
`;

const Footer = styled.p`
    text-align:center;color:#374151;font-size:.66rem;margin-top:16px;letter-spacing:.01em;
    a{color:rgba(8,205,0,.3);text-decoration:none;transition:color .15s;&:hover{color:rgba(8,205,0,.65);}}
`;

const FlashWrap = styled.div`
    margin-bottom:14px;
    [role='alert'],[class*='bg-red'],[class*='bg-yellow']{
        background:rgba(239,68,68,0.08)!important;
        border:1px solid rgba(239,68,68,0.25)!important;
        border-radius:8px!important;color:#fca5a5!important;
        font-size:.8rem!important;padding:10px 14px!important;
    }
`;

const fv = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.32, ease: [0.22,1,0.36,1] } }),
};

interface Values { username: string; email: string; password: string; confirmPassword: string; agree: boolean; }

const RegisterContainer = () => {
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
            setSubmitting(false);
        }
    };

    if (success) return (
        <Scene>
            <Glow top='-20%' left='-15%' size={500} color='rgba(8,205,0,0.18)'/>
            <Card initial={{opacity:0,y:20,scale:.98}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.42,ease:[.22,1,.36,1]}}>
                <div style={{textAlign:'center',padding:'20px 0',fontFamily:'Inter,sans-serif'}}>
                    <div style={{width:56,height:56,borderRadius:16,background:'rgba(8,205,0,0.14)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#08cd00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <h2 style={{color:'#f1f5f9',fontSize:'1.1rem',fontWeight:700,marginBottom:8}}>Account Requested</h2>
                    <p style={{color:'#6b7a96',fontSize:'.85rem',marginBottom:24}}>Your request has been submitted. An admin will activate it shortly.</p>
                    <Link to='/auth/login' style={{color:'#08cd00',fontSize:'.82rem',fontWeight:600,textDecoration:'none'}}>← Back to Login</Link>
                </div>
            </Card>
        </Scene>
    );

    return (
        <Scene>
            <Glow top='-20%' left='-15%' size={500} color='rgba(8,205,0,0.18)'/>
            <Glow top='60%' left='65%' size={380} color='rgba(8,205,0,0.10)'/>

            <div style={{width:'100%',maxWidth:460,margin:'0 auto'}}>
                <Card
                    initial={{opacity:0,y:20,scale:.98}}
                    animate={{opacity:1,y:0,scale:1}}
                    transition={{duration:.42,ease:[.22,1,.36,1]}}
                >
                    <LogoBadge initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:.08,duration:.38,ease:[.22,1,.36,1]}}>
                        <LogoSvg/>
                    </LogoBadge>
                    <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:.15,duration:.32}}>
                        <Title>AquiaTheme</Title>
                        <Subtitle>Create Account</Subtitle>
                    </motion.div>

                    <FlashWrap><FlashMessageRender byKey='auth:register'/></FlashWrap>

                    <Formik
                        initialValues={{username:'',email:'',password:'',confirmPassword:'',agree:false}}
                        validationSchema={object({
                            username: string().min(3,'At least 3 characters.').max(32).required('Username is required.'),
                            email: string().email('Valid email required.').required('Email is required.'),
                            password: string().min(8,'At least 8 characters.').required('Password is required.'),
                            confirmPassword: string().oneOf([ref('password')],'Passwords do not match.').required('Confirm your password.'),
                            agree: boolean().oneOf([true],'You must agree to the terms.'),
                        })}
                        onSubmit={submit}
                    >
                        {({ isSubmitting, values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
                            <form onSubmit={handleSubmit} noValidate style={{display:'flex',flexDirection:'column'}}>

                                <Row>
                                    <motion.div custom={0} variants={fv} initial='hidden' animate='visible'>
                                        <Field>
                                            <Label htmlFor='username'>Username</Label>
                                            <StyledInput id='username' name='username' type='text' placeholder='coolname' value={values.username} onChange={handleChange} onBlur={handleBlur} autoComplete='username'/>
                                            {touched.username && errors.username && <ErrorMsg>{errors.username}</ErrorMsg>}
                                        </Field>
                                    </motion.div>
                                    <motion.div custom={1} variants={fv} initial='hidden' animate='visible'>
                                        <Field>
                                            <Label htmlFor='email'>Email Address</Label>
                                            <StyledInput id='email' name='email' type='email' placeholder='you@example.com' value={values.email} onChange={handleChange} onBlur={handleBlur} autoComplete='email'/>
                                            {touched.email && errors.email && <ErrorMsg>{errors.email}</ErrorMsg>}
                                        </Field>
                                    </motion.div>
                                </Row>

                                <Row>
                                    <motion.div custom={2} variants={fv} initial='hidden' animate='visible'>
                                        <Field>
                                            <Label htmlFor='password'>Password</Label>
                                            <StyledInput id='password' name='password' type='password' placeholder='••••••••' value={values.password} onChange={handleChange} onBlur={handleBlur} autoComplete='new-password'/>
                                            {touched.password && errors.password && <ErrorMsg>{errors.password}</ErrorMsg>}
                                        </Field>
                                    </motion.div>
                                    <motion.div custom={3} variants={fv} initial='hidden' animate='visible'>
                                        <Field>
                                            <Label htmlFor='confirmPassword'>Confirm Password</Label>
                                            <StyledInput id='confirmPassword' name='confirmPassword' type='password' placeholder='••••••••' value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur} autoComplete='new-password'/>
                                            {touched.confirmPassword && errors.confirmPassword && <ErrorMsg>{errors.confirmPassword}</ErrorMsg>}
                                        </Field>
                                    </motion.div>
                                </Row>

                                <motion.div custom={4} variants={fv} initial='hidden' animate='visible'>
                                    <CheckRow onClick={() => setFieldValue('agree', !values.agree)}>
                                        <CheckBox checked={values.agree}>
                                            {values.agree && (
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#08cd00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            )}
                                        </CheckBox>
                                        <span style={{fontSize:'.8rem',color:'#6b7a96',lineHeight:1.5}}>
                                            I agree to the{' '}
                                            <a href='#' onClick={e=>e.stopPropagation()} style={{color:'#08cd00',textDecoration:'none'}}>Terms of Service</a>
                                            {' '}and{' '}
                                            <a href='#' onClick={e=>e.stopPropagation()} style={{color:'#08cd00',textDecoration:'none'}}>Privacy Policy</a>
                                        </span>
                                    </CheckRow>
                                    {touched.agree && errors.agree && <ErrorMsg style={{marginTop:-14,marginBottom:12}}>{errors.agree}</ErrorMsg>}
                                </motion.div>

                                <motion.div custom={5} variants={fv} initial='hidden' animate='visible'>
                                    <SubmitBtn type='submit' disabled={isSubmitting}>
                                        {isSubmitting ? 'Creating Account…' : 'Create Account'}
                                    </SubmitBtn>
                                </motion.div>

                                <motion.div custom={6} variants={fv} initial='hidden' animate='visible'
                                    style={{textAlign:'center',marginTop:18,fontSize:'.8rem',color:'#4b5a72'}}
                                >
                                    Already have an account?{' '}
                                    <Link to='/auth/login' style={{color:'#08cd00',fontWeight:600,textDecoration:'none'}}>Sign in</Link>
                                </motion.div>
                            </form>
                        )}
                    </Formik>
                </Card>

                <Footer>
                    &copy; {new Date().getFullYear()}&nbsp;
                    <a rel='noopener nofollow noreferrer' href='https://wiskcraft.com' target='_blank'>WiskCraft</a>
                    &nbsp;&mdash;&nbsp;
                    <a rel='noopener nofollow noreferrer' href='https://pterodactyl.io' target='_blank'>Pterodactyl</a>
                </Footer>
            </div>
        </Scene>
    );
};

export default RegisterContainer;
