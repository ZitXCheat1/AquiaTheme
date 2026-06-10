import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import { motion } from 'framer-motion';
import styled from 'styled-components/macro';

interface Values {
    username: string;
    password: string;
}

const AnimatedField = styled(motion.div)``;

const fieldVariants = {
    hidden:  { opacity: 0, x: -14 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
};

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

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
                    <AnimatedField
                        custom={0}
                        variants={fieldVariants}
                        initial={'hidden'}
                        animate={'visible'}
                    >
                        <Field
                            type={'text'}
                            label={'Username or Email'}
                            name={'username'}
                            disabled={isSubmitting}
                        />
                    </AnimatedField>

                    <AnimatedField
                        custom={1}
                        variants={fieldVariants}
                        initial={'hidden'}
                        animate={'visible'}
                        css={tw`mt-5`}
                    >
                        <Field
                            type={'password'}
                            label={'Password'}
                            name={'password'}
                            disabled={isSubmitting}
                        />
                    </AnimatedField>

                    <AnimatedField
                        custom={2}
                        variants={fieldVariants}
                        initial={'hidden'}
                        animate={'visible'}
                        css={tw`mt-6`}
                    >
                        <Button
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Sign In
                        </Button>
                    </AnimatedField>

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

                    <AnimatedField
                        custom={3}
                        variants={fieldVariants}
                        initial={'hidden'}
                        animate={'visible'}
                        css={tw`mt-5 text-center`}
                    >
                        <Link
                            to={'/auth/password'}
                            css={tw`text-xs tracking-wide no-underline uppercase`}
                            style={{ color: 'rgba(0,212,255,0.5)', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#00d4ff')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,212,255,0.5)')}
                        >
                            Forgot password?
                        </Link>
                    </AnimatedField>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
