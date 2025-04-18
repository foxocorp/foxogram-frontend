import { useEffect } from "preact/hooks";
import styles from "./LoadingApp.module.css";
import foxogramLogo from "../../assets/foxogram.svg";

const Loading = ({ onLoaded, isLoading }: { onLoaded: () => void, isLoading: boolean }) => {
	useEffect(() => {
		if (!isLoading) {
			onLoaded();
		}
	}, [isLoading, onLoaded]);

	if (!isLoading) {
		return null;
	}

	return (
		<div className={styles["loading-overlay"]}>
			<img src={foxogramLogo} alt="Logo" className={styles["logo"]} />
			<div className={styles["loading"]}>
				<div className={styles["loading-bar"]} />
			</div>
		</div>
	);
};

export default Loading;
