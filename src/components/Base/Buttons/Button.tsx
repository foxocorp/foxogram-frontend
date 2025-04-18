import { ComponentChildren, JSX } from "preact";
import "./Buttons.css";

interface ButtonProps {
	children: ComponentChildren;
	width?: number | string;
	fontSize?: number | string;
	fontWeight?: number | string;
	onClick?: () => void | Promise<void>;
	variant?: "primary" | "secondary" | "danger" | "default";
	icon?: string | undefined;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	style?: JSX.CSSProperties;
	className?: string;
}

export function Button({
						   children,
						   width = 368,
						   fontSize = 16,
						   fontWeight,
						   onClick,
						   variant = "default",
						   icon,
						   disabled = false,
						   type = "button",
						   style,
						   className = "",
					   }: ButtonProps) {
	const buttonClass = `button-${variant} ${disabled ? "button-disabled" : ""} ${className}`.trim();

	const buttonStyle: JSX.CSSProperties = Object.assign(
		{},
		{
			width: typeof width === "number" ? `${width}px` : width,
			fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
			fontWeight: typeof fontWeight === "number" ? fontWeight : 400,
		},
		style ?? {},
	);

	const handleClick = () => {
		if (onClick) {
			void onClick();
		}
	};

	return (
		<button
			className={buttonClass}
			style={buttonStyle}
			onClick={handleClick}
			disabled={disabled}
			type={type}>
			{children}
			{icon && <img src={icon} alt="icon" className="button-icon" />}
		</button>
	);
}
