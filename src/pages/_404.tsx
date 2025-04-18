import { styled } from "styled-components";
import handIcon from "@icons/errors/hand-error.svg";
import gridBackground from "@icons/grid-background.svg";
import noiseEffect from "@icons/noise-effect.svg";

export function NotFound({ path }: { path: string }) {
	const truncatedUri = path.length > 30 ? `${path.substring(0, 30)}...` : path;

	return (
		<ErrorPageWrapper>
			<Content>
				<Hand>
					<img src={handIcon} alt="404" />
				</Hand>
				<Text>
					<h1>404</h1>
					<p>
						Looks like you’re lost...<br />
						There’s no page for <span className="uri">{truncatedUri}</span>
					</p>
					<Buttons>
						<StyledLink href="/" className="btn red">
							Return to Home
						</StyledLink>
						<StyledLink
							href="https://status.foxogram.su/"
							className="btn status-page"
							target="_blank"
							rel="noopener noreferrer"
						>
							Status Page
						</StyledLink>
					</Buttons>
				</Text>
			</Content>
		</ErrorPageWrapper>
	);
}

const ErrorPageWrapper = styled.div`
	position: relative;
	background-image: url(${gridBackground}), url(${noiseEffect});
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
	padding: 0 20px;
`;

const Content = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 200px;
	margin-bottom: 155px;
	position: relative;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: 30px;
		margin-left: 0;
		margin-bottom: 50px;
	}
`;

const Hand = styled.div`
	position: relative;
	transform: translateY(0);
	width: 150px;
	height: 150px;
	display: flex;
	align-items: center;
	justify-content: center;

	&::before {
		content: "";
		position: absolute;
		width: 300%;
		height: 300%;
		background: radial-gradient(
			circle,
			rgb(242 74 74 / 0.29) 0%,
			rgb(242 74 74 / 0) 70%
		);
		border-radius: 50%;
	}

	img {
		width: 150px;
		height: auto;

		@media (max-width: 768px) {
			width: 100px;
		}
	}
`;

const Text = styled.div`
	text-align: left;
	max-width: 400px;
	margin-left: 10px;

	h1 {
		font-weight: 900;
		font-size: 120px;
		color: #f24a4a;
		margin: 0 0 -19px 0;

		@media (max-width: 768px) {
			font-size: 80px;
		}
	}

	p {
		font-weight: 400;
		font-size: 23px;
		color: #fff;
		margin: 20px 0;

		.uri {
			font-weight: 700;
			font-size: 23px;
			color: #f24a4a;

			@media (max-width: 768px) {
				font-size: 18px;
			}
		}

		@media (max-width: 768px) {
			font-size: 18px;
			text-align: center;
		}
	}

	@media (max-width: 768px) {
		text-align: center;
		margin-left: 0;
		max-width: 90%;
	}
`;

const Buttons = styled.div`
	display: flex;
	gap: 10px;

	.btn {
		font-weight: 400;
		font-size: 16px;
		color: #ececec;
		border-radius: 5px;
		padding: 11px 18px;
		text-decoration: none;
		height: 20px;
		transition: background 0.3s ease;

		&.red {
			background: #f24a4a;
		}

		&:hover {
			background: rgb(242 74 74 / 0.75);
		}

		&.status-page:hover {
			background: rgb(200 200 200 / 0.25);
		}

		@media (max-width: 768px) {
			padding: 10px 15px;
		}
	}

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: center;
		gap: 15px;
	}
`;

const StyledLink = styled.a`
	border: 1px solid rgb(96 96 96 / 0.5);
	border-radius: 5px;
	backdrop-filter: blur(5px);
	background: rgb(0 0 0 / 0.25);
	padding: 11px 18px;
`;
