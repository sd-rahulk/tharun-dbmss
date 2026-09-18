import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({ children, className = '', variant = 'dark', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'dark'|'light'|'outline'|'ember' }) {
  const styles = {
    dark: 'bg-ink text-white hover:bg-transit',
    light: 'bg-white text-ink hover:bg-fog',
    outline: 'border border-ink/20 text-ink hover:border-transit hover:text-transit',
    ember: 'bg-ember text-white hover:bg-[#9e5639]'
  }[variant];
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`} {...props}>{children}</button>;
}

export function Panel({ children, className = '', as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section'|'div'|'article' }) {
  return <Tag className={`rounded-2xl border border-black/10 bg-white/70 shadow-panel ${className}`}>{children}</Tag>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral'|'blue'|'green'|'amber'|'red' }) {
  const colors = { neutral: 'bg-fog text-ink', blue: 'bg-[#dfecee] text-transit', green: 'bg-[#e0eee7] text-signal', amber: 'bg-[#f4e5d9] text-[#9c5a3d]', red: 'bg-[#f5dcd7] text-[#a53f32]' }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.12em] ${colors}`}>{children}</span>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="rounded-2xl border border-dashed border-black/15 bg-white/40 px-6 py-12 text-center"><p className="display text-xl">{title}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55">{message}</p></div>;
}
