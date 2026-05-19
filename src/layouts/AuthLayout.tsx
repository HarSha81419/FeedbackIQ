import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md"
        >
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-8 w-8 text-accent-cyan" />
            <span className="text-2xl font-semibold tracking-tight">
              Feedback<span className="text-gradient">IQ</span>
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-100 leading-tight">
            Turn customer feedback into actionable intelligence
          </h1>
          <p className="mt-4 text-slate-400 leading-relaxed">
            AI-powered sentiment analysis, churn prediction, and semantic search — built for
            modern product teams.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {['12K+ feedback analyzed', 'Real-time alerts', 'RAG insights', 'Customer 360'].map(
              (item) => (
                <div key={item} className="glass rounded-lg px-4 py-3 text-sm text-slate-400">
                  {item}
                </div>
              )
            )}
          </div>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-accent-indigo/5" />
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
