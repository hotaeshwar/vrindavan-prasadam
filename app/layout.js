import './globals.css';
import DevotionalAudioPlayer from '../components/DevotionalAudioPlayer';

export const metadata = {
  title: 'Vrindavan Prasadam Network | Advance Booking Form',
  description: 'Book pure sattvic prasadam catering, ashram & hotel stays, 84 Kosh Yatra, and guide services in Sri Vrindavan Dham. Instant WhatsApp booking confirmation.',
  keywords: 'Vrindavan Prasadam Network, Vrindavan catering, Prasad booking, Mathura yatra, 84 Kosh Yatra, ISKCON Vrindavan, Banke Bihari, Sattvic food catering',
  authors: [{ name: 'Vrindavan Prasadam Network' }],
  icons: {
    icon: '/assets/banner_flyer.jpg',
  },
  openGraph: {
    title: 'Vrindavan Prasadam Network - Advance Booking Form',
    description: 'Book pure sattvic prasadam, dharmashala stays, 84 Kosh Yatra, taxi, and guide services.',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#D97706',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FFF9ED] text-[#5B3513] antialiased selection:bg-saffron-200 selection:text-maroon-900">
        {children}
        <DevotionalAudioPlayer />
      </body>
    </html>
  );
}
