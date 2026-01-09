import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <motion.div
        whileHover={onClick ? { scale: 1.01, y: -4 } : {}}
        whileTap={onClick ? { scale: 0.98 } : {}}
        onClick={onClick}
        className={`glass-card p-6 rounded-[2rem] ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
        {children}
    </motion.div>
);

export const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, icon: Icon }: {
    children: React.ReactNode,
    onClick?: () => void,
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
    className?: string,
    disabled?: boolean,
    icon?: any
}) => {
    const baseStyles = "flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5",
        secondary: "bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-100 hover:-translate-y-0.5",
        outline: "bg-transparent border-2 border-slate-200 text-slate-600 hover:border-sky-500 hover:text-sky-500",
        ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
        danger: "bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {Icon && <Icon size={18} />}
            {children}
        </motion.button>
    );
};

export const Badge = ({ children, color = 'blue' }: { children: React.ReactNode, color?: 'blue' | 'green' | 'yellow' | 'red' | 'indigo' }) => {
    const colors = {
        blue: "bg-sky-50 text-sky-600 border-sky-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
        yellow: "bg-amber-50 text-amber-600 border-amber-100",
        red: "bg-rose-50 text-rose-600 border-rose-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${colors[color]}`}>
            {children}
        </span>
    );
};

export const ProgressBar = ({ value, color = 'blue', label }: { value: number, color?: 'blue' | 'green' | 'yellow' | 'red', label?: string }) => {
    const colors = {
        blue: "from-sky-500 to-blue-600",
        green: "from-emerald-400 to-teal-500",
        yellow: "from-amber-400 to-orange-400",
        red: "from-rose-500 to-pink-500"
    };

    return (
        <div className="w-full space-y-2">
            {label && <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">{label}<span>{value}%</span></div>}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${colors[color]}`}
                />
            </div>
        </div>
    );
};
