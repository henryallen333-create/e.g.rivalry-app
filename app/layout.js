import './globals.css';

export const metadata = {
  title: 'Rivalry — a fitness league for you and your friends',
  description: 'Weekly head-to-head fitness matchups with your friends.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
