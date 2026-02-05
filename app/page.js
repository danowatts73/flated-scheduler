import Scheduler from '../components/Scheduler';

export default function Home() {
    return (
        <div className="section">
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>Schedule a Call</h1>
                    <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
                        Available Monday to Friday, 9:00 AM - 5:00 PM Mountain Standard Time.
                    </p>
                </div>

                <div style={{ background: '#f9f9f9', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Scheduler />
                </div>
            </div>
        </div>
    );
}
