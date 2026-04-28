import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './pages/ApplicationForm';
import AnalyzePage from './pages/AnalyzePage';
import ResumesPage from './pages/ResumesPage';
import EmailImportPage from './pages/EmailImportPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/add"       element={<ApplicationForm />} />
            <Route path="/edit/:id"  element={<ApplicationForm />} />
            <Route path="/analyze"   element={<AnalyzePage />} />
            <Route path="/resumes"       element={<ResumesPage />} />
            <Route path="/email-import"  element={<EmailImportPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}