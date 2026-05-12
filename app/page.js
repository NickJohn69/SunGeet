import Search from '../components/Search';
import Library from '../components/Library';

export default function Home() {
  return (
    <main>
      <Search />
      <div className="max-w-7xl mx-auto px-4 mt-8 mb-12">
        <div className="h-px bg-border/50 w-full" />
      </div>
      <Library />
    </main>
  );
}
