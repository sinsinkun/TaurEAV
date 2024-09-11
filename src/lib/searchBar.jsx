import { useState } from "react";
import { useDispatch } from "react-redux";

import { searchAttrValue, searchAttrValueComparison, searchEntity } from "../store/eav";

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
    const comparisonRegex = /^[a-z0-9_]+? [<>] /i;
    if (comparisonRegex.test(v)) {
      const [attr, op, val] = v.split(" ");
      if (isNaN(Number(val))) return console.error("Value is not a number");
      dispatch(searchAttrValueComparison({ attr, val, op }));
      return;
    }
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