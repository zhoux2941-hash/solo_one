import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScoresList from "@/pages/ScoresList";
import AnnotationReview from "@/pages/AnnotationReview";
import Export from "@/pages/Export";
import TeacherReview from "@/pages/TeacherReview";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScoresList />} />
        <Route path="/score/:id" element={<AnnotationReview />} />
        <Route path="/score/:id/export" element={<Export />} />
        <Route path="/teacher/:teacherId" element={<TeacherReview />} />
      </Routes>
    </Router>
  );
}
