import App from "./App";
import ActionManager from "./actions/Manager";
import InputExtractor from "./inputExtractor";

new App(new ActionManager(), new InputExtractor()).start();
