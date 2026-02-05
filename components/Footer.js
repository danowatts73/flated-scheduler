import Link from 'next/link';

export default function Footer() {
    return (
        <footer style={{ padding: '40px 0', marginTop: 'auto', borderTop: '1px solid #333' }}>
            <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div className="logo">
                    <Link href="/">
                        <img
                            src="https://flated.com/cdn/shop/files/Flated_Logo_Horiz_WHT_1600x.png?v=1677101830"
                            alt="FLATED"
                            style={{ height: '30px', objectFit: 'contain', opacity: 0.8 }}
                        />
                    </Link>
                </div>
                <div style={{ fontSize: '14px', color: '#888' }}>
                    &copy; {new Date().getFullYear()} FLATED. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
