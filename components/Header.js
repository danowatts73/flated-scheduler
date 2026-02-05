import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
    return (
        <header className="header" style={{ padding: '20px 0', borderBottom: '1px solid #333' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="logo">
                    <Link href="/">
                        {/* Using a standard img tag for simplicity within next/image constraints without domain config */}
                        <img
                            src="https://flated.com/cdn/shop/files/Flated_Logo_Horiz_WHT_1600x.png?v=1677101830"
                            alt="FLATED"
                            style={{ height: '40px', objectFit: 'contain' }}
                        />
                    </Link>
                </div>
                <nav>
                    <ul style={{ display: 'flex', gap: '30px', listStyle: 'none', margin: 0, padding: 0 }}>
                        <li><Link href="#" style={{ color: 'var(--primary-white)', fontWeight: '700', fontSize: '14px', letterSpacing: '1px' }}>SHOP</Link></li>
                        <li><Link href="#" style={{ color: 'var(--primary-white)', fontWeight: '700', fontSize: '14px', letterSpacing: '1px' }}>SUPPORT</Link></li>
                        <li><Link href="#" style={{ color: 'var(--primary-white)', fontWeight: '700', fontSize: '14px', letterSpacing: '1px' }}>ABOUT US</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
