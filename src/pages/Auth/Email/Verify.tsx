import { FunctionalComponent } from "preact";
import { useEffect } from "preact/hooks";
import { useLocation } from "preact-iso";
import { apiMethods } from "@services/API/apiMethods";

const EmailConfirmationHandler: FunctionalComponent = () => {
    const location = useLocation();
    const code: string | undefined = location.query["code"];

    useEffect(() => {
        const confirmEmail = async (): Promise<void> => {
            try {
                if (!code) {
                    location.route("/auth/register?error=invalid-code");
                    return;
                }

                await apiMethods.verifyEmail(code);
                location.route("/");
            } catch (error) {
                console.error("Email confirmation failed", error);
                location.route("/auth/register?error=email-confirmation-failed");
            }
        };

        confirmEmail().catch((error: unknown) => {
            console.error("Unexpected error:", error);
            location.route("/auth/register?error=unknown-error");
        });
    }, [code, location]);

    return <div>Processing...</div>;
};

export default EmailConfirmationHandler;
