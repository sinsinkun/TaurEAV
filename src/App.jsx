import { Provider } from "react-redux";

import "./theme/App.css";
import store from "./store";
import EavTable from "./lib/eavTable";

function App() {
  return (
    <Provider store={store}>
      <div className="container-center">
        <h3>EAV Data Manager</h3>
        <EavTable />
      </div>
    </Provider>
  );
}

export default App;
