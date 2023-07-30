import { invoke } from "@tauri-apps/api/tauri";
import { createState } from "tahitiensis";

type QSO = {
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

const [addStateListener, removeStateListener, patchState, getState] = createState({
    qsos: [] as QSO[]
});

// let greetInputEl: HTMLInputElement | null;
// let greetMsgEl: HTMLElement | null;
//
// async function greet() {
//   if (greetMsgEl && greetInputEl) {
//     // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//     greetMsgEl.textContent = await invoke("greet", {
//       name: greetInputEl.value,
//     });
//   }
// }
//

let qsosEl: HTMLElement | null;
let detailsEl: HTMLDialogElement | null;
let addEl: HTMLDialogElement | null;
let backdropEl: HTMLElement | null;

const showDetails = (qso: QSO) => {
    if(!detailsEl || !backdropEl) return;
    
    const t = detailsEl.querySelector("tbody")!;
    [qso.source, qso.destination, qso.freq, new Date(qso.time_on).toLocaleString(), new Date(qso.time_off).toLocaleString(), qso.mode, qso.their_name, qso.their_qth, qso.our_square, qso.notes].forEach((v, i) => {
        (t.querySelector(`tr:nth-child(${i + 1}) > td:last-child`) as HTMLElement).innerText = v ?? "";
    });

    detailsEl.open = true;
    backdropEl.dataset["open"] = "true";
}

addStateListener(({ qsos }) => {
    // rerender the qsos list
    if(!qsosEl) return;

    qsosEl.innerHTML = "";
    for(const qso of qsos) {
        const r = document.createElement("tr");
        [qso.source, qso.destination, qso.mode, qso.freq].forEach(val => {
            const d = document.createElement("td");
            d.innerText = val ?? "";
            r.appendChild(d);
        })
        const d = document.createElement("td");
        const b = document.createElement("button");
        b.innerText = "🔍";
        b.addEventListener("click", () => showDetails(qso));
        d.appendChild(b);
        r.appendChild(d);
        qsosEl.appendChild(r);
    }
}, ["qsos"]);

window.addEventListener("DOMContentLoaded", async () => {
    qsosEl = document.getElementById("qsos")!;
    detailsEl = document.getElementById("details") as HTMLDialogElement;
    addEl = document.getElementById("add") as HTMLDialogElement;
    backdropEl = document.getElementById("backdrop")!;

    [detailsEl.querySelector("button")!, backdropEl, addEl.querySelector("button[value=cancel]")!].forEach(e => e.addEventListener("click", () => {
        detailsEl!.open = false;
        addEl!.open = false;
        backdropEl!.dataset["open"] = "false";
    }));

    document.getElementById("addButton")!.addEventListener("click", () => {
        if(!addEl || !backdropEl) return;
        addEl.open = true;
        backdropEl.dataset["open"] = "true";
    });

    addEl.querySelector("form")!.addEventListener("submit", () => {
        const form = addEl!.querySelector("form") as HTMLFormElement;
        const data = new FormData(form);
        invoke("create_qso", { qso: Object.fromEntries(data.entries()) }).then((qsos) => patchState({ qsos: qsos as QSO[] }));
        addEl!.open = false;
        backdropEl!.dataset["open"] = "false";
    });

    invoke("get_qsos").then((qsos) => patchState({ qsos: qsos as QSO[] }));
});
