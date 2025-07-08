import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Step0_ChooseLanguage from '../components/InitialSetup/Step0_ChooseLanguage';
import Step1_BasicQuizStart from '../components/InitialSetup/Step1_BasicQuizStart';
import Step2_Assessment from '../components/InitialSetup/Step2_Assessment';
import Step3_CustomQuizStart from '../components/InitialSetup/Step3_CustomQuizStart';
import Step4_TargetSelector from '../components/InitialSetup/Step4_TargetSelector';


interface Quiz {
  quizId: string;
  userScore: number;
  userAnswers: string[];
}

interface Course {
  courseId: string;
  courseName: string;
  status: 'completed' | 'enrolled' | 'in-progress';
  result: number;
}

interface UserDashboard {
  _id: string;
  name: string;
  email: string;
  role: string;
  lang: string;
  quizzes: any[];
  customQuizzes: any[];
  courses: any[];
  createdAt: string;
  updatedAt: string;
}

const InitialSetup: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [language, setLanguage] = useState<string>('');
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    // Use axios instead of fetch for consistency
    const fetchUserData = async () => {
      try {
        const res = await api.get(`/api/users/${userId}`);
        const data: UserDashboard = res.data;

        setDashboard(data);
        if (data.lang) setLanguage(data.lang);

        // Check basic quiz completion by fetching quiz details
        const basicQuizDone = data.quizzes && data.lang && (() => {
          return data.quizzes.length >= 3; // Simple check - if user has completed 3 quizzes, basic quiz is done
        })();

        const assessmentDone = data.courses && data.courses.length > 0 && data.lang;

        // Check custom quiz completion
        const customQuizDone = data.customQuizzes && data.customQuizzes.length >= 3; // Simple check

        // Check if target concept is set (user has courses with in-progress status)
        const targetConceptSet = data.courses && data.courses.some((course: any) => course.status === 'in-progress');

        if (!data.lang) setStep(0);
        else if (!basicQuizDone) setStep(1);
        else if (!assessmentDone) setStep(2);
        else if (!customQuizDone) setStep(3);
        else if (!targetConceptSet) setStep(4);
        else {
          // All steps completed, redirect to dashboard
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an error, start from language selection
        setStep(0);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const goNext = () => setStep((prev) => prev + 1);

  return (
    <div className=" d-flex flex-column align-items-center justify-content-center min-vh-100">
      <div className="container mt-5 d-flex flex-column align-items-center justify-content-center">
        {/* STEP INDICATOR */}
        <div className="d-flex justify-content-center mb-4">
          {['Lang', 'Basic', 'Assess', 'Custom', 'Target'].map((label, index) => (
            <div
              key={index}
              className={`mx-1 px-3 py-2 rounded-pill ${index === step
                  ? 'bg-primary text-white'
                  : index < step
                    ? 'bg-success text-white'
                    : 'bg-light text-muted border'
                }`}
              style={{ minWidth: '60px', textAlign: 'center', fontWeight: 'bold' }}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* STEP CONTENT */}
        <div className="d-flex card shadow p-4 mb-5 rounded justify-content-center align-items-center">
          {step === 0 && (
            <Step0_ChooseLanguage
              onSelect={async (lang) => {
                setLanguage(lang);
                try {
                  // Use axios instead of fetch for consistency
                  await api.put(`/api/users/${userId}`, { lang: lang });
                  goNext();
                } catch (error) {
                  console.error('Error saving language:', error);
                  // Still proceed to next step even if there's an error
                  goNext();
                }
              }}
            />
          )}
          {step === 1 && <Step1_BasicQuizStart userId={userId} language={language} onNext={goNext} />}
          {step === 2 && <Step2_Assessment userId={userId} language={language} onNext={goNext} />}
          {step === 3 && <Step3_CustomQuizStart userId={userId} onNext={goNext} />}
          {step === 4 && <Step4_TargetSelector userId={userId} onNext={() => navigate('/dashboard')} />}

        </div>
      </div>
    </div>
  );
};

export default InitialSetup;