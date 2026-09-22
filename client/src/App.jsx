import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { FlashProvider } from './context/FlashContext';

import Layout from './components/layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CategoryDetail from './pages/CategoryDetail';
import CourseDetail from './pages/CourseDetail';
import LessonDetail from './pages/LessonDetail';
import SpeechToText from './pages/tools/SpeechToText';
import TextToSpeech from './pages/tools/TextToSpeech';
import TextToSign from './pages/tools/TextToSign';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <FlashProvider>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/about" element={<Navigate to="/home/about" replace />} />
                <Route path="/home/about" element={<About />} />
                <Route path="/contact" element={<Navigate to="/home/contact" replace />} />
                <Route path="/home/contact" element={<Contact />} />
                <Route path="/login" element={<Navigate to="/home/login" replace />} />
                <Route path="/home/login" element={<Login />} />
                <Route path="/signup" element={<Navigate to="/home/signup" replace />} />
                <Route path="/home/signup" element={<Signup />} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
                <Route path="/dashboard/profile" element={<Profile />} />

                <Route path="/category/:type" element={<CategoryDetail />} />
                <Route path="/category/:type/course/:courseId" element={<CourseDetail />} />
                <Route path="/category/:type/course/:courseId/lesson/:lessonIndex" element={<LessonDetail />} />

                <Route path="/tools/speech-to-text" element={<SpeechToText />} />
                <Route path="/tools/text-to-speech" element={<TextToSpeech />} />
                <Route path="/tools/text-to-sign" element={<TextToSign />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Router>
        </FlashProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
