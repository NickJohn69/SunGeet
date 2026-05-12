import Navigation from '../components/Navigation';
import Player from '../components/Player';
import Lyrics from '../components/Lyrics';
import "./globals.css";

export const metadata = {
  title: "SunGeet Music",
  description: "Modern MP3 Player and Downloader",
  manifest: "/manifest.json",
  themeColor: "#18181b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Synchronously apply theme before hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem('music-player-storage');
                var theme = s ? JSON.parse(s).state?.theme : 'dark';
                if (theme === 'dark' || !theme) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className={`antialiased min-h-screen bg-background text-foreground transition-colors duration-300 pb-32`}>
        <Navigation />
        {children}
        <Player />
        <Lyrics />
      </body>
    </html>
  );
}

