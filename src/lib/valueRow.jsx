import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { addValue, updateValue, openForm, setFormInput } from "../store/eav";

const ValueRow = ({ data }) => {
  const dispatch = useDispatch();
  const showDelete = useSelector((state) => state.eav.showDelete);
  const [isEditing, setIsEditing] = useState(false);
  const [fvalue, setFValue] = useState("");
  const [unit, setUnit] = useState("");
  const [dvalue, setDValue] = useState(null);

  function submitValue() {
    if (!fvalue && fvalue !== 0 && fvalue !== false) return setIsEditing(false);
    const form = { ...data };
    switch (data.value_type) {
      case "str":
        form.value_str = fvalue;
        break;
      case "int":
        form.value_int = Number(fvalue);
        break;
      case "float":
        form.value_float = Number(fvalue);
        break;
      case "time":
        form.value_time = new Date(fvalue);
        break;
      case "bool":
        form.value_bool = Boolean(fvalue);
        break;
      default:
        break;
    }
    if (unit && data.value_type !== "str") data.value_str = unit;
    if (!data.value_id) dispatch(addValue(form));
    else dispatch(updateValue(form));
    // clean up
    setDValue(fvalue);
    setIsEditing(false);
  }

  function handleInput(e) {
    const { name, value } = e.target;
    if (name === "unit") setUnit(value);
    else setFValue(value);
  }

  function handleCheck(e) {
    const { checked } = e.target;
    setFValue(checked);
  }

  function confirmDeleteValue(id) {
    dispatch(openForm("delValue"));
    dispatch(setFormInput({ id: id }));
  }

  useEffect(() => {
    switch (data.value_type) {
      case "str":
        if (data.value_str) {
          setFValue(data.value_str);
          setDValue(data.value_str);
        } else {
          setDValue("-");
        }
        break;
      case "int":
        if (data.value_int || data.value_int === 0) {
          setFValue(data.value_int);
          setDValue(String(data.value_int));
          if (data.value_str) setUnit(data.value_str);
        } else {
          setDValue("-")
        }
        break;
      case "float":
        if (data.value_float || data.value_float === 0) {
          setFValue(data.value_float.toFixed(2));
          setDValue(data.value_float.toFixed(2));
          if (data.value_str) setUnit(data.value_str);
        } else {
          setDValue("-");
        }
        break;
      case "time":
        if (data.value_time) {
          const converted = new Date(data.value_time);
          const formatted = 
            converted.getUTCFullYear() + "-" + 
            (converted.getUTCMonth() + 1) + "-" + 
            converted.getUTCDate();
          setFValue(formatted);
          setDValue(formatted);
        } else {
          setDValue("-");
        }
        break;
      case "bool":
        if (data.value_bool === true) {
          setFValue(true);
          setDValue("Yes");
        } else if (data.value_bool === false) {
          setFValue(false);
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
      <div>{data.attr} {!data.value_id && "(+)"}</div>
      {isEditing ? (
        <div className="value-field-container">
          {data.value_type === "str" && (
            <input type="text" placeholder="value" name="fvalue" value={fvalue} onChange={handleInput} />
          )}
          {data.value_type === "int" && (
            <input type="number" placeholder="value" name="fvalue" value={fvalue} onChange={handleInput} />
          )}
          {data.value_type === "float" && (
            <input type="number" placeholder="value" name="fvalue" value={fvalue} onChange={handleInput} />
          )}
          {data.value_type === "time" && (
            <input type="date" name="fvalue" value={fvalue} onChange={handleInput} />
          )}
          {data.value_type === "bool" && (
            <input type="checkbox" name="fvalue" checked={fvalue} onChange={handleCheck} />
          )}
          {data.value_type === "int" || data.value_type === "float" && (
            <input type="text" placeholder="unit" name="unit" className="subfield" value={unit} onChange={handleInput} />
          )}
          <div style={{ flexGrow:1 }}></div>
          <button onClick={submitValue}>{data.value_id ? "Update" : "Add"}</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
          {showDelete && (
            <button onClick={() => confirmDeleteValue(data.value_id)} className="square">
              X
            </button>
          )}
        </div>
      ) : (
        <div className="value-display-container" onClick={() => setIsEditing(true)}>
          {dvalue} {unit}
        </div>
      )}
    </div>
  )
}

export default ValueRow;