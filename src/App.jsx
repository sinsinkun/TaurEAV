import { Provider } from "react-redux";

import "./theme/App.css";
import store from "./store";
import EavTable from "./lib/eavTable";
import MenuBar from "./lib/menuBar";

function App() {
  return (
    <Provider store={store}>
      <div className="container-center">
        <MenuBar />
        <EavTable />
      </div>
    </Provider>
  );
}

export default App;
