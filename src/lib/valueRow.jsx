import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { addValue, updateValue } from "../store/eav";

const ValueRow = ({ data }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [fvalue, setFValue] = useState("");
  const [dvalue, setDValue] = useState(null);

  function submitValue() {
    if (!fvalue && fvalue !== 0 && fvalue !== false) return setIsEditing(false);
    const form = { ...data };
    switch (data.value_type) {
      case "str":
        form.value_str = fvalue;
        break;
      case "int":
        form.value_int = fvalue;
        break;
      case "float":
        form.value_float = fvalue;
        break;
      case "time":
        form.value_time = fvalue;
        break;
      case "bool":
        form.value_bool = fvalue;
        break;
      default:
        break;
    }
    if (!data.value_id) dispatch(addValue(form));
    else if (data.allow_multiple) dispatch(addValue(form));
    else dispatch(updateValue(form));
    // clean up
    setDValue(fvalue);
    setIsEditing(false);
  }

  function handleInput(e) {
    const { value } = e.target;
    setFValue(value);
  }

  function handleCheck(e) {
    const { checked } = e.target;
    setFValue(checked);
  }

  useEffect(() => {
    switch (data.value_type) {
      case "str":
        if (data.value_str) {
          if (!data.allow_multiple) setFValue(data.value_str);
          setDValue(data.value_str);
        } else {
          setDValue("-");
        }
        break;
      case "int":
        if (data.value_int || data.value_int === 0) {
          if (!data.allow_multiple) setFValue(data.value_int);
          setDValue(String(data.value_int));
        } else {
          setDValue("-")
        }
        break;
      case "float":
        if (data.value_float || data.value_float === 0) {
          if (!data.allow_multiple) setFValue(data.value_float);
          setDValue(data.value_float.toFixed(2));
        } else {
          setDValue("-");
        }
        break;
      case "time":
        if (data.value_time) {
          if (!data.allow_multiple) setFValue(data.valueTime);
          setDValue(data.value_time);
        } else {
          setDValue("-");
        }
        break;
      case "bool":
        if (data.value_bool === true) {
          if (!data.allow_multiple) setFValue(true);
          setDValue("Yes");
        } else if (data.value_bool === false) {
          if (!data.allow_multiple) setFValue(false);
          setDValue("No");
        } else {
          setDValue("-");
        }
        break;
      default:
        break;
    }
  }, [])

  return (
    <div className="grid" style={{ textAlign: "left" }}>
      <div>{data.attr} {data.allow_multiple && "(+)"}</div>
      {isEditing ? (
        <div className="value-field-container">
          {data.value_type === "str" && <input type="text" value={fvalue} onChange={handleInput} />}
          {data.value_type === "int" && <input type="number" value={fvalue} onChange={handleInput} />}
          {data.value_type === "float" && <input type="number" value={fvalue} onChange={handleInput} />}
          {data.value_type === "time" && <input type="datetime-local" value={fvalue} onChange={handleInput} />}
          {data.value_type === "bool" && <input type="checkbox" checked={fvalue} onChange={handleCheck} />}
          <div style={{ flexGrow:1 }}></div>
          <button onClick={submitValue}>{data.allow_multiple ? "Add" : "Update"}</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="value-display-container" onClick={() => setIsEditing(true)}>
          {dvalue}
        </div>
      )}
    </div>
  )
}

export default ValueRow;