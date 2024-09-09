import { useState } from "react";
import { useDispatch } from "react-redux";

import { searchEntity } from "../store/eav";

function SearchBar() {
  const dispatch = useDispatch();
  const [v, setV] = useState("");

  function handleInput(e) {
    const { value } = e.target;
    setV(value);
  }

  function handleKey(e) {
    if (e.code === "Enter") {
      dispatch(searchEntity(v));
    }
  }

  function handleSubmit() {
    dispatch(searchEntity(v));
  }

  return (
    <div className="searchbar">
      <input placeholder="Search..." name="search" value={v} onChange={handleInput} onKeyUp={handleKey} />
      <button onClick={handleSubmit}>Search</button>
    </div>
  )
}

export default SearchBar;