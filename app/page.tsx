import dynamic from 'next/dynamic';

// Dynamically import Game component with no SSR (canvas needs browser)
const Game = dynamic(() => import('@/components/Game'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100vh',
      background: '#1a1a2e',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '18px',
    }}>
      Loading Watermelon Farm...
    </div>
  ),
});

export default function Home() {
  return <Game />;
}
