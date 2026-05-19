import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="glass rounded-2xl p-8">
      <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
        <Sparkles className="h-7 w-7 text-accent-cyan" />
        <span className="text-xl font-semibold">
          Feedback<span className="text-gradient">IQ</span>
        </span>
      </div>
      <h2 className="text-xl font-semibold text-slate-100">Welcome back</h2>
      <p className="text-sm text-slate-500 mt-1">Sign in to your intelligence dashboard</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {login.isError ? (
          <p className="text-xs text-red-400">Invalid email or password. Try any credentials in demo mode.</p>
        ) : null}
        <Button type="submit" className="w-full" size="lg" isLoading={login.isPending}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-accent-cyan hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
