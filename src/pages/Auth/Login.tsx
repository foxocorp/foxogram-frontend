import { useState } from "preact/hooks";
import { JSX } from "preact";
import styles from "./Login.module.css";
import { Button } from "@components/Base/Buttons/Button";
import { PasswordResetModal } from "@components/Modal/PasswordReset/PasswordResetModal";
import arrowLeftIcon from "@icons/navigation/arrow-left.svg";
import resetPasswordIcon from "@icons/navigation/reset-password.svg";
import newUserIcon from "@icons/navigation/new-user.svg";
import { apiMethods } from "@services/API/apiMethods";
import { useAuthStore } from "@store/authenticationStore";
import { useLocation } from "preact-iso";
import { Logger } from "@utils/logger";

const Login = (): JSX.Element => {
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [emailError, setEmailError] = useState<boolean>(false);
	const [passwordError, setPasswordError] = useState<boolean>(false);
	const [isPasswordResetModalOpen, setPasswordResetModalOpen] = useState<boolean>(false);

	const authStore = useAuthStore();
	const location = useLocation();

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email) && email.length >= 4 && email.length <= 64;
	};

	const validatePassword = (password: string): boolean => {
		const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{4,128}$/;
		return passwordRegex.test(password);
	};

	const handleLogin = async (): Promise<void> => {
		setEmailError(false);
		setPasswordError(false);

		let isValid = true;

		if (!email || !validateEmail(email)) {
			setEmailError(true);
			isValid = false;
		}

		if (!password || !validatePassword(password)) {
			setPasswordError(true);
			isValid = false;
		}

		if (!isValid) return;

		try {
			const response = await apiMethods.login(email, password);
			if (response.access_token) {
				authStore.login(response.access_token);
				console.log("Successful login");
				location.route("/");
			} else {
				console.error("Login error. Please try again.");
			}
		} catch (error) {
			Logger.error(`Error during login: ${error}`);
		}
	};

	const openPasswordResetModal = (): void => {
		setPasswordResetModalOpen(true);
	};

	const closePasswordResetModal = (): void => {
		setPasswordResetModalOpen(false);
	};

	return (
		<div className={styles["login-container"]}>
			<div className={styles["login-form"]}>
				<div className={styles["login-form-header"]}>
					<div className={styles["login-form-title"]}>
						<div className={styles["form"]}>
							<div className={styles["login-title"]}>Log in</div>
							<div className={styles["form-login"]}>
								<div className={styles["login"]}>
									<label className={styles["login-label"]}>
										Email<span className={styles["required"]}>*</span>
									</label>
									<input
										type="email"
										className={`${styles["login-input"]} ${emailError ? styles["input-error"] : ""}`}
										placeholder="floofer@coof.fox"
										value={email}
										onInput={(e) => { setEmail((e.target as HTMLInputElement).value); }}
										onBlur={() => { setEmailError(!validateEmail(email)); }}
										required
									/>
									{emailError && (
										<span className={`${styles["error-text"]}`} style={{ top: "18%", left: "70px" }}>— Incorrect format</span>
									)}
									<label className={styles["login-label"]}>
										Password<span className={styles["required"]}>*</span>
									</label>
									<input
										type="password"
										className={`${styles["login-input"]} ${passwordError ? styles["input-error"] : ""}`}
										placeholder="your floof password :3"
										value={password}
										onInput={(e) => { setPassword((e.target as HTMLInputElement).value); }}
										required
									/>
									{passwordError && (
										<span className={`${styles["error-text"]}`} style={{ top: "39.5%", left: "107px" }}>— Incorrect format</span>
									)}
								</div>
							</div>
						</div>
						<div className={styles["login-button"]}>
							<Button
								key="login-button"
								variant="primary"
								fontSize={20}
								fontWeight={600}
								onClick={handleLogin}
								icon={arrowLeftIcon}>
								Log in
							</Button>
						</div>
						<div className={styles["divider"]} />
						<div className={styles["action-buttons"]}>
							<Button key="reset-password-button" variant="secondary" onClick={openPasswordResetModal} icon={resetPasswordIcon}>
								Reset your password
							</Button>
							<Button key="create-account-button" variant="secondary" onClick={() => {location.route("/auth/register");}} icon={newUserIcon}>
								Create new account
							</Button>
						</div>
					</div>
				</div>
			</div>
			<PasswordResetModal
				isOpen={isPasswordResetModalOpen}
				email={email}
				onClose={closePasswordResetModal}
				onSendEmail={apiMethods.resetPassword}
				onVerifyCode={(code) => apiMethods.confirmResetPassword(email, code, password)}
				onResetPassword={apiMethods.resetPassword}
				onResendCode={apiMethods.resendEmailVerification}
			/>
		</div>
	);
};

export default Login;
