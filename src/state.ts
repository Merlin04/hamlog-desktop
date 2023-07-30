import { createState } from "niue";

export type QSO = {
    id: string,
    source: string,
    destination: string,
    freq: string,
    time_on: string,
    time_off: string,
    mode: string,
    their_name?: string,
    their_qth?: string,
    our_square?: string,
    notes?: string
};

export type SingleJson = {
    data: string;
}

export type NewQSO = Omit<QSO, "id" | "source">;

export const [useStore, patchStore, getStore] = createState<{
    qsos: QSO[],
    cert: SingleJson | null
}>({
    qsos: [],
    cert: null
});