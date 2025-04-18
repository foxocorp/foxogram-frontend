import "preact/debug"; // disable in production

import "@fontsource/inter/900.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter"; //400
import "@fontsource/inter/300.css";
import "@fontsource/inter/200.css";
import "./style.css";

import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

import { Home } from "./pages/Home";
import { NotFound } from "./pages/_404";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import EmailConfirmationHandler from "./pages/Auth/Email/Verify";

export function App() {
    return (
        <LocationProvider>
            <main>
                <Router>
                    <Route path="/" component={Home} />
                    <Route path="/auth/login" component={Login} />
                    <Route path="/auth/register" component={Register} />
                    <Route path="/auth/email/verify" component={EmailConfirmationHandler} />
                    <Route default component={NotFound} />
                </Router>
            </main>
        </LocationProvider>
    );
}

render(<App />, document.getElementById("app") ?? document.body);
