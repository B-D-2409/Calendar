type Props = {
    children: React.ReactNode;
};

function Container({ children }: Props) {
    return <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>{children}</div>;
}

export default Container;
