export type MonsterStatus = 'ACTIVE' | 'FINISHED' | 'NEXT';

export type Monster = {
    name: string;
    difficulty: string;
    hp: number;
    week: number;
    icon: string;
    killed: boolean;
    status?: MonsterStatus;
    lore?: string;
    escapeDate?: Date;
    finishedDate?: Date;
    combatLogs?: any;
};