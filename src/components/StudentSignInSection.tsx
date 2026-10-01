import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  User as UserIcon,
  Building2,
  Calendar,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { studentDetails } from '../studentDetails';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Placement & Trainning',
  'Artificial Intelligence & Data Science',
  'Biotechnology',
  'Management Studies & MBA',
  'Humanities & Social Sciences'
];

const YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Postgraduate'
];

interface StudentSignInSectionProps {
  id?: string;
  isStandalone?: boolean;
  initialMode?: 'login' | 'register';
}

export const StudentSignInSection: React.FC<StudentSignInSectionProps> = ({
  id = 'student-signin',
  isStandalone = false,
  initialMode = 'login'
}) => {
  const { login, registerStudent, isAuthenticated, isStudent, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    loginId: '',
    password: ''
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    name: studentDetails.name || '',
    department: studentDetails.department || '',
    year: studentDetails.year || '',
    mobileNumber: studentDetails.mobileNumber || '',
    loginId: '',
    password: '',
    confirmPassword: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync if studentDetails change
  useEffect(() => {
    if (studentDetails.name) {
      setRegisterForm(prev => ({
        ...prev,
        name: studentDetails.name || prev.name,
        department: studentDetails.department || prev.department,
        year: studentDetails.year || prev.year,
        mobileNumber: studentDetails.mobileNumber || prev.mobileNumber
      }));
    }
  }, []);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  // ----------------------------------------------------
  // Handle Student Login
  // ----------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginForm.loginId.trim() || !loginForm.password.trim()) {
      setErrorMessage('Please enter both your Student ID and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(loginForm.loginId.trim(), loginForm.password.trim(), 'student');
      showToast(`Welcome back, ${loggedUser.name}!`, 'success');
      navigate('/student/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid Student ID or Password.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Handle New Student Registration
  // ----------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Required fields check
    if (!registerForm.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!registerForm.department.trim()) {
      setErrorMessage('Please select your department.');
      return;
    }
    if (!registerForm.year.trim()) {
      setErrorMessage('Please select your academic year.');
      return;
    }
    if (!registerForm.mobileNumber.trim()) {
      setErrorMessage('Please enter your mobile number.');
      return;
    }
    if (!registerForm.loginId.trim()) {
      setErrorMessage('Please create a Student Login ID.');
      return;
    }
    if (!registerForm.password) {
      setErrorMessage('Please create a password.');
      return;
    }
    if (!registerForm.confirmPassword) {
      setErrorMessage('Please confirm your password.');
      return;
    }

    // Password match check
    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerStudent({
        name: registerForm.name.trim(),
        department: registerForm.department.trim(),
        year: registerForm.year.trim(),
        mobileNumber: registerForm.mobileNumber.trim(),
        loginId: registerForm.loginId.trim(),
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword
      });

      const registeredId = result.loginId || registerForm.loginId.trim();

      // Show success message and redirect to login mode with Student ID pre-filled
      setSuccessMessage('Student account created successfully.');
      showToast('Student account created successfully.', 'success');

      // Pre-fill Student ID in login form
      setLoginForm({
        loginId: registeredId,
        password: ''
      });

      // Reset sensitive password fields
      setRegisterForm(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      // Switch to login mode
      setMode('login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create student account. Please try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id={id}
      className={`relative scroll-mt-20 ${
        isStandalone
          ? 'py-8'
          : 'py-16 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-900/40 dark:to-slate-950'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Collegiate Student Portal</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {mode === 'login' ? 'Student Sign In' : 'New Student Registration'}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {mode === 'login'
              ? 'Access your registered college events, digital admission passes, and student dashboard.'
              : 'Create your official student account to discover, register, and attend college campus events.'}
          </p>
        </div>

        {/* If already authenticated as student, show active status banner */}
        {isAuthenticated && isStudent && user && !isStandalone && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Currently Signed In as {user.name} ({user.loginId})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.department} {user.year ? `• ${user.year}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
            >
              <span>Go to Student Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div
            id="student-auth-success-alert"
            className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-emerald-800 dark:text-emerald-200 text-sm font-medium animate-fadeIn"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{successMessage}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Your Student ID has been filled in below. Please enter your password to sign in.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            id="student-auth-error-alert"
            className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-medium animate-fadeIn"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODE 1: STUDENT LOGIN                                */}
        {/* ==================================================== */}
        {mode === 'login' && (
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 transition-all space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Student Account Login
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter your registered Student ID and password to proceed.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Student ID */}
              <div>
                <label
                  htmlFor="login-student-id"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Student ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="login-student-id"
                    name="loginId"
                    type="text"
                    value={loginForm.loginId}
                    onChange={handleLoginChange}
                    placeholder="Enter Student ID"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-student-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-student-password"
                    name="password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="Enter Password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="student-login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Option to create new student account */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <button
                  id="switch-to-create-account-btn"
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Student Account</span>
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODE 2: NEW STUDENT REGISTRATION                    */}
        {/* ==================================================== */}
        {mode === 'register' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 transition-all space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Create Student Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Fill in your details below to register your student profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Already have an account? Sign In</span>
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="reg-student-name"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-student-name"
                      name="name"
                      type="text"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label
                    htmlFor="reg-student-department"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <select
                      id="reg-student-department"
                      name="department"
                      value={registerForm.department}
                      onChange={handleRegisterChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
                      required
                    >
                      <option value="" disabled>
                        Select Department
                      </option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <label
                    htmlFor="reg-student-year"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Year
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <select
                      id="reg-student-year"
                      name="year"
                      value={registerForm.year}
                      onChange={handleRegisterChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
                      required
                    >
                      <option value="" disabled>
                        Select Year
                      </option>
                      {YEARS.map(yr => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label
                    htmlFor="reg-student-mobile"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-student-mobile"
                      name="mobileNumber"
                      type="tel"
                      value={registerForm.mobileNumber}
                      onChange={handleRegisterChange}
                      placeholder="Enter mobile number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Account Credentials Sub-Grid */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 space-y-4">
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                  Account Credentials
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Student Login ID */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-student-loginid"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Student Login ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-student-loginid"
                        name="loginId"
                        type="text"
                        value={registerForm.loginId}
                        onChange={handleRegisterChange}
                        placeholder="Create Student ID"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-student-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-student-password"
                        name="password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        placeholder="Create Password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-student-confirmpassword"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-student-confirmpassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="Confirm Password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="student-register-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Student Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Already have a Student Account?{' '}
                <button
                  id="switch-to-login-btn"
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
