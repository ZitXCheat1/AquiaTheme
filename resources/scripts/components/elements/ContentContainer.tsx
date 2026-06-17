import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';

const ContentContainer = styled.div`
    margin-top: 1rem;
    margin-left: 1rem;
    margin-right: 1rem;

    ${breakpoint('xl')`
        margin-left: auto;
        margin-right: auto;
    `}
`;
ContentContainer.displayName = 'ContentContainer';
ContentContainer.defaultProps = {
    className: 'content-container',
};

export default ContentContainer;
