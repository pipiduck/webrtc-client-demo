import "./App.css";
import { WebrtcPlayer } from "./WebrtcPlayer";

function App() {
  return (
    <div>
      <h1>{__USER_IDENTITY__}</h1>
      <WebrtcPlayer />
    </div>
  );
}

export default App;
