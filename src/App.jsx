import { Provider } from "react-redux";

import "./theme/App.css";
import store from "./store";
import EavTable from "./lib/eavTable";

function App() {
  return (
    <Provider store={store}>
      <div className="container-center">
        <h2>EAV Data Manager</h2>
        <br />
        <EavTable />
      </div>
    </Provider>
  );
}

export default App;
