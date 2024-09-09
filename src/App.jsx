import { Provider } from "react-redux";

import "./theme/App.css";
import store from "./store";
import EavTable from "./lib/eavTable";
import MenuBar from "./lib/menuBar";
import SearchBar from "./lib/searchBar";

function App() {
  return (
    <Provider store={store}>
      <div className="container-center">
        <MenuBar />
        <SearchBar />
        <EavTable />
      </div>
    </Provider>
  );
}

export default App;
