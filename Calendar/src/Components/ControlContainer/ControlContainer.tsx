import React from 'react';

type Props = {
    /** React nodes to be wrapped inside the container */
    children: React.ReactNode;
};

/**
 * A responsive container that centers its content and limits max width.
 *
 * @param {Props} props - Component props
 * @param {React.ReactNode} props.children - Content to be rendered inside the container
 * @returns {JSX.Element} The container wrapping its children
 */
function Container({ children }: Props) {
    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            {children}
        </div>
    );
}

export default Container;