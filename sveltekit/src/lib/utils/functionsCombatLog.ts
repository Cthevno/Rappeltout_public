export interface CombatLogEntry{
    login: string;
    dmg: number;
    date: string;
}

export function transformLogsToSeries(logs: CombatLogEntry[]){
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let dataMap: Record<string, {date: string, total: number}[]> = {};

    for (let log of sorted) {
        if (!dataMap[log.login]) dataMap[log.login] = [];

        let lastTotal = dataMap[log.login].length > 0
        ? dataMap[log.login][dataMap[log.login].length - 1].total
        : 0;

        dataMap[log.login].push({
            date: log.date,
            total: lastTotal + log.dmg
        });
    }
    return dataMap;
}

export function houseTotalDamage(logs: CombatLogEntry[]){
    let total = 0;

    for (const log of logs){
        total += log.dmg;
    }
    return total;
}