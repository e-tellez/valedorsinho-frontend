"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Download } from "lucide-react";

const HEX_REGEX = /^[0-9a-fA-F]{12}$/;

function buildPayload(keyA: string, keyB: string, doInBackground: boolean) {
  return {
    cardAcquisition: [
      {
        conf: [
          {
            keys: [
              { key: keyA || "***", keyType: "a" },
              { key: keyB || "***", keyType: "b" },
            ],
            sector: 2,
          },
        ],
        convert: { dataType: "hex", length: 0, offset: 0 },
        ref: "mifareClassicCard",
      },
      {
        convert: { dataType: "hex", length: 0, offset: 0 },
        length: 256,
        offset: 0,
        ref: "type2Card",
      },
    ],
    doInBackground,
  };
}

export default function NfcFormatterFeature() {
  const [keyA, setKeyA] = useState("");
  const [keyB, setKeyB] = useState("");
  const [doInBackground, setDoInBackground] = useState(true);
  const [copied, setCopied] = useState(false);

  const keyAValid = keyA === "" || HEX_REGEX.test(keyA);
  const keyBValid = keyB === "" || HEX_REGEX.test(keyB);

  const payload = useMemo(
    () => buildPayload(keyA.trim(), keyB.trim(), doInBackground),
    [keyA, keyB, doInBackground],
  );
  const payloadJson = JSON.stringify(payload, null, 2);

  function copy() {
    navigator.clipboard.writeText(payloadJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function download() {
    const url = URL.createObjectURL(new Blob([payloadJson], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "nfc-card-acquisition.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cb-main cb-main--wide">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">NFC Formatter</h1>
          <p className="cb-head__sub">
            Configure NFC credentials for Mifare Classic 1K and generate the card-acquisition payload.
            The preview updates as you type.
          </p>
        </div>
      </header>

      <div className="cb-suggest">
        <div className="cb-panel">
          <div className="cb-panel__hd"><h3>Credentials</h3></div>
          <div className="cb-panel__bd">
            <div className="cb-field">
              <label htmlFor="nfc-key-a">Key A <span className="cb-field__hint">hex · 12 chars</span></label>
              <input
                id="nfc-key-a"
                className={`cb-input ${!keyAValid ? "cb-input--bad" : ""}`}
                value={keyA}
                onChange={(e) => setKeyA(e.target.value)}
                placeholder="FFFFFFFFFFFF"
                maxLength={12}
                spellCheck={false}
                autoComplete="off"
              />
              {!keyAValid && <span className="cb-fielderr">Must be a 12-character hex string.</span>}
            </div>

            <div className="cb-field">
              <label htmlFor="nfc-key-b">Key B <span className="cb-field__hint">hex · 12 chars</span></label>
              <input
                id="nfc-key-b"
                className={`cb-input ${!keyBValid ? "cb-input--bad" : ""}`}
                value={keyB}
                onChange={(e) => setKeyB(e.target.value)}
                placeholder="FFFFFFFFFFFF"
                maxLength={12}
                spellCheck={false}
                autoComplete="off"
              />
              {!keyBValid && <span className="cb-fielderr">Must be a 12-character hex string.</span>}
            </div>

            <label className={`cb-vertitem ${doInBackground ? "is-on" : ""}`}>
              <input type="checkbox" checked={doInBackground} onChange={(e) => setDoInBackground(e.target.checked)} />
              <span className="cb-vertitem__txt">
                <b>Turn off Adyen UI</b>
                <span>Run card acquisition in the background without displaying the Adyen screen.</span>
              </span>
            </label>
          </div>
        </div>

        <div className="cb-panel">
          <div className="cb-panel__hd">
            <h3>cardAcquisition payload</h3>
            <span className="cb-jsonbtns" style={{ marginLeft: "auto" }}>
              <button className={`cb-iconbtn ${copied ? "is-ok" : ""}`} onClick={copy} title="Copy JSON" aria-label="Copy payload as JSON">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <button className="cb-iconbtn" onClick={download} title="Download .json" aria-label="Download payload as JSON">
                <Download size={13} />
              </button>
            </span>
          </div>
          <div className="cb-panel__bd">
            <pre className="cb-json">{payloadJson}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
