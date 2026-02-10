interface KeyStepperProps {
    label: string;
    value: string;
    hint: string;
    onIncrease: () => void;
    onDecrease: () => void;
}

export default function KeyStepper({
    label,
    value,
    hint,
    onIncrease,
    onDecrease,
}: KeyStepperProps) {
    return (
        <div className="key-stepper">
            <span className="key-label">{label}</span>
            <div className="key-field">
                <span>{value}</span>
                <div className="key-step-buttons">
                    <button type="button" onClick={onIncrease} aria-label={`Increase ${label}`}>
                        <span className="material-symbols-outlined">expand_less</span>
                    </button>
                    <button type="button" onClick={onDecrease} aria-label={`Decrease ${label}`}>
                        <span className="material-symbols-outlined">expand_more</span>
                    </button>
                </div>
            </div>
            <span className="key-hint">{hint}</span>
        </div>
    );
}
