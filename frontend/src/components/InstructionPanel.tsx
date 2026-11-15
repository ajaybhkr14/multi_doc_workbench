interface Props {
  instruction: string;
  busy: boolean;
  analyzing: boolean;
  uploadedCount: number;
  onChange: (value: string) => void;
  onAnalyze: () => void;
}

const examples = [
  { title: 'KYC verification', instruction: 'Verify KYC details across PAN, Aadhaar and the application. Compare names, addresses and dates of birth. Highlight missing documents and inconsistent information.' },
  { title: 'Income comparison', instruction: 'Compare declared income with salary slips and bank statements. Calculate differences and highlight missing supporting documents.' },
  { title: 'Financial comparison', instruction: 'Compare financial statements for revenue, assets, liabilities and outstanding loans. Highlight differences and missing information.' },
];

export function InstructionPanel({ instruction, busy, analyzing, uploadedCount, onChange, onAnalyze }: Props) {
  return (
    <section className="panel" aria-labelledby="instruction-title">
      <h2 id="instruction-title">2. Tell us what to check</h2>
      <div className="example-buttons" aria-label="Example instructions">
        {examples.map((example) => <button key={example.title} className="secondary" onClick={() => onChange(example.instruction)} disabled={busy}>{example.title}</button>)}
      </div>
      <label htmlFor="instruction">Analysis instruction</label>
      <textarea
        id="instruction"
        value={instruction}
        onChange={(event) => onChange(event.target.value)}
        disabled={busy}
        maxLength={5000}
        rows={5}
        placeholder="Compare PAN and Aadhaar details and flag mismatches in names, addresses and dates of birth."
        aria-describedby="instruction-help"
      />
      <p id="instruction-help" className="hint">{instruction.length} / 5,000 characters · {uploadedCount} uploaded {uploadedCount === 1 ? 'document' : 'documents'} available</p>
      <p className="hint">Only successfully uploaded files are included in the analysis.</p>
      <button onClick={onAnalyze} disabled={busy || uploadedCount === 0 || !instruction.trim()}>
        {analyzing ? 'Analyzing documents…' : 'Analyze uploaded documents'}
      </button>
    </section>
  );
}
