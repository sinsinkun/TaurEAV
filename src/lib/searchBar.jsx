import { useState } from "react";
import { useDispatch } from "react-redux";

import { searchAttrValue, searchEntity } from "../store/eav";

function SearchBar() {
  const dispatch = useDispatch();
  const [v, setV] = useState("");

  function handleInput(e) {
    const { value } = e.target;
    setV(value);
  }

  function handleKey(e) {
    if (e.code === "Enter") {
      handleSubmit();
    }
  }

  function handleSubmit() {
    const attrRegex = /^[a-z0-9_]+?:/i;
    if (attrRegex.test(v)) {
      const [attr, val] = v.split(": ");
      dispatch(searchAttrValue({ attr, val }));
      return;
    }
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