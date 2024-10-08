import { useState } from "react";
import { useDispatch } from "react-redux";

import { scrollToTop, searchAttrValue, searchAttrValueComparison, searchEntity } from "../store/eav";

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
    const comparisonRegex = /^[A-Za-z0-9_]+? [<>] /i;
    if (comparisonRegex.test(v)) {
      const [attr, op, val] = v.split(" ");
      if (isNaN(Number(val))) return console.error("Value is not a number");
      dispatch(scrollToTop());
      dispatch(searchAttrValueComparison({ attr, val, op }));
      return;
    }
    const attrRegex = /^[A-Za-z0-9_]+?:/i;
    if (attrRegex.test(v)) {
      const [attr, val] = v.split(": ");
      dispatch(scrollToTop());
      dispatch(searchAttrValue({ attr, val }));
      return;
    }
    const extendRegex = /^![A-Za-z0-9().?!/&-_ ]+?$/i;
    dispatch(scrollToTop());
    dispatch(searchEntity({ regex: v, extended: !extendRegex.test(v) }));
  }

  return (
    <div className="searchbar">
      <input placeholder="Search..." name="search" value={v} onChange={handleInput} onKeyUp={handleKey} />
      <button onClick={handleSubmit}>Search</button>
    </div>
  )
}

export default SearchBar;