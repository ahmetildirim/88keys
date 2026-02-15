import AppTopBar from "../../../shared/ui/components/AppTopBar";
import BackButton from "../../../shared/ui/components/BackButton";
import {
    APP_CONTACT_EMAIL,
    APP_DOMAIN,
    APP_NAME,
    APP_RELEASE_STAGE,
    APP_VERSION,
} from "../../../shared/config/appMeta";

interface AboutPageProps {
    onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
    return (
        <div className="app-page about-page">
            <AppTopBar
                rightSlot={
                    <BackButton onClick={onBack} />
                }
            />

            <main className="about-main">
                <div className="about-wrapper">
                    <section className="about-content">
                        <div className="about-icon-box" aria-hidden>
                            <span className="material-symbols-outlined">piano</span>
                        </div>

                        <h1>About {APP_NAME} ({APP_RELEASE_STAGE})</h1>
                        <div className="about-divider" aria-hidden />

                        <p>
                            As a new piano student, I struggled to find a sight-reading app that
                            truly supported beginners. Most tools felt either too complex or not
                            focused enough on consistent practice. So I built a simple, focused app
                            designed to make daily sight-reading practice easier and more effective.
                        </p>

                        <p>
                            The app is intentionally minimal. It&apos;s currently in active
                            development, and new features will be added gradually based on real user
                            feedback and practical needs.
                        </p>

                        <p>
                            For now, everything works offline. There are no accounts, no profiles,
                            and no cloud storage and all data stays on your device. The app is
                            completely free to use, with no ads and no in-app purchases.
                        </p>

                        <p>
                            If you have suggestions, ideas, or encounter any issues, please{" "}
                            <a
                                href="https://github.com/ahmetildirim/sightreadinglabs/issues"
                                target="_blank"
                                rel="noreferrer"
                            >
                                open an issue on GitHub
                            </a>
                            . Your feedback directly shapes the direction of this project.
                        </p>

                        <p>
                            For direct contact: <strong className="mono">{APP_CONTACT_EMAIL}</strong>
                        </p>

                        <p>
                            If you&apos;d like to support ongoing development, you can do so via the
                            Buy Me a Coffee link. Any support is genuinely appreciated and helps keep
                            the project improving.
                        </p>

                        <div className="about-support">
                            <div className="about-support-actions">
                                <a
                                    className="about-support-button"
                                    href="https://github.com/ahmetildirim/sightreadinglabs"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span className="material-symbols-outlined">code</span>
                                    <span>GitHub</span>
                                </a>
                                <a
                                    className="about-support-button"
                                    href="https://buymeacoffee.com/ahmetildirim"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span className="material-symbols-outlined">local_cafe</span>
                                    <span>Buy me a coffee</span>
                                </a>
                            </div>
                            <p>Support independent development</p>
                        </div>
                    </section>

                    <figure className="about-hero" aria-label="Piano keys close-up">
                        <div className="about-hero-image" aria-hidden />
                    </figure>
                </div>
            </main>

            <footer className="about-footer">
                <p className="mono">v{APP_VERSION} · {APP_RELEASE_STAGE}</p>
                <p>© 2026 {APP_DOMAIN}</p>
            </footer>
        </div>
    );
}
