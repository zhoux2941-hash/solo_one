import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ContactList from '../components/contact/ContactList';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ContactList />
        </main>
      </div>
    </div>
  );
}
