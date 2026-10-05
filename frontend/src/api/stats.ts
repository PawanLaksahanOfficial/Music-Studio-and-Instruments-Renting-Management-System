import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MonthlyRevenue, StatsDashboard, StatsSummary } from '@/types/api';
import { keys } from './keys';

export interface DateRange {
    start?: string;
    end?: string;
}

const params = (range: DateRange) => ({ ...(range.start ? { start: range.start } : {}), ...(range.end ? { end: range.end } : {}) });

export const useStatsSummary = (range: DateRange) =>
    useQuery({
        queryKey: [...keys.stats, 'summary', range],
        queryFn: () => api.get<StatsSummary>('/stats/summary', { params: params(range) }).then(r => r.data),
        placeholderData: previous => previous,
    });

export const useMonthlyRevenue = (range: DateRange) =>
    useQuery({
        queryKey: [...keys.stats, 'monthly', range],
        queryFn: () => api.get<MonthlyRevenue[]>('/stats/monthly', { params: params(range) }).then(r => r.data),
        placeholderData: previous => previous,
    });

export const useStatsDashboard = (range: DateRange) =>
    useQuery({
        queryKey: [...keys.stats, 'dashboard', range],
        queryFn: () => api.get<StatsDashboard>('/stats/dashboard', { params: params(range) }).then(r => r.data),
        placeholderData: previous => previous,
    });

export interface ReminderResult {
    message: string;
    overdueMarked: number;
    sent: number;
    failed: number;
    skipped: number;
}

export const useTriggerReminders = () =>
    useMutation({ mutationFn: () => api.post<ReminderResult>('/cron/trigger-reminders').then(r => r.data) });
