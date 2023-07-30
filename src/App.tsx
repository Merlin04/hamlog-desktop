import { useStore, QSO, patchStore, NewQSO, SingleJson, getStore } from "./state.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/tauri";

const updateCert = async () => {
    const cert = await invoke("get_cert");
    patchStore({ cert: cert ? cert as SingleJson : null });
}

export default function App() {
    const { cert } = useStore(["cert"]);
    const [signUpLoading, setSignUpLoading] = useState(false);

    useEffect(() => {
        updateCert();
    }, []);

    return /*cert*/ true ? (
        <>
            <h1>hamlog</h1>
            <QSOs />
        </>
    ) : (
        <>
            <h1>sign up for hamlog</h1>
            <form onSubmit={async e => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                try {
                    setSignUpLoading(true);
                    debugger;
                    await invoke("sign_in", {
                        callsign: formData.get("callsign"),
                        apiEndpoint: formData.get("api")
                    });
                    console.log("a");
                    await updateCert();
                    console.log("b");
                    console.log(getStore());
                } finally {
                    setSignUpLoading(false);
                }
            }}>
                <label for="callsign">callsign</label>
                <input type="text" id="callsign" name="callsign" required />
                <label for="api">api endpoint</label>
                <input type="text" id="api" name="api" required />
                <button type="submit" disabled={signUpLoading}>{signUpLoading ? "loading..." : "request cert"}</button>
            </form>
        </>
    );
}

const addQSOFields: {
    k: keyof NewQSO,
    disp?: string,
    type?: "text" | "datetime-local",
    required?: boolean
}[] = [{
    k: "destination",
    disp: "their callsign",
    required: true
}, {
    k: "freq",
    required: true
}, {
    k: "time_on",
    disp: "time on",
    type: "datetime-local",
    required: true
}, {
    k: "time_off",
    disp: "time off",
    type: "datetime-local",
    required: true
}, {
    k: "mode",
    required: true
}, {
    k: "their_name",
    disp: "their name"
}, {
    k: "their_qth",
    disp: "their qth"
}, {
    k: "our_square",
    disp: "our square"
}, /*{
    k: "notes"
}*/];

function QSOs() {
    const { qsos } = useStore(["qsos"]);
    const [detailsQSO, setDetailsQSO] = useState<QSO | null>(null);
    const addDialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        invoke("get_qsos").then(qsos => patchStore({ qsos: qsos as QSO[] }));
    }, []);

    return (
        <>
            <button onClick={() => {
                addDialogRef.current && (addDialogRef.current.open = true);
            }}>add</button>
            <table>
                <thead>
                <tr>
                    <th>src</th>
                    <th>dest</th>
                    <th>mode</th>
                    <th>freq</th>
                    <th>.</th>
                </tr>
                </thead>
                <tbody>
                {qsos.map(qso => (
                    <tr>
                        <td>{qso.source}</td>
                        <td>{qso.destination}</td>
                        <td>{qso.mode}</td>
                        <td>{qso.freq}</td>
                        <td><button onClick={() => setDetailsQSO(qso)}>🔍</button></td>
                    </tr>
                ))}
                </tbody>
            </table>

            {detailsQSO && (
                <dialog open>
                    <header>details</header>
                    <form method="dialog">
                        <table>
                            <tbody>
                            <tr>
                                <td>source</td>
                                <td>{detailsQSO.source}</td>
                            </tr>
                            <tr>
                                <td>their callsign</td>
                                <td>{detailsQSO.destination}</td>
                            </tr>
                            <tr>
                                <td>freq</td>
                                <td>{detailsQSO.freq}</td>
                            </tr>
                            <tr>
                                <td>time on</td>
                                <td>{new Date(detailsQSO.time_on).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>time off</td>
                                <td>{new Date(detailsQSO.time_off).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>mode</td>
                                <td>{detailsQSO.mode}</td>
                            </tr>
                            <tr>
                                <td>their name</td>
                                <td>{detailsQSO.their_name}</td>
                            </tr>
                            <tr>
                                <td>their qth</td>
                                <td>{detailsQSO.their_qth}</td>
                            </tr>
                            <tr>
                                <td>our square</td>
                                <td>{detailsQSO.our_square}</td>
                            </tr>
                            <tr>
                                <td>notes</td>
                                <td>{detailsQSO.notes}</td>
                            </tr>
                            </tbody>
                        </table>
                        <menu>
                            <button onClick={() => {
                                setDetailsQSO(null);
                            }}>close</button>
                        </menu>
                    </form>
                </dialog>
            )}

            <dialog ref={addDialogRef}>
                <header>add</header>
                <form method="dialog" id="addForm" onSubmit={() => {
                    const form = addDialogRef.current!.querySelector("form")!;
                    const data = new FormData(form);
                    console.log(Object.fromEntries(data.entries()));
                    debugger;
                    invoke("create_qso", { qso: Object.fromEntries(data.entries()) }).then(qso => patchStore({ qsos: [...qsos, qso as QSO] }));
                    addDialogRef.current!.open = false;
                }}>
                    {addQSOFields.map(({ k, disp, type, required }) => (
                        <div>
                            <label for={k}>{disp ?? k}</label>
                            <input type={type ?? "text"} name={k} id={k} required={required} />
                        </div>
                    ))}
                    <div id="notesContainer">
                        <label for="notes">notes</label>
                        <textarea name="notes" id="notes" />
                    </div>
                    <menu>
                        <button onClick={(e) => {
                            e.preventDefault();
                            addDialogRef.current!.open = false;
                        }}>cancel</button>
                        <button type="submit">submit</button>
                    </menu>
                </form>
            </dialog>
        </>
    )
}