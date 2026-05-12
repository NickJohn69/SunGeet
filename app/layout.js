import Navigation from '../components/Navigation';
import Player from '../components/Player';
import Sidebar from '../components/Sidebar';
import Lyrics from '../components/Lyrics';
import "./globals.css";

export const metadata = {
  title: "SunGeet",
  description: "Music player",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('dark');` }} />
      </head>
      <body className="antialiased bg-background text-foreground">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto pb-24">
            <Navigation />
            {children}
          </div>
        </div>
<Player />
      <Lyrics />
    </body>
    </html>
  );
}
