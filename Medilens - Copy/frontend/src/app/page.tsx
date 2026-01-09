"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Shield, Activity, FileText, Upload, Plus,
  Search, Bell, History, ArrowRight, ArrowLeft,
  Sparkles, CheckCircle2, AlertTriangle, Info,
  LineChart, MousePointer2, Thermometer, Heart,
  Droplets, Zap, User, Microscope, Stethoscope, Clock, X
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { Card, Button, Badge, ProgressBar } from '../components/ui';
import { analyzeReport, AnalysisResponse } from '../services/api';

// --- ANIMATION VARIANTS ---
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function MediLensApp() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'patient' | 'doctor'>('patient');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState([
    { date: "Oct 12, 2025", type: "Full Blood Count", source: "City Labs", urgency: "Normal" },
    { date: "Aug 05, 2025", type: "Kidney Panel", source: "Apollo Hospital", urgency: "Alert" },
    { date: "May 20, 2025", type: "Diabetes Care", source: "City Labs", urgency: "Normal" },
    { date: "Jan 15, 2025", type: "Annual Physical", source: "Care Clinics", urgency: "Normal" },
  ]);
  const [riskLevel, setRiskLevel] = useState(30);
  const [reportData, setReportData] = useState<AnalysisResponse | null>(null);
  const [fileImage, setFileImage] = useState<string | null>(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient Queue State for Clinical View
  const [patients, setPatients] = useState([
    { name: "Sujitha K.", age: 28, risk: 85, status: "Critical", time: "2m ago", findings: "Renal Failure Alert" },
    { name: "John Doe", age: 45, risk: 62, status: "Moderate", time: "15m ago", findings: "Hyperglycemia" },
    { name: "Emma Smith", age: 32, risk: 32, status: "Stable", time: "1h ago", findings: "Normal Baseline" },
    { name: "Robert J.", age: 58, risk: 18, status: "Normal", time: "3h ago", findings: "Post-Op Stable" },
  ]);

  // Handle Inspect Scan Timing
  useEffect(() => {
    if (inspectMode) {
      setIsScanning(true);
      const timer = setTimeout(() => setIsScanning(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [inspectMode]);

  // Real-time risk radar logic moved into RiskRadarPage component to prevent top-level re-render lag

  const nextStep = () => setStep(s => Math.min(s + 1, 11));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  // --- SUB-PAGES ---

  // 1. Welcome & Mode Selection
  const WelcomePage = () => (
    <motion.div {...pageVariants} transition={pageTransition} className="max-w-4xl mx-auto text-center space-y-12 py-12">
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-20 h-20 bg-gradient-to-tr from-sky-500 to-teal-400 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-sky-500/20"
        >
          <Brain className="text-white w-10 h-10" />
        </motion.div>
        <h1 className="text-6xl font-black tracking-tight text-slate-900">
          MediLens <span className="text-sky-500 italic">AI</span>
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
          Simplifying complex medical reports into clear, actionable insights for everyone.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 px-4">
        <Card onClick={() => { setMode('patient'); setStep(1); }} className="p-8 border-2 border-transparent hover:border-sky-500 group">
          <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Patient Mode</h3>
          <p className="text-slate-500 mb-6">Understand your health in simple terms, get action plans, and track trends.</p>
          <div className="flex items-center text-sky-600 font-bold gap-2">
            Get Started <ArrowRight size={18} />
          </div>
        </Card>

        <Card onClick={() => { setMode('doctor'); setStep(1); }} className="p-8 border-2 border-transparent hover:border-teal-500 group">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Stethoscope size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Clinical Mode</h3>
          <p className="text-slate-500 mb-6">High-precision medical terminology, risk flags, and suggested investigations.</p>
          <div className="flex items-center text-teal-600 font-bold gap-2">
            Clinical Login <ArrowRight size={18} />
          </div>
        </Card>
      </div>
    </motion.div>
  );

  // 2. Report Upload Page
  const UploadPage = () => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      try {
        // Create preview URL if it's an image
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFileImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
          // For PDF, we just note it's a doc (in a real app we'd use pdf.js)
          setFileImage('/pdf-placeholder.png');
        }

        const result = await analyzeReport(file);
        setReportData(result);
        setStep(2); // Jump to Overview
      } catch (err: any) {
        console.error("Upload failed:", err);
        setError("Failed to analyze report. Please ensure the backend is running and try again.");
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <motion.div {...pageVariants} transition={pageTransition} className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Upload Your Reports</h2>
          <p className="text-slate-500">Drop your PDF lab results or imaging reports below.</p>
        </div>

        <label
          className={`relative border-2 border-dashed rounded-[3rem] p-12 transition-all cursor-pointer bg-white group block
            ${isUploading ? 'border-sky-500 ring-4 ring-sky-50' : 'border-slate-200 hover:border-sky-400 hover:bg-slate-50/50'}`}
        >
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} disabled={isUploading} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isUploading ? 'bg-sky-500 text-white animate-bounce' : 'bg-slate-100 text-slate-400 group-hover:text-sky-500 group-hover:bg-sky-50'}`}>
              <Upload size={32} />
            </div>
            {isUploading ? (
              <div className="space-y-4 w-full text-center">
                <p className="text-sky-600 font-bold text-lg">AI is reading your report...</p>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: "100%" }}
                    transition={{ duration: 1.8 }}
                    className="h-full bg-sky-500"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-slate-800 font-bold text-lg">Click or drag & drop files</p>
                <p className="text-slate-400 text-sm">PDF, JPEG, or PNG (Max 10MB)</p>
              </div>
            )}
          </div>
        </label>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 text-sm font-medium flex items-center gap-3">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Patient Age</label>
            <input type="text" placeholder="28" className="w-full bg-transparent font-bold text-slate-800 outline-none" />
          </div>
          <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sex</label>
            <select className="w-full bg-transparent font-bold text-slate-800 outline-none">
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </motion.div>
    );
  };

  // 3. Instant Health Overview
  const OverviewPage = () => {
    if (!reportData) return <div className="text-center py-20 text-slate-400 font-medium">Please upload a report to view insights.</div>;

    const riskScore = reportData.explanation.confidence_score || 85;

    return (
      <motion.div {...pageVariants} transition={pageTransition} className="space-y-8">
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4 flex flex-col items-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" stroke="rgba(255,255,255,0.1)" strokeWidth="16" fill="transparent" />
                  <motion.circle
                    cx="96" cy="96" r="80" stroke="url(#gradient)" strokeWidth="16" fill="transparent"
                    strokeDasharray={2 * Math.PI * 80}
                    initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 80) * (1 - riskScore / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black">{riskScore}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Health Score</span>
                </div>
              </div>
              <div className="mt-6 flex flex-col items-center gap-3">
                <Badge color={riskScore > 70 ? "red" : riskScore > 40 ? "yellow" : "green"}>
                  {riskScore > 70 ? "Critical" : riskScore > 40 ? "Attention Required" : "Near Baseline"}
                </Badge>
                {riskScore > 70 && (
                  <motion.button
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [0.9, 1, 0.9] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    onClick={() => setStep(9)}
                    className="bg-rose-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-rose-500/40 flex items-center gap-2 hover:bg-rose-600 transition-colors"
                  >
                    <AlertTriangle size={14} /> IMMEDIATE ACTION REQUIRED
                  </motion.button>
                )}
              </div>
            </div>
            <div className="lg:col-span-8 space-y-6">
              <h2 className="text-4xl font-bold">Health Summary</h2>
              <p className="text-xl text-slate-300 leading-relaxed">
                {mode === 'patient' ? reportData.explanation.patient_summary : reportData.explanation.doctor_summary}
              </p>
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Key Findings</p>
                <div className="flex flex-wrap gap-3">
                  {(mode === 'patient' ? reportData.explanation.recommendations_patient : reportData.explanation.correlations_doctor).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
                      <Sparkles size={14} className="text-sky-300" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-12">
          <Button onClick={nextStep} icon={ArrowRight}>View Detailed Breakdown</Button>
        </div>
      </motion.div>
    );
  };

  // 4. Patient Friendly Explanation
  const ExplanationPage = () => {
    if (!reportData) return null;
    return (
      <motion.div {...pageVariants} transition={pageTransition} className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Your Lab Results</h2>
            <p className="text-slate-500">Each value explained in plain English.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={FileText}>Export PDF</Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {reportData.results.map((r, i) => (
            <Card key={i} className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{r.test_name}</h3>
                  <Badge color={r.flag as any}>{r.status}</Badge>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">{r.value}</span>
                  <span className="text-xs font-bold text-slate-400 block uppercase">{r.unit}</span>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                {r.interpretation}
              </p>
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                  <span>Normal Range: {r.reference_range}</span>
                  <span>{r.visual_value}%</span>
                </div>
                <ProgressBar value={r.visual_value} color={r.flag === 'green' ? 'green' : r.flag === 'red' ? 'red' : 'yellow'} />
              </div>
            </Card>
          ))}
        </div>
        <div className="flex justify-center pt-8">
          <Button onClick={nextStep} icon={LineChart}>View Visual Insights</Button>
        </div>
      </motion.div>
    );
  };

  // 5. Visual Insight Dashboard
  const VisualDashboard = () => {
    if (!reportData) return null;

    // Use actual results to create a trend line (mocking history around the result for demo)
    const primaryResult = reportData.results[0];
    const chartData = [
      { date: 'Month 1', val: (parseInt(primaryResult?.value) || 100) - 10 },
      { date: 'Month 2', val: (parseInt(primaryResult?.value) || 100) + 5 },
      { date: 'Month 3', val: (parseInt(primaryResult?.value) || 100) - 5 },
      { date: 'Month 4', val: (parseInt(primaryResult?.value) || 100) + 15 },
      { date: 'Month 5', val: (parseInt(primaryResult?.value) || 100) },
    ];

    return (
      <motion.div {...pageVariants} transition={pageTransition} className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-8">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold">Biomarker Trends: {primaryResult?.test_name}</h3>
              <select className="bg-slate-50 border-none rounded-lg p-2 text-sm font-bold shadow-sm">
                <option>Last 6 Months</option>
                <option>Last 1 Year</option>
              </select>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip cursor={{ stroke: '#0ea5e9', strokeWidth: 2 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                  <Area type="monotone" dataKey="val" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-6 text-slate-800">Visual Highlighting</h3>
              <div className="relative aspect-[3/4] bg-slate-50 rounded-[2rem] flex items-center justify-center overflow-hidden">
                {inspectMode && fileImage ? (
                  <motion.img
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={fileImage}
                    className="w-full h-full object-cover"
                    alt="Analyzed Report"
                  />
                ) : (
                  <div className="p-8 relative">
                    <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -left-4 top-20 w-12 h-12 bg-rose-500/20 rounded-full blur-xl"></motion.div>
                    <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute right-0 top-40 w-10 h-10 bg-amber-500/20 rounded-full blur-xl"></motion.div>
                    <svg width="120" height="240" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-300">
                      <path d="M50 10C55 10 60 15 60 25C60 35 55 40 50 40C45 40 40 35 40 25C40 15 45 10 50 10Z" fill="currentColor" opacity="0.5" />
                      <path d="M40 45C30 45 20 55 20 75V110C20 120 25 130 35 130H65C75 130 80 120 80 110V75C80 55 70 45 60 45H40Z" fill="currentColor" opacity="0.5" />
                      <rect x="35" y="132" width="10" height="60" rx="5" fill="currentColor" opacity="0.5" />
                      <rect x="55" y="132" width="10" height="60" rx="5" fill="currentColor" opacity="0.5" />
                      <path d="M20 75L10 110" stroke="currentColor" strokeWidth="8" strokeOpacity="0.5" strokeLinecap="round" />
                      <path d="M80 75L90 110" stroke="currentColor" strokeWidth="8" strokeOpacity="0.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                {inspectMode && isScanning && (
                  <div className="absolute inset-0 border-2 border-sky-500/50 pointer-events-none">
                    <motion.div
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)] z-20"
                    />
                  </div>
                )}
                {inspectMode && !isScanning && (
                  <div className="absolute inset-0 z-10">
                    {reportData.results.filter(r => r.flag !== 'green').map((r, i) => {
                      const positions = [
                        { top: '25%', left: '30%' },
                        { top: '45%', left: '65%' },
                        { top: '65%', left: '40%' },
                        { top: '35%', left: '75%' },
                        { top: '75%', left: '25%' },
                      ];
                      const pos = positions[i % positions.length];
                      const isRed = r.flag === 'red';

                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`absolute w-8 h-8 rounded-full border-2 ${isRed ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'border-amber-500 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.3)]'} flex items-center justify-center`}
                          style={{ top: pos.top, left: pos.left }}
                        >
                          <div className={`w-2 h-2 rounded-full ${isRed ? 'bg-rose-500' : 'bg-amber-500'} animate-pulse`}></div>
                        </motion.div>
                      );
                    })}
                    <div className="absolute top-4 left-4 bg-sky-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">SCAN COMPLETE</div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center font-medium">
                {inspectMode ? (isScanning ? "AI is reading document structure..." : "Analysis complete. Biomarkers mapped to medical database.") : "Auto-detected areas of clinical focus from report biomarkers."}
              </p>
            </div>
            <Button
              variant={inspectMode ? "primary" : "outline"}
              className="w-full mt-6"
              onClick={() => setInspectMode(!inspectMode)}
            >
              {inspectMode ? "Back to Highlights" : "Inspect Image"}
            </Button>
          </Card>
        </div>
        <div className="flex justify-center mt-12">
          <Button onClick={nextStep} icon={Zap}>See AI Action Plan</Button>
        </div>
      </motion.div>
    );
  };

  // 6. Dual Mode Clinician View (Handled by step 6 or toggle)
  const ClinicianView = () => {
    if (!reportData) return null;
    return (
      <motion.div {...pageVariants} transition={pageTransition} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter">Clinical Dashboard</h2>
            <p className="text-slate-500">Professional diagnostic insights and clinical correlations.</p>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-full">
            <button onClick={() => setMode('patient')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'patient' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-500'}`}>Patient</button>
            <button onClick={() => setMode('doctor')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'doctor' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}`}>Clinical</button>
          </div>
        </div>
        <div className="space-y-4">
          {reportData.results.map((r, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-xl transition-all grid md:grid-cols-4 gap-6 items-center">
              <div className="md:col-span-1">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Observation</h4>
                <p className="font-black text-slate-900 text-lg">{r.test_name}</p>
              </div>
              <div className="md:col-span-1 border-l border-slate-100 pl-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Result</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black ${r.flag === 'red' ? 'text-rose-600' : r.flag === 'yellow' ? 'text-amber-500' : 'text-emerald-500'}`}>{r.value} {r.unit || ''}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">REF: {r.reference_range}</p>
              </div>
              <div className="md:col-span-2 border-l border-slate-100 pl-6 border-dashed">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  Clinical Correlation <Microscope size={14} className="text-sky-500" />
                </h4>
                <p className="text-sm text-slate-600 font-medium italic">
                  "{r.interpretation}"
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-12">
          <Button onClick={prevStep} variant="outline" icon={ArrowLeft}>Back to Visuals</Button>
          <Button onClick={nextStep} icon={Clock}>Next Steps & Action Plan</Button>
        </div>
      </motion.div>
    );
  };

  // 7. AI What Next? Action Plan
  const ActionPlanPage = () => {
    if (!reportData) return null;
    return (
      <motion.div {...pageVariants} transition={pageTransition} className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
            <Zap size={28} />
          </div>
          <h2 className="text-4xl font-bold text-slate-900">AI-Generated Action Plan</h2>
          <p className="text-slate-500">Personalized steps to improve your health metrics.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="text-emerald-500" /> Recommended Steps</h3>
            {reportData.explanation.recommendations_patient.map((s, i) => (
              <Card key={i} className="p-6 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${i === 0 ? 'bg-rose-500' : 'bg-sky-500'}`}></div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">{s}</h4>
                  <Badge color={i === 0 ? 'red' : 'blue'}>ASAP</Badge>
                </div>
                <p className="text-sm text-slate-500">Based on your abnormal findings in the uploaded report.</p>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><Shield className="text-sky-500" /> Outcome Forecast</h3>
            <Card className="bg-rose-50 border-rose-100 p-6">
              <h4 className="text-rose-700 font-bold mb-2 flex items-center gap-2"><AlertTriangle size={18} /> If Untreated</h4>
              <p className="text-sm text-rose-600 leading-relaxed italic">Potential complications based on detected biomarkers.</p>
            </Card>
            <Card className="bg-emerald-50 border-emerald-100 p-6">
              <h4 className="text-emerald-700 font-bold mb-2 flex items-center gap-2"><Sparkles size={18} /> With Treatment</h4>
              <p className="text-sm text-emerald-600 leading-relaxed italic">Improved outcomes expected with recommended interventions.</p>
            </Card>
          </div>
        </div>
        <div className="flex justify-center mt-12">
          <Button onClick={nextStep} icon={Activity}>Go to Health Risk Radar</Button>
        </div>
      </motion.div>
    );
  };

  // 8. Real-time Health Risk Radar
  const RiskRadarPage = () => {
    const [localSymptoms, setLocalSymptoms] = useState('');
    const [localRiskLevel, setLocalRiskLevel] = useState(riskLevel);

    useEffect(() => {
      if (localSymptoms.length > 5) {
        const interval = setInterval(() => {
          setLocalRiskLevel(prev => Math.min(prev + 2, 85));
        }, 500);
        return () => clearInterval(interval);
      } else {
        setLocalRiskLevel(riskLevel || 32);
      }
    }, [localSymptoms, riskLevel]);

    if (!reportData) return <div className="text-center py-20 text-slate-400 font-medium">Please upload a report to use the risk radar.</div>;
    return (
      <motion.div {...pageVariants} transition={pageTransition} className="max-w-4xl mx-auto space-y-12 py-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-slate-900">Live Risk Radar</h2>
          <p className="text-slate-500">Input your current symptoms for real-time risk assessment.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Describe Symptoms</label>
              <textarea
                value={localSymptoms}
                onChange={(e) => setLocalSymptoms(e.target.value)}
                placeholder="e.g. I have persistent fatigue and occasional swelling in my ankles..."
                className="w-full h-40 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm focus:ring-4 focus:ring-sky-50 focus:border-sky-500 transition-all outline-none text-slate-700 font-medium"
              />
            </div>
            <div className="flex items-center gap-4 p-4 bg-sky-50 rounded-2xl border border-sky-100 italic text-sm text-sky-700">
              <Sparkles size={20} className="shrink-0" />
              "Our AI analyzes natural language to detect subtle health correlations."
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 mb-8">
              <div className={`absolute inset-0 rounded-full border-8 border-slate-100 ${localRiskLevel > 70 ? 'animate-pulse' : ''}`}></div>
              <svg className="w-full h-full transform -rotate-90">
                <motion.circle
                  cx="128" cy="128" r="110" stroke={localRiskLevel > 70 ? '#ef4444' : localRiskLevel > 50 ? '#f59e0b' : '#10b981'} strokeWidth="12" fill="transparent"
                  strokeDasharray={2 * Math.PI * 110}
                  animate={{ strokeDashoffset: (2 * Math.PI * 110) * (1 - localRiskLevel / 100) }}
                  transition={{ type: "spring", stiffness: 50 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-black ${localRiskLevel > 70 ? 'text-rose-600' : localRiskLevel > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>{localRiskLevel}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Risk Index</span>
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-xl font-bold text-slate-800">{localRiskLevel > 70 ? 'High Urgency' : localRiskLevel > 40 ? 'Moderate Alert' : 'Normal Baseline'}</h4>
              <p className="text-sm text-slate-500 max-w-[240px] mt-2">
                {localRiskLevel > 70 ? 'Symptoms correlate with abnormal kidney values. Clinical review advised.' : 'Monitoring symptoms alongside your lab values.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // 8. Clinical Priority Radar
  const ClinicalPriorityPage = () => {
    if (!reportData) return null;

    const filteredPatients = patients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.findings.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "All" || p.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    const handleAddPatient = () => {
      const name = prompt("Enter Patient Name:");
      if (!name) return;
      const age = parseInt(prompt("Enter Age:") || "0");
      const risk = Math.floor(Math.random() * 100);
      const status = risk > 70 ? "Critical" : risk > 40 ? "Moderate" : "Stable";

      const newPatient = {
        name,
        age,
        risk,
        status,
        time: "Just now",
        findings: "New Intake"
      };
      setPatients([newPatient, ...patients]);
    };

    return (
      <motion.div {...pageVariants} transition={pageTransition} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Priority Radar</h2>
            <p className="text-slate-500">AI-sorted patient queue based on clinical urgency.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 rounded-full outline-none text-sm focus:bg-white border focus:border-teal-500 transition-all"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-100 px-4 py-2 rounded-full text-sm font-medium outline-none border focus:border-teal-500 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Critical">Critical</option>
              <option value="Moderate">Moderate</option>
              <option value="Stable">Stable</option>
              <option value="Normal">Normal</option>
            </select>
            <Button variant="outline" icon={Plus} onClick={handleAddPatient}>Add Patient</Button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredPatients.length > 0 ? filteredPatients.map((p, i) => (
            <Card key={i} className="p-4 grid md:grid-cols-6 gap-8 items-center hover:bg-slate-50 border-none shadow-sm transition-all group">
              <div className="flex items-center gap-4 md:col-span-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-inner group-hover:from-sky-50 group-hover:to-sky-100 transition-colors">{p.name[0]}</div>
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{p.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">Age {p.age} • Patient ID: #2934{i}</p>
                </div>
              </div>
              <div className="md:col-span-1">
                <Badge color={p.risk > 70 ? 'red' : p.risk > 40 ? 'yellow' : 'green'}>{p.status}</Badge>
              </div>
              <div className="md:col-span-1">
                <span className="text-sm font-bold text-slate-700">{p.findings}</span>
              </div>
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <Clock size={12} className="text-slate-300" /> {p.time}
                </div>
              </div>
              <div className="md:col-span-1 text-right">
                <Button variant="ghost" className="text-teal-600 font-bold hover:bg-teal-50 rounded-xl" onClick={() => setSelectedPatient(p)}>Snapshot</Button>
              </div>
            </Card>
          )) : (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <Search size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No patients found matching your criteria.</p>
              <button onClick={() => { setSearchQuery(""); setFilterStatus("All"); }} className="text-sky-500 font-bold text-sm mt-2 hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // 10. Alerts & Emergency Guidance
  const EmergencyPage = () => {
    if (!reportData) return null;
    return (
      <motion.div {...pageVariants} transition={pageTransition} className="max-w-4xl mx-auto space-y-12 py-12">
        <div className="bg-rose-500 rounded-[3rem] p-12 text-white relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-black/10 animate-pulse"></div>
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center">
              <AlertTriangle size={40} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold">Immediate Action Required</h2>
            <p className="text-xl text-rose-100 max-w-2xl mx-auto">
              Based on your clinical findings and live symptoms, we recommend immediate medical consultation.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 border-rose-100 bg-white space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Red-Flag Indicators</h3>
            <ul className="space-y-3">
              {reportData.results.filter(r => r.flag === 'red').length > 0 ? (
                reportData.results.filter(r => r.flag === 'red').map((r, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                    <span className="font-bold text-slate-700">{r.test_name}</span>: {r.status} ({r.value} {r.unit})
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-3 text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  No critical red-flag findings detected.
                </li>
              )}
            </ul>
          </Card>
          <Card className="p-8 bg-slate-900 text-white space-y-4">
            <h3 className="text-xl font-bold">Emergency Contacts</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                <span className="font-bold">Primary Care</span>
                <span className="text-sky-300 font-mono">555-0192</span>
              </div>
              <div className="flex justify-between items-center bg-rose-500/30 p-4 rounded-2xl border border-rose-500/50">
                <span className="font-bold text-rose-200 uppercase tracking-widest text-xs">Emergency Services</span>
                <span className="text-white font-black text-lg">911</span>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  };

  // 11. History & Follow-up
  const HistoryPage = () => {
    if (!reportData) return null;

    const handleHistoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const newItem = {
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        type: file.name.split('.')[0].replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        source: "User Upload",
        urgency: "Normal"
      };
      setHistoryItems([newItem, ...historyItems]);
    };

    return (
      <motion.div {...pageVariants} transition={pageTransition} className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Medical History</h2>
          <div>
            <input type="file" id="history-upload" className="hidden" accept="image/*,.pdf" onChange={handleHistoryUpload} />
            <Button variant="outline" icon={Plus} onClick={() => document.getElementById('history-upload')?.click()}>Upload Historical Report</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {historyItems.map((h, i) => (
            <Card key={i} className="p-6 text-center space-y-4 hover:shadow-lg transition-all border-slate-100">
              <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-full mx-auto flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{h.type}</h4>
                <p className="text-xs text-slate-400 font-medium">{h.date}</p>
              </div>
              <Badge color={h.urgency === 'Alert' ? 'yellow' : 'blue'}>{h.source}</Badge>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  };

  // 12. Trust & Disclaimer
  const DisclaimerPage = () => (
    <motion.div {...pageVariants} transition={pageTransition} className="max-w-3xl mx-auto py-12 text-center space-y-12">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center">
          <Shield size={40} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900">Your Health, Secured.</h2>
        <p className="text-slate-500">MediLens AI uses enterprise-grade encryption and HIPAA-compliant data practices.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="font-bold text-slate-800">HIPAA Ready</div>
          <p className="text-xs text-slate-400">End-to-end encryption for all medical data.</p>
        </div>
        <div className="space-y-2">
          <div className="font-bold text-slate-800">AI Disclaimer</div>
          <p className="text-xs text-slate-400">AI insights are for education, not diagnosis.</p>
        </div>
        <div className="space-y-2">
          <div className="font-bold text-slate-800">Data Privacy</div>
          <p className="text-xs text-slate-400">You own your data. We never sell medical info.</p>
        </div>
      </div>

      <Card className="bg-slate-50 border-slate-200 text-left p-8">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Info size={18} className="text-sky-500" /> Medical Disclaimer</h4>
        <p className="text-sm text-slate-500 leading-relaxed italic">
          This platform uses Artificial Intelligence to interpret laboratory results. It should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </p>
      </Card>

      <Button onClick={() => setStep(0)} variant="primary" icon={ArrowLeft}>Back to Start</Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-sky-100 font-sans">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep(0)}>
          <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Brain size={22} />
          </div>
          <div>
            <span className="font-black text-slate-900 tracking-tight text-xl">MediLens</span>
            <span className="text-[10px] font-bold text-sky-600 block leading-none uppercase tracking-widest">Global Intelligence</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {['Dashboard', 'Insights', 'Radar', 'History'].map((item, i) => (
            <button key={i} onClick={() => setStep(i + 2)} className={`text-sm font-bold transition-colors ${step === i + 2 ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 relative cursor-pointer">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold border-2 border-white shadow-sm cursor-pointer">
            S
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-40">
        <AnimatePresence mode="wait">
          {step === 0 && <WelcomePage key="welcome" />}
          {step === 1 && <UploadPage key="upload" />}
          {step === 2 && <OverviewPage key="overview" />}
          {step === 3 && <ExplanationPage key="explanation" />}
          {step === 4 && <VisualDashboard key="visual" />}
          {step === 5 && <ClinicianView key="clinical" />}
          {step === 6 && <ActionPlanPage key="action" />}
          {step === 7 && <RiskRadarPage key="radar" />}
          {step === 8 && <ClinicalPriorityPage key="priority" />}
          {step === 9 && <EmergencyPage key="emergency" />}
          {step === 10 && <HistoryPage key="history" />}
          {step === 11 && <DisclaimerPage key="disclaimer" />}
        </AnimatePresence>

        {/* Patient Snapshot Modal */}
        <AnimatePresence>
          {selectedPatient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden"
              >
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-teal-100 flex items-center justify-center text-teal-600 text-2xl font-black shadow-inner">
                        {selectedPatient.name[0]}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-none mb-1">{selectedPatient.name}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Age {selectedPatient.age} • Patient ID #29340</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Score</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${selectedPatient.risk > 70 ? 'bg-rose-500' : selectedPatient.risk > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        <span className="text-xl font-black text-slate-800">{selectedPatient.risk}%</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <Badge color={selectedPatient.risk > 70 ? 'red' : selectedPatient.risk > 40 ? 'yellow' : 'green'}>{selectedPatient.status}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Sparkles size={16} className="text-sky-500" /> AI Diagnostic Findings</h4>
                    <Card className="bg-sky-50 border-sky-100 p-4">
                      <p className="text-sm text-sky-800 font-medium leading-relaxed italic">
                        "{selectedPatient.findings}: Patient exhibits biomarkers consistent with current clinical trends. Recommend immediate follow-up on renal parameters."
                      </p>
                    </Card>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button variant="primary" className="flex-1" icon={FileText} onClick={() => setSelectedPatient(null)}>Full Clinical Report</Button>
                    <Button variant="outline" className="flex-1" icon={ArrowRight} onClick={() => setSelectedPatient(null)}>Consultation</Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Demo Navigation */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 glass p-2 rounded-full shadow-2xl">
        <button onClick={prevStep} className="p-3 text-slate-400 hover:text-sky-600 transition-colors"><ArrowLeft size={20} /></button>
        <div className="flex items-center gap-1.5 px-2">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${step === i ? 'w-6 bg-sky-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <button onClick={nextStep} className="p-3 text-slate-400 hover:text-sky-600 transition-colors"><ArrowRight size={20} /></button>
      </footer>
    </div>
  );
}
