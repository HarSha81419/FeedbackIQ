import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSignup } from '@/hooks/useAuth';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signup = useSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup.mutate({ name, email, password });
  };

  return (
    <div className="glass rounded-2xl p-8">
      <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
        <Sparkles className="h-7 w-7 text-accent-cyan" />
        <span className="text-xl font-semibold">
          Feedback<span className="text-gradient">IQ</span>
        </span>
      </div>
      <h2 className="text-xl font-semibold text-slate-100">Create your account</h2>
      <p className="text-sm text-slate-500 mt-1">Start turning feedback into intelligence</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" size="lg" isLoading={signup.isPending}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-accent-cyan hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
